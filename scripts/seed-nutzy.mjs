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

    // 3. Category: Breakfast Spreads & Jams
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

    const productsToSeed = [
      {
        name: 'Nutzy Creamy Smooth Peanut Butter (227g)',
        variantName: '227g Jar',
        description: 'Enjoy the velvety smooth, rich taste of Nutzy Creamy Smooth Peanut Butter. Made with 100% select Nigerian-grown roasted peanuts, blended to a silky-smooth spreadable consistency with no cholesterol and zero trans fats.\n\nProduct Features:\n• Pure Creamy Spread: Silky, ultra-spreadable texture that glides effortlessly onto bread.\n• Wholesome Nutrition: Rich source of plant-based protein, healthy fats, and essential minerals.\n• Premium Local Sourcing: Proudly crafted from locally roasted Nigerian peanuts.\n• Everyday Versatility: Ideal for breakfast bread, toast, crackers, apples, smoothies, and baking.\n• Shelf Verification: Sourced directly from Calabar Mall supermarket shelves.\n\nSpecifications:\n• Brand: Nutzy\n• Net Weight: 227g (8 oz)\n• Packaging: Sealed Jar with Blue Cap\n• Texture: Creamy / Smooth\n• Shelf Price: ₦1,820\n• Selling Price: ₦1,911\n• Sold by: Calabar Mall',
        price: 1911,
        cost: 1820,
        compareAtPrice: 2205,
        stockQuantity: 50,
        unit: 'jar',
        images: [
          '/images/products/calabar-mall/nutzy-creamy-peanut-butter-227g-packshot.png',
        ],
      },
      {
        name: 'Nutzy Honey Peanut Butter (510g)',
        variantName: '510g Family Jar',
        description: 'Experience the irresistible combination of golden honey and roasted peanuts with Nutzy Honey Peanut Butter (510g). Infused with pure honey for a naturally sweet, aromatic spread that elevates your morning breakfast.\n\nProduct Features:\n• Golden Honey Blend: Naturally sweetened with pure honey for balanced flavor.\n• Family Size 510g: Big value jar perfect for households and daily breakfast lovers.\n• Nutrient Dense: Packed with natural protein, dietary fiber, and healthy energy to start your day.\n• Delicious Versatility: Fantastic on warm bread, toast, pancakes, waffles, oatmeal, or spooned right out of the jar.\n• Shelf Verification: Sourced directly from Calabar Mall supermarket shelves.\n\nSpecifications:\n• Brand: Nutzy\n• Net Weight: 510g (18 oz)\n• Packaging: Family-Size Sealed Jar\n• Flavor: Roasted Peanut with Pure Honey\n• Shelf Price: ₦3,770\n• Selling Price: ₦3,959\n• Sold by: Calabar Mall',
        price: 3959,
        cost: 3770,
        compareAtPrice: 4620,
        stockQuantity: 50,
        unit: 'jar',
        images: [
          '/images/products/calabar-mall/nutzy-honey-peanut-butter-510g-packshot.png',
        ],
      },
    ];

    for (const p of productsToSeed) {
      const prodCheck = await client.query(
        `SELECT id FROM "retailProduct" WHERE "organizationId" = $1 AND LOWER(name) = LOWER($2) LIMIT 1`,
        [orgId, p.name]
      );

      let productId;
      if (prodCheck.rows.length > 0) {
        productId = prodCheck.rows[0].id;
        await client.query(
          `UPDATE "retailProduct"
           SET "variantName" = $2,
               "categoryId" = $3,
               "globalCategory" = 'Groceries & Supermarket',
               description = $4,
               price = $5,
               cost = $6,
               "compareAtPrice" = $7,
               "stockQuantity" = $8,
               unit = $9,
               "imageAssetId" = $10,
               "isWeighed" = false
           WHERE id = $1`,
          [
            productId,
            p.variantName,
            categoryId,
            p.description,
            p.price,
            p.cost,
            p.compareAtPrice,
            p.stockQuantity,
            p.unit,
            JSON.stringify(p.images),
          ]
        );
        console.log(`✓ Updated Product: ${p.name}`);
      } else {
        productId = crypto.randomUUID();
        await client.query(
          `INSERT INTO "retailProduct" (id, "organizationId", "categoryId", "globalCategory", name, "variantName", description, price, cost, "compareAtPrice", "stockQuantity", unit, "imageAssetId", "isWeighed")
           VALUES ($1, $2, $3, 'Groceries & Supermarket', $4, $5, $6, $7, $8, $9, $10, $11, $12, false)`,
          [
            productId,
            orgId,
            categoryId,
            p.name,
            p.variantName,
            p.description,
            p.price,
            p.cost,
            p.compareAtPrice,
            p.stockQuantity,
            p.unit,
            JSON.stringify(p.images),
          ]
        );
        console.log(`✓ Created Product: ${p.name}`);
      }

      // Upsert Location Stock
      const stockCheck = await client.query(
        `SELECT id FROM "retailLocationStock" WHERE "organizationId" = $1 AND "productId" = $2 AND "locationId" = $3 LIMIT 1`,
        [orgId, productId, locationId]
      );
      if (stockCheck.rows.length > 0) {
        await client.query(
          `UPDATE "retailLocationStock"
           SET "stockQuantity" = $2
           WHERE id = $1`,
          [stockCheck.rows[0].id, p.stockQuantity]
        );
        console.log(`✓ Updated Location Stock for: ${p.name}`);
      } else {
        await client.query(
          `INSERT INTO "retailLocationStock" (id, "organizationId", "locationId", "productId", "stockQuantity")
           VALUES ($1, $2, $3, $4, $5)`,
          [crypto.randomUUID(), orgId, locationId, productId, p.stockQuantity]
        );
        console.log(`✓ Created Location Stock for: ${p.name}`);
      }
    }

    console.log('\n🎉 Successfully added both Nutzy products to Calabar Mall!');
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
