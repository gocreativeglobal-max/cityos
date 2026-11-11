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

    // 3. Category: Breakfast Spreads & Jams (or Groceries & Pantry)
    const categoryName = 'Breakfast Spreads & Jams';
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

    // 4. Product: Skippy Super Chunk Extra Crunchy Peanut Butter
    const productName = 'SKIPPY Super Chunk Extra Crunchy Peanut Butter (462g / 16.3 oz)';
    const productDesc = 'Indulge in real peanut goodness with SKIPPY Super Chunk Extra Crunchy Peanut Butter. Packed with loads of real peanut pieces blended into a rich, creamy peanut spread, delivering maximum crunch and satisfying flavor in every spoonful.\n\nProduct Features:\n• Super Chunk Extra Crunchy: Loaded with chunks of real roasted peanuts for signature crunch.\n• High Protein: 7g of protein per serving to power your morning.\n• Pure Ingredients: Roasted peanuts, sugar, vegetable oil, and salt.\n• Versatile Staple: Perfect for toast, agege bread, apples, bananas, smoothies, or dipping.\n• Quality Standard: Gluten-free, certified Kosher, with no artificial flavors or preservatives.\n• Genuine Calabar Mall Stock: Verified directly from Calabar Mall supermarket shelves.\n\nSpecifications:\n• Brand: SKIPPY (Hormel Foods)\n• Net Weight: 16.3 oz (462g)\n• Texture: Super Chunk / Extra Crunchy\n• Price: ₦8,785\n• Store: Calabar Mall';

    const images = [
      '/images/products/calabar-mall/skippy-peanut-butter-front.jpg',
      '/images/products/calabar-mall/skippy-peanut-butter-packshot.png',
      '/images/products/calabar-mall/skippy-peanut-butter-shelf.jpg',
    ];

    const prodCheck = await client.query(
      `SELECT id FROM "retailProduct" WHERE "organizationId" = $1 AND LOWER(name) LIKE '%skippy%' LIMIT 1`,
      [orgId]
    );

    let productId;
    if (prodCheck.rows.length > 0) {
      productId = prodCheck.rows[0].id;
      await client.query(
        `UPDATE "retailProduct"
         SET name = $2,
             "variantName" = '16.3 oz (462g)',
             "categoryId" = $3,
             "globalCategory" = 'Groceries & Supermarket',
             description = $4,
             price = 9224,
             cost = 8785,
             "compareAtPrice" = 9975,
             "stockQuantity" = 50,
             unit = 'jar',
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
         VALUES ($1, $2, $3, 'Groceries & Supermarket', $4, '16.3 oz (462g)', $5, 9224, 8785, 9975, 50, 'jar', $6, false)`,
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
         SET "stockQuantity" = 50
         WHERE id = $1`,
        [stockCheck.rows[0].id]
      );
      console.log('✓ Updated Location Stock: 50 jars');
    } else {
      await client.query(
        `INSERT INTO "retailLocationStock" (id, "organizationId", "locationId", "productId", "stockQuantity")
         VALUES ($1, $2, $3, $4, 50)`,
        [crypto.randomUUID(), orgId, locationId, productId]
      );
      console.log('✓ Created Location Stock: 50 jars');
    }

    // 6. Update aisles on DiscoveryListing to include Breakfast Spreads & Jams
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

    console.log('\n🎉 Successfully added SKIPPY Super Chunk Peanut Butter (₦8,785) to Calabar Mall!');
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
