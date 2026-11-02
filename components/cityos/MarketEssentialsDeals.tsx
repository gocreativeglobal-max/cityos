'use client';

import {
  Smartphone,
  Laptop,
  Tv,
  ShoppingBasket,
  Shirt,
  Footprints,
  Baby,
  Home,
  Armchair,
  Headphones,
  Sparkles,
  ArrowRight,
  Flame,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface EssentialDealItem {
  id: string;
  title: string;
  subtitle: string;
  categoryId?: string;
  searchKeyword?: string;
  icon: any;
  colorScheme: {
    bg: string;
    border: string;
    iconBg: string;
    iconColor: string;
    badgeBg: string;
    badgeText: string;
  };
}

export const ESSENTIAL_DEALS_DATA: EssentialDealItem[] = [
  {
    id: 'phones-tablets',
    title: 'Phones & Tablets',
    subtitle: 'Deals made for you',
    categoryId: 'phones-iphones-tablets',
    icon: Smartphone,
    colorScheme: {
      bg: 'hover:border-orange-300 hover:bg-orange-50/40',
      border: 'border-slate-200/90',
      iconBg: 'bg-orange-100/80',
      iconColor: 'text-orange-600',
      badgeBg: 'bg-orange-100/70',
      badgeText: 'text-orange-700',
    },
  },
  {
    id: 'appliances-deals',
    title: 'Appliances Deals',
    subtitle: 'Deals made for you',
    categoryId: 'home-kitchen-appliances',
    searchKeyword: 'appliances',
    icon: Home,
    colorScheme: {
      bg: 'hover:border-teal-300 hover:bg-teal-50/40',
      border: 'border-slate-200/90',
      iconBg: 'bg-teal-100/80',
      iconColor: 'text-teal-600',
      badgeBg: 'bg-teal-100/70',
      badgeText: 'text-teal-700',
    },
  },
  {
    id: 'kids-baby-more',
    title: 'Kids, Baby And More',
    subtitle: 'Deals made for you',
    categoryId: 'baby-kids-toys',
    icon: Baby,
    colorScheme: {
      bg: 'hover:border-amber-300 hover:bg-amber-50/40',
      border: 'border-slate-200/90',
      iconBg: 'bg-amber-100/80',
      iconColor: 'text-amber-600',
      badgeBg: 'bg-amber-100/70',
      badgeText: 'text-amber-700',
    },
  },
  {
    id: 'fashion-deals',
    title: 'Fashion Deals',
    subtitle: 'Deals made for you',
    categoryId: 'fashion-shoes-accessories',
    icon: Shirt,
    colorScheme: {
      bg: 'hover:border-rose-300 hover:bg-rose-50/40',
      border: 'border-slate-200/90',
      iconBg: 'bg-rose-100/80',
      iconColor: 'text-rose-600',
      badgeBg: 'bg-rose-100/70',
      badgeText: 'text-rose-700',
    },
  },
  {
    id: 'sneakers-deals',
    title: 'Sneakers Deals',
    subtitle: 'Deals made for you',
    categoryId: 'fashion-shoes-accessories',
    searchKeyword: 'sneakers',
    icon: Footprints,
    colorScheme: {
      bg: 'hover:border-red-300 hover:bg-red-50/40',
      border: 'border-slate-200/90',
      iconBg: 'bg-red-100/80',
      iconColor: 'text-red-600',
      badgeBg: 'bg-red-100/70',
      badgeText: 'text-red-700',
    },
  },
  {
    id: 'home-office-deals',
    title: 'Home & Office Deals',
    subtitle: 'Deals made for you',
    categoryId: 'home-kitchen-appliances',
    searchKeyword: 'office',
    icon: Armchair,
    colorScheme: {
      bg: 'hover:border-indigo-300 hover:bg-indigo-50/40',
      border: 'border-slate-200/90',
      iconBg: 'bg-indigo-100/80',
      iconColor: 'text-indigo-600',
      badgeBg: 'bg-indigo-100/70',
      badgeText: 'text-indigo-700',
    },
  },
  {
    id: 'television-deals',
    title: 'Television Deals',
    subtitle: 'Deals made for you',
    categoryId: 'home-kitchen-appliances',
    searchKeyword: 'tv',
    icon: Tv,
    colorScheme: {
      bg: 'hover:border-sky-300 hover:bg-sky-50/40',
      border: 'border-slate-200/90',
      iconBg: 'bg-sky-100/80',
      iconColor: 'text-sky-600',
      badgeBg: 'bg-sky-100/70',
      badgeText: 'text-sky-700',
    },
  },
  {
    id: 'supermarket-deals',
    title: 'Supermarket Deals',
    subtitle: 'Deals made for you',
    categoryId: 'supermarket-groceries',
    icon: ShoppingBasket,
    colorScheme: {
      bg: 'hover:border-emerald-300 hover:bg-emerald-50/40',
      border: 'border-slate-200/90',
      iconBg: 'bg-emerald-100/80',
      iconColor: 'text-emerald-600',
      badgeBg: 'bg-emerald-100/70',
      badgeText: 'text-emerald-700',
    },
  },
  {
    id: 'mobile-accessories-deals',
    title: 'Mobile Accessories Deals',
    subtitle: 'Deals made for you',
    categoryId: 'fast-chargers-cables-extensions',
    searchKeyword: 'accessories',
    icon: Headphones,
    colorScheme: {
      bg: 'hover:border-purple-300 hover:bg-purple-50/40',
      border: 'border-slate-200/90',
      iconBg: 'bg-purple-100/80',
      iconColor: 'text-purple-600',
      badgeBg: 'bg-purple-100/70',
      badgeText: 'text-purple-700',
    },
  },
  {
    id: 'computing-deals',
    title: 'Computing Deals',
    subtitle: 'Deals made for you',
    categoryId: 'laptops-macbooks-monitors',
    icon: Laptop,
    colorScheme: {
      bg: 'hover:border-blue-300 hover:bg-blue-50/40',
      border: 'border-slate-200/90',
      iconBg: 'bg-blue-100/80',
      iconColor: 'text-blue-600',
      badgeBg: 'bg-blue-100/70',
      badgeText: 'text-blue-700',
    },
  },
  {
    id: 'beauty-must-have',
    title: 'Beauty Must Have',
    subtitle: 'Deals made for you',
    categoryId: 'health-beauty-personal-care',
    icon: Sparkles,
    colorScheme: {
      bg: 'hover:border-pink-300 hover:bg-pink-50/40',
      border: 'border-slate-200/90',
      iconBg: 'bg-pink-100/80',
      iconColor: 'text-pink-600',
      badgeBg: 'bg-pink-100/70',
      badgeText: 'text-pink-700',
    },
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
  const handleClick = (item: EssentialDealItem) => {
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
    <section className={cn('space-y-3.5', className)} aria-label="Essentials & Deals">
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
          Hand-picked offers from top local merchants
        </p>
      </div>

      {/* Grid of Deal Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5 sm:gap-3">
        {ESSENTIAL_DEALS_DATA.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => handleClick(item)}
              className={cn(
                'group relative flex flex-col justify-between p-3 sm:p-3.5 rounded-2xl bg-white border text-left transition-all duration-200 cursor-pointer shadow-xs hover:shadow-md hover:-translate-y-0.5 active:scale-[0.98]',
                item.colorScheme.border,
                item.colorScheme.bg
              )}
            >
              {/* Top row: Icon + Arrow */}
              <div className="flex items-start justify-between gap-2 mb-2.5">
                <div
                  className={cn(
                    'w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110',
                    item.colorScheme.iconBg,
                    item.colorScheme.iconColor
                  )}
                >
                  <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-slate-900 group-hover:text-white transition-all shrink-0">
                  <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>

              {/* Text Info */}
              <div className="space-y-1">
                <h3 className="text-xs sm:text-sm font-bold text-slate-900 line-clamp-2 group-hover:text-slate-950 leading-snug">
                  {item.title}
                </h3>
                <span
                  className={cn(
                    'inline-block px-1.5 py-0.5 rounded-md text-[10px] font-bold tracking-tight',
                    item.colorScheme.badgeBg,
                    item.colorScheme.badgeText
                  )}
                >
                  {item.subtitle}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
