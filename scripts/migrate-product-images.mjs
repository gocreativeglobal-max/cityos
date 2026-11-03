import 'dotenv/config';
import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

function getS3Client() {
  const region = process.env.AWS_REGION;
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
  const bucketName = process.env.AWS_BUCKET_NAME;

  if (!region || !accessKeyId || !secretAccessKey || !bucketName) {
    return null;
  }

  return {
    client: new S3Client({
      region,
      credentials: { accessKeyId, secretAccessKey },
    }),
    bucketName,
    region,
  };
}

async function fetchImageBufferWithRetry(url, maxRetries = 3) {
  let origin = 'https://istorecalabar.com/';
  try {
    const parsed = new URL(url);
    origin = `${parsed.protocol}//${parsed.host}/`;
  } catch {}

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000);
    try {
      const res = await fetch(url, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
          'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
          'Referer': origin,
        },
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status} ${res.statusText}`);
      }

      const contentType = res.headers.get('content-type') || 'image/jpeg';
      const arrayBuffer = await res.arrayBuffer();
      return {
        buffer: Buffer.from(arrayBuffer),
        contentType,
      };
    } catch (err) {
      if (attempt === maxRetries) {
        throw err;
      }
      await new Promise(r => setTimeout(r, 1000 * attempt));
    } finally {
      clearTimeout(timeout);
    }
  }
}

function getExtension(url, contentType) {
  if (contentType?.includes('png')) return 'png';
  if (contentType?.includes('webp')) return 'webp';
  if (contentType?.includes('gif')) return 'gif';
  if (contentType?.includes('svg')) return 'svg';
  
  const cleanUrl = url.split('?')[0].toLowerCase();
  if (cleanUrl.endsWith('.png')) return 'png';
  if (cleanUrl.endsWith('.webp')) return 'webp';
  if (cleanUrl.endsWith('.gif')) return 'gif';
  if (cleanUrl.endsWith('.svg')) return 'svg';
  return 'jpg';
}

async function deleteProductCascade(productId) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(`DELETE FROM "voiceCartItem" WHERE "retailProductId" = $1`, [productId]);
    await client.query(`DELETE FROM "retailStockMovement" WHERE "productId" = $1`, [productId]);
    await client.query(`DELETE FROM "retailLocationStock" WHERE "productId" = $1`, [productId]);
    await client.query(`DELETE FROM "retailOrderItem" WHERE "productId" = $1`, [productId]);
    await client.query(`DELETE FROM "retailPurchaseOrderItem" WHERE "productId" = $1`, [productId]);
    await client.query(`DELETE FROM "retailProduct" WHERE "parentId" = $1`, [productId]);
    await client.query(`DELETE FROM "retailProduct" WHERE id = $1`, [productId]);
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function main() {
  console.log('--- 9jaLive Product Image Host & Sync ---');

  // Step 1: Purge any products where image is completely missing/blank
  const noImageCheck = await pool.query(`
    SELECT id, name FROM "retailProduct"
    WHERE "imageAssetId" IS NULL OR trim("imageAssetId") = ''
  `);

  if (noImageCheck.rows.length > 0) {
    console.log(`Found ${noImageCheck.rows.length} item(s) without image. Purging completely...`);
    for (const item of noImageCheck.rows) {
      await deleteProductCascade(item.id);
      console.log(`  ✗ Deleted item without image: ${item.name} (${item.id})`);
    }
  }

  // Step 2: Check AWS S3 status
  const s3 = getS3Client();
  const isAwsConfigured = Boolean(s3);
  console.log(`AWS S3 Integration: ${isAwsConfigured ? `ONLINE (Bucket: ${s3.bucketName}, Region: ${s3.region})` : 'PENDING (Will host in public/images/products until AWS keys are added to .env)'}\n`);

  // Step 3: Fetch all active products
  const productsRes = await pool.query(`
    SELECT id, name, "organizationId", "imageAssetId"
    FROM "retailProduct"
    ORDER BY "organizationId", id
  `);

  const products = productsRes.rows;
  console.log(`Total active products in database: ${products.length}\n`);

  const localOutputDir = path.join(process.cwd(), 'public', 'images', 'products');
  fs.mkdirSync(localOutputDir, { recursive: true });

  let processedCount = 0;
  let alreadyHostedCount = 0;
  let downloadedCount = 0;
  let deletedBrokenCount = 0;

  for (let i = 0; i < products.length; i++) {
    const p = products[i];
    const currentUrl = p.imageAssetId;
    const progress = `[${i + 1}/${products.length}]`;
    processedCount++;

    // Check if already hosted on S3 or locally
    if (s3 && currentUrl.includes(s3.bucketName)) {
      alreadyHostedCount++;
      continue;
    }

    const orgDir = path.join(localOutputDir, p.organizationId);
    fs.mkdirSync(orgDir, { recursive: true });

    let buffer = null;
    let contentType = 'image/jpeg';
    let fileExt = 'jpg';

    // Check if local file already exists
    if (currentUrl.startsWith('/images/products/')) {
      const existingLocalPath = path.join(process.cwd(), 'public', currentUrl);
      if (fs.existsSync(existingLocalPath)) {
        buffer = fs.readFileSync(existingLocalPath);
        fileExt = path.extname(existingLocalPath).replace('.', '') || 'jpg';
        contentType = fileExt === 'png' ? 'image/png' : (fileExt === 'webp' ? 'image/webp' : 'image/jpeg');
      }
    }

    // If not local, download from remote URL
    if (!buffer) {
      try {
        const res = await fetchImageBufferWithRetry(currentUrl, 3);
        buffer = res.buffer;
        contentType = res.contentType;
        fileExt = getExtension(currentUrl, contentType);
      } catch (err) {
        console.warn(`${progress} ⚠️ Broken image for "${p.name}" (${currentUrl}): ${err.message}`);
        console.log(`   -> Deleting product as requested: "${p.name}" (${p.id})`);
        try {
          await deleteProductCascade(p.id);
          deletedBrokenCount++;
        } catch (delErr) {
          console.error(`   ✗ Error deleting broken product ${p.id}:`, delErr.message);
        }
        continue;
      }
    }

    const fileName = `${p.id}.${fileExt}`;
    const localFilePath = path.join(orgDir, fileName);

    // Save locally
    if (!fs.existsSync(localFilePath)) {
      fs.writeFileSync(localFilePath, buffer);
    }
    downloadedCount++;

    let targetUrl = `/images/products/${p.organizationId}/${fileName}`;

    // Upload to AWS S3 if credentials configured
    if (s3) {
      try {
        const s3Key = `products/${p.organizationId}/${fileName}`;
        await s3.client.send(
          new PutObjectCommand({
            Bucket: s3.bucketName,
            Key: s3Key,
            Body: buffer,
            ContentType: contentType,
          })
        );
        targetUrl = `https://${s3.bucketName}.s3.${s3.region}.amazonaws.com/${s3Key}`;
        console.log(`${progress} ✓ Uploaded to AWS S3: ${p.name}`);
      } catch (s3Err) {
        console.warn(`${progress} ⚠️ S3 upload error for ${p.name}: ${s3Err.message}, retaining local URL`);
      }
    } else {
      console.log(`${progress} ✓ Self-hosted: ${p.name} -> ${targetUrl}`);
    }

    // Update database record if needed
    if (currentUrl !== targetUrl) {
      await pool.query(
        `UPDATE "retailProduct" SET "imageAssetId" = $1 WHERE id = $2`,
        [targetUrl, p.id]
      );
    }

    // Small delay to be polite to remote sources
    await new Promise(r => setTimeout(r, 60));
  }

  // Final database audit
  const finalAudit = await pool.query(`
    SELECT 
      count(*)::int as total_products,
      count(CASE WHEN "imageAssetId" LIKE 'https://%amazonaws.com%' THEN 1 END)::int as aws_s3_hosted,
      count(CASE WHEN "imageAssetId" LIKE '/images/products/%' THEN 1 END)::int as local_self_hosted,
      count(CASE WHEN "imageAssetId" LIKE 'http%' AND "imageAssetId" NOT LIKE 'https://%amazonaws.com%' THEN 1 END)::int as external_remote,
      count(CASE WHEN "imageAssetId" IS NULL OR trim("imageAssetId") = '' THEN 1 END)::int as without_image
    FROM "retailProduct"
  `);

  console.log('\n==================================================');
  console.log('FINAL AUDIT SUMMARY:');
  console.log(finalAudit.rows[0]);
  console.log(` - Deleted Broken Items: ${deletedBrokenCount}`);
  console.log('==================================================\n');

  await pool.end();
}

main().catch(err => {
  console.error('Migration error:', err);
  process.exit(1);
});
