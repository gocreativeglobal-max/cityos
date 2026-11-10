'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Clock, ShoppingBag, Eye, Store } from 'lucide-react';
import RecentlyViewedSection from '@/components/cityos/RecentlyViewedSection';
import ChowdeckBasketDock from '@/components/cityos/delivery/ChowdeckBasketDock';
import { getRecentlyViewedProducts } from '@/lib/recently-viewed';

export default function RecentlyViewedPage() {
  const [hasItems, setHasItems] = useState<boolean | null>(null);

  useEffect(() => {
    const checkItems = () => {
      const items = getRecentlyViewedProducts(1);
      setHasItems(items.length > 0);
    };

    checkItems();
    window.addEventListener('cityos:recently-viewed-updated', checkItems);
    return () => {
      window.removeEventListener('cityos:recently-viewed-updated', checkItems);
    };
  }, []);

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6 pb-24">
      {/* Header Breadcrumb */}
      <div className="flex items-center justify-between">
        <Link
          href="/market"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-emerald-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to CityMart</span>
        </Link>
        <Link
          href="/cart"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-orange-600 hover:underline"
        >
          <ShoppingBag className="w-4 h-4" />
          <span>View Cart</span>
        </Link>
      </div>

      <div className="space-y-1">
        <h1 className="text-xl md:text-2xl font-black text-slate-900 flex items-center gap-2">
          <Clock className="w-5 h-5 text-orange-600" />
          Recently Viewed Items
        </h1>
        <p className="text-xs text-slate-500 font-medium">
          Products and deals you have browsed recently across authorized Calabar stores
        </p>
      </div>

      {/* Main Full Recently Viewed Section or Empty State */}
      {hasItems === false ? (
        <div className="bg-white rounded-2xl border border-slate-200/90 p-8 md:p-12 text-center space-y-4 shadow-xs">
          <div className="w-14 h-14 rounded-2xl bg-orange-50 border border-orange-200 text-orange-600 mx-auto flex items-center justify-center">
            <Eye className="w-7 h-7" />
          </div>
          <div className="space-y-1 max-w-sm mx-auto">
            <h2 className="text-base font-black text-slate-900">
              No recently viewed items yet
            </h2>
            <p className="text-xs text-slate-500">
              As you browse products across Calabar stores, the items you view will automatically appear here for quick access.
            </p>
          </div>
          <Link
            href="/market"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-xs transition-colors"
          >
            <Store className="w-4 h-4" />
            <span>Explore CityMart</span>
          </Link>
        </div>
      ) : (
        <RecentlyViewedSection
          title="Browsing History"
          maxItems={30}
          showClear={true}
          className="p-6"
        />
      )}

      <ChowdeckBasketDock label="Checkout" />
    </div>
  );
}
