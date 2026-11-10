import fs from 'fs';

async function fetchAllCyGroupProducts() {
  console.log('Fetching all products from https://cygroup.ng/wp-json/wc/store/v1/products ...');
  const allProducts = [];
  let page = 1;
  const perPage = 100;

  while (true) {
    console.log(`Fetching page ${page}...`);
    const res = await fetch(`https://cygroup.ng/wp-json/wc/store/v1/products?per_page=${perPage}&page=${page}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });

    if (!res.ok) {
      if (res.status === 400 || res.status === 404) {
        break; // Reached past end of pages
      }
      console.warn(`Warning: received status ${res.status} on page ${page}`);
      break;
    }

    const items = await res.json();
    if (!Array.isArray(items) || items.length === 0) {
      break;
    }

    allProducts.push(...items);
    console.log(`Page ${page}: got ${items.length} items (Running total: ${allProducts.length})`);
    
    const totalPages = parseInt(res.headers.get('x-wp-totalpages') || '1', 10);
    if (page >= totalPages) {
      break;
    }
    page++;
  }

  console.log(`\nTotal products downloaded: ${allProducts.length}`);
  fs.writeFileSync('scripts/cygroup-products.json', JSON.stringify(allProducts, null, 2));
  console.log('Saved to scripts/cygroup-products.json');

  // Filter available (in-stock) products
  const available = allProducts.filter(p => p.is_in_stock !== false);
  console.log(`Available / In-Stock products: ${available.length}`);

  // Group by category
  const categoriesCount = {};
  for (const p of available) {
    const cats = (p.categories || []).map(c => c.name);
    const catLabel = cats.join(' > ') || 'Uncategorized';
    categoriesCount[catLabel] = (categoriesCount[catLabel] || 0) + 1;
  }

  console.log('\nAvailable products by category:');
  for (const [cat, count] of Object.entries(categoriesCount).sort((a, b) => b[1] - a[1])) {
    console.log(`  • ${cat}: ${count} products`);
  }
}

fetchAllCyGroupProducts().catch(err => {
  console.error('Error fetching CyGroup catalog:', err);
  process.exit(1);
});
