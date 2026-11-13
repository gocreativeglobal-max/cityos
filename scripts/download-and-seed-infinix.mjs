import 'dotenv/config';
import pg from 'pg';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

const { Pool } = pg;

async function downloadFile(url, destPath) {
  if (fs.existsSync(destPath)) {
    console.log(`- Exists: ${destPath}`);
    return;
  }
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      }
    });
    if (!res.ok) {
      console.warn(`Failed to download ${url}: status ${res.status}`);
      return;
    }
    const buf = Buffer.from(await res.arrayBuffer());
    fs.mkdirSync(path.dirname(destPath), { recursive: true });
    fs.writeFileSync(destPath, buf);
    console.log(`✓ Downloaded: ${destPath} (${buf.length} bytes)`);
  } catch (err) {
    console.error(`Error downloading ${url}:`, err.message);
  }
}

async function main() {
  const brandDir = 'public/images/brands/infinix';
  const prodDir = 'public/images/products/infinix';
  fs.mkdirSync(brandDir, { recursive: true });
  fs.mkdirSync(prodDir, { recursive: true });

  // 1. Download Banners & Visuals
  console.log('\n--- 1. Downloading Official Brand Banners ---');
  await downloadFile(
    'https://ng.jumia.is/cms/0-CMS-MIGRATION-2020/infinix/2026/sept/1168X384.jpg',
    path.join(brandDir, 'hero-banner.jpg')
  );
  await downloadFile(
    'https://ng.jumia.is/cms/0-CMS-MIGRATION-2020/infinix/2026/july/updated/HOT70PRO-168x384-SLIDDERS.jpg',
    path.join(brandDir, 'hot70-banner.jpg')
  );
  await downloadFile(
    'https://ng.jumia.is/cms/0-CMS-MIGRATION-2020/infinix/2026/April/April-29/SMART20xKVx1168x384.png',
    path.join(brandDir, 'smart20-banner.png')
  );
  await downloadFile(
    'https://ng.jumia.is/cms/0-CMS-MIGRATION-2020/infinix/2026/sept/1152X252GT50PRO.jpg',
    path.join(brandDir, 'gt50-banner.jpg')
  );
  await downloadFile(
    'https://ng.jumia.is/unsafe/fit-in/300x300/filters:fill(white)/product/86/5735914/1.jpg?9093',
    path.join(brandDir, 'logo.jpg')
  );

  // 2. Download Core Product Packshots
  console.log('\n--- 2. Downloading Product Packshots ---');
  const catalog = [
    {
      id: 'infinix-gt-50-pro',
      name: 'Infinix GT 50 Pro (512GB ROM / 12GB RAM) – 144Hz 6.78", Dimensity 8400, 6500mAh, 45W Wired & 30W Wireless Gaming Flagship',
      series: 'GT Gaming Series',
      variantName: '512GB / 12GB RAM',
      cost: 883288,
      compareAtPrice: 1500000,
      url: 'https://ng.jumia.is/unsafe/fit-in/520x520/filters:fill(white)/product/99/6710024/1.jpg?1989',
      file: 'gt-50-pro-512gb.jpg',
      category: 'Smartphones & Mobile Phones',
      description: 'Unleash elite mobile gaming performance with the Infinix GT 50 Pro. Powered by the MediaTek Dimensity 8400 Ultimate processor, a silky-smooth 144Hz 6.78" display, and a massive 6500mAh battery supporting 45W wired and 30W wireless charging with dedicated bypass cooling.\n\nKey Features:\n• 144Hz 6.78" FHD+ Ultra Gaming Display\n• MediaTek Dimensity 8400 Ultimate 5G Chipset\n• 512GB Storage + 12GB High-Speed LPDDR5X RAM\n• 6500mAh Long-Lasting Battery with 45W Wired & 30W Wireless Charging\n• Bypass Charging Mode for Zero Thermal Throttling during intensive gaming\n• Cyber Mecha Design with Customizable RGB Interactive Lighting\n• 12+1 Months Official Carlcare Warranty in Calabar'
    },
    {
      id: 'infinix-zero-flip',
      name: 'Infinix ZERO FLIP (512GB ROM / 8GB RAM) – 3D Curved AMOLED Foldable Flagship, 4K Pro Vlog, 70W SuperCharge',
      series: 'Zero Series',
      variantName: '512GB / 8GB RAM',
      cost: 821585,
      compareAtPrice: 900000,
      url: 'https://ng.jumia.is/unsafe/fit-in/520x520/filters:fill(white)/product/44/7696914/1.jpg?6493',
      file: 'zero-flip-512gb.jpg',
      category: 'Smartphones & Mobile Phones',
      description: 'Experience futuristic luxury with the Infinix ZERO FLIP. Seamless zero-gap folding hinge, dual interactive AMOLED screens, 4K Pro Vlog rear and front video cameras, and massive 512GB storage in an ultra-sleek Rock Black finish.\n\nKey Features:\n• Zero-Gap Foldable Hinge with Ultra-Thin Glass (UTG)\n• Dual AMOLED Displays: 3.64" Cover Screen & 6.9" 120Hz Main Display\n• 50MP OIS Ultra-Clear Main Camera + 50MP Ultra-Wide\n• 4K Ultra-HD Video Recording on Both Front and Rear Cameras\n• 512GB Internal Storage + 8GB RAM (expandable up to 16GB)\n• 70W Ultra Charge + 4720mAh Dual-Cell Battery\n• 12+1 Months Official Carlcare Warranty in Calabar'
    },
    {
      id: 'infinix-note-edge-256gb',
      name: 'Infinix Note Edge (256GB ROM / 8GB RAM) – 6.78" 120Hz Curved AMOLED, Dimensity 7100, 6500mAh Battery',
      series: 'Note Series',
      variantName: '256GB / 8GB RAM',
      cost: 496488,
      compareAtPrice: 650000,
      url: 'https://ng.jumia.is/unsafe/fit-in/520x520/filters:fill(white)/product/02/2776914/1.jpg?2164',
      file: 'note-edge-256gb.jpg',
      category: 'Smartphones & Mobile Phones',
      description: 'The Infinix Note Edge delivers executive elegance with a breathtaking 6.78-inch 120Hz curved AMOLED display, MediaTek Dimensity 7100 chipset, 108MP super-zoom triple camera system, and a monster 6500mAh battery.\n\nKey Features:\n• 6.78" 120Hz 3D Curved AMOLED Display with In-Display Fingerprint\n• 108MP Ultra-Clear Camera with 3x In-Sensor Lossless Zoom\n• MediaTek Dimensity 7100 5G Processor for High-Efficiency Multitasking\n• 256GB Storage + 8GB High-Speed RAM\n• 6500mAh Battery with 45W Fast Charging\n• JBL Tuned Dual Stereo Speakers with Hi-Res Audio\n• 12+1 Months Official Carlcare Warranty in Calabar'
    },
    {
      id: 'infinix-hot-70-pro',
      name: 'Infinix Hot 70 Pro 5G (128GB ROM / 6GB RAM) – 6.78" 120Hz IPS, Dimensity 7100 5G, 7000mAh Extreme Battery',
      series: 'Hot Series',
      variantName: '128GB / 6GB RAM',
      cost: 424588,
      compareAtPrice: 500000,
      url: 'https://ng.jumia.is/unsafe/fit-in/520x520/filters:fill(white)/product/26/7710024/1.jpg?2454',
      file: 'hot-70-pro-128gb.jpg',
      category: 'Smartphones & Mobile Phones',
      description: 'Power through multiple days on a single charge with the Infinix Hot 70 Pro 5G. Featuring an unprecedented 7000mAh battery, fast Dimensity 7100 5G performance, and a buttery-smooth 120Hz display.\n\nKey Features:\n• Colossal 7000mAh Battery for up to 3 days of heavy usage\n• MediaTek Dimensity 7100 5G High-Speed Processor\n• 6.78" 120Hz IPS Ultra-Smooth Punch-Hole Screen\n• 64MP AI Triple Rear Camera with Quad-LED Flash\n• 128GB Storage + 6GB RAM (expandable via Extended RAM)\n• 45W All-Round Fast Charge\n• 12+1 Months Official Carlcare Warranty in Calabar'
    },
    {
      id: 'infinix-hot-70-128gb',
      name: 'Infinix Hot 70 (128GB ROM / 4GB RAM) – 6.78" 120Hz Display, Helio G100 Ultimate, 6000mAh Battery, 45W Fast Charge (Night Pulse)',
      series: 'Hot Series',
      variantName: '128GB / 4GB RAM',
      cost: 233688,
      compareAtPrice: 250000,
      url: 'https://ng.jumia.is/unsafe/fit-in/520x520/filters:fill(white)/product/46/2787914/1.jpg?3568',
      file: 'hot-70-128gb-nightpulse.jpg',
      category: 'Smartphones & Mobile Phones',
      description: 'Built for dynamic speed and all-day entertainment. The Infinix Hot 70 features the MediaTek Helio G100 Ultimate processor, an expansive 6000mAh battery with 45W rapid charge, and a stunning 120Hz fluid display.\n\nKey Features:\n• MediaTek Helio G100 Ultimate High-Efficiency Processor\n• 6.78" 120Hz FHD+ Punch-Hole Display with Wet-Touch Technology\n• 6000mAh Battery with 45W Multi-Speed Fast Charging\n• 50MP AI Main Camera with Super Night Mode\n• 128GB Internal Storage + 4GB RAM\n• Dual Speakers with DTS Sound Optimization\n• 12+1 Months Official Carlcare Warranty in Calabar'
    },
    {
      id: 'infinix-smart-20-128gb',
      name: 'Infinix Smart 20 (128GB ROM / 4GB RAM) – 6.78" 120Hz Display, Helio G81, 5200mAh Battery, Interactive Dynamic Bar',
      series: 'Smart Series',
      variantName: '128GB / 4GB RAM',
      cost: 179958,
      compareAtPrice: 195000,
      url: 'https://ng.jumia.is/unsafe/fit-in/520x520/filters:fill(white)/product/40/8375914/1.jpg?8841',
      file: 'smart-20-128gb.jpg',
      category: 'Smartphones & Mobile Phones',
      description: 'The unbeatable budget champion. Infinix Smart 20 packs a big 128GB storage, a smooth 120Hz 6.78-inch display, Helio G81 processor, and a reliable 5200mAh battery with the interactive Dynamic Bar for instant notifications.\n\nKey Features:\n• 128GB Big Storage + 4GB RAM\n• 6.78" 120Hz Punch-Hole Screen with Dynamic Bar\n• MediaTek Helio G81 Ultimate Responsive Processor\n• 5200mAh Long-Life Battery with Type-C Fast Charging\n• 13MP AI Dual Camera with Dual Flash\n• 200% Super Volume Speaker with DTS\n• 12+1 Months Official Carlcare Warranty in Calabar'
    },
    {
      id: 'infinix-smart-20-64gb',
      name: 'Infinix Smart 20 (64GB ROM / 4GB RAM) – 6.78" 120Hz Display, Helio G81, 5200mAh Battery (Shadow Black)',
      series: 'Smart Series',
      variantName: '64GB / 4GB RAM',
      cost: 161368,
      compareAtPrice: 175000,
      url: 'https://ng.jumia.is/unsafe/fit-in/520x520/filters:fill(white)/product/86/5735914/1.jpg?9093',
      file: 'smart-20-64gb.jpg',
      category: 'Smartphones & Mobile Phones',
      description: 'Smart essential everyday connectivity. Featuring 64GB storage, 4GB RAM, fluid 120Hz refresh rate, and a durable 5200mAh battery built for all-day social media, streaming, and work.\n\nKey Features:\n• 64GB Storage + 4GB RAM\n• 6.78" 120Hz Display with Dynamic Bar\n• 5200mAh Battery with Type-C Charging\n• Side-Mounted Fast Fingerprint Sensor & Face Unlock\n• 12+1 Months Official Carlcare Warranty in Calabar'
    },
    {
      id: 'infinix-xwatch-n4-pro',
      name: 'Infinix XWatch N4 Pro AI Smartwatch – 1.43" AMOLED HD Display, Bluetooth Calling, 12-Day Battery (Titanium Grey)',
      series: 'Wearables & Audio',
      variantName: 'Titanium Grey',
      cost: 57988,
      compareAtPrice: 65000,
      url: 'https://ng.jumia.is/unsafe/fit-in/520x520/filters:fill(white)/product/37/8930024/1.jpg?5688',
      file: 'xwatch-n4-pro.jpg',
      category: 'Electronics & Gadgets',
      description: 'Elevate your wrist with the premium Infinix XWatch N4 Pro. Featuring a vivid 1.43" AMOLED HD display, aircraft-grade metallic case in Titanium Grey, clear Bluetooth phone calling, comprehensive heart rate & SpO2 health tracking, and up to 12 days of battery life.\n\nKey Features:\n• 1.43" Ultra-Bright AMOLED Always-On Display (466x466)\n• High-Fidelity Bluetooth Calling with Built-in Speaker & Mic\n• 24/7 Heart Rate, Blood Oxygen (SpO2), Sleep & Stress Monitoring\n• 100+ Professional Sports Modes\n• IP68 Water and Dust Resistance\n• Up to 12-Day Long Battery Endurance\n• Official Carlcare Warranty Coverage'
    },
    {
      id: 'infinix-xwatch-3-plus',
      name: 'Infinix XWatch 3 Plus Smartwatch – 2.13" Curved AMOLED Display, Clear Bluetooth Calling, Fitness & Sleep Tracker',
      series: 'Wearables & Audio',
      variantName: 'Obsidian Black',
      cost: 42988,
      compareAtPrice: 50000,
      url: 'https://ng.jumia.is/unsafe/fit-in/520x520/filters:fill(white)/product/93/2527914/1.jpg?1814',
      file: 'xwatch-3-plus.jpg',
      category: 'Electronics & Gadgets',
      description: 'Sleek curved aesthetics meet high functionality. The Infinix XWatch 3 Plus features an expansive 2.13" curved AMOLED screen, crystal-clear Bluetooth calling, and full fitness telemetry.\n\nKey Features:\n• 2.13" Large Curved AMOLED Display with 60Hz Refresh Rate\n• Quick Bluetooth Voice Calling and Message Notifications\n• Complete Health Suite: Heart Rate, SpO2 & Sleep Tracker\n• Custom Watch Faces via My Health App\n• 7-Day Active Battery Life\n• Official Carlcare Warranty Coverage'
    },
    {
      id: 'infinix-xbuds-n4-pro',
      name: 'Infinix XBuds N4 Pro Active Noise Cancelling TWS Earbuds – 35H Total Playtime, Deep Bass, Quad Mic ENC',
      series: 'Wearables & Audio',
      variantName: 'Titanium Grey',
      cost: 34488,
      compareAtPrice: 45000,
      url: 'https://ng.jumia.is/unsafe/fit-in/520x520/filters:fill(white)/product/41/5427914/1.jpg?3852',
      file: 'xbuds-n4-pro.jpg',
      category: 'Electronics & Gadgets',
      description: 'Immerse yourself in studio-grade audio with the Infinix XBuds N4 Pro. Featuring active noise cancellation, deep bass tuning, quad-mic environmental noise cancellation for ultra-clear calls, and up to 35 hours total playtime.\n\nKey Features:\n• Active Noise Cancellation (ANC) with Transparency Mode\n• Quad-Mic ENC for Crystal Clear Voice Calling\n• 10mm Titanium Composite Drivers for Punchy Deep Bass\n• Up to 35 Hours Total Playtime with Fast Charging Case\n• Low Latency Game Mode for Zero Audio Lag\n• IPX4 Sweat & Splash Resistant'
    },
    {
      id: 'infinix-zloop-4',
      name: 'Infinix ZLoop 4 True Wireless Earphones – 25H Playtime, Instant Auto-Pairing, Ergonomic Comfort',
      series: 'Wearables & Audio',
      variantName: 'Midnight Black',
      cost: 25988,
      compareAtPrice: 35000,
      url: 'https://ng.jumia.is/unsafe/fit-in/520x520/filters:fill(white)/product/57/2527914/1.jpg?4189',
      file: 'zloop-4.jpg',
      category: 'Electronics & Gadgets',
      description: 'Compact, featherlight, and punchy. The Infinix ZLoop 4 TWS earbuds deliver rich acoustic sound, reliable touch controls, and 25 hours of uninterrupted battery life.\n\nKey Features:\n• 25 Hours Total Endurance (6h earbuds + 19h charging case)\n• Bluetooth 5.3 Fast and Stable Connection\n• 13mm Dynamic Bass Boost Drivers\n• Smart Touch Controls for Music & Calls\n• Featherweight Ergonomic In-Ear Fit'
    },
    {
      id: 'infinix-30000mah-powerbank',
      name: 'Infinix 30000mAh High-Capacity Fast Power Bank – Dual USB-A + Type-C In/Out, Multi-Device Safe Charging',
      series: 'Power & Accessories',
      variantName: '30,000mAh Black',
      cost: 26988,
      compareAtPrice: 32000,
      url: 'https://ng.jumia.is/unsafe/fit-in/520x520/filters:fill(white)/product/83/1427914/1.jpg?3178',
      file: 'powerbank-30000mah.jpg',
      category: 'Electronics & Gadgets',
      description: 'Massive backup power for phones, tablets, and mobile gadgets. The Infinix 30,000mAh external battery pack keeps you charged during power outages and travels with multi-device simultaneous charging.\n\nKey Features:\n• True 30,000mAh High-Density Polymer Core\n• Dual Output USB Ports + Bi-Directional Type-C Port\n• Smart Temperature & Overcharge Protection Circuit\n• LED Battery Level Indicators\n• Anti-Scratch Matte Texture Finish'
    },
    {
      id: 'infinix-10000mah-powerbank',
      name: 'Infinix 10000mAh Ultra-Slim Fast Power Bank – Type-C In & Out, Pocket-Friendly Travel Charger (Black)',
      series: 'Power & Accessories',
      variantName: '10,000mAh Black',
      cost: 10988,
      compareAtPrice: 18000,
      url: 'https://ng.jumia.is/unsafe/fit-in/520x520/filters:fill(white)/product/62/1496914/1.jpg?1553',
      file: 'powerbank-10000mah.jpg',
      category: 'Electronics & Gadgets',
      description: 'Pocket-friendly emergency power wherever you go. The Infinix 10,000mAh slim power bank delivers convenient fast charging in an ultra-compact form factor.\n\nKey Features:\n• 10,000mAh Slim Pocket Profile\n• Type-C and Micro-USB Dual Input + Dual USB-A Output\n• Fast Charging with Intelligent Device Detection\n• Safe-Guard Protection Against Overvoltage and Overheating'
    }
  ];

  for (const p of catalog) {
    const dest = path.join(prodDir, p.file);
    await downloadFile(p.url, dest);
  }

  console.log('\n--- 3. Database Upsert: Infinix Official Store ---');
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // 1. Resolve Calabar City
    const cityRes = await client.query(
      `SELECT id, name, slug FROM city WHERE LOWER(slug) = 'calabar' OR LOWER(name) = 'calabar' LIMIT 1`
    );
    if (cityRes.rows.length === 0) throw new Error('Calabar city not found');
    const cityId = cityRes.rows[0].id;

    // 2. Organization: infinix-store
    const orgId = 'infinix-store';
    const orgName = 'Infinix Official Store';
    const orgAddress = 'Carlcare Regional Service & Distribution Centre, 44 Ndidem Usang Iso (Marian) Road, Calabar, Cross River State';
    const orgDesc = 'Official Brand Flagship for Infinix Nigeria in Calabar. 100% genuine guaranteed smartphones, laptops, tablets, smart wearables, and audio accessories with 12+1 months official Carlcare manufacturer warranty.';
    const storeCategory = 'Electronics & Gadgets';
    const logoAssetId = '/images/brands/infinix/logo.jpg';

    const orgCheck = await client.query(`SELECT id FROM organization WHERE id = $1 LIMIT 1`, [orgId]);
    if (orgCheck.rows.length > 0) {
      await client.query(
        `UPDATE organization
         SET name = $2, type = 'RETAIL', "storeCategory" = $3, description = $4, address = $5, "logoAssetId" = $6, status = 'ACTIVE'
         WHERE id = $1`,
        [orgId, orgName, storeCategory, orgDesc, orgAddress, logoAssetId]
      );
      console.log('✓ Updated Organization:', orgName);
    } else {
      await client.query(
        `INSERT INTO organization (id, name, type, "storeCategory", description, address, "logoAssetId", status)
         VALUES ($1, $2, 'RETAIL', $3, $4, $5, $6, 'ACTIVE')`,
        [orgId, orgName, storeCategory, orgDesc, orgAddress, logoAssetId]
      );
      console.log('✓ Created Organization:', orgName);
    }

    // 3. Location: Carlcare Marian Hub
    const locName = 'Carlcare Service & Retail Hub (Marian)';
    let locRes = await client.query(`SELECT id FROM location WHERE "organizationId" = $1 LIMIT 1`, [orgId]);
    let locationId;
    if (locRes.rows.length > 0) {
      locationId = locRes.rows[0].id;
      await client.query(
        `UPDATE location
         SET name = $2, address = $3, "cityId" = $4, latitude = 4.9720, longitude = 8.3370
         WHERE id = $1`,
        [locationId, locName, orgAddress, cityId]
      );
      console.log('✓ Updated Location:', locName);
    } else {
      locationId = crypto.randomUUID();
      await client.query(
        `INSERT INTO location (id, "organizationId", name, address, "cityId", latitude, longitude)
         VALUES ($1, $2, $3, $4, $5, 4.9720, 8.3370)`,
        [locationId, orgId, locName, orgAddress, cityId]
      );
      console.log('✓ Created Location:', locName);
    }

    // 4. DiscoveryListing with Flagship Metadata
    const subBrandsList = [
      { id: 'all', name: 'All Series', icon: '✨', tag: 'all', description: 'Complete official Infinix smartphone & gadget ecosystem' },
      { id: 'gt-series', name: 'GT Gaming', icon: '🎮', tag: 'GT Gaming Series', description: 'Ultra gaming flagships with 144Hz & Dimensity processors' },
      { id: 'zero-series', name: 'Zero Series', icon: '🌟', tag: 'Zero Series', description: 'Zero Flip foldable & 4K vlog photography flagships' },
      { id: 'note-series', name: 'Note Series', icon: '⚡', tag: 'Note Series', description: 'Curved AMOLED, 108MP camera & All-Round FastCharge' },
      { id: 'hot-series', name: 'Hot Series', icon: '🔥', tag: 'Hot Series', description: 'Fast Helio G100 gaming, 120Hz displays & 7000mAh batteries' },
      { id: 'smart-series', name: 'Smart Series', icon: '📱', tag: 'Smart Series', description: 'Incredible value champions with big batteries & Dynamic Bar' },
      { id: 'wearables-audio', name: 'Wearables & Audio', icon: '🎧', tag: 'Wearables & Audio', description: 'AMOLED smartwatches, ANC wireless earbuds & Hi-Res audio' },
      { id: 'power-accessories', name: 'Power & Accessories', icon: '🔋', tag: 'Power & Accessories', description: 'High-density fast power banks & original chargers' }
    ];

    const aisles = [
      'Smartphones & Mobile Phones',
      'Wearables & Smartwatches',
      'Audio & True Wireless',
      'Power Banks & Chargers'
    ];

    const listingMetadata = JSON.stringify({
      claimed: true,
      verified: true,
      isVerified: true,
      isOfficialBrandStore: true,
      brandName: 'Infinix',
      neighborhood: 'Marian Road / Calabar Municipal',
      area: 'Ndidem Usang Iso Road',
      workingHours: 'Mon – Sat · 08:30 AM – 06:30 PM',
      landmark: 'Carlcare Centre, Marian Road, Calabar',
      coverImage: '/images/brands/infinix/hero-banner.jpg',
      images: [
        '/images/brands/infinix/hero-banner.jpg',
        '/images/brands/infinix/hot70-banner.jpg',
        '/images/brands/infinix/smart20-banner.png',
        '/images/brands/infinix/gt50-banner.jpg'
      ],
      heroBanners: [
        {
          title: 'Infinix Official Flagship Store',
          subtitle: 'The Future is Now · 100% Genuine Guaranteed + Carlcare Warranty',
          image: '/images/brands/infinix/hero-banner.jpg',
          ctaText: 'Explore All Devices',
          filterTag: 'all'
        },
        {
          title: 'Infinix Hot 70 Series',
          subtitle: 'Sleek, Fast & Tough — Powered by Helio G100 & Massive Batteries',
          image: '/images/brands/infinix/hot70-banner.jpg',
          ctaText: 'Shop Hot Series',
          filterTag: 'Hot Series'
        },
        {
          title: 'Infinix Smart 20 Series',
          subtitle: 'Big 5200mAh Battery + Dynamic Bar — Unmatched Daily Value',
          image: '/images/brands/infinix/smart20-banner.png',
          ctaText: 'Shop Smart Series',
          filterTag: 'Smart Series'
        },
        {
          title: 'Infinix GT 50 Pro Gaming Flagship',
          subtitle: '144Hz Refresh Rate + Dimensity 8400 Ultimate + Cyber Mecha Design',
          image: '/images/brands/infinix/gt50-banner.jpg',
          ctaText: 'Shop GT 50 Pro',
          filterTag: 'GT Gaming Series'
        }
      ],
      subBrands: subBrandsList,
      aisles,
    });

    const listRes = await client.query(`SELECT id FROM "discoveryListing" WHERE "organizationId" = $1 LIMIT 1`, [orgId]);
    if (listRes.rows.length > 0) {
      await client.query(
        `UPDATE "discoveryListing"
         SET "locationId" = $2, "cityId" = $3, vertical = 'RETAIL', slug = 'infinix-store', title = $4,
             description = $5, "coverAssetId" = $6, "isActive" = true, metadata = $7
         WHERE id = $1`,
        [listRes.rows[0].id, locationId, cityId, orgName, orgDesc, '/images/brands/infinix/hero-banner.jpg', listingMetadata]
      );
      console.log('✓ Updated DiscoveryListing for Infinix Official Store');
    } else {
      await client.query(
        `INSERT INTO "discoveryListing" (id, "organizationId", "locationId", "cityId", vertical, slug, title, description, "coverAssetId", "isActive", metadata)
         VALUES ($1, $2, $3, $4, 'RETAIL', 'infinix-store', $5, $6, $7, true, $8)`,
        [crypto.randomUUID(), orgId, locationId, cityId, orgName, orgDesc, '/images/brands/infinix/hero-banner.jpg', listingMetadata]
      );
      console.log('✓ Created DiscoveryListing for Infinix Official Store');
    }

    // 5. RetailSettings
    const settingsCheck = await client.query(`SELECT id FROM "retailSettings" WHERE "organizationId" = $1 LIMIT 1`, [orgId]);
    if (settingsCheck.rows.length === 0) {
      await client.query(
        `INSERT INTO "retailSettings" (id, "organizationId", "storeName", "storeAddress", "currencySymbol", country, "hasStoreInfo", "hasProducts")
         VALUES ($1, $2, $3, $4, '₦', 'NG', true, true)`,
        [crypto.randomUUID(), orgId, orgName, orgAddress]
      );
      console.log('✓ Created RetailSettings');
    }

    // 6. Categories & Products
    for (const p of catalog) {
      // Upsert Category
      let catRes = await client.query(
        `SELECT id FROM "retailCategory" WHERE "organizationId" = $1 AND LOWER(name) = LOWER($2) LIMIT 1`,
        [orgId, p.series]
      );
      let catId;
      if (catRes.rows.length > 0) {
        catId = catRes.rows[0].id;
      } else {
        catId = crypto.randomUUID();
        await client.query(
          `INSERT INTO "retailCategory" (id, "organizationId", name) VALUES ($1, $2, $3)`,
          [catId, orgId, p.series]
        );
      }

      // Selling Price = Math.round(cost * 1.05)
      const sellingPrice = Math.round(p.cost * 1.05);
      const compareAt = p.compareAtPrice ? Math.round(p.compareAtPrice * 1.05) : null;
      const imagePath = `/images/products/infinix/${p.file}`;

      let prodCheck = await client.query(
        `SELECT id FROM "retailProduct" WHERE "organizationId" = $1 AND (id = $2 OR LOWER(name) = LOWER($3)) LIMIT 1`,
        [orgId, p.id, p.name]
      );

      let productId;
      if (prodCheck.rows.length > 0) {
        productId = prodCheck.rows[0].id;
        await client.query(
          `UPDATE "retailProduct"
           SET name = $2, "variantName" = $3, "categoryId" = $4, "globalCategory" = $5,
               description = $6, price = $7, cost = $8, "compareAtPrice" = $9, "stockQuantity" = 25,
               unit = 'item', "imageAssetId" = $10, "isWeighed" = false
           WHERE id = $1`,
          [
            productId,
            p.name,
            p.variantName,
            catId,
            p.category,
            p.description,
            sellingPrice,
            p.cost,
            compareAt,
            JSON.stringify([imagePath])
          ]
        );
        console.log(`✓ Updated Product: ${p.name.slice(0, 45)}... (₦${sellingPrice.toLocaleString()})`);
      } else {
        productId = p.id;
        await client.query(
          `INSERT INTO "retailProduct" (id, "organizationId", "categoryId", "globalCategory", name, "variantName", description, price, cost, "compareAtPrice", "stockQuantity", unit, "imageAssetId", "isWeighed")
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 25, 'item', $11, false)`,
          [
            productId,
            orgId,
            catId,
            p.category,
            p.name,
            p.variantName,
            p.description,
            sellingPrice,
            p.cost,
            compareAt,
            JSON.stringify([imagePath])
          ]
        );
        console.log(`✓ Created Product: ${p.name.slice(0, 45)}... (₦${sellingPrice.toLocaleString()})`);
      }

      // Upsert Location Stock
      const stockCheck = await client.query(
        `SELECT id FROM "retailLocationStock" WHERE "organizationId" = $1 AND "productId" = $2 AND "locationId" = $3 LIMIT 1`,
        [orgId, productId, locationId]
      );
      if (stockCheck.rows.length > 0) {
        await client.query(
          `UPDATE "retailLocationStock" SET "stockQuantity" = 25 WHERE id = $1`,
          [stockCheck.rows[0].id]
        );
      } else {
        await client.query(
          `INSERT INTO "retailLocationStock" (id, "organizationId", "locationId", "productId", "stockQuantity")
           VALUES ($1, $2, $3, $4, 25)`,
          [crypto.randomUUID(), orgId, locationId, productId]
        );
      }
    }

    await client.query('COMMIT');
    console.log('\n🎉 Successfully seeded Infinix Official Store with all products, Carlcare warranty, and +5% selling prices!');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Database seeding error:', err);
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
