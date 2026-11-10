import 'dotenv/config';
import pg from 'pg';

const { Pool } = pg;

async function updateCalabarMallImages() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  const client = await pool.connect();
  try {
    const orgId = 'calabar-mall';
    const storeImage = '/images/stores/calabar-mall-storefront.jpg';

    await client.query('BEGIN');

    // 1. Update Organization Logo
    await client.query(
      `UPDATE organization 
       SET "logoAssetId" = $2 
       WHERE id = $1`,
      [orgId, storeImage]
    );
    console.log('✓ Updated Organization logo to online storefront image');

    // 2. Update DiscoveryListing Cover Image & Metadata
    const listRes = await client.query(
      `SELECT id, metadata FROM "discoveryListing" WHERE "organizationId" = $1 LIMIT 1`,
      [orgId]
    );
    if (listRes.rows.length > 0) {
      let meta = {};
      try {
        meta = typeof listRes.rows[0].metadata === 'string' ? JSON.parse(listRes.rows[0].metadata) : (listRes.rows[0].metadata || {});
      } catch {}
      meta.coverImage = storeImage;
      meta.images = [storeImage];
      await client.query(
        `UPDATE "discoveryListing" 
         SET "coverAssetId" = $2, metadata = $3 
         WHERE id = $1`,
        [listRes.rows[0].id, storeImage, JSON.stringify(meta)]
      );
      console.log('✓ Updated DiscoveryListing cover image');
    }

    // 3. Update Alpenliebe Eclairs -> ONLY online packshot
    await client.query(
      `UPDATE "retailProduct"
       SET "imageAssetId" = $2
       WHERE "organizationId" = $1 AND LOWER(name) LIKE '%alpenliebe%'`,
      [orgId, JSON.stringify(['/images/products/calabar-mall/alpenliebe-eclairs-packshot.jpg'])]
    );
    console.log('✓ Alpenliebe Eclairs updated to ONLY online downloaded packshot');

    // 4. Update Skippy Peanut Butter -> ONLY online packshots
    await client.query(
      `UPDATE "retailProduct"
       SET "imageAssetId" = $2
       WHERE "organizationId" = $1 AND LOWER(name) LIKE '%skippy%'`,
      [
        orgId,
        JSON.stringify([
          '/images/products/calabar-mall/skippy-peanut-butter-front.jpg',
          '/images/products/calabar-mall/skippy-peanut-butter-packshot.png',
        ]),
      ]
    );
    console.log('✓ Skippy Peanut Butter updated to ONLY online downloaded images');

    // 5. Update Nutzy Creamy 227g -> ONLY online packshot
    await client.query(
      `UPDATE "retailProduct"
       SET "imageAssetId" = $2
       WHERE "organizationId" = $1 AND LOWER(name) LIKE '%nutzy%' AND LOWER(name) LIKE '%creamy%'`,
      [orgId, JSON.stringify(['/images/products/calabar-mall/nutzy-creamy-peanut-butter-227g-packshot.png'])]
    );
    console.log('✓ Nutzy Creamy updated to ONLY online downloaded packshot');

    // 6. Update Nutzy Honey 510g -> ONLY online packshot
    await client.query(
      `UPDATE "retailProduct"
       SET "imageAssetId" = $2
       WHERE "organizationId" = $1 AND LOWER(name) LIKE '%nutzy%' AND LOWER(name) LIKE '%honey%'`,
      [orgId, JSON.stringify(['/images/products/calabar-mall/nutzy-honey-peanut-butter-510g-packshot.png'])]
    );
    console.log('✓ Nutzy Honey updated to ONLY online downloaded packshot');

    await client.query('COMMIT');
    console.log('\n🎉 Successfully updated all Calabar Mall products to strictly use only online downloaded images!');

    const verifyRes = await client.query(
      `SELECT name, price, "imageAssetId" FROM "retailProduct" WHERE "organizationId" = $1 ORDER BY name ASC`,
      [orgId]
    );
    console.log('\nVerified Products for Calabar Mall:');
    for (const row of verifyRes.rows) {
      console.log(`• ${row.name}: ₦${row.price}`);
      console.log(`  Images: ${row.imageAssetId}`);
    }
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

updateCalabarMallImages().catch(console.error);
