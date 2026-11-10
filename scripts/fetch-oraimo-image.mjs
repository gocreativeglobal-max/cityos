import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import pg from 'pg';

const { Pool } = pg;

async function main() {
  const images = [
    {
      url: 'https://ng.jumia.is/unsafe/fit-in/680x680/filters:fill(white)/product/67/8867814/1.jpg',
      filename: 'oraimo-power-cube-10-ocw-1111u-l53-1.jpg'
    },
    {
      url: 'https://ng.jumia.is/unsafe/fit-in/680x680/filters:fill(white)/product/67/8867814/2.jpg',
      filename: 'oraimo-power-cube-10-ocw-1111u-l53-2.jpg'
    }
  ];

  const outDir = path.resolve('public/images/products/cygroup');
  fs.mkdirSync(outDir, { recursive: true });

  const localPaths = [];
  for (const img of images) {
    console.log('Downloading:', img.url);
    const res = await fetch(img.url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
    });
    const buffer = Buffer.from(await res.arrayBuffer());
    const outFile = path.join(outDir, img.filename);
    fs.writeFileSync(outFile, buffer);
    console.log('✓ Saved', img.filename, `(${buffer.length} bytes)`);
    localPaths.push(`/images/products/cygroup/${img.filename}`);
  }

  // Update Database
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const client = await pool.connect();
  try {
    const jsonImages = JSON.stringify(localPaths);
    const updateRes = await client.query(
      `UPDATE "retailProduct"
       SET "imageAssetId" = $1
       WHERE id = 'cygroup-cal-8073' OR name ILIKE '%OCW-1111U-L53%'`,
      [jsonImages]
    );
    console.log(`✓ Updated database for ${updateRes.rowCount} product(s) with new imageAssetId:`, jsonImages);

    // Verify
    const verifyRes = await client.query(
      `SELECT id, name, "imageAssetId" FROM "retailProduct" WHERE id = 'cygroup-cal-8073'`
    );
    console.log('Verified product:', verifyRes.rows[0]);
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch(console.error);
