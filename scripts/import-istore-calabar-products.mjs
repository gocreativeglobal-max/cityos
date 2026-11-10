import 'dotenv/config';
import pg from 'pg';
import crypto from 'crypto';
import fs from 'fs';

const { Pool } = pg;

function decodeHtmlEntities(str) {
  if (!str) return '';
  return str
    .replace(//g, 'Apple')
    .replace(/&#8211;/g, '–')
    .replace(/&#8212;/g, '—')
    .replace(/&#8217;/g, "'")
    .replace(/&#8220;/g, '"')
    .replace(/&#8221;/g, '"')
    .replace(/&#8358;/g, '₦')
    .replace(/&amp;/g, '&')
    .replace(/&nbsp;/g, ' ')
    .replace(/&quot;/g, '"')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractColorFromDesc(desc) {
  if (!desc) return null;
  const colorMatch = desc.match(/(?:COLOR|COLOUR)\s*:\s*([A-Za-z\s]+?)(?:\s+OS\b|\s+Face\s+ID|\s+SENSOR|$)/i);
  if (colorMatch && colorMatch[1]) {
    return colorMatch[1].trim();
  }
  const pipeMatch = desc.match(/Face\s*ID\s*\|\s*([A-Za-z\s]+?)\s*\|/i);
  if (pipeMatch && pipeMatch[1]) {
    return pipeMatch[1].trim();
  }
  return null;
}

function determineCategory(name, categories) {
  const n = name.toLowerCase();
  const catNames = (categories || []).map(c => c.name.toLowerCase()).join(' ');

  if (n.includes('macbook') || catNames.includes('macbook') || n.includes('mac ')) {
    return { name: 'MacBooks & Laptops', global: 'Computers & Electronics' };
  }
  if (n.includes('ipad') || catNames.includes('ipad')) {
    return { name: 'iPads & Tablets', global: 'Computers & Electronics' };
  }
  if (n.includes('watch') || catNames.includes('apple watch')) {
    return { name: 'Apple Watches', global: 'Wearable Tech' };
  }
  if (n.includes('airpods') || catNames.includes('airpods') || n.includes('earbuds') || n.includes('headphone')) {
    return { name: 'AirPods & Audio', global: 'Audio & Music' };
  }
  if (n.includes('keyboard') || n.includes('pencil') || n.includes('adapter') || n.includes('cable') || n.includes('charger') || catNames.includes('accessories')) {
    return { name: 'Apple Accessories', global: 'Gadget Accessories' };
  }
  if (n.includes('iphone') || catNames.includes('iphone')) {
    if (n.includes('used') || n.includes('pre-owned')) {
      return { name: 'iPhones (US-Used)', global: 'Phones & Tablets' };
    }
    return { name: 'iPhones (Brand New)', global: 'Phones & Tablets' };
  }
  return { name: 'Phones & Gadgets', global: 'Phones & Tablets' };
}

async function main() {
  const rawProducts = JSON.parse(fs.readFileSync('scripts/istore-products-raw.json', 'utf8'));
  const imageMapping = JSON.parse(fs.readFileSync('scripts/istore-image-mapping.json', 'utf8'));

  console.log(`Processing ${rawProducts.length} products...`);

  // Disambiguate product names
  const nameCounts = new Map();
  const normalizedItems = rawProducts.map((p) => {
    let baseName = decodeHtmlEntities(p.name)
      .replace(/\|\s*\|/g, '|')
      .replace(/\|\s*$/g, '')
      .replace(/\s*\|\s*/g, ' | ')
      .trim();

    const desc = decodeHtmlEntities(p.short_description || p.description || '');
    const color = extractColorFromDesc(desc);

    const rawPrice = Number(p.prices?.price || 0);
    const minorUnit = Number(p.prices?.currency_minor_unit ?? 2);
    const price = rawPrice / Math.pow(10, minorUnit);

    const rawRegPrice = Number(p.prices?.regular_price || 0);
    const regularPrice = rawRegPrice / Math.pow(10, minorUnit);
    const compareAtPrice = regularPrice > price ? regularPrice : null;

    // Use downloaded local image
    const localImg = imageMapping[p.id] || p.images?.[0]?.src || null;
    const cat = determineCategory(baseName, p.categories);

    return {
      wcId: p.id,
      baseName,
      color,
      desc: desc || `${baseName} available at iStore Calabar. 100% verified authentic Apple device.`,
      price,
      compareAtPrice,
      img: localImg,
      categoryName: cat.name,
      globalCategory: cat.global,
      permalink: p.permalink,
    };
  });

  for (const item of normalizedItems) {
    nameCounts.set(item.baseName.toLowerCase(), (nameCounts.get(item.baseName.toLowerCase()) || 0) + 1);
  }

  const usedFinalNames = new Set();
  const finalItems = normalizedItems.map((item) => {
    let title = item.baseName;
    if (nameCounts.get(item.baseName.toLowerCase()) > 1 && item.color) {
      title = `${item.baseName} (${item.color})`;
    }
    if (usedFinalNames.has(title.toLowerCase())) {
      title = `${title} #${item.wcId}`;
    }
    usedFinalNames.add(title.toLowerCase());
    return {
      ...item,
      title,
    };
  });

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const client = await pool.connect();

  try {
    const tablesRes = await client.query(
      `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'`
    );
    const tableNames = tablesRes.rows.map((r) => r.table_name);
    const resolveTable = (candidates) => {
      for (const c of candidates) {
        const found = tableNames.find((t) => t.toLowerCase() === c.toLowerCase());
        if (found) return `"${found}"`;
      }
      throw new Error(`Could not find table for candidates: ${candidates.join(', ')}`);
    };

    const T_CITY = resolveTable(['city']);
    const T_ORG = resolveTable(['organization']);
    const T_LOC = resolveTable(['location']);
    const T_LISTING = resolveTable(['discoverylisting', 'discovery_listing']);
    const T_SETTINGS = resolveTable(['retailsettings', 'retail_settings']);
    const T_CATEGORY = resolveTable(['retailcategory', 'retail_category']);
    const T_PRODUCT = resolveTable(['retailproduct', 'retail_product']);
    const T_STOCK = resolveTable(['retaillocationstock', 'retail_location_stock']);
    const T_CONTACT = resolveTable(['organizationcontactpoint', 'organization_contact_point']);

    await client.query('BEGIN');

    // 1. Find Calabar city
    const cityRes = await client.query(
      `SELECT id, name, slug FROM ${T_CITY} WHERE LOWER(slug) = 'calabar' OR LOWER(name) = 'calabar' LIMIT 1`
    );
    const cityId = cityRes.rows[0]?.id;

    // 2. Upsert Organization: iStore Calabar
    const orgId = 'istore-calabar';
    const orgName = 'iStore Calabar';
    const orgAddress = 'Marian Road, Calabar Municipal, Calabar';
    const orgDesc =
      'Premium Apple & Gadget Store in Calabar — iPhones (New & US-Used), iPads, MacBooks, Apple Watch, AirPods, and official Apple Accessories.';
    const orgCover = '/images/products/istore/istore-prod-3993.jpeg';

    const existingOrg = await client.query(`SELECT id FROM ${T_ORG} WHERE id = $1 LIMIT 1`, [orgId]);
    if (existingOrg.rows.length > 0) {
      await client.query(
        `UPDATE ${T_ORG}
         SET name = $2,
             type = 'RETAIL',
             "storeCategory" = 'Phones, Apple & Devices',
             description = $3,
             address = $4,
             "logoAssetId" = $5,
             status = 'ACTIVE'
         WHERE id = $1`,
        [orgId, orgName, orgDesc, orgAddress, orgCover]
      );
    } else {
      await client.query(
        `INSERT INTO ${T_ORG} (id, name, type, "storeCategory", description, address, "logoAssetId", status)
         VALUES ($1, $2, 'RETAIL', 'Phones, Apple & Devices', $3, $4, $5, 'ACTIVE')`,
        [orgId, orgName, orgDesc, orgAddress, orgCover]
      );
    }

    // 3. Upsert Location in Calabar
    let locRes = await client.query(`SELECT id FROM ${T_LOC} WHERE "organizationId" = $1 LIMIT 1`, [orgId]);
    let locationId;
    if (locRes.rows.length > 0) {
      locationId = locRes.rows[0].id;
      await client.query(
        `UPDATE ${T_LOC}
         SET name = 'iStore Calabar Showroom',
             address = $2,
             "cityId" = $3,
             latitude = 4.9685,
             longitude = 8.3342
         WHERE id = $1`,
        [locationId, orgAddress, cityId]
      );
    } else {
      locationId = crypto.randomUUID();
      await client.query(
        `INSERT INTO ${T_LOC} (id, "organizationId", name, address, "cityId", latitude, longitude)
         VALUES ($1, $2, 'iStore Calabar Showroom', $3, $4, 4.9685, 8.3342)`,
        [locationId, orgId, orgAddress, cityId]
      );
    }

    // 4. Ensure Central Hotline and WhatsApp contact points (+2348065373747)
    if (T_CONTACT) {
      await client.query(`DELETE FROM ${T_CONTACT} WHERE "organizationId" = $1`, [orgId]);
      await client.query(
        `INSERT INTO ${T_CONTACT} (id, "organizationId", type, value, "isPrimary")
         VALUES ($1, $2, 'PHONE', '+2348065373747', true)`,
        [crypto.randomUUID(), orgId]
      );
      await client.query(
        `INSERT INTO ${T_CONTACT} (id, "organizationId", type, value, "isPrimary")
         VALUES ($1, $2, 'WHATSAPP', '2348065373747', true)`,
        [crypto.randomUUID(), orgId]
      );
    }

    // 5. Upsert DiscoveryListing
    const listingMetadata = JSON.stringify({
      isVerified: true,
      neighborhood: 'Marian Road',
      area: 'Marian Road',
      workingHours: 'Mon – Sat · 09:00 AM – 06:00 PM',
      websiteUrl: 'https://istorecalabar.com/',
      coverImage: orgCover,
      phone: '+2348065373747',
      whatsapp: '2348065373747',
      aisles: [
        'iPhones (Brand New)',
        'iPhones (US-Used)',
        'MacBooks & Laptops',
        'iPads & Tablets',
        'Apple Watches',
        'AirPods & Audio',
        'Apple Accessories'
      ],
    });

    const listRes = await client.query(`SELECT id FROM ${T_LISTING} WHERE "organizationId" = $1 LIMIT 1`, [orgId]);
    if (listRes.rows.length > 0) {
      await client.query(
        `UPDATE ${T_LISTING}
         SET "locationId" = $2,
             "cityId" = $3,
             vertical = 'RETAIL',
             slug = 'istore-calabar',
             title = $4,
             description = $5,
             "coverAssetId" = $6,
             "isActive" = true,
             metadata = $7
         WHERE id = $1`,
        [listRes.rows[0].id, locationId, cityId, orgName, orgDesc, orgCover, listingMetadata]
      );
    } else {
      await client.query(
        `INSERT INTO ${T_LISTING} (id, "organizationId", "locationId", "cityId", vertical, slug, title, description, "coverAssetId", "isActive", metadata)
         VALUES ($1, $2, $3, $4, 'RETAIL', 'istore-calabar', $5, $6, $7, true, $8)`,
        [crypto.randomUUID(), orgId, locationId, cityId, orgName, orgDesc, orgCover, listingMetadata]
      );
    }

    // 6. Upsert RetailSettings
    const settingsRes = await client.query(`SELECT id FROM ${T_SETTINGS} WHERE "organizationId" = $1 LIMIT 1`, [orgId]);
    if (settingsRes.rows.length === 0) {
      await client.query(
        `INSERT INTO ${T_SETTINGS} (id, "organizationId", "storeName", "storeAddress", "currencySymbol", country, "hasStoreInfo", "hasProducts")
         VALUES ($1, $2, $3, $4, '₦', 'NG', true, true)`,
        [crypto.randomUUID(), orgId, orgName, orgAddress]
      );
    }

    // 7. Clear old stock and products for istore-calabar & insert fresh 64 products
    await client.query(`DELETE FROM ${T_STOCK} WHERE "organizationId" = $1`, [orgId]);
    await client.query(`DELETE FROM ${T_PRODUCT} WHERE "organizationId" = $1`, [orgId]);
    await client.query(`DELETE FROM ${T_CATEGORY} WHERE "organizationId" = $1`, [orgId]);

    const categoryMap = new Map();
    const aisleSummary = new Map();

    for (let i = 0; i < finalItems.length; i++) {
      const item = finalItems[i];

      let categoryId = categoryMap.get(item.categoryName);
      if (!categoryId) {
        categoryId = crypto.randomUUID();
        await client.query(
          `INSERT INTO ${T_CATEGORY} (id, "organizationId", name, description)
           VALUES ($1, $2, $3, $4)`,
          [categoryId, orgId, item.categoryName, `${item.categoryName} at iStore Calabar`]
        );
        categoryMap.set(item.categoryName, categoryId);
      }

      const productId = `istore-cal-${item.wcId}`;
      const sku = `IST-${String(i + 1).padStart(3, '0')}`;

      await client.query(
        `INSERT INTO ${T_PRODUCT} (
          id, "organizationId", name, description, sku, price, "compareAtPrice",
          "stockQuantity", "lowStockLevel", "isWeighed", unit, "imageAssetId",
          "globalCategory", "categoryId"
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, 5, 1, false, 'ea', $8, $9, $10)`,
        [
          productId,
          orgId,
          item.title,
          item.desc,
          sku,
          item.price,
          item.compareAtPrice,
          item.img,
          item.globalCategory,
          categoryId,
        ]
      );

      await client.query(
        `INSERT INTO ${T_STOCK} (id, "organizationId", "locationId", "productId", "stockQuantity", "lowStockLevel")
         VALUES ($1, $2, $3, $4, 5, 1)`,
        [crypto.randomUUID(), orgId, locationId, productId]
      );

      aisleSummary.set(item.categoryName, (aisleSummary.get(item.categoryName) || 0) + 1);
    }

    await client.query('COMMIT');
    console.log(`\n🎉 Successfully imported all ${finalItems.length} products for ${orgName} (${orgId})!`);
    console.log(`   Location: ${locationId}`);
    console.log(`   Hotline & WhatsApp: +2348065373747`);
    console.log(`   Categories:`);
    for (const [aisle, count] of Array.from(aisleSummary.entries()).sort((a, b) => b[1] - a[1])) {
      console.log(`     - ${aisle}: ${count} item(s)`);
    }
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((err) => {
  console.error('Import failed:', err);
  process.exit(1);
});
