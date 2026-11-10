import fs from 'node:fs';

async function fetchAllIstoreProducts() {
  let page = 1;
  const allProducts = [];

  while (true) {
    const url = `https://istorecalabar.com/wp-json/wc/store/v1/products?per_page=100&page=${page}`;
    console.log(`Fetching page ${page}...`);
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    if (!res.ok) {
      console.log(`Status ${res.status} on page ${page}, stopping.`);
      break;
    }

    const data = await res.json();
    if (!Array.isArray(data) || data.length === 0) {
      break;
    }

    allProducts.push(...data);
    const totalPages = Number(res.headers.get('x-wp-totalpages') || '1');
    if (page >= totalPages) break;
    page++;
  }

  console.log(`Fetched total ${allProducts.length} products from iStore Calabar!`);
  
  // Save raw json for review
  fs.writeFileSync('scripts/istore-products-raw.json', JSON.stringify(allProducts, null, 2));

  // Quick summary of categories and price ranges
  const categories = new Set();
  let withImg = 0;
  let withoutImg = 0;

  for (const p of allProducts) {
    for (const c of (p.categories || [])) {
      categories.add(c.name);
    }
    if (p.images && p.images.length > 0 && p.images[0].src) {
      withImg++;
    } else {
      withoutImg++;
    }
  }

  console.log('Categories found:', Array.from(categories));
  console.log(`Products with image: ${withImg}, without image: ${withoutImg}`);
}

fetchAllIstoreProducts().catch(console.error);
