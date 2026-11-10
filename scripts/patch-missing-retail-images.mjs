import { db } from '../src/prisma/db.ts';

async function main() {
  const updates = [
    {
      id: '5cfacd12-d400-4a7e-ace4-51b06ea6943a',
      name: 'Ceramic Coffee Mug',
      img: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?q=80&w=800&auto=format&fit=crop'
    },
    {
      id: '340c475e-7ae6-4418-a908-d8c16d5f4130',
      name: 'Artisan Sourdough Loaf',
      img: 'https://images.unsplash.com/photo-1589367920969-ab8e050bbb04?q=80&w=800&auto=format&fit=crop'
    },
    {
      id: 'dbeaa432-5ed0-4916-abc0-294bfb22cca9',
      name: 'Organic Basmati Rice 5kg',
      img: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?q=80&w=800&auto=format&fit=crop'
    },
    {
      id: 'f9ff0fa6-406e-434f-a6e0-2a5e20cd6eb3',
      name: 'Fresh Palm Oil 1L',
      img: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?q=80&w=800&auto=format&fit=crop'
    },
    {
      id: '99aca975-cf0c-4376-a70d-1e4213d6a4fc',
      name: 'Test Item',
      img: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=800&auto=format&fit=crop'
    }
  ];

  for (const u of updates) {
    await db.orm.public.RetailProduct.where({ id: u.id }).update({
      imageAssetId: JSON.stringify([u.img])
    });
    console.log(`✓ Updated image for ${u.name}`);
  }

  // Delete orphaned Test Item if any
  try {
    await db.orm.public.RetailProduct.where({ id: '99aca975-cf0c-4376-a70d-1e4213d6a4fc' }).delete();
    console.log('✓ Cleaned up test item');
  } catch {}

  console.log('All missing retail product images patched successfully!');
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
