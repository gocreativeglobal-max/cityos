import { db } from '../src/prisma/db.ts';

async function main() {
  const allProducts = await db.orm.public.RetailProduct.all();
  
  const noImage = allProducts.filter(p => {
    if (!p.imageAssetId) return true;
    const trimmed = p.imageAssetId.trim();
    if (trimmed === '' || trimmed === '[]' || trimmed === 'null' || trimmed === '""') return true;
    try {
      if (trimmed.startsWith('[')) {
        const arr = JSON.parse(trimmed);
        return !Array.isArray(arr) || arr.length === 0 || !arr[0];
      }
    } catch {
      return true;
    }
    return false;
  });

  console.log('Total products in DB:', allProducts.length);
  console.log('Products without images:', noImage.length);

  const byOrg = {};
  for (const p of noImage) {
    byOrg[p.organizationId] = (byOrg[p.organizationId] || 0) + 1;
  }
  console.log('No image by org:', JSON.stringify(byOrg, null, 2));

  console.log(`\nAll products without images (${noImage.length}):`);
  for (const p of noImage) {
    console.log(`  - [${p.organizationId}] ${p.id}: ${p.name}`);
  }

  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
