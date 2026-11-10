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

export const INITIAL_POPULAR_FALLBACKS: RecentlyViewedItem[] = [
  {
    id: 'jumia-rv-hp-elitebook-830',
    name: 'Hp ELITEBOOK 830 G7 10TH GEN - Intel Core I5-8GB RAM/256GB SSD/Backlit Keyboard/FP Reader Windows 11 Pro + MOUSE',
    price: 470000,
    compareAtPrice: 520000,
    image: 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=600&q=80',
    storeName: 'Software Guru Technology',
    organizationId: 'software-guru-tech-calabar',
    categoryName: 'Computers & Laptops',
    rating: 4.8,
    reviewsCount: 142,
    discountPct: 10,
  },
  {
    id: 'jumia-rv-aeon-chest-freezer',
    name: 'Aeon 90 Litres Chest Freezer (ACF90GJ) - Dark Grey + 1 Year Warranty',
    price: 168999,
    compareAtPrice: 300000,
    image: 'https://images.unsplash.com/photo-1571175443880-49e1d25b2bc5?w=600&q=80',
    storeName: 'City Home Appliances',
    organizationId: 'cygroup-calabar',
    categoryName: 'Home & Kitchen',
    rating: 3.9,
    reviewsCount: 840,
    discountPct: 44,
  },
  {
    id: 'jumia-rv-nivea-men-deodorant',
    name: 'NIVEA MEN Black & White Invisible Original Anti-Perspirant Roll-on For Men, 72h - 50ml (Pack Of 3)',
    price: 4000,
    compareAtPrice: 6125,
    image: 'https://images.unsplash.com/photo-1608248597359-54359d997235?w=600&q=80',
    storeName: 'Calabar Everyday Store',
    organizationId: 'pouchvilla-calabar',
    categoryName: 'Beauty & Personal Care',
    rating: 4.0,
    reviewsCount: 3061,
    discountPct: 35,
  },
  {
    id: 'jumia-rv-phone-camera-lens',
    name: '2 Functions Mobile Phone Lens 0.45X Wide Angle Len & 12.5X Macro HD Camera Lens Universal for iPhone Android Phone',
    price: 7765,
    compareAtPrice: 14014,
    image: 'https://images.unsplash.com/photo-1512790182412-b19e6d62bc39?w=600&q=80',
    storeName: 'Pouch Villa',
    organizationId: 'pouchvilla-calabar',
    categoryName: 'Gadget Accessories',
    rating: 4.2,
    reviewsCount: 189,
    discountPct: 45,
  },
  {
    id: 'jumia-rv-gameboy-r36s',
    name: 'Game Boy R36S Ultra Handheld Gaming Console 5000mah Endurance 3.5 Inch Video Portable Game Player 20000+ Simulator Classic Games, 64G TF Card 5G Wifi',
    price: 44800,
    compareAtPrice: 87000,
    image: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=600&q=80',
    storeName: 'CyGroup Tech',
    organizationId: 'cygroup-calabar',
    categoryName: 'Gaming & Gadgets',
    rating: 4.5,
    reviewsCount: 24,
    discountPct: 49,
  },
];

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
