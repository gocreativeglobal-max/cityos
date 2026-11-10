import fs from 'fs';

async function fetchAllPouchVilla() {
  console.log('Starting full catalog extraction from https://www.pouchvilla.com.ng/api/v1/products ...');
  const allProducts = [];
  let cursor = null;
  let batch = 1;

  while (true) {
    const url = new URL('https://www.pouchvilla.com.ng/api/v1/products');
    url.searchParams.set('limit', '100');
    if (cursor) {
      url.searchParams.set('cursor', cursor);
    }

    console.log(`Fetching batch ${batch} (cursor: ${cursor ? cursor.slice(0, 15) + '...' : 'initial'})...`);
    const res = await fetch(url.toString(), {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json'
      }
    });

    if (!res.ok) {
      console.error(`HTTP error ${res.status}: ${res.statusText}`);
      break;
    }

    const json = await res.json();
    if (!json.ok || !json.data || !json.data.products) {
      console.warn('Unexpected response structure:', json);
      break;
    }

    const products = json.data.products;
    allProducts.push(...products);
    console.log(`Batch ${batch}: got ${products.length} products (Running total: ${allProducts.length} / ${json.data.total})`);

    cursor = json.data.nextCursor;
    if (!cursor || products.length === 0) {
      break;
    }
    batch++;
  }

  console.log(`\n🎉 Completed extraction! Total products: ${allProducts.length}`);
  fs.writeFileSync('scripts/pouchvilla-products.json', JSON.stringify(allProducts, null, 2));
  console.log('Saved to scripts/pouchvilla-products.json');

  // Breakdown
  const inStock = allProducts.filter(p => p.inStock > 0);
  console.log(`In-Stock products: ${inStock.length}`);
  console.log(`Out-of-Stock products: ${allProducts.length - inStock.length}`);

  const brands = {};
  for (const p of inStock) {
    const b = p.brandName || 'Unbranded / Generic';
    brands[b] = (brands[b] || 0) + 1;
  }
  console.log('\nIn-stock products by brand:', brands);
}

fetchAllPouchVilla().catch(console.error);
