import 'dotenv/config';
import pg from 'pg';
const { Pool } = pg;

async function applyInfinixMarkup() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // 1. Fetch current items
    const beforeRes = await client.query(`
      SELECT id, name, cost, price, "compareAtPrice"
      FROM "retailProduct"
      WHERE "organizationId" = 'infinix-store'
      ORDER BY price DESC
    `);

    console.log(`Found ${beforeRes.rows.length} Infinix products to update.\n`);

    // 2. Apply +5% to price and compareAtPrice
    const updateRes = await client.query(`
      UPDATE "retailProduct"
      SET 
        price = ROUND((price * 1.05)::numeric, 0)::double precision,
        "compareAtPrice" = CASE 
          WHEN "compareAtPrice" IS NOT NULL THEN ROUND(("compareAtPrice" * 1.05)::numeric, 0)::double precision 
          ELSE NULL 
        END
      WHERE "organizationId" = 'infinix-store'
      RETURNING id, name, cost, price, "compareAtPrice";
    `);

    await client.query('COMMIT');

    console.log('--- UPDATED INFINIX PRODUCTS (+5% APPLIED) ---');
    for (const p of updateRes.rows) {
      const prev = beforeRes.rows.find((b) => b.id === p.id);
      console.log(`• ${p.name.slice(0, 48)}...`);
      console.log(`  Prev Price: ₦${prev.price.toLocaleString()} -> New Price (+5%): ₦${p.price.toLocaleString()} (Cost: ₦${p.cost.toLocaleString()}, CompareAt: ₦${p.compareAtPrice?.toLocaleString()})`);
    }

    console.log('\n✓ Successfully added 5% to all Infinix products!');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error applying markup to Infinix:', err);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

applyInfinixMarkup();
