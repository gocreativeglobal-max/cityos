'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Clock, ShoppingBag } from 'lucide-react';
import RecentlyViewedSection from '@/components/cityos/RecentlyViewedSection';
import ChowdeckBasketDock from '@/components/cityos/delivery/ChowdeckBasketDock';

export default function RecentlyViewedPage() {
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

      {/* Main Full Recently Viewed Section */}
      <RecentlyViewedSection
        title="Browsing History"
        maxItems={30}
        showClear={true}
        className="p-6"
      />

      <ChowdeckBasketDock label="Checkout" />
    </div>
  );
}
