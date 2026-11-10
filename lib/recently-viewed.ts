'use client';

export interface RecentlyViewedItem {
  id: string;
  name: string;
  price: number;
  compareAtPrice?: number | null;
  image?: string;
  imageAssetId?: string;
  imageUrl?: string;
  storeName?: string;
  organizationId?: string;
  categoryName?: string;
  rating?: number | null;
  reviewsCount?: number | null;
  discountPct?: number;
  viewedAt?: number;
}

export const STORAGE_KEY = 'cityos_recently_viewed_products';
const MAX_ITEMS = 24;

/**
 * Retrieve recently viewed products from localStorage.
 */
export function getRecentlyViewedProducts(limit = 12): RecentlyViewedItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.slice(0, limit);
  } catch {
    return [];
  }
}

/**
 * Record a product visit into localStorage.
 */
export function recordRecentlyViewedProduct(item: Omit<RecentlyViewedItem, 'viewedAt'>): void {
  if (typeof window === 'undefined' || !item || !item.id) return;
  try {
    const current = getRecentlyViewedProducts(MAX_ITEMS);
    // Remove if already present (to bring to the top)
    const filtered = current.filter((p) => p.id !== item.id);
    
    const discountPct =
      item.discountPct ??
      (item.compareAtPrice && item.compareAtPrice > item.price
        ? Math.round(((item.compareAtPrice - item.price) / item.compareAtPrice) * 100)
        : 0);

    const updated: RecentlyViewedItem = {
      ...item,
      discountPct,
      viewedAt: Date.now(),
    };

    const nextList = [updated, ...filtered].slice(0, MAX_ITEMS);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextList));

    // Dispatch global event for live reactive updates across components
    window.dispatchEvent(new CustomEvent('cityos:recently-viewed-updated', { detail: nextList }));
  } catch (err) {
    console.error('Failed to save recently viewed product:', err);
  }
}

/**
 * Clear all recently viewed products.
 */
export function clearRecentlyViewedProducts(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(STORAGE_KEY);
    window.dispatchEvent(new CustomEvent('cityos:recently-viewed-updated', { detail: [] }));
  } catch (err) {
    console.error('Failed to clear recently viewed products:', err);
  }
}

/**
 * Remove a single item from recently viewed.
 */
export function removeRecentlyViewedProduct(id: string): void {
  if (typeof window === 'undefined') return;
  try {
    const current = getRecentlyViewedProducts(MAX_ITEMS);
    const nextList = current.filter((p) => p.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextList));
    window.dispatchEvent(new CustomEvent('cityos:recently-viewed-updated', { detail: nextList }));
  } catch (err) {
    console.error('Failed to remove recently viewed item:', err);
  }
}
