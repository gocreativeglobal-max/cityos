import 'dotenv/config';
import pg from 'pg';

const { Pool } = pg;

async function applyMarkup() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Snapshot counts
    const countRes = await client.query(`SELECT COUNT(*) as count FROM "retailProduct"`);
    const totalCount = parseInt(countRes.rows[0].count, 10);
    console.log(`Found ${totalCount} retail products in system.`);

    // 2. Set cost to current price where cost is null or 0 (so cost of goods preserves the original base price)
    const costUpdateRes = await client.query(`
      UPDATE "retailProduct"
      SET "cost" = "price"
      WHERE "cost" IS NULL OR "cost" = 0
    `);
    console.log(`✓ Preserved original base price in 'cost' for ${costUpdateRes.rowCount} products.`);

    // 3. Update selling price by adding 5% (+5% markup) rounded to nearest whole Naira
    // and scale compareAtPrice by 1.05 as well where present.
    const priceUpdateRes = await client.query(`
      UPDATE "retailProduct"
      SET 
        "price" = ROUND(("price" * 1.05)::numeric, 0)::double precision,
        "compareAtPrice" = CASE 
          WHEN "compareAtPrice" IS NOT NULL THEN ROUND(("compareAtPrice" * 1.05)::numeric, 0)::double precision
          ELSE NULL 
        END
    `);
    console.log(`✓ Added 5% markup to selling price for ${priceUpdateRes.rowCount} products in the system.`);

    await client.query('COMMIT');

    // 4. Verification
    console.log('\n--- VERIFICATION ---');
    const calabarMallCheck = await client.query(`
      SELECT name, "cost" as shelf_price, price as selling_price, "compareAtPrice"
      FROM "retailProduct"
      WHERE "organizationId" = 'calabar-mall'
      ORDER BY name ASC;
    `);
    console.log('Calabar Mall Products (+5% Selling Price):');
    for (const r of calabarMallCheck.rows) {
      console.log(`• ${r.name}:`);
      console.log(`  Shelf Cost: ₦${r.shelf_price} -> New Selling Price: ₦${r.selling_price} (CompareAt: ₦${r.compareAtPrice})`);
    }

    const otherSample = await client.query(`
      SELECT p.name, o.name as org, p."cost" as original_cost, p.price as new_selling_price
      FROM "retailProduct" p
      JOIN organization o ON p."organizationId" = o.id
      WHERE p."organizationId" != 'calabar-mall'
      LIMIT 8;
    `);
    console.log('\nOther Products Across the System (Sample):');
    for (const r of otherSample.rows) {
      console.log(`• [${r.org}] ${r.name}: ₦${r.original_cost} -> ₦${r.new_selling_price}`);
    }

    console.log('\n🎉 Successfully updated all products in the system with +5% selling price!');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error applying markup:', err);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

applyMarkup().catch((e) => {
  console.error(e);
  process.exit(1);
});
