import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { PRICE_PRESETS, getPriceFilterLabel, PriceRangeValue } from '../components/cityos/PriceFilterPopover';

describe('Price Filter & Range System', () => {
  const sampleProducts = [
    { id: '1', name: 'Close Up Toothpaste', price: 1500 },
    { id: '2', name: 'Omo Detergent 2kg', price: 7500 },
    { id: '3', name: 'Knorr Seasoning Cube Box', price: 9800 },
    { id: '4', name: 'Infinix Smart Watch XE27', price: 29400 },
    { id: '5', name: 'Infinix Smart 9 128GB', price: 139125 },
    { id: '6', name: 'Infinix Note 40 Pro', price: 341250 },
    { id: '7', name: 'Infinix Zero Flip 5G', price: 973825 },
  ];

  function filterByPrice(products: typeof sampleProducts, filter: PriceRangeValue) {
    return products.filter((p) => {
      const price = Number(p.price) || 0;
      if (filter.min !== undefined && price < filter.min) return false;
      if (filter.max !== undefined && price > filter.max) return false;
      return true;
    });
  }

  test('1. "All Prices" returns complete product catalog', () => {
    const filter: PriceRangeValue = { preset: 'all' };
    const filtered = filterByPrice(sampleProducts, filter);
    assert.equal(filtered.length, 7);
    assert.equal(getPriceFilterLabel(filter), 'All Prices');
  });

  test('2. "Under ₦10,000" filters fast-moving consumables and daily essentials', () => {
    const under10kPreset = PRICE_PRESETS.find((p) => p.id === 'under-10k')!;
    const filter: PriceRangeValue = {
      preset: under10kPreset.id,
      min: under10kPreset.min,
      max: under10kPreset.max,
    };
    const filtered = filterByPrice(sampleProducts, filter);
    assert.equal(filtered.length, 3);
    assert.deepEqual(filtered.map((p) => p.id), ['1', '2', '3']);
    assert.equal(getPriceFilterLabel(filter), 'Under ₦10,000');
  });

  test('3. "₦10,000 – ₦50,000" filters smart accessories and wearables', () => {
    const preset = PRICE_PRESETS.find((p) => p.id === '10k-50k')!;
    const filter: PriceRangeValue = {
      preset: preset.id,
      min: preset.min,
      max: preset.max,
    };
    const filtered = filterByPrice(sampleProducts, filter);
    assert.equal(filtered.length, 1);
    assert.equal(filtered[0].id, '4');
    assert.equal(getPriceFilterLabel(filter), '₦10,000 – ₦50,000');
  });

  test('4. "₦50,000 – ₦200,000" filters entry-level smartphones', () => {
    const preset = PRICE_PRESETS.find((p) => p.id === '50k-200k')!;
    const filter: PriceRangeValue = {
      preset: preset.id,
      min: preset.min,
      max: preset.max,
    };
    const filtered = filterByPrice(sampleProducts, filter);
    assert.equal(filtered.length, 1);
    assert.equal(filtered[0].id, '5');
  });

  test('5. "₦200,000 – ₦500,000" filters mid-range performance smartphones', () => {
    const preset = PRICE_PRESETS.find((p) => p.id === '200k-500k')!;
    const filter: PriceRangeValue = {
      preset: preset.id,
      min: preset.min,
      max: preset.max,
    };
    const filtered = filterByPrice(sampleProducts, filter);
    assert.equal(filtered.length, 1);
    assert.equal(filtered[0].id, '6');
  });

  test('6. "Above ₦500,000" filters flagship and foldable devices', () => {
    const preset = PRICE_PRESETS.find((p) => p.id === 'above-500k')!;
    const filter: PriceRangeValue = {
      preset: preset.id,
      min: preset.min,
      max: preset.max,
    };
    const filtered = filterByPrice(sampleProducts, filter);
    assert.equal(filtered.length, 1);
    assert.equal(filtered[0].id, '7');
    assert.equal(getPriceFilterLabel(filter), 'Above ₦500,000');
  });

  test('7. Custom Min & Max price filtering works accurately', () => {
    const customFilter: PriceRangeValue = {
      preset: 'custom',
      min: 25000,
      max: 350000,
    };
    const filtered = filterByPrice(sampleProducts, customFilter);
    assert.equal(filtered.length, 3);
    assert.deepEqual(filtered.map((p) => p.id), ['4', '5', '6']);
    assert.equal(getPriceFilterLabel(customFilter), '₦25,000 – ₦350,000');
  });

  test('8. Custom open-ended bounds format labels cleanly', () => {
    assert.equal(getPriceFilterLabel({ preset: 'custom', min: 100000 }), '≥ ₦100,000');
    assert.equal(getPriceFilterLabel({ preset: 'custom', max: 50000 }), '≤ ₦50,000');
    assert.equal(getPriceFilterLabel({ preset: 'custom' }), 'Custom Price');
  });
});
