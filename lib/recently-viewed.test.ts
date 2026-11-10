import test from 'node:test';
import assert from 'node:assert';
import {
  STORAGE_KEY,
  recordRecentlyViewedProduct,
  getRecentlyViewedProducts,
  clearRecentlyViewedProducts,
  removeRecentlyViewedProduct,
} from './recently-viewed';

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

  await t.test('returns empty array when nothing has been viewed yet', () => {
    mockLocalStorage.clear();
    const items = getRecentlyViewedProducts();
    assert.strictEqual(items.length, 0);
  });

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
