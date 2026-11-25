import 'dotenv/config';
import pg from 'pg';
import fs from 'fs';
import path from 'path';

const { Pool } = pg;

const OUT_DIR = path.resolve('public/images/products/cygroup');
const ORG_ID = 'cygroup-calabar';
const MAX_IMAGES_PER_PRODUCT = 3;

const EXT_BY_CONTENT_TYPE = {
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/avif': 'avif',
  'image/gif': 'gif',
};

function sanitizeSlug(str) {
  return String(str || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

function extFromUrl(url) {
  try {
    const pathname = new URL(url).pathname.toLowerCase();
    const m = pathname.match(/\.(jpg|jpeg|png|webp|avif|gif)$/);
    if (m) return m[1] === 'jpeg' ? 'jpg' : m[1];
  } catch {}
  return 'jpg';
}

async function downloadImage(url, baseFilename) {
  for (let attempt = 1; attempt <= 3; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 20000);
    try {
      const res = await fetch(url, {
        signal: controller.signal,
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
          Accept: 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
          Referer: 'https://cygroup.ng/',
        },
      });
      clearTimeout(timer);
      if (!res.ok) {
        if (res.status === 404) return null;
        throw new Error(`HTTP ${res.status}`);
      }
      const ct = (res.headers.get('content-type') || '').split(';')[0].trim().toLowerCase();
      if (!ct.startsWith('image/')) {
        return null;
      }
      const buf = Buffer.from(await res.arrayBuffer());
      if (buf.length < 300) return null;

      const ext = EXT_BY_CONTENT_TYPE[ct] || extFromUrl(url);
      const filename = `${baseFilename}.${ext}`;
      const fullPath = path.join(OUT_DIR, filename);
      fs.writeFileSync(fullPath, buf);
      return `/images/products/cygroup/${filename}`;
    } catch (err) {
      clearTimeout(timer);
      if (attempt === 3) {
        console.warn(`  [fail] ${url}: ${err.message}`);
        return null;
      }
      await new Promise((r) => setTimeout(r, 500 * attempt));
    }
  }
  return null;
}

async function fetchLiveCygroupProducts() {
  const byId = new Map();
  const byName = new Map();
  let page = 1;
  while (true) {
    const res = await fetch(
      `https://cygroup.ng/wp-json/wc/store/v1/products?per_page=100&page=${page}`,
      { headers: { 'User-Agent': 'Mozilla/5.0' } }
    );
    if (!res.ok) break;
    const items = await res.json();
    if (!Array.isArray(items) || items.length === 0) break;
    for (const p of items) {
      byId.set(String(p.id), p);
      const normName = (p.name || '').trim().toLowerCase();
      if (normName && !byName.has(normName)) byName.set(normName, p);
    }
    const totalPages = parseInt(res.headers.get('x-wp-totalpages') || '1', 10);
    if (page >= totalPages) break;
    page++;
  }
  return { byId, byName };
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  console.log('1. Fetching live catalog from cygroup.ng...');
  const { byId, byName } = await fetchLiveCygroupProducts();
  console.log(`   Loaded ${byId.size} live products from cygroup.ng.`);

  const pool = new Pool({ connectionString: process.env.DIRECT_URL || process.env.DATABASE_URL });
  const client = await pool.connect();

  try {
    // 2. Download store logo (prefer square cropped icon, fallback to logo.png)
    console.log('2. Syncing store logo & cover image...');
    const logoLocal =
      (await downloadImage(
        'https://cygroup.ng/wp-content/uploads/2026/11/cropped-Screenshot_20220912-033129-300x300.jpg',
        'cygroup-store-logo'
      )) ||
      (await downloadImage(
        'https://cygroup.ng/wp-content/uploads/2026/11/logo.png',
        'cygroup-store-logo'
      ));
    console.log('   Store logo saved:', logoLocal);

    // 3. Load DB products for cygroup-calabar
    const { rows: dbProducts } = await client.query(
      `SELECT id, name, "imageAssetId" FROM "retailProduct" WHERE "organizationId" = $1 ORDER BY id`,
      [ORG_ID]
    );
    console.log(`3. Syncing ${dbProducts.length} products in DB...`);

    let keptLocal = 0;
    let updated = 0;
    let failed = 0;
    const failedItems = [];
    const productFirstImageMap = new Map();

    // Process with controlled concurrency of 6
    const CONCURRENCY = 6;
    for (let i = 0; i < dbProducts.length; i += CONCURRENCY) {
      const batch = dbProducts.slice(i, i + CONCURRENCY);
      await Promise.all(
        batch.map(async (dp) => {
          // Check if already pointing to an existing local image
          let existingArr = [];
          if (dp.imageAssetId) {
            if (dp.imageAssetId.startsWith('[')) {
              try {
                existingArr = JSON.parse(dp.imageAssetId);
              } catch {}
            } else {
              existingArr = [dp.imageAssetId];
            }
          }
          const validExistingLocal = existingArr.filter(
            (u) => typeof u === 'string' && u.startsWith('/images/') && fs.existsSync(path.resolve('public', u.slice(1)))
          );
          if (validExistingLocal.length > 0) {
            keptLocal++;
            productFirstImageMap.set(dp.id, validExistingLocal[0]);
            return;
          }

          // Match live product
          const idMatch = dp.id.match(/^cygroup-cal-(\d+)$/);
          let live = idMatch ? byId.get(idMatch[1]) : null;
          if (!live) {
            live = byName.get((dp.name || '').trim().toLowerCase()) || null;
          }

          // Also try fetching single product endpoint if missing from paginated list
          if (!live && idMatch) {
            try {
              const r = await fetch(`https://cygroup.ng/wp-json/wc/store/v1/products/${idMatch[1]}`, {
                headers: { 'User-Agent': 'Mozilla/5.0' },
              });
              if (r.ok) live = await r.json();
            } catch {}
          }

          const candidateUrls = Array.from(
            new Set((live?.images || []).map((img) => img?.src).filter(Boolean))
          ).slice(0, MAX_IMAGES_PER_PRODUCT);

          const savedPaths = [];
          const basePrefix = `${dp.id}-${sanitizeSlug(dp.name).slice(0, 32)}`;
          for (let idx = 0; idx < candidateUrls.length; idx++) {
            const saved = await downloadImage(
              candidateUrls[idx],
              idx === 0 ? basePrefix : `${basePrefix}-${idx + 1}`
            );
            if (saved) savedPaths.push(saved);
          }

          if (savedPaths.length > 0) {
            await client.query(
              `UPDATE "retailProduct" SET "imageAssetId" = $2 WHERE id = $1`,
              [dp.id, JSON.stringify(savedPaths)]
            );
            productFirstImageMap.set(dp.id, savedPaths[0]);
            updated++;
          } else {
            failed++;
            failedItems.push({
              id: dp.id,
              name: dp.name,
              liveId: live?.id || null,
              liveImgCount: live?.images?.length || 0,
            });
          }
        })
      );
    }

    // 4. Update Organization logo & DiscoveryListing metadata/cover
    if (logoLocal) {
      await client.query(`UPDATE "organization" SET "logoAssetId" = $2 WHERE id = $1`, [
        ORG_ID,
        logoLocal,
      ]);

      const { rows: listings } = await client.query(
        `SELECT id, metadata FROM "discoveryListing" WHERE "organizationId" = $1`,
        [ORG_ID]
      );
      const sampleCover = Array.from(productFirstImageMap.values())[0] || logoLocal;
      for (const l of listings) {
        let meta = {};
        try {
          if (l.metadata) meta = JSON.parse(l.metadata);
        } catch {}
        meta.logoUrl = logoLocal;
        meta.coverImage = sampleCover;
        meta.images = [sampleCover, logoLocal];
        await client.query(
          `UPDATE "discoveryListing" SET "coverAssetId" = $2, metadata = $3 WHERE id = $1`,
          [l.id, sampleCover, JSON.stringify(meta)]
        );
      }
    }

    // 5. Sync Post.imageUrl for cygroup-calabar posts linked to RetailProducts
    let postsUpdated = 0;
    const { rows: posts } = await client.query(
      `SELECT id, "linkedEntityId", "imageUrl" FROM "post" WHERE "organizationId" = $1`,
      [ORG_ID]
    );
    for (const post of posts) {
      const localImg = post.linkedEntityId ? productFirstImageMap.get(post.linkedEntityId) : null;
      if (localImg && post.imageUrl !== localImg) {
        await client.query(`UPDATE "post" SET "imageUrl" = $2 WHERE id = $1`, [post.id, localImg]);
        postsUpdated++;
      } else if (!localImg && post.imageUrl && post.imageUrl.includes('cygroup.ng') && logoLocal) {
        await client.query(`UPDATE "post" SET "imageUrl" = $2 WHERE id = $1`, [post.id, logoLocal]);
        postsUpdated++;
      }
    }

    console.log('\n=== Cygroup Image Re-Sync Complete ===');
    console.log({
      totalProducts: dbProducts.length,
      keptLocal,
      updatedFromLiveApi: updated,
      failed,
      postsUpdated,
      logoLocal,
    });
    if (failedItems.length > 0) {
      console.log('Failed items:', failedItems);
    }
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
