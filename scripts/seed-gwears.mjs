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

    // Ensure public logo exists
    const localLogoRelativePath = '/images/stores/gwears-logo.jpg';
    const publicLogoDir = path.resolve(process.cwd(), 'public/images/stores');
    const publicLogoPath = path.join(publicLogoDir, 'gwears-logo.jpg');
    fs.mkdirSync(publicLogoDir, { recursive: true });

    const sourceLogo = 'C:/Users/HomePC/.gemini/antigravity-cli/brain/2dfc51df-169f-4307-8164-b36d0f44339c/.user_uploaded/uploaded_media_1794244409704.jpg';
    if (fs.existsSync(sourceLogo) && !fs.existsSync(publicLogoPath)) {
      fs.copyFileSync(sourceLogo, publicLogoPath);
      console.log('✓ Copied GWears logo to', publicLogoPath);
    }

    await client.query('BEGIN');

    // 1. Calabar City
    let cityRes = await client.query(
      `SELECT id, name, slug FROM ${T_CITY} WHERE LOWER(slug) = 'calabar' OR LOWER(name) = 'calabar' LIMIT 1`
    );
    let cityId;
    if (cityRes.rows.length > 0) {
      cityId = cityRes.rows[0].id;
    } else {
      cityId = crypto.randomUUID();
      await client.query(
        `INSERT INTO ${T_CITY} (id, name, slug, country, state, timezone, currency, "isActive", latitude, longitude)
         VALUES ($1, 'Calabar', 'calabar', 'NG', 'Cross River', 'Africa/Lagos', 'NGN', true, 4.9517, 8.3220)`,
        [cityId]
      );
    }

    // 2. Organization: G.Wears (GWears)
    const orgId = 'gwears-calabar';
    const orgName = 'G.Wears';
    const orgAddress = 'Calabar, Cross River State, Nigeria';
    const orgDesc = 'Premier fashion boutique and streetwear retail store in Calabar, offering curated modern clothing, luxury apparel, lifestyle wear, and accessories.';
    const orgLogo = localLogoRelativePath;

    let orgRes = await client.query(`SELECT id FROM ${T_ORG} WHERE id = $1 LIMIT 1`, [orgId]);
    if (orgRes.rows.length > 0) {
      await client.query(
        `UPDATE ${T_ORG}
         SET name = $2,
             type = 'RETAIL',
             "storeCategory" = 'Fashion & Apparel',
             description = $3,
             address = $4,
             "logoAssetId" = $5,
             status = 'ACTIVE'
         WHERE id = $1`,
        [orgId, orgName, orgDesc, orgAddress, orgLogo]
      );
      console.log('✓ Updated Organization:', orgId);
    } else {
      await client.query(
        `INSERT INTO ${T_ORG} (id, name, type, "storeCategory", description, address, "logoAssetId", status)
         VALUES ($1, $2, 'RETAIL', 'Fashion & Apparel', $3, $4, $5, 'ACTIVE')`,
        [orgId, orgName, orgDesc, orgAddress, orgLogo]
      );
      console.log('✓ Created Organization:', orgId);
    }

    // 3. Location
    let locRes = await client.query(`SELECT id FROM ${T_LOC} WHERE "organizationId" = $1 LIMIT 1`, [orgId]);
    let locationId;
    if (locRes.rows.length > 0) {
      locationId = locRes.rows[0].id;
      await client.query(
        `UPDATE ${T_LOC}
         SET name = 'G.Wears Fashion Store (Calabar)',
             address = $2,
             "cityId" = $3,
             latitude = 4.9589,
             longitude = 8.3269
         WHERE id = $1`,
        [locationId, orgAddress, cityId]
      );
      console.log('✓ Updated Location:', locationId);
    } else {
      locationId = crypto.randomUUID();
      await client.query(
        `INSERT INTO ${T_LOC} (id, "organizationId", name, address, "cityId", latitude, longitude)
         VALUES ($1, $2, 'G.Wears Fashion Store (Calabar)', $3, $4, 4.9589, 8.3269)`,
        [locationId, orgId, orgAddress, cityId]
      );
      console.log('✓ Created Location:', locationId);
    }

    // 4. DiscoveryListing
    const listingMetadata = JSON.stringify({
      claimed: true,
      verified: true,
      isVerified: true,
      neighborhood: 'Calabar Municipal',
      area: 'Calabar Municipal',
      workingHours: 'Mon – Sat · 09:00 AM – 08:00 PM',
      landmark: 'Calabar',
      coverImage: orgLogo,
      images: [orgLogo],
      aisles: [
        'Streetwear & Hoodies',
        'T-Shirts & Polos',
        'Jeans & Trousers',
        'Men\'s Fashion',
        'Women\'s Fashion',
        'Footwear & Sneakers',
        'Caps & Accessories',
      ],
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
             slug = 'gwears-calabar',
             title = $4,
             description = $5,
             "coverAssetId" = $6,
             "isActive" = true,
             metadata = $7
         WHERE id = $1`,
        [listRes.rows[0].id, locationId, cityId, orgName, orgDesc, orgLogo, listingMetadata]
      );
      console.log('✓ Updated DiscoveryListing:', listRes.rows[0].id);
    } else {
      const listingId = crypto.randomUUID();
      await client.query(
        `INSERT INTO ${T_LISTING} (id, "organizationId", "locationId", "cityId", vertical, slug, title, description, "coverAssetId", "isActive", metadata)
         VALUES ($1, $2, $3, $4, 'RETAIL', 'gwears-calabar', $5, $6, $7, true, $8)`,
        [listingId, orgId, locationId, cityId, orgName, orgDesc, orgLogo, listingMetadata]
      );
      console.log('✓ Created DiscoveryListing:', listingId);
    }

    // 5. RetailSettings
    let settingsRes = await client.query(`SELECT id FROM ${T_SETTINGS} WHERE "organizationId" = $1 LIMIT 1`, [orgId]);
    if (settingsRes.rows.length === 0) {
      await client.query(
        `INSERT INTO ${T_SETTINGS} (id, "organizationId", "storeName", "storeAddress", "currencySymbol", country, "hasStoreInfo", "hasProducts")
         VALUES ($1, $2, $3, $4, '₦', 'NG', true, false)`,
        [crypto.randomUUID(), orgId, orgName, orgAddress]
      );
      console.log('✓ Created RetailSettings');
    }

    // 6. Standard Retail Categories for Fashion
    const FASHION_CATEGORIES = [
      'Streetwear & Hoodies',
      'T-Shirts & Polos',
      'Jeans & Trousers',
      "Men's Fashion",
      "Women's Fashion",
      'Footwear & Sneakers',
      'Caps & Accessories',
    ];

    const categoryIdByName = new Map();
    for (const catName of FASHION_CATEGORIES) {
      let catId;
      const catCheck = await client.query(
        `SELECT id FROM ${T_CATEGORY} WHERE "organizationId" = $1 AND LOWER(name) = LOWER($2) LIMIT 1`,
        [orgId, catName]
      );
      if (catCheck.rows.length === 0) {
        catId = crypto.randomUUID();
        await client.query(
          `INSERT INTO ${T_CATEGORY} (id, "organizationId", name)
           VALUES ($1, $2, $3)`,
          [catId, orgId, catName]
        );
        console.log(`✓ Added category: ${catName}`);
      } else {
        catId = catCheck.rows[0].id;
      }
      categoryIdByName.set(catName, catId);
    }

    // 7. Seed Initial Products
    const T_PRODUCT = resolveTable(['retailProduct', 'RetailProduct', 'retail_product']);
    const T_STOCK = resolveTable(['retailLocationStock', 'RetailLocationStock', 'retail_location_stock']);

    const initialProduct = {
      name: 'Luxury Chunky Runner Sneakers – Red Patent & Black Ballistic Mesh (Size 43)',
      variantName: 'Size 43',
      category: 'Footwear & Sneakers',
      globalCategory: 'Fashion, Shoes & Accessories',
      description: 'Elevate your streetwear aesthetic with these premier chunky runner sneakers from G.Wears. Crafted with vibrant red patent leather overlays set against high-durability black ballistic mesh, these luxury sneakers combine avant-garde street style with responsive athletic performance.\n\nKey Features:\n• Glossy Red Patent Leather: Sleek, high-shine statement panels.\n• Breathable Technical Mesh: Keeps your feet cool and comfortable all day.\n• Sculpted Air Cushion Midsole: Absorbs impact and provides responsive bounce.\n• Ergonomic Grip Outsole: Durable high-traction rubber tread.\n• Padded Collar & Tongue: Premium plush interior lining for supreme comfort.\n\nSpecifications:\n• Store: G.Wears Calabar\n• Category: Luxury Footwear / Streetwear Sneakers\n• Colorway: Cherry Red / Jet Black\n• Sole Type: Air Cushion Bubble Midsole\n• Closure: Lace-Up\n• Size: EU 43\n• Gender: Unisex',
      price: 130000,
      cost: 130000,
      compareAtPrice: 165000,
      stockQuantity: 10,
      unit: 'pair',
      images: [
        '/images/products/gwears/red-patent-mesh-runner-front.jpg',
        '/images/products/gwears/red-patent-mesh-runner-side.jpg'
      ]
    };

    const prodCheck = await client.query(
      `SELECT id FROM ${T_PRODUCT} WHERE "organizationId" = $1 AND LOWER(name) = LOWER($2) LIMIT 1`,
      [orgId, initialProduct.name]
    );

    let productId;
    if (prodCheck.rows.length === 0) {
      productId = crypto.randomUUID();
      await client.query(
        `INSERT INTO ${T_PRODUCT} (id, "organizationId", "categoryId", "globalCategory", name, "variantName", description, price, cost, "compareAtPrice", "stockQuantity", unit, "imageAssetId", "isWeighed")
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, false)`,
        [
          productId,
          orgId,
          categoryIdByName.get(initialProduct.category),
          initialProduct.globalCategory,
          initialProduct.name,
          initialProduct.variantName,
          initialProduct.description,
          initialProduct.price,
          initialProduct.cost,
          initialProduct.compareAtPrice,
          initialProduct.stockQuantity,
          initialProduct.unit,
          JSON.stringify(initialProduct.images)
        ]
      );
      console.log(`✓ Created product: ${initialProduct.name}`);
    } else {
      productId = prodCheck.rows[0].id;
      await client.query(
        `UPDATE ${T_PRODUCT}
         SET name = $2,
             "variantName" = $3,
             description = $4
         WHERE id = $1`,
        [productId, initialProduct.name, initialProduct.variantName, initialProduct.description]
      );
      console.log(`✓ Updated product: ${productId} with Size 43`);
    }

    // Upsert location stock
    const stockCheck = await client.query(
      `SELECT id FROM ${T_STOCK} WHERE "organizationId" = $1 AND "productId" = $2 AND "locationId" = $3 LIMIT 1`,
      [orgId, productId, locationId]
    );
    if (stockCheck.rows.length === 0) {
      await client.query(
        `INSERT INTO ${T_STOCK} (id, "organizationId", "locationId", "productId", "stockQuantity")
         VALUES ($1, $2, $3, $4, $5)`,
        [crypto.randomUUID(), orgId, locationId, productId, initialProduct.stockQuantity]
      );
    }

    // Ensure RetailSettings hasProducts is true
    await client.query(
      `UPDATE ${T_SETTINGS} SET "hasProducts" = true WHERE "organizationId" = $1`,
      [orgId]
    );

    await client.query('COMMIT');
    console.log('\n🎉 G.Wears fashion store initialized successfully!');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error seeding GWears store:', err);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
