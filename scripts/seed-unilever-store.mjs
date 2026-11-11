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

    await client.query('BEGIN');

    // 1. Resolve Calabar City
    const cityRes = await client.query(
      `SELECT id, name, slug FROM ${T_CITY} WHERE LOWER(slug) = 'calabar' OR LOWER(name) = 'calabar' LIMIT 1`
    );
    if (cityRes.rows.length === 0) {
      throw new Error('Calabar city record not found in database');
    }
    const cityId = cityRes.rows[0].id;
    console.log('✓ Found Calabar cityId:', cityId);

    // 2. Organization: Unilever Official Store
    const orgId = 'unilever-store';
    const orgName = 'Unilever Official Store';
    const orgAddress = 'Unilever Regional Fulfillment Depot, Murtala Mohammed Highway, Calabar, Cross River State, Nigeria';
    const orgDesc = 'Official Brand Flagship for Unilever Nigeria in Calabar. 100% genuine guaranteed personal care, home care, and food seasonings direct from the manufacturer: Knorr, Vaseline, Closeup, Rexona, Pepsodent, Royco, and Pears.';
    const storeCategory = 'Food, Home & Personal Care';
    const logoAssetId = '/images/brands/unilever/logo.svg';

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
        [orgId, orgName, storeCategory, orgDesc, orgAddress, logoAssetId]
      );
      console.log('✓ Updated Organization:', orgName);
    } else {
      await client.query(
        `INSERT INTO ${T_ORG} (id, name, type, "storeCategory", description, address, "logoAssetId", status)
         VALUES ($1, $2, 'RETAIL', $3, $4, $5, $6, 'ACTIVE')`,
        [orgId, orgName, storeCategory, orgDesc, orgAddress, logoAssetId]
      );
      console.log('✓ Created Organization:', orgName);
    }

    // 3. Location: Unilever Central Depot
    const locName = 'Unilever Regional Distribution Depot';
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

    // 4. DiscoveryListing with Brand Flagship metadata
    const aisles = [
      'Food & Seasoning (Knorr & Royco)',
      'Skin Care (Vaseline)',
      'Oral Care (Closeup & Pepsodent)',
      'Deodorants & Freshness (Rexona)',
      'Baby Care (Pears)'
    ];

    const subBrandsList = [
      { name: 'Knorr', icon: '🍲', logo: '/images/brands/unilever/subbrands/knorr.png', tag: 'Knorr' },
      { name: 'Vaseline', icon: '🧴', logo: '/images/brands/unilever/vaseline-banner.jpg', tag: 'Vaseline' },
      { name: 'Closeup', icon: '🪥', logo: '/images/products/unilever/closeup-pack-of-8-closeup-175gm.jpg', tag: 'Closeup' },
      { name: 'Rexona', icon: '🌬️', logo: '/images/brands/unilever/rexona-tile.jpg', tag: 'Rexona' },
      { name: 'Pepsodent', icon: '🦷', logo: '/images/products/unilever/pepsodent-triple-protection-complete-toothpaste-tw.jpg', tag: 'Pepsodent' },
      { name: 'Royco', icon: '🍲', logo: '/images/brands/unilever/subbrands/royco.png', tag: 'Royco' },
      { name: 'Pears', icon: '👶', logo: '/images/brands/unilever/subbrands/pears.png', tag: 'Pears' },
    ];

    const listingMetadata = JSON.stringify({
      claimed: true,
      verified: true,
      isVerified: true,
      isOfficialBrandStore: true,
      brandName: 'Unilever',
      neighborhood: 'Highway / Calabar Municipal',
      area: 'Murtala Mohammed Highway',
      workingHours: 'Mon – Sat · 08:00 AM – 06:00 PM',
      landmark: 'Unilever Depot, MM Highway, Calabar',
      coverImage: '/images/brands/unilever/hero-banner.jpg',
      images: [
        '/images/brands/unilever/hero-banner.jpg',
        '/images/brands/unilever/vaseline-banner.jpg',
        '/images/brands/unilever/knorr-banner.jpg'
      ],
      heroBanners: [
        {
          title: 'Unilever Official Store',
          subtitle: '100% Genuine Guaranteed Direct from Manufacturer',
          image: '/images/brands/unilever/hero-banner.jpg',
          ctaText: 'Shop All Brands',
          filterTag: 'all'
        },
        {
          title: 'Vaseline Deep Moisture & Radiance',
          subtitle: 'Healthy skin starts with deep restoring moisture',
          image: '/images/brands/unilever/vaseline-banner.jpg',
          ctaText: 'Explore Vaseline',
          filterTag: 'Vaseline'
        },
        {
          title: 'Knorr Great Flavor & Real Nutrition',
          subtitle: 'Original Chicken & Beef Seasoning Cubes',
          image: '/images/brands/unilever/knorr-banner.jpg',
          ctaText: 'Shop Knorr',
          filterTag: 'Knorr'
        }
      ],
      subBrands: subBrandsList,
      aisles,
      phone: '+2348065373747',
      whatsapp: '2348065373747',
      address: orgAddress,
      description: orgDesc,
      rating: 4.8,
      ratingCount: 1420,
    });

    // Check slug unilever-store and unilever
    const listRes = await client.query(`SELECT id FROM ${T_LISTING} WHERE "organizationId" = $1 LIMIT 1`, [orgId]);
    if (listRes.rows.length > 0) {
      await client.query(
        `UPDATE ${T_LISTING}
         SET "locationId" = $2,
             "cityId" = $3,
             vertical = 'RETAIL',
             slug = 'unilever-store',
             title = $4,
             description = $5,
             "coverAssetId" = $6,
             "isActive" = true,
             metadata = $7
         WHERE id = $1`,
        [listRes.rows[0].id, locationId, cityId, orgName, orgDesc, '/images/brands/unilever/hero-banner.jpg', listingMetadata]
      );
      console.log('✓ Updated DiscoveryListing for Unilever Store');
    } else {
      await client.query(
        `INSERT INTO ${T_LISTING} (id, "organizationId", "locationId", "cityId", vertical, slug, title, description, "coverAssetId", "isActive", metadata)
         VALUES ($1, $2, $3, $4, 'RETAIL', 'unilever-store', $5, $6, $7, true, $8)`,
        [crypto.randomUUID(), orgId, locationId, cityId, orgName, orgDesc, '/images/brands/unilever/hero-banner.jpg', listingMetadata]
      );
      console.log('✓ Created DiscoveryListing for Unilever Store');
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

    // 6. Categories for Unilever
    const categoryMap = new Map();
    const categoriesToSeed = [
      'Food & Seasoning',
      'Skin Care & Lotions',
      'Oral Care & Toothpaste',
      'Deodorants & Freshness',
      'Baby Care',
    ];

    for (const catName of categoriesToSeed) {
      const catCheck = await client.query(
        `SELECT id FROM ${T_CATEGORY} WHERE "organizationId" = $1 AND LOWER(name) = LOWER($2) LIMIT 1`,
        [orgId, catName]
      );
      if (catCheck.rows.length > 0) {
        categoryMap.set(catName, catCheck.rows[0].id);
      } else {
        const catId = crypto.randomUUID();
        await client.query(
          `INSERT INTO ${T_CATEGORY} (id, "organizationId", name)
           VALUES ($1, $2, $3)`,
          [catId, orgId, catName]
        );
        categoryMap.set(catName, catId);
        console.log('✓ Created Category:', catName);
      }
    }

    // Helper to map brand to category
    function getCategoryForBrand(brand) {
      const b = (brand || '').toLowerCase();
      if (b.includes('knorr') || b.includes('royco')) return 'Food & Seasoning';
      if (b.includes('vaseline')) return 'Skin Care & Lotions';
      if (b.includes('closeup') || b.includes('pepsodent')) return 'Oral Care & Toothpaste';
      if (b.includes('rexona')) return 'Deodorants & Freshness';
      if (b.includes('pears')) return 'Baby Care';
      return 'Skin Care & Lotions';
    }

    // 7. Seed Products from ready-unilever-products.json
    const readyProducts = JSON.parse(fs.readFileSync('scripts/ready-unilever-products.json', 'utf8'));
    console.log(`\nSeeding ${readyProducts.length} Unilever products...`);

    let insertedCount = 0;
    let updatedCount = 0;

    for (const p of readyProducts) {
      const catName = getCategoryForBrand(p.brand);
      const categoryId = categoryMap.get(catName) || null;
      const localImg = p.localImage || `/images/products/unilever/${p.slug}.jpg`;
      const price = Number(p.price) || 1000;
      const compareAtPrice = p.oldPrice ? Number(p.oldPrice) : Math.round(price * 1.25);
      const desc = `${p.name} - Genuine 100% authentic product direct from Unilever Nigeria. Fast doorstep delivery in Calabar via CityDrive.`;

      // Check if product exists by name for this org
      const prodCheck = await client.query(
        `SELECT id FROM ${T_PRODUCT} WHERE "organizationId" = $1 AND LOWER(name) = LOWER($2) LIMIT 1`,
        [orgId, p.name]
      );

      let productId;
      if (prodCheck.rows.length > 0) {
        productId = prodCheck.rows[0].id;
        await client.query(
          `UPDATE ${T_PRODUCT}
           SET price = $2,
               "compareAtPrice" = $3,
               description = $4,
               "imageAssetId" = $5,
               "categoryId" = $6,
               "globalCategory" = $7,
               "stockQuantity" = 100,
               unit = 'ea'
           WHERE id = $1`,
          [productId, price, compareAtPrice, desc, localImg, categoryId, catName]
        );
        updatedCount++;
      } else {
        productId = crypto.randomUUID();
        await client.query(
          `INSERT INTO ${T_PRODUCT} (id, "organizationId", name, price, "compareAtPrice", description, "imageAssetId", "categoryId", "globalCategory", "stockQuantity", unit)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 100, 'ea')`,
          [productId, orgId, p.name, price, compareAtPrice, desc, localImg, categoryId, catName]
        );
        insertedCount++;
      }

      // Upsert RetailLocationStock
      const stockCheck = await client.query(
        `SELECT id FROM ${T_STOCK} WHERE "organizationId" = $1 AND "locationId" = $2 AND "productId" = $3 LIMIT 1`,
        [orgId, locationId, productId]
      );
      if (stockCheck.rows.length > 0) {
        await client.query(
          `UPDATE ${T_STOCK}
           SET "stockQuantity" = 100
           WHERE id = $1`,
          [stockCheck.rows[0].id]
        );
      } else {
        await client.query(
          `INSERT INTO ${T_STOCK} (id, "organizationId", "locationId", "productId", "stockQuantity")
           VALUES ($1, $2, $3, $4, 100)`,
          [crypto.randomUUID(), orgId, locationId, productId]
        );
      }
    }

    await client.query('COMMIT');
    console.log(`\n🎉 Successfully completed seeding Unilever Official Store!`);
    console.log(`   - Inserted products: ${insertedCount}`);
    console.log(`   - Updated products: ${updatedCount}`);
    console.log(`   - Total products live: ${readyProducts.length}`);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error during Unilever store seeding:', err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

main();
