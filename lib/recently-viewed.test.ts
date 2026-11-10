import test from 'node:test';
import assert from 'node:assert';
import {
  INITIAL_POPULAR_FALLBACKS,
  STORAGE_KEY,
  recordRecentlyViewedProduct,
  getRecentlyViewedProducts,
  clearRecentlyViewedProducts,
  removeRecentlyViewedProduct,
} from './recently-viewed';

test('recently-viewed: fallback list validation', async (t) => {
  await t.test('contains all expected sample products with authentic data', () => {
    assert.strictEqual(INITIAL_POPULAR_FALLBACKS.length, 5);
    const names = INITIAL_POPULAR_FALLBACKS.map((item) => item.name);
    assert.ok(names.some((n) => n.includes('ELITEBOOK 830 G7')));
    assert.ok(names.some((n) => n.includes('Aeon 90 Litres Chest Freezer')));
    assert.ok(names.some((n) => n.includes('NIVEA MEN Black & White')));
    assert.ok(names.some((n) => n.includes('Mobile Phone Lens')));
    assert.ok(names.some((n) => n.includes('Game Boy R36S')));
  });

  await t.test('has valid prices, ratings, and discounts', () => {
    for (const item of INITIAL_POPULAR_FALLBACKS) {
      assert.ok(item.price > 0);
      assert.ok(typeof item.image === 'string' && item.image.length > 0);
      if (item.compareAtPrice) {
        assert.ok(item.compareAtPrice >= item.price);
        assert.ok(item.discountPct !== undefined && item.discountPct > 0);
      }
    }
  });
});

test('recently-viewed: browser storage simulation', async (t) => {
  const store: Record<string, string> = {};
  const mockLocalStorage = {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, val: string) => {
      store[key] = val;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      for (const k of Object.keys(store)) delete store[k];
    },
  };

  (globalThis as any).localStorage = mockLocalStorage;
  (globalThis as any).window = {
    dispatchEvent: () => true,
    localStorage: mockLocalStorage,
  };

  await t.test('records and retrieves recently viewed items in LIFO order', () => {
    mockLocalStorage.clear();

    recordRecentlyViewedProduct({
      id: 'p-1',
      name: 'Item One',
      price: 1000,
      image: '/img1.jpg',
    });

    recordRecentlyViewedProduct({
      id: 'p-2',
      name: 'Item Two',
      price: 2000,
      image: '/img2.jpg',
    });

    const items = getRecentlyViewedProducts();
    assert.strictEqual(items.length, 2);
    assert.strictEqual(items[0].id, 'p-2');
    assert.strictEqual(items[1].id, 'p-1');
  });

  await t.test('removes item by ID', () => {
    removeRecentlyViewedProduct('p-1');
    const items = getRecentlyViewedProducts();
    assert.strictEqual(items.length, 1);
    assert.strictEqual(items[0].id, 'p-2');
  });

  await t.test('clears all items', () => {
    clearRecentlyViewedProducts();
    const items = getRecentlyViewedProducts();
    assert.strictEqual(items.length, 0);
  });
});
