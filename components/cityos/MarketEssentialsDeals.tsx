'use client';

import Image from 'next/image';
import { ArrowRight, Flame, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface EssentialCategoryItem {
  id: string;
  title: string;
  subtitle: string;
  image: string;
  alt: string;
  categoryId?: string;
  searchKeyword?: string;
  badge?: string;
}

/**
 * The 5 Core Essentials Categories configured from public/images/categories/
 */
export const ESSENTIAL_CATEGORIES_DATA: EssentialCategoryItem[] = [
  {
    id: 'mobile-phones',
    title: 'Phones & Tablets',
    subtitle: 'Deals made for you',
    badge: 'Popular',
    image: '/images/categories/mobile-phones.jpg',
    alt: 'Phones & Tablets',
    categoryId: 'phones-iphones-tablets',
  },
  {
    id: 'electronics',
    title: 'Electronics & Gadgets',
    subtitle: 'Deals made for you',
    badge: 'Best Deals',
    image: '/images/categories/electronics.jpg',
    alt: 'Electronics & Gadgets',
    searchKeyword: 'electronics',
  },
  {
    id: 'agriculture-food',
    title: 'Food & Groceries',
    subtitle: 'Deals made for you',
    badge: 'Fresh',
    image: '/images/categories/agriculture-food.jpg',
    alt: 'Agriculture, Food & Groceries',
    categoryId: 'supermarket-groceries',
  },
  {
    id: 'fashion',
    title: 'Fashion & Apparel',
    subtitle: 'Deals made for you',
    badge: 'Trending',
    image: '/images/categories/fashion.jpg',
    alt: 'Fashion & Apparel',
    categoryId: 'fashion-shoes-accessories',
  },
  {
    id: 'health-beauty',
    title: 'Health & Beauty',
    subtitle: 'Deals made for you',
    badge: 'Verified',
    image: '/images/categories/health-beauty-clean.jpg',
    alt: 'Health & Beauty',
    categoryId: 'health-beauty-personal-care',
  },
];

export interface MarketEssentialsDealsProps {
  onSelectCategory?: (categoryId: string) => void;
  onSearchKeyword?: (keyword: string) => void;
  className?: string;
}

export default function MarketEssentialsDeals({
  onSelectCategory,
  onSearchKeyword,
  className,
}: MarketEssentialsDealsProps) {
  const handleClick = (item: EssentialCategoryItem) => {
    if (item.categoryId && onSelectCategory) {
      onSelectCategory(item.categoryId);
    } else if (item.searchKeyword && onSearchKeyword) {
      onSearchKeyword(item.searchKeyword);
    }

    if (typeof window !== 'undefined') {
      const el = document.getElementById('market-catalog-section');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  return (
    <section className={cn('space-y-3.5', className)} aria-label="Market Essentials">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-1 px-1">
        <div>
          <div className="inline-flex items-center gap-1.5 text-[11px] font-extrabold tracking-wider uppercase text-orange-600">
            <Flame className="w-3.5 h-3.5 fill-orange-500 text-orange-500 animate-pulse" />
            <span>Deals Made For You</span>
          </div>
          <h2 className="text-lg sm:text-xl md:text-2xl font-black tracking-tight text-slate-900 mt-0.5">
            All Your Essentials in One Place
          </h2>
        </div>
        <p className="text-xs font-semibold text-slate-500">
          Curated top categories from verified local merchants
        </p>
      </div>

      {/* Grid of the 5 Category Photo Cards with Footers */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 sm:gap-4">
        {ESSENTIAL_CATEGORIES_DATA.map((item, idx) => (
          <button
            key={item.id}
            type="button"
            onClick={() => handleClick(item)}
            className={cn(
              'group relative flex flex-col rounded-2xl bg-white border border-slate-200/80 overflow-hidden text-left transition-all duration-300 cursor-pointer shadow-2xs hover:shadow-md hover:-translate-y-1 active:scale-[0.98]',
              // On mobile (2-columns), make the 5th item stretch gracefully across both columns if needed
              idx === 4 ? 'col-span-2 sm:col-span-1' : 'col-span-1'
            )}
          >
            {/* Top Photo Container */}
            <div
              className={cn(
                'relative w-full overflow-hidden bg-slate-100',
                idx === 4
                  ? 'aspect-[2.2/1] sm:aspect-square'
                  : 'aspect-square'
              )}
            >
              <Image
                src={item.image}
                alt={item.alt}
                fill
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                className="w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-108"
              />

              {/* Pill badge in top corner */}
              {item.badge && (
                <div className="absolute top-2.5 left-2.5 z-10">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-black/60 text-white backdrop-blur-md shadow-xs">
                    <Sparkles className="w-2.5 h-2.5 text-amber-300" />
                    {item.badge}
                  </span>
                </div>
              )}
            </div>

            {/* Card Footer ("foters") */}
            <div className="p-3 sm:p-3.5 bg-white flex flex-col justify-between flex-1 border-t border-slate-100 gap-1">
              <div className="flex items-center justify-between gap-1.5">
                <h3 className="text-xs sm:text-sm font-extrabold text-slate-900 group-hover:text-orange-600 transition-colors line-clamp-1">
                  {item.title}
                </h3>
                <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-orange-600 group-hover:text-white transition-all shrink-0">
                  <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-[11px] font-medium text-slate-500">
                  {item.subtitle}
                </span>
              </div>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}
