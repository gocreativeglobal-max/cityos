import 'dotenv/config';
import pg from 'pg';
import crypto from 'crypto';

const { Pool } = pg;

async function main() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  const client = await pool.connect();
  try {
    const orgId = 'calabar-mall';

    // 1. Verify Calabar Mall exists
    const orgRes = await client.query(`SELECT id, name FROM organization WHERE id = $1 LIMIT 1`, [orgId]);
    if (orgRes.rows.length === 0) {
      throw new Error('Calabar Mall organization not found in database');
    }
    console.log('✓ Found Organization:', orgRes.rows[0].name);

    // 2. Resolve Location
    const locRes = await client.query(`SELECT id FROM location WHERE "organizationId" = $1 LIMIT 1`, [orgId]);
    if (locRes.rows.length === 0) {
      throw new Error('Calabar Mall location not found');
    }
    const locationId = locRes.rows[0].id;
    console.log('✓ Found Location:', locationId);

    // 3. Category: Beverages, Coffee & Tea
    const categoryName = 'Beverages, Coffee & Tea';
    let catRes = await client.query(
      `SELECT id FROM "retailCategory" WHERE "organizationId" = $1 AND LOWER(name) = LOWER($2) LIMIT 1`,
      [orgId, categoryName]
    );
    let categoryId;
    if (catRes.rows.length > 0) {
      categoryId = catRes.rows[0].id;
    } else {
      categoryId = crypto.randomUUID();
      await client.query(
        `INSERT INTO "retailCategory" (id, "organizationId", name) VALUES ($1, $2, $3)`,
        [categoryId, orgId, categoryName]
      );
      console.log('✓ Created Category:', categoryName);
    }

    // 4. Product: Lipton Yellow Label Black Tea (25 Tea Bags)
    const productName = 'Lipton Yellow Label Black Tea (25 Tea Bags)';
    const productDesc = 'Start your day refreshed with Lipton Yellow Label Black Tea. Crafted from finest sun-ripened tea leaves carefully selected and freshly pressed to capture maximum rich natural tea taste and inviting aroma in every cup.\n\nProduct Features:\n• Quality No. 1 Black Tea: Rich natural taste and soothing golden amber brew.\n• Sun-Ripened Tea Leaves: Freshly pressed tea essence for full-bodied flavor.\n• 25 Individually Tagged Tea Bags: Convenient, quick brewing in hot water.\n• Pure & Energizing: Rich in natural antioxidants (flavonoids) for natural morning alertness.\n• Daily Breakfast Staple: Enjoy black, or pair with milk, honey, lemon, or sugar.\n\nSpecifications:\n• Brand: Lipton\n• Count: 25 Tea Bags\n• Type: Black Tea / Yellow Label\n• Price: ₦1,100\n• Store: Calabar Mall';

    const images = ['/images/products/calabar-mall/lipton-yellow-label-tea-25bags.jpg'];

    const prodCheck = await client.query(
      `SELECT id FROM "retailProduct" WHERE "organizationId" = $1 AND LOWER(name) LIKE '%lipton%' LIMIT 1`,
      [orgId]
    );

    let productId;
    if (prodCheck.rows.length > 0) {
      productId = prodCheck.rows[0].id;
      await client.query(
        `UPDATE "retailProduct"
         SET name = $2,
             "variantName" = '25 Tea Bags',
             "categoryId" = $3,
             "globalCategory" = 'Groceries & Supermarket',
             description = $4,
             price = 1155,
             cost = 1100,
             "compareAtPrice" = 1418,
             "stockQuantity" = 100,
             unit = 'pack',
             "imageAssetId" = $5,
             "isWeighed" = false
         WHERE id = $1`,
        [productId, productName, categoryId, productDesc, JSON.stringify(images)]
      );
      console.log('✓ Updated Product:', productName);
    } else {
      productId = crypto.randomUUID();
      await client.query(
        `INSERT INTO "retailProduct" (id, "organizationId", "categoryId", "globalCategory", name, "variantName", description, price, cost, "compareAtPrice", "stockQuantity", unit, "imageAssetId", "isWeighed")
         VALUES ($1, $2, $3, 'Groceries & Supermarket', $4, '25 Tea Bags', $5, 1155, 1100, 1418, 100, 'pack', $6, false)`,
        [productId, orgId, categoryId, productName, productDesc, JSON.stringify(images)]
      );
      console.log('✓ Created Product:', productName);
    }

    // 5. Stock in retailLocationStock
    const stockCheck = await client.query(
      `SELECT id FROM "retailLocationStock" WHERE "organizationId" = $1 AND "productId" = $2 AND "locationId" = $3 LIMIT 1`,
      [orgId, productId, locationId]
    );
    if (stockCheck.rows.length > 0) {
      await client.query(
        `UPDATE "retailLocationStock"
         SET "stockQuantity" = 100
         WHERE id = $1`,
        [stockCheck.rows[0].id]
      );
      console.log('✓ Updated Location Stock: 100 packs');
    } else {
      await client.query(
        `INSERT INTO "retailLocationStock" (id, "organizationId", "locationId", "productId", "stockQuantity")
         VALUES ($1, $2, $3, $4, 100)`,
        [crypto.randomUUID(), orgId, locationId, productId]
      );
      console.log('✓ Created Location Stock: 100 packs');
    }

    // 6. Update aisles on DiscoveryListing to include Beverages, Coffee & Tea
    const listRes = await client.query(`SELECT id, metadata FROM "discoveryListing" WHERE "organizationId" = $1 LIMIT 1`, [orgId]);
    if (listRes.rows.length > 0) {
      let meta = {};
      try {
        meta = typeof listRes.rows[0].metadata === 'string' ? JSON.parse(listRes.rows[0].metadata) : (listRes.rows[0].metadata || {});
      } catch {}
      const existingAisles = meta.aisles || [];
      if (!existingAisles.includes(categoryName)) {
        meta.aisles = [categoryName, ...existingAisles];
      }
      await client.query(
        `UPDATE "discoveryListing" SET metadata = $2 WHERE id = $1`,
        [listRes.rows[0].id, JSON.stringify(meta)]
      );
      console.log('✓ Updated DiscoveryListing aisles');
    }

    console.log('\n🎉 Successfully added Lipton Yellow Label Tea (₦1,100) to Calabar Mall!');
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
