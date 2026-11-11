import 'dotenv/config';
import pg from 'pg';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

const { Pool } = pg;

async function main() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  const client = await pool.connect();
  try {
    const tablesRes = await client.query(
      `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'`
    );
    const tableNames = tablesRes.rows.map((r) => r.table_name);
    const resolveTable = (candidates) => {
      for (const c of candidates) {
        const found = tableNames.find((t) => t.toLowerCase() === c.toLowerCase());
        if (found) return `"${found}"`;
      }
      throw new Error(`Could not find table for candidates: ${candidates.join(', ')}`);
    };

    const T_CITY = resolveTable(['city', 'City']);
    const T_ORG = resolveTable(['organization', 'Organization']);
    const T_LOC = resolveTable(['location', 'Location']);
    const T_LISTING = resolveTable(['discoveryListing', 'DiscoveryListing', 'discovery_listing']);
    const T_SETTINGS = resolveTable(['retailSettings', 'RetailSettings', 'retail_settings']);
    const T_CATEGORY = resolveTable(['retailCategory', 'RetailCategory', 'retail_category']);
    const T_PRODUCT = resolveTable(['retailProduct', 'RetailProduct', 'retail_product']);
    const T_STOCK = resolveTable(['retailLocationStock', 'RetailLocationStock', 'retail_location_stock']);

    // Ensure image exists in public folder
    const productImages = [
      '/images/products/calabar-mall/alpenliebe-eclairs-packshot.jpg',
      '/images/products/calabar-mall/alpenliebe-eclairs.jpg',
    ];
    const storeLogoRelPath = '/images/products/calabar-mall/alpenliebe-eclairs-packshot.jpg';

    await client.query('BEGIN');

    // 1. Resolve Calabar City
    let cityRes = await client.query(
      `SELECT id, name, slug FROM ${T_CITY} WHERE LOWER(slug) = 'calabar' OR LOWER(name) = 'calabar' LIMIT 1`
    );
    if (cityRes.rows.length === 0) {
      throw new Error('Calabar city record not found in database');
    }
    const cityId = cityRes.rows[0].id;
    console.log('✓ Found Calabar cityId:', cityId);

    // 2. Organization: Calabar Mall
    const orgId = 'calabar-mall';
    const orgName = 'Calabar Mall';
    const orgAddress = 'Murtala Mohammed Highway, Calabar, Cross River State, Nigeria';
    const orgDesc = 'Premier retail shopping center and supermarket in Calabar, offering top brands in groceries, confectionery, snacks, drinks, daily household essentials, and consumer goods.';
    const storeCategory = 'Groceries & Supermarket';

    const existingOrg = await client.query(`SELECT id FROM ${T_ORG} WHERE id = $1 LIMIT 1`, [orgId]);
    if (existingOrg.rows.length > 0) {
      await client.query(
        `UPDATE ${T_ORG}
         SET name = $2,
             type = 'RETAIL',
             "storeCategory" = $3,
             description = $4,
             address = $5,
             "logoAssetId" = $6,
             status = 'ACTIVE'
         WHERE id = $1`,
        [orgId, orgName, storeCategory, orgDesc, orgAddress, storeLogoRelPath]
      );
      console.log('✓ Updated Organization:', orgName);
    } else {
      await client.query(
        `INSERT INTO ${T_ORG} (id, name, type, "storeCategory", description, address, "logoAssetId", status)
         VALUES ($1, $2, 'RETAIL', $3, $4, $5, $6, 'ACTIVE')`,
        [orgId, orgName, storeCategory, orgDesc, orgAddress, storeLogoRelPath]
      );
      console.log('✓ Created Organization:', orgName);
    }

    // 3. Location: Calabar Mall Main Branch
    const locName = 'Calabar Mall Main Supermarket';
    let locRes = await client.query(
      `SELECT id FROM ${T_LOC} WHERE "organizationId" = $1 LIMIT 1`,
      [orgId]
    );
    let locationId;
    if (locRes.rows.length > 0) {
      locationId = locRes.rows[0].id;
      await client.query(
        `UPDATE ${T_LOC}
         SET name = $2,
             address = $3,
             "cityId" = $4,
             latitude = 4.9757,
             longitude = 8.3417
         WHERE id = $1`,
        [locationId, locName, orgAddress, cityId]
      );
      console.log('✓ Updated Location:', locName);
    } else {
      locationId = crypto.randomUUID();
      await client.query(
        `INSERT INTO ${T_LOC} (id, "organizationId", name, address, "cityId", latitude, longitude)
         VALUES ($1, $2, $3, $4, $5, 4.9757, 8.3417)`,
        [locationId, orgId, locName, orgAddress, cityId]
      );
      console.log('✓ Created Location:', locName);
    }

    // 4. DiscoveryListing for Calabar Mall
    const aisles = [
      'Snacks & Confectionery',
      'Groceries & Pantry',
      'Beverages & Drinks',
      'Household Essentials',
    ];
    const listingMetadata = JSON.stringify({
      claimed: true,
      verified: true,
      isVerified: true,
      neighborhood: 'Highway / Calabar Municipal',
      area: 'Murtala Mohammed Highway',
      workingHours: 'Mon – Sun · 08:00 AM – 09:30 PM',
      landmark: 'Murtala Mohammed Highway, Calabar',
      coverImage: storeLogoRelPath,
      images: [storeLogoRelPath],
      aisles,
      phone: '+2348065373747',
      whatsapp: '2348065373747',
      address: orgAddress,
      description: orgDesc,
    });

    let listRes = await client.query(`SELECT id FROM ${T_LISTING} WHERE "organizationId" = $1 LIMIT 1`, [orgId]);
    if (listRes.rows.length > 0) {
      await client.query(
        `UPDATE ${T_LISTING}
         SET "locationId" = $2,
             "cityId" = $3,
             vertical = 'RETAIL',
             slug = 'calabar-mall',
             title = $4,
             description = $5,
             "coverAssetId" = $6,
             "isActive" = true,
             metadata = $7
         WHERE id = $1`,
        [listRes.rows[0].id, locationId, cityId, orgName, orgDesc, storeLogoRelPath, listingMetadata]
      );
      console.log('✓ Updated DiscoveryListing for Calabar Mall');
    } else {
      await client.query(
        `INSERT INTO ${T_LISTING} (id, "organizationId", "locationId", "cityId", vertical, slug, title, description, "coverAssetId", "isActive", metadata)
         VALUES ($1, $2, $3, $4, 'RETAIL', 'calabar-mall', $5, $6, $7, true, $8)`,
        [crypto.randomUUID(), orgId, locationId, cityId, orgName, orgDesc, storeLogoRelPath, listingMetadata]
      );
      console.log('✓ Created DiscoveryListing for Calabar Mall');
    }

    // 5. RetailSettings
    const existingSettings = await client.query(
      `SELECT id FROM ${T_SETTINGS} WHERE "organizationId" = $1 LIMIT 1`,
      [orgId]
    );
    if (existingSettings.rows.length === 0) {
      await client.query(
        `INSERT INTO ${T_SETTINGS} (id, "organizationId", "storeName", "storeAddress", "currencySymbol", country, "hasStoreInfo", "hasProducts")
         VALUES ($1, $2, $3, $4, '₦', 'NG', true, true)`,
        [crypto.randomUUID(), orgId, orgName, orgAddress]
      );
      console.log('✓ Created RetailSettings');
    }

    // 6. Category: Snacks & Confectionery
    const categoryName = 'Snacks & Confectionery';
    let catCheck = await client.query(
      `SELECT id FROM ${T_CATEGORY} WHERE "organizationId" = $1 AND LOWER(name) = LOWER($2) LIMIT 1`,
      [orgId, categoryName]
    );
    let categoryId;
    if (catCheck.rows.length > 0) {
      categoryId = catCheck.rows[0].id;
    } else {
      categoryId = crypto.randomUUID();
      await client.query(
        `INSERT INTO ${T_CATEGORY} (id, "organizationId", name)
         VALUES ($1, $2, $3)`,
        [categoryId, orgId, categoryName]
      );
      console.log('✓ Created Category:', categoryName);
    }

    // 7. Insert/Update Product: Alpenliebe Eclairs
    const productName = 'Alpenliebe Eclairs Caramel Candy with Chocolate Center (Bag)';
    const productDesc = 'Indulge in the rich, luscious taste of Alpenliebe Eclairs. Featuring a smooth, creamy caramel shell filled with a decadent liquid chocolate center that melts in your mouth.\n\nProduct Details:\n• Rich Milky Caramel: Creamy and silky exterior shell.\n• Liquid Chocolate Center: Delicious molten chocolate core.\n• Individually Wrapped: Convenient, hygienic, and perfect for on-the-go snacking.\n• Genuine Calabar Mall Stock: Sourced directly from Calabar Mall supermarket shelves.\n\nSpecifications:\n• Brand: Alpenliebe\n• Product: Eclairs with Chocolate Center\n• Packaging: Sealed Value Pack / Bag\n• Price: ₦1,800\n• Store: Calabar Mall';

    const prodCheck = await client.query(
      `SELECT id FROM ${T_PRODUCT} WHERE "organizationId" = $1 AND LOWER(name) = LOWER($2) LIMIT 1`,
      [orgId, productName]
    );

    let productId;
    if (prodCheck.rows.length > 0) {
      productId = prodCheck.rows[0].id;
      await client.query(
        `UPDATE ${T_PRODUCT}
         SET "categoryId" = $2,
             "globalCategory" = 'Groceries & Supermarket',
             description = $3,
             price = 1890,
             cost = 1800,
             "compareAtPrice" = 2310,
             "stockQuantity" = 100,
             unit = 'bag',
             "imageAssetId" = $4,
             "variantName" = 'Bag',
             "isWeighed" = false
         WHERE id = $1`,
        [productId, categoryId, productDesc, JSON.stringify(productImages)]
      );
      console.log('✓ Updated Product:', productName);
    } else {
      productId = crypto.randomUUID();
      await client.query(
        `INSERT INTO ${T_PRODUCT} (id, "organizationId", "categoryId", "globalCategory", name, "variantName", description, price, cost, "compareAtPrice", "stockQuantity", unit, "imageAssetId", "isWeighed")
         VALUES ($1, $2, $3, 'Groceries & Supermarket', $4, 'Bag', $5, 1890, 1800, 2310, 100, 'bag', $6, false)`,
        [productId, orgId, categoryId, productName, productDesc, JSON.stringify(productImages)]
      );
      console.log('✓ Created Product:', productName);
    }

    // 8. Update/Insert RetailLocationStock
    const stockCheck = await client.query(
      `SELECT id FROM ${T_STOCK} WHERE "organizationId" = $1 AND "productId" = $2 AND "locationId" = $3 LIMIT 1`,
      [orgId, productId, locationId]
    );
    if (stockCheck.rows.length > 0) {
      await client.query(
        `UPDATE ${T_STOCK}
         SET "stockQuantity" = 100
         WHERE id = $1`,
        [stockCheck.rows[0].id]
      );
      console.log('✓ Updated Location Stock: 100 bags');
    } else {
      await client.query(
        `INSERT INTO ${T_STOCK} (id, "organizationId", "locationId", "productId", "stockQuantity")
         VALUES ($1, $2, $3, $4, 100)`,
        [crypto.randomUUID(), orgId, locationId, productId]
      );
      console.log('✓ Created Location Stock: 100 bags');
    }

    // Ensure RetailSettings hasProducts is true
    await client.query(
      `UPDATE ${T_SETTINGS} SET "hasProducts" = true WHERE "organizationId" = $1`,
      [orgId]
    );

    await client.query('COMMIT');
    console.log('🎉 Successfully seeded Calabar Mall and Alpenliebe Eclairs product at ₦1,800!');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Seed error:', err);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
