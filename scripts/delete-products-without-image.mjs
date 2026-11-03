import 'dotenv/config';
import pg from 'pg';

const { Pool } = pg;

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const client = await pool.connect();

  try {
    const res = await client.query(`
      SELECT id, name, "organizationId"
      FROM "retailProduct"
      WHERE "imageAssetId" IS NULL OR trim("imageAssetId") = ''
    `);

    const ids = res.rows.map(r => r.id);
    console.log(`Found ${ids.length} products without images to delete.`);

    if (ids.length === 0) {
      console.log('No products without images found.');
      return;
    }

    await client.query('BEGIN');

    // 1. Delete voiceCartItem
    const delVoiceCart = await client.query(
      `DELETE FROM "voiceCartItem" WHERE "retailProductId" = ANY($1::text[])`,
      [ids]
    );

    // 2. Delete retailStockMovement
    const delStockMovements = await client.query(
      `DELETE FROM "retailStockMovement" WHERE "productId" = ANY($1::text[])`,
      [ids]
    );

    // 3. Delete retailLocationStock
    const delLocStock = await client.query(
      `DELETE FROM "retailLocationStock" WHERE "productId" = ANY($1::text[])`,
      [ids]
    );

    // 4. Delete retailOrderItem
    const delOrderItems = await client.query(
      `DELETE FROM "retailOrderItem" WHERE "productId" = ANY($1::text[])`,
      [ids]
    );

    // 5. Delete retailPurchaseOrderItem
    const delPO = await client.query(
      `DELETE FROM "retailPurchaseOrderItem" WHERE "productId" = ANY($1::text[])`,
      [ids]
    );

    // 6. Delete child variants
    const delVariants = await client.query(
      `DELETE FROM "retailProduct" WHERE "parentId" = ANY($1::text[])`,
      [ids]
    );

    // 7. Delete the products themselves
    const delProducts = await client.query(
      `DELETE FROM "retailProduct" WHERE id = ANY($1::text[]) RETURNING id, name`,
      [ids]
    );

    await client.query('COMMIT');

    console.log(`\nSuccessfully deleted ${delProducts.rowCount} products without images:`);
    console.log(` - voiceCartItem: ${delVoiceCart.rowCount}`);
    console.log(` - retailStockMovement: ${delStockMovements.rowCount}`);
    console.log(` - retailLocationStock: ${delLocStock.rowCount}`);
    console.log(` - retailOrderItem: ${delOrderItems.rowCount}`);
    console.log(` - retailPurchaseOrderItem: ${delPO.rowCount}`);
    console.log(` - child variants: ${delVariants.rowCount}`);
    console.log(` - retailProduct rows: ${delProducts.rowCount}`);

    // Verify remaining
    const remaining = await client.query(`
      SELECT 
        count(*)::int as total,
        count(CASE WHEN "imageAssetId" IS NOT NULL AND trim("imageAssetId") != '' THEN 1 END)::int as with_image,
        count(CASE WHEN "imageAssetId" IS NULL OR trim("imageAssetId") = '' THEN 1 END)::int as without_image
      FROM "retailProduct"
    `);
    console.log('\nRemaining products in database:', remaining.rows[0]);

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error during deletion:', err);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch(console.error);
