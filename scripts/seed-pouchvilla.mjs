import 'dotenv/config';
import pg from 'pg';
import crypto from 'crypto';
import fs from 'fs';

const { Pool } = pg;

function categorizePouchProduct(p) {
  const name = (p.name || '').toLowerCase();
  const brand = (p.brandName || '').toLowerCase();

  if (name.includes('screen') || name.includes('glass') || name.includes('lens') || name.includes('guard')) {
    return { inStoreCategory: 'Screen & Camera Protectors', globalCategory: 'Phone Cases, Covers & Screen Guards' };
  }
  if (brand === 'apple' || name.includes('iphone') || name.includes('ipad') || name.includes('magsafe')) {
    return { inStoreCategory: 'iPhone & iPad Cases', globalCategory: 'Phone Cases, Covers & Screen Guards' };
  }
  if (brand === 'samsung' || name.includes('samsung') || name.includes('galaxy')) {
    return { inStoreCategory: 'Samsung Cases & Covers', globalCategory: 'Phone Cases, Covers & Screen Guards' };
  }
  if (brand === 'google' || name.includes('pixel')) {
    return { inStoreCategory: 'Google Pixel Cases', globalCategory: 'Phone Cases, Covers & Screen Guards' };
  }
  if (brand === 'tecno' || brand === 'infinix' || brand === 'oppo' || brand === 'redmi' || brand === 'xiaomi') {
    return { inStoreCategory: 'Android Cases & Covers', globalCategory: 'Phone Cases, Covers & Screen Guards' };
  }
  if (name.includes('flash') || name.includes('sandisk') || name.includes('drive') || name.includes('otg') || name.includes('memory')) {
    return { inStoreCategory: 'Storage & Flash Drives', globalCategory: 'Flash Drives & Memory Cards' };
  }
  if (name.includes('cable') || name.includes('charger') || name.includes('adapter') || name.includes('power')) {
    return { inStoreCategory: 'Chargers & Cables', globalCategory: 'Chargers, Cables & Fast Power' };
  }
  if (name.includes('pouch') || name.includes('case') || name.includes('cover')) {
    return { inStoreCategory: 'Pouches & Protective Cases', globalCategory: 'Phone Cases, Covers & Screen Guards' };
  }
  return { inStoreCategory: 'Gadget Accessories', globalCategory: 'Electronics Accessories' };
}

async function main() {
  if (!fs.existsSync('scripts/pouchvilla-products.json')) {
    throw new Error('scripts/pouchvilla-products.json not found. Run extract-pouchvilla.mjs first.');
  }

  const rawProducts = JSON.parse(fs.readFileSync('scripts/pouchvilla-products.json', 'utf8'));
  console.log(`Loaded ${rawProducts.length} raw products from scripts/pouchvilla-products.json`);

  const inStockProducts = rawProducts.filter(p => p.inStock > 0);
  console.log(`Filtered ${inStockProducts.length} in-stock products for Pouch Villa.`);

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    statement_timeout: 30000,
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
    const T_CONTACT = resolveTable(['organizationContactPoint', 'OrganizationContactPoint', 'organization_contact_point']);

    // 1. Calabar City
    const cityRes = await client.query(
      `SELECT id, name, slug FROM ${T_CITY} WHERE LOWER(slug) = 'calabar' OR LOWER(name) = 'calabar' LIMIT 1`
    );
    const cityId = cityRes.rows[0].id;

    // 2. Organization: Pouch Villa
    const orgId = 'pouchvilla-calabar';
    const orgName = 'Pouch Villa';
    const orgAddress = '101 Marian Road, Calabar, Cross River State, Nigeria';
    const orgDesc =
      "Calabar's top specialist for phone cases, luxury pouches, tempered screen guards, camera lens protectors, fast charging accessories, and SanDisk storage drives. Located at 101 Marian Road, Calabar.";
    const orgLogo = '/images/stores/pouchvilla-banner.png';
    const storeCategory = 'Phones, Apple & Devices';

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
        [orgId, orgName, storeCategory, orgDesc, orgAddress, orgLogo]
      );
    } else {
      await client.query(
        `INSERT INTO ${T_ORG} (id, name, type, "storeCategory", description, address, "logoAssetId", status)
         VALUES ($1, $2, 'RETAIL', $3, $4, $5, $6, 'ACTIVE')`,
        [orgId, orgName, storeCategory, orgDesc, orgAddress, orgLogo]
      );
    }

    // 3. Location: 101 Marian Road
    let locRes = await client.query(`SELECT id FROM ${T_LOC} WHERE "organizationId" = $1 LIMIT 1`, [orgId]);
    let locationId;
    if (locRes.rows.length > 0) {
      locationId = locRes.rows[0].id;
      await client.query(
        `UPDATE ${T_LOC}
         SET name = 'Pouch Villa Showroom (101 Marian Road)',
             address = $2,
             "cityId" = $3,
             latitude = 4.9665,
             longitude = 8.3312
         WHERE id = $1`,
        [locationId, orgAddress, cityId]
      );
    } else {
      locationId = crypto.randomUUID();
      await client.query(
        `INSERT INTO ${T_LOC} (id, "organizationId", name, address, "cityId", latitude, longitude)
         VALUES ($1, $2, 'Pouch Villa Showroom (101 Marian Road)', $3, $4, 4.9665, 8.3312)`,
        [locationId, orgId, orgAddress, cityId]
      );
    }

    // 4. Contact Points
    const phonePrimary = '2348093283608';
    const waRes = await client.query(
      `SELECT id FROM ${T_CONTACT} WHERE "organizationId" = $1 AND type = 'WHATSAPP' LIMIT 1`,
      [orgId]
    );
    if (waRes.rows.length > 0) {
      await client.query(
        `UPDATE ${T_CONTACT} SET value = $2, "isPrimary" = true, "isVerified" = true WHERE id = $1`,
        [waRes.rows[0].id, phonePrimary]
      );
    } else {
      await client.query(
        `INSERT INTO ${T_CONTACT} (id, "organizationId", type, value, "isPrimary", "isVerified")
         VALUES ($1, $2, 'WHATSAPP', $3, true, true)`,
        [crypto.randomUUID(), orgId, phonePrimary]
      );
    }

    // 5. DiscoveryListing
    const listingMetadata = JSON.stringify({
      claimed: true,
      verified: true,
      isVerified: true,
      neighborhood: 'Marian Road',
      area: 'Calabar Municipal',
      workingHours: 'Mon – Sat · 08:30 AM – 07:30 PM',
      websiteUrl: 'https://www.pouchvilla.com.ng/',
      phone: '08093283608',
      whatsappPhone: phonePrimary,
      logoUrl: orgLogo,
      coverImage: orgLogo,
      images: [orgLogo],
      aisles: [
        'iPhone & iPad Cases',
        'Samsung Cases & Covers',
        'Google Pixel Cases',
        'Android Cases & Covers',
        'Screen & Camera Protectors',
        'Pouches & Protective Cases',
        'Storage & Flash Drives',
        'Chargers & Cables'
      ],
      address: orgAddress,
      description: orgDesc,
    });

    const listRes = await client.query(`SELECT id FROM ${T_LISTING} WHERE "organizationId" = $1 LIMIT 1`, [orgId]);
    if (listRes.rows.length > 0) {
      await client.query(
        `UPDATE ${T_LISTING}
         SET "locationId" = $2,
             "cityId" = $3,
             vertical = 'RETAIL',
             slug = 'pouchvilla-calabar',
             title = $4,
             description = $5,
             "coverAssetId" = $6,
             "isActive" = true,
             metadata = $7
         WHERE id = $1`,
        [listRes.rows[0].id, locationId, cityId, orgName, orgDesc, orgLogo, listingMetadata]
      );
    } else {
      await client.query(
        `INSERT INTO ${T_LISTING} (id, "organizationId", "locationId", "cityId", vertical, slug, title, description, "coverAssetId", "isActive", metadata)
         VALUES ($1, $2, $3, $4, 'RETAIL', 'pouchvilla-calabar', $5, $6, $7, true, $8)`,
        [crypto.randomUUID(), orgId, locationId, cityId, orgName, orgDesc, orgLogo, listingMetadata]
      );
    }

    // 6. RetailSettings
    const settingsRes = await client.query(`SELECT id FROM ${T_SETTINGS} WHERE "organizationId" = $1 LIMIT 1`, [orgId]);
    if (settingsRes.rows.length === 0) {
      await client.query(
        `INSERT INTO ${T_SETTINGS} (id, "organizationId", "storeName", "storeAddress", "currencySymbol", country, "hasStoreInfo", "hasProducts")
         VALUES ($1, $2, $3, $4, '₦', 'NG', true, true)`,
        [crypto.randomUUID(), orgId, orgName, orgAddress]
      );
    } else {
      await client.query(
        `UPDATE ${T_SETTINGS} SET "hasProducts" = true, "storeName" = $2 WHERE "organizationId" = $1`,
        [orgId, orgName]
      );
    }

    // 7. Clear old products/categories
    console.log('Clearing old Pouch Villa products...');
    await client.query(`DELETE FROM ${T_STOCK} WHERE "organizationId" = $1`, [orgId]);
    await client.query(`DELETE FROM ${T_PRODUCT} WHERE "organizationId" = $1`, [orgId]);
    await client.query(`DELETE FROM ${T_CATEGORY} WHERE "organizationId" = $1`, [orgId]);

    // 8. Categories
    const categoryMap = new Map();
    const uniqueCategories = [
      'iPhone & iPad Cases',
      'Samsung Cases & Covers',
      'Google Pixel Cases',
      'Android Cases & Covers',
      'Screen & Camera Protectors',
      'Pouches & Protective Cases',
      'Storage & Flash Drives',
      'Chargers & Cables',
      'Gadget Accessories'
    ];

    for (const catName of uniqueCategories) {
      const catId = crypto.randomUUID();
      await client.query(
        `INSERT INTO ${T_CATEGORY} (id, "organizationId", name, description)
         VALUES ($1, $2, $3, $4)`,
        [catId, orgId, catName, `${catName} at Pouch Villa Calabar`]
      );
      categoryMap.set(catName, catId);
    }

    // 9. Fast Multi-Row Inserts in batches of 40
    console.log(`Seeding ${inStockProducts.length} products with multi-row batching...`);
    const batchSize = 40;

    for (let b = 0; b < inStockProducts.length; b += batchSize) {
      const chunk = inStockProducts.slice(b, b + batchSize);

      const productValues = [];
      const productParams = [];
      const stockValues = [];
      const stockParams = [];

      for (let i = 0; i < chunk.length; i++) {
        const p = chunk[i];
        const overallIdx = b + i;
        const { inStoreCategory, globalCategory } = categorizePouchProduct(p);
        const categoryId = categoryMap.get(inStoreCategory);

        const productId = `pv-cal-${p.id}`;
        const sku = `PV-${String(overallIdx + 1).padStart(4, '0')}`;
        const price = Math.round((p.fromKobo || 0) / 100);
        const stockQty = 15;

        const images = [];
        if (p.primaryImage?.heroUrl) images.push(p.primaryImage.heroUrl);
        if (p.primaryImage?.cardUrl && !images.includes(p.primaryImage.cardUrl)) images.push(p.primaryImage.cardUrl);

        const desc = `${p.name} available at Pouch Villa, 101 Marian Road, Calabar. Guaranteed authentic quality and precision fit.`;

        // Product query parameters ($1..$11 per row)
        const pOffset = i * 11;
        productValues.push(`($${pOffset + 1}, $${pOffset + 2}, $${pOffset + 3}, $${pOffset + 4}, $${pOffset + 5}, $${pOffset + 6}, $${pOffset + 7}, $${pOffset + 8}, 2, false, 'ea', $${pOffset + 9}, $${pOffset + 10}, $${pOffset + 11})`);
        productParams.push(
          productId,
          orgId,
          p.name,
          desc,
          sku,
          price,
          price, // zero markup
          stockQty,
          JSON.stringify(images),
          globalCategory,
          categoryId
        );

        // Stock query parameters ($1..$5 per row)
        const sOffset = i * 5;
        stockValues.push(`($${sOffset + 1}, $${sOffset + 2}, $${sOffset + 3}, $${sOffset + 4}, $${sOffset + 5}, 2)`);
        stockParams.push(
          crypto.randomUUID(),
          orgId,
          locationId,
          productId,
          stockQty
        );
      }

      // Execute product batch insert
      const prodQuery = `
        INSERT INTO ${T_PRODUCT} (
          id, "organizationId", name, description, sku, price, cost,
          "stockQuantity", "lowStockLevel", "isWeighed", unit, "imageAssetId",
          "globalCategory", "categoryId"
        ) VALUES ${productValues.join(', ')}
      `;
      await client.query(prodQuery, productParams);

      // Execute stock batch insert
      const stockQuery = `
        INSERT INTO ${T_STOCK} (
          id, "organizationId", "locationId", "productId", "stockQuantity", "lowStockLevel"
        ) VALUES ${stockValues.join(', ')}
      `;
      await client.query(stockQuery, stockParams);

      console.log(`✓ Batch ${Math.floor(b / batchSize) + 1}/${Math.ceil(inStockProducts.length / batchSize)} inserted (${chunk.length} items)...`);
    }

    console.log(`\n🎉 Successfully seeded all ${inStockProducts.length} available products for ${orgName} (${orgId})!`);
  } catch (err) {
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
