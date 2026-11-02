import 'dotenv/config';
import fs from 'fs';
import pg from 'pg';
import { v4 as uuidv4 } from 'uuid';

const CALABAR_CITY_ID = 'c497e1f5-4dc7-4340-b007-0a1e9e765b90';
const UYO_CITY_ID = 'edb86701-efce-4c43-b86b-18c651952eb6';

function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

function resolveCalabarZone(rawText) {
  if (!rawText) return 'Calabar Municipal';
  const text = rawText.toLowerCase();

  if (text.includes('marian') || text.includes('ndidem usang iso') || text.includes('rabana') || text.includes('atekong')) {
    if (text.includes('state housing')) return 'State Housing';
    return 'Marian Road';
  }
  if (text.includes('state housing') || text.includes('housing estate')) {
    return 'State Housing';
  }
  if (text.includes('watt') || text.includes('target') || text.includes('bedwell') || text.includes('goldie') || text.includes('calabar road') || text.includes('calabar south')) {
    return 'Watt Market / Calabar South';
  }
  if (text.includes('etta agbor') || text.includes('ettagbor') || text.includes('unical') || text.includes('malabor')) {
    return 'Etta Agbor / UNICAL';
  }
  if (text.includes('mcc') || text.includes('effio-ette') || text.includes('effioette') || text.includes('channel view')) {
    return 'MCC Road / Effio-Ette';
  }
  if (text.includes('8 miles') || text.includes('eight miles') || text.includes('federal housing') || text.includes('ikot ansa') || text.includes('ikot omin')) {
    return 'Federal Housing / 8 Miles';
  }
  if (text.includes('parliamentary') || text.includes('asari eso') || text.includes('secretariat')) {
    return 'Parliamentary Road';
  }
  if (text.includes('diamond hill') || text.includes('marina') || text.includes('mary slessor') || text.includes('government house')) {
    return 'Diamond Hill / Marina';
  }
  if (text.includes('satellite town')) {
    return 'Satellite Town';
  }
  if (text.includes('murtala') || text.includes('highway') || text.includes('zone 6')) {
    return 'Murtala Mohammed Highway';
  }
  if (text.includes('ekorinim')) {
    return 'Murtala Mohammed Highway';
  }
  if (text.includes('bogobiri')) {
    return 'Bogobiri';
  }
  if (text.includes('anantigha') || text.includes('crutech') || text.includes('unicross')) {
    return 'Anantigha / UNICROSS';
  }
  return 'Calabar Municipal';
}

function classifyBusiness(name, categories, about) {
  const combined = (name + ' ' + (categories || []).join(' ') + ' ' + (about || '')).toLowerCase();

  // Healthcare
  if (combined.includes('hospital') || combined.includes('clinic') || combined.includes('pharmacy') || combined.includes('medical') || combined.includes('health') || combined.includes('doctor')) {
    return {
      type: 'HEALTHCARE',
      directoryCategory: 'health',
      storeCategory: combined.includes('pharmacy') ? 'Pharmacy' : 'Healthcare & Clinic',
      categoryLabel: 'Health & Pharmacy'
    };
  }

  // Hotels & Stays
  if (combined.includes('hotel') || combined.includes('suites') || combined.includes('resort') || combined.includes('lodging') || combined.includes('guest house') || combined.includes('apartments') || combined.includes('inn')) {
    return {
      type: 'HOTEL',
      directoryCategory: 'hotels',
      storeCategory: 'Hotel & Lodging',
      categoryLabel: 'Hotels & Lodging'
    };
  }

  // Nightlife & Lounges
  if (combined.includes('lounge') || combined.includes('bar') || combined.includes('club') || combined.includes('karaoke') || combined.includes('nightlife') || combined.includes('rooftop')) {
    return {
      type: 'RESTAURANT',
      directoryCategory: 'nightlife',
      storeCategory: 'Bar & Lounge',
      categoryLabel: 'Nightlife & Lounges'
    };
  }

  // Dining & Restaurants
  if (combined.includes('restaurant') || combined.includes('cafe') || combined.includes('bakery') || combined.includes('grill') || combined.includes('confectionery') || combined.includes('eatery') || combined.includes('fast food') || combined.includes('chicken') || combined.includes('kitchen') || combined.includes('food') || combined.includes('bistro') || combined.includes('buka') || combined.includes('amala')) {
    return {
      type: 'RESTAURANT',
      directoryCategory: 'dining',
      storeCategory: 'Restaurant & Dining',
      categoryLabel: 'Food & Dining'
    };
  }

  // Event Centers
  if (combined.includes('event center') || combined.includes('event centre') || combined.includes('convention') || combined.includes('hall')) {
    return {
      type: 'EVENT_ORGANIZER',
      directoryCategory: 'artisans',
      storeCategory: 'Event Center',
      categoryLabel: 'Artisans & Technical'
    };
  }

  // Tourism / Recreation
  if (combined.includes('museum') || combined.includes('park') || combined.includes('ranch') || combined.includes('stadium') || combined.includes('golf')) {
    return {
      type: 'SERVICES',
      directoryCategory: 'artisans',
      storeCategory: 'Tourism & Recreation',
      categoryLabel: 'Artisans & Technical'
    };
  }

  return {
    type: 'SERVICES',
    directoryCategory: 'artisans',
    storeCategory: 'Business Services',
    categoryLabel: 'Artisans & Technical'
  };
}

async function seedChopCalabarDirectory() {
  const filePath = 'chopcalabar_extracted_businesses.json';
  if (!fs.existsSync(filePath)) {
    console.error('File not found:', filePath);
    process.exit(1);
  }

  const businesses = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  console.log(`Loaded ${businesses.length} businesses from ChopCalabar extraction.`);

  const client = new pg.Client({ connectionString: process.env.DIRECT_URL || process.env.DATABASE_URL });
  await client.connect();
  console.log('Connected to PostgreSQL database.');

  let createdCount = 0;
  let updatedCount = 0;

  for (const item of businesses) {
    const isUyo = (item.name + ' ' + (item.address || '') + ' ' + (item.about || '')).toLowerCase().includes('uyo') ||
      (item.address || '').toLowerCase().includes('akwa ibom');

    const cityId = isUyo ? UYO_CITY_ID : CALABAR_CITY_ID;
    const cityNameSuffix = isUyo ? 'uyo' : 'calabar';

    const classification = classifyBusiness(item.name, item.categories, item.about);
    const zone = isUyo ? 'Uyo Central' : resolveCalabarZone(item.address);

    // Format slug
    let baseSlug = slugify(item.name);
    if (!baseSlug.includes(cityNameSuffix)) {
      baseSlug = `${baseSlug}-${cityNameSuffix}`;
    }

    const metadata = JSON.stringify({
      phone: item.phone || null,
      allPhones: item.allPhones || (item.phone ? [item.phone] : []),
      whatsapp: item.whatsapp || null,
      hours: item.hours || 'Mon - Sun: 8:00 AM - 10:00 PM',
      zone,
      landmark: null,
      category: classification.directoryCategory,
      directoryCategory: classification.directoryCategory,
      categoryLabel: classification.categoryLabel,
      services: item.categories || [classification.storeCategory],
      claimed: false,
      verified: true,
      address: item.address,
      latitude: item.latitude || null,
      longitude: item.longitude || null,
      instagram: item.instagram || null,
      instagramHandle: item.instagramHandle || null,
      facebook: item.facebook || null,
      website: item.website || null,
      coverImage: item.coverImage || null,
      description: item.about,
      rating: 4.8 + Math.round(Math.random() * 2) / 10,
      source: 'chopcalabar',
      sourceId: item.id
    });

    // Check if listing already exists by slug or sourceId in metadata
    const existingListingRes = await client.query(
      `SELECT id, "organizationId", "locationId" FROM "discoveryListing" WHERE slug = $1 LIMIT 1`,
      [baseSlug]
    );

    let listing = existingListingRes.rows[0];

    // If not found by slug, check if existing organization has the exact same name
    if (!listing) {
      const existingOrgRes = await client.query(
        `SELECT id FROM "organization" WHERE LOWER(TRIM(name)) = LOWER(TRIM($1)) LIMIT 1`,
        [item.name]
      );
      if (existingOrgRes.rows[0]) {
        const orgId = existingOrgRes.rows[0].id;
        const orgListing = await client.query(
          `SELECT id, "organizationId", "locationId" FROM "discoveryListing" WHERE "organizationId" = $1 LIMIT 1`,
          [orgId]
        );
        if (orgListing.rows[0]) {
          listing = orgListing.rows[0];
        }
      }
    }

    if (listing) {
      // Update existing listing
      await client.query(
        `UPDATE "discoveryListing" 
         SET title = $1, description = $2, "coverAssetId" = $3, "isActive" = true, metadata = $4
         WHERE id = $5`,
        [item.name, item.about, item.coverImage || null, metadata, listing.id]
      );

      // Update organization details
      if (listing.organizationId) {
        await client.query(
          `UPDATE "organization"
           SET name = $1, address = $2, description = $3, "storeCategory" = $4, "logoAssetId" = COALESCE("logoAssetId", $5)
           WHERE id = $6`,
          [item.name, item.address, item.about, classification.storeCategory, item.coverImage || null, listing.organizationId]
        );
      }

      // Update location if present
      if (listing.locationId && item.latitude && item.longitude) {
        await client.query(
          `UPDATE "location"
           SET address = $1, latitude = $2, longitude = $3
           WHERE id = $4`,
          [item.address, item.latitude, item.longitude, listing.locationId]
        );
      }

      updatedCount++;
    } else {
      // Create new Organization, Location, and DiscoveryListing
      const orgId = uuidv4();
      const locId = uuidv4();
      const listingId = uuidv4();

      await client.query(
        `INSERT INTO "organization" (
          id, name, type, "storeCategory", description, address, "logoAssetId", status, "createdAt"
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'ACTIVE', NOW())`,
        [
          orgId,
          item.name,
          classification.type,
          classification.storeCategory,
          item.about,
          item.address,
          item.coverImage || null
        ]
      );

      await client.query(
        `INSERT INTO "location" (
          id, "organizationId", name, address, latitude, longitude, "cityId"
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          locId,
          orgId,
          `${item.name} - ${isUyo ? 'Uyo' : 'Calabar'}`,
          item.address,
          item.latitude || null,
          item.longitude || null,
          cityId
        ]
      );

      await client.query(
        `INSERT INTO "discoveryListing" (
          id, "organizationId", "locationId", "cityId", vertical, slug, title, description, "coverAssetId", "isActive", metadata, "createdAt"
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, true, $10, NOW())`,
        [
          listingId,
          orgId,
          locId,
          cityId,
          classification.type,
          baseSlug,
          item.name,
          item.about,
          item.coverImage || null,
          metadata
        ]
      );

      createdCount++;
    }

    if ((createdCount + updatedCount) % 25 === 0) {
      console.log(`Processed ${createdCount + updatedCount} / ${businesses.length} businesses...`);
    }
  }

  console.log(`\n🎉 ChopCalabar Directory Seeding Complete!`);
  console.log(`Created: ${createdCount} new listings`);
  console.log(`Updated: ${updatedCount} existing listings`);
  console.log(`Total active directory entries: ${createdCount + updatedCount}`);

  // Query final counts
  const finalCount = await client.query(`SELECT count(*) FROM "discoveryListing" WHERE "cityId" = $1 AND "isActive" = true`, [CALABAR_CITY_ID]);
  console.log(`Active listings for Calabar: ${finalCount.rows[0].count}`);

  await client.end();
}

seedChopCalabarDirectory().catch((err) => {
  console.error('Fatal error during directory seeding:', err);
  process.exit(1);
});
