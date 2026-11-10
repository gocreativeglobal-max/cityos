'use client';

import React, { useState } from 'react';
import {
  MessageCircle,
  Search,
  ArrowRight,
  ShieldCheck,
  Clock,
  PackageSearch,
  MapPin,
} from 'lucide-react';
import ProductSourcingModal from '@/components/cityos/ProductSourcingModal';
import { cn } from '@/lib/utils';

export interface ProductSourcingBannerProps {
  searchQuery?: string;
  className?: string;
  variant?: 'empty-state' | 'shelf' | 'compact';
}

export default function ProductSourcingBanner({
  searchQuery = '',
  className,
  variant = 'shelf',
}: ProductSourcingBannerProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [typedQuery, setTypedQuery] = useState(searchQuery);

  const handleOpenModal = (queryToUse?: string) => {
    if (queryToUse !== undefined) {
      setTypedQuery(queryToUse);
    }
    setIsModalOpen(true);
  };

  const handleQuickSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!typedQuery.trim()) return;

    const message = [
      '*PRODUCT SOURCING INQUIRY — 9jaLive Calabar*',
      '────────────────────────────',
      `*Item Requested:* ${typedQuery.trim()}`,
      '*City:* Calabar',
      '*Inquiry Channel:* CityMart Search',
      '────────────────────────────',
      'Hello 9jaLive Team,',
      'I am looking for this product in Calabar and could not find it listed in the catalog.',
      'Please check availability with verified stores and let me know current pricing.',
    ].join('\n');

    const waUrl = `https://wa.me/2348065373747?text=${encodeURIComponent(message)}`;
    window.open(waUrl, '_blank', 'noopener,noreferrer');
  };

  // 1. EMPTY STATE VARIANT (When zero search results)
  if (variant === 'empty-state') {
    return (
      <>
        <div
          className={cn(
            'relative overflow-hidden rounded-2xl bg-slate-900 p-6 sm:p-8 text-white shadow-lg border border-slate-800',
            className
          )}
        >
          <div className="relative z-10 max-w-xl mx-auto text-center space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-slate-300 text-xs font-semibold">
              <PackageSearch className="w-3.5 h-3.5 text-emerald-400" />
              <span>9jaLive Sourcing Desk</span>
              <span className="text-slate-500">•</span>
              <span className="text-emerald-400 flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                Calabar
              </span>
            </div>

            <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight">
              {searchQuery ? (
                <>
                  Can&apos;t find &ldquo;<span className="text-emerald-400">{searchQuery}</span>&rdquo; in Calabar stores?
                </>
              ) : (
                <>Looking for an item not currently listed?</>
              )}
            </h3>

            <p className="text-xs sm:text-sm text-slate-300 font-normal leading-relaxed max-w-md mx-auto">
              Our team assists buyers in locating hard-to-find products. We check inventory across verified merchants in Calabar and provide confirmed availability and pricing.
            </p>

            {/* Quick Sourcing Bar */}
            <form onSubmit={handleQuickSubmit} className="pt-1 max-w-md mx-auto flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={typedQuery}
                  onChange={(e) => setTypedQuery(e.target.value)}
                  placeholder={searchQuery || "Type the product name or model..."}
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-xs sm:text-sm text-white placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                />
              </div>
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm active:scale-95 transition-all shrink-0"
              >
                <MessageCircle className="w-4 h-4 fill-white" />
                <span>Inquire on WhatsApp</span>
              </button>
            </form>

            {/* Modal Link & Contact */}
            <div className="pt-2 flex items-center justify-center gap-4 text-xs text-slate-400">
              <button
                type="button"
                onClick={() => handleOpenModal(searchQuery)}
                className="hover:text-emerald-300 underline font-medium flex items-center gap-1 transition-colors"
              >
                <span>Add specific condition &amp; budget</span>
                <ArrowRight className="w-3 h-3" />
              </button>
              <span>•</span>
              <span className="flex items-center gap-1 text-slate-300 font-medium">
                <span>Desk Hotline: +234 806 537 3747</span>
              </span>
            </div>
          </div>
        </div>

        <ProductSourcingModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          initialQuery={typedQuery || searchQuery}
          sourceContext="Zero Search Results"
        />
      </>
    );
  }

  // 2. SHELF / PERSISTENT BANNER VARIANT (Placed in market feed)
  return (
    <>
      <div
        className={cn(
          'relative overflow-hidden rounded-2xl bg-slate-900 text-white p-5 sm:p-6 shadow-md border border-slate-800',
          className
        )}
      >
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
          <div className="space-y-1.5 max-w-xl">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 text-[10px] uppercase font-bold tracking-wider bg-slate-800 text-slate-300 border border-slate-700 px-2.5 py-0.5 rounded-md">
                <PackageSearch className="w-3.5 h-3.5 text-emerald-400" />
                9jaLive Sourcing Desk
              </span>
              <span className="text-[11px] font-medium text-slate-400 flex items-center gap-1">
                <MapPin className="w-3 h-3 text-emerald-400" />
                Calabar
              </span>
            </div>

            <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
              Can&apos;t find what you&apos;re looking for in Calabar stores?
            </h3>

            <p className="text-xs text-slate-300 font-normal leading-relaxed">
              If an item is unlisted or temporarily out of stock, our sourcing desk assists you in finding it across verified local merchants in Calabar.
            </p>

            <div className="flex items-center gap-4 text-[11px] text-slate-400 pt-1">
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Verified Local Merchants</span>
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-emerald-400" />
                <span>Direct WhatsApp Support</span>
              </span>
            </div>
          </div>

          <div className="shrink-0 flex items-center gap-2.5 w-full md:w-auto">
            <button
              onClick={() => handleOpenModal()}
              className="w-full md:w-auto px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm active:scale-95 transition-all"
            >
              <MessageCircle className="w-4 h-4 fill-white" />
              <span>Request an Item (+234 806 537 3747)</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <ProductSourcingModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        initialQuery={typedQuery}
        sourceContext="Marketplace Bottom Banner"
      />
    </>
  );
}
