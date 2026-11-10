import { db } from '../src/prisma/db.ts';

async function main() {
  await db.orm.public.RetailProduct.where({ id: 'cygroup-cal-7079' }).update({
    imageAssetId: JSON.stringify(['/images/products/cygroup/mtn-4g-lte-m30s-pro-zlt.jpg'])
  });
  console.log('✓ Successfully fixed MTN 4G LTE M30S PRO image URL!');
  process.exit(0);
}

main().catch(console.error);
