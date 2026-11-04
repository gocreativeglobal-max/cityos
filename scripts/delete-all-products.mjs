import 'dotenv/config';
import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { S3Client, ListObjectsV2Command, DeleteObjectsCommand } from '@aws-sdk/client-s3';

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
  };
}

async function cleanS3ProductImages() {
  const s3 = getS3Client();
  if (!s3) {
    console.log('AWS S3 credentials not configured; skipping S3 deletion.');
    return;
  }

  console.log(`\nPurging products prefix from S3 bucket: ${s3.bucketName}...`);
  let continuationToken = undefined;
  let totalDeleted = 0;

  do {
    const listRes = await s3.client.send(
      new ListObjectsV2Command({
        Bucket: s3.bucketName,
        Prefix: 'products/',
        ContinuationToken: continuationToken,
      })
    );

    const objects = listRes.Contents || [];
    if (objects.length > 0) {
      await s3.client.send(
        new DeleteObjectsCommand({
          Bucket: s3.bucketName,
          Delete: {
            Objects: objects.map(o => ({ Key: o.Key })),
            Quiet: true,
          },
        })
      );
      totalDeleted += objects.length;
      console.log(`  Deleted ${objects.length} objects from S3 (Running total: ${totalDeleted})...`);
    }

    continuationToken = listRes.NextContinuationToken;
  } while (continuationToken);

  console.log(`✓ Total S3 product images purged: ${totalDeleted}`);
}

async function main() {
  console.log('=== PURGING ALL PRODUCTS FROM CATALOG ===\n');

  const client = await pool.connect();
  try {
    const countBefore = await client.query('SELECT count(*)::int as count FROM "retailProduct"');
    console.log(`Found ${countBefore.rows[0].count} product(s) in retailProduct.`);

    console.log('Beginning atomic cascade deletion...');
    await client.query('BEGIN');

    const vCart = await client.query('DELETE FROM "voiceCartItem" WHERE "retailProductId" IS NOT NULL');
    console.log(`  - Deleted ${vCart.rowCount} voiceCartItem records`);

    const rStockMov = await client.query('DELETE FROM "retailStockMovement"');
    console.log(`  - Deleted ${rStockMov.rowCount} retailStockMovement records`);

    const rLocStock = await client.query('DELETE FROM "retailLocationStock"');
    console.log(`  - Deleted ${rLocStock.rowCount} retailLocationStock records`);

    const rOrdItem = await client.query('DELETE FROM "retailOrderItem"');
    console.log(`  - Deleted ${rOrdItem.rowCount} retailOrderItem records`);

    const rPoItem = await client.query('DELETE FROM "retailPurchaseOrderItem"');
    console.log(`  - Deleted ${rPoItem.rowCount} retailPurchaseOrderItem records`);

    const rVariants = await client.query('DELETE FROM "retailProduct" WHERE "parentId" IS NOT NULL');
    console.log(`  - Deleted ${rVariants.rowCount} variant products`);

    const rProducts = await client.query('DELETE FROM "retailProduct"');
    console.log(`  - Deleted ${rProducts.rowCount} root products`);

    const rSettings = await client.query('UPDATE "retailSettings" SET "hasProducts" = false');
    console.log(`  - Updated ${rSettings.rowCount} retailSettings (hasProducts = false)`);

    await client.query('COMMIT');
    console.log('✓ Database transaction successfully committed.\n');

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('✗ Transaction rolled back due to error:', err);
    throw err;
  } finally {
    client.release();
  }

  // Clear local product images
  const localOutputDir = path.join(process.cwd(), 'public', 'images', 'products');
  if (fs.existsSync(localOutputDir)) {
    fs.rmSync(localOutputDir, { recursive: true, force: true });
    fs.mkdirSync(localOutputDir, { recursive: true });
    console.log(`✓ Cleaned local image directory: ${localOutputDir}`);
  }

  // Clear S3 product images
  try {
    await cleanS3ProductImages();
  } catch (s3Err) {
    console.warn('⚠️ S3 cleanup encountered an issue:', s3Err.message);
  }

  // Final verification
  const countAfter = await pool.query('SELECT count(*)::int as count FROM "retailProduct"');
  console.log(`\n==================================================`);
  console.log(`FINAL VERIFICATION:`);
  console.log(`Products remaining in retailProduct: ${countAfter.rows[0].count}`);
  console.log(`==================================================\n`);

  await pool.end();
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
