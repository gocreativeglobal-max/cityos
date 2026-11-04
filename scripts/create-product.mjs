import 'dotenv/config';
import pg from 'pg';
import { randomUUID } from 'crypto';

const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function main() {
  const orgId = 'software-guru-tech-calabar';
  const locationId = '5e77fe02-0abc-4391-bd1b-6c7ab3e267ed'; // Ettagbor Showroom
  const productId = randomUUID();

  // Find or create category
  let categoryRes = await pool.query(
    `SELECT id FROM "retailCategory" WHERE "organizationId" = $1 AND name ILIKE '%Power%' LIMIT 1`,
    [orgId]
  );
  let categoryId = categoryRes.rows[0]?.id;

  if (!categoryId) {
    const newCatId = randomUUID();
    await pool.query(
      `INSERT INTO "retailCategory" (id, "organizationId", name) VALUES ($1, $2, $3)`,
      [newCatId, orgId, 'Chargers, Cables & Power Adapters']
    );
    categoryId = newCatId;
  }

  const title = 'LDNIO 65W GaN Super Fast Charger with Retractable Magnetic Cable – Multi-Port Desktop & Travel Power Adapter for Laptops, Tablets & Smartphones';
  const description = `Power all your essential devices faster, safer, and cleaner with the LDNIO 65W GaN Super Fast Charger. Engineered with advanced Gallium Nitride (GaN) technology and Turbo Power Engine, this compact powerhouse delivers high-efficiency charging while running significantly cooler than standard silicon adapters. Featuring a built-in lanyard-style retractable magnetic cable alongside auxiliary USB ports, it eliminates desk clutter and powers laptops, tablets, and phones simultaneously from a single compact unit.

Key Features:
• 65W High-Speed Output: Provides up to 65W power delivery, capable of rapid-charging power-hungry devices—from MacBooks and Windows ultrabooks to iPhones, iPads, and Android flagships.
• Next-Gen GaN Technology: Gallium Nitride semiconductor components allow for smaller size, higher heat dissipation efficiency, and faster energy transfer with minimal power loss.
• Integrated Retractable Magnetic Cable: Built with a durable integrated cable featuring a magnetic tip and convenient carrying loop—no tangled cords in your bag or workspace.
• Multi-Device Compatibility: Compatible with USB-C PD, QC, and UFCS fast-charging protocols across phones, tablets, earbuds, and laptops.
• Multi-Port Versatility: Integrated cable plus onboard USB-A and USB-C ports to charge multiple gadgets at once without throttling performance.
• Certified Multi-Layer Protection: Built-in safeguards defend against over-current, over-voltage, short-circuiting, and overheating for complete device safety.

Specifications:
• Brand: LDNIO
• Total Power Output: 65W Max
• Technology: GaN (Gallium Nitride) / Turbo Power Engine
• Supported Protocols: UFCS, PD (Power Delivery), QC (Quick Charge)
• Ports / Outputs: Integrated Retractable Magnetic Cable + USB-C + USB-A
• Compatibility: Laptops, Tablets, Smartphones, Smartwatches, Earbuds
• Form Factor: Compact Desktop / Portable Travel Adapter`;

  const s3ImageUrl = 'https://cityconnect-assets-123.s3.eu-north-1.amazonaws.com/products/ldnio-65w-gan-super-fast-charger.jpg';
  const price = 26250; // 25k + 5%
  const compareAtPrice = 45000;
  const cost = 25000;
  const stockQuantity = 25;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Insert product
    await client.query(
      `INSERT INTO "retailProduct" (
        id, "organizationId", name, description, price, "compareAtPrice", cost,
        "stockQuantity", "imageAssetId", "categoryId", "globalCategory", unit, "createdAt"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW())`,
      [
        productId,
        orgId,
        title,
        description,
        price,
        compareAtPrice,
        cost,
        stockQuantity,
        s3ImageUrl,
        categoryId,
        'Mobile Accessories deals',
        'ea'
      ]
    );

    // 2. Insert RetailLocationStock
    await client.query(
      `INSERT INTO "retailLocationStock" (id, "organizationId", "locationId", "productId", "stockQuantity")
       VALUES ($1, $2, $3, $4, $5)`,
      [randomUUID(), orgId, locationId, productId, stockQuantity]
    );

    // 3. Insert RetailStockMovement
    await client.query(
      `INSERT INTO "retailStockMovement" (id, "organizationId", "locationId", "productId", delta, "beforeQty", "afterQty", reason)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [randomUUID(), orgId, locationId, productId, stockQuantity, 0, stockQuantity, 'INITIAL_STOCK']
    );

    // 4. Update RetailSettings hasProducts
    await client.query(
      `UPDATE "retailSettings" SET "hasProducts" = true WHERE "organizationId" = $1`,
      [orgId]
    );

    await client.query('COMMIT');
    console.log('✓ Successfully created product:', productId);
    console.log({
      id: productId,
      name: title,
      price,
      compareAtPrice,
      cost,
      stockQuantity,
      imageAssetId: s3ImageUrl,
      organizationId: orgId,
      locationId
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Failed to create product:', err);
    throw err;
  } finally {
    client.release();
  }

  await pool.end();
}

main().catch(console.error);
