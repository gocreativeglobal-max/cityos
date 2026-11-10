'use client';

import React, { useState } from 'react';
import {
  MessageCircle,
  Sparkles,
  Search,
  ArrowRight,
  ShieldCheck,
  MapPin,
  Clock,
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
      '🛍️ *PRODUCT SOURCING REQUEST — 9jaLive Calabar*',
      '━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
      `*Item Needed:* ${typedQuery.trim()}`,
      '*City / Area:* Calabar',
      '*Requested via:* CityMart Sourcing Concierge',
      '━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
      'Hello 9jaLive team, I was searching on CityMart and couldn’t find this product.',
      'Please check local sellers across Calabar and send me availability & price options!',
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
            'relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950 p-6 sm:p-8 text-white shadow-xl border border-emerald-500/20',
            className
          )}
        >
          {/* Subtle Background Glow */}
          <div className="absolute top-0 right-0 -mt-12 -mr-12 w-64 h-64 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-2xl mx-auto text-center space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>9jaLive Calabar Personal Shopper</span>
            </div>

            <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              {searchQuery ? (
                <>
                  Can't find &ldquo;<span className="text-emerald-400">{searchQuery}</span>&rdquo; in the catalog?
                </>
              ) : (
                <>Looking for an item that isn't listed here?</>
              )}
            </h3>

            <p className="text-xs sm:text-sm text-slate-300 font-medium leading-relaxed max-w-lg mx-auto">
              Don&apos;t worry! <strong>9jaLive</strong> has scouts on the ground across Calabar (Marian, Watt Market, Bedwell, Bogobiri). We will find it, negotiate wholesale prices, and arrange doorstep delivery.
            </p>

            {/* Quick Sourcing Bar */}
            <form onSubmit={handleQuickSubmit} className="pt-2 max-w-md mx-auto flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={typedQuery}
                  onChange={(e) => setTypedQuery(e.target.value)}
                  placeholder={searchQuery || "Type the exact product you need..."}
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-xs sm:text-sm text-white placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                />
              </div>
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-md shadow-emerald-500/20 active:scale-95 transition-all shrink-0"
              >
                <MessageCircle className="w-4 h-4 fill-slate-950" />
                <span>Source via WhatsApp</span>
              </button>
            </form>

            {/* Extra Options Button */}
            <div className="pt-1 flex items-center justify-center gap-4 text-[11px] text-slate-400">
              <button
                type="button"
                onClick={() => handleOpenModal(searchQuery)}
                className="hover:text-emerald-300 underline font-semibold flex items-center gap-1 transition-colors"
              >
                <span>Add specific budget &amp; condition details</span>
                <ArrowRight className="w-3 h-3" />
              </button>
              <span>•</span>
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3 text-emerald-400" />
                <span>Hotline: +2348065373747</span>
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

  // 2. SHELF / PERSISTENT BANNER VARIANT (Placed at bottom of market or shelves)
  return (
    <>
      <div
        className={cn(
          'relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white p-5 sm:p-6 shadow-md border border-emerald-500/20',
          className
        )}
      >
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
          <div className="space-y-1.5 max-w-xl">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 text-[10px] uppercase font-black tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 px-2 py-0.5 rounded-full">
                <Sparkles className="w-3 h-3 text-emerald-400" /> 9jaLive Sourcing Desk
              </span>
              <span className="text-[11px] font-semibold text-emerald-200">
                Calabar On-Demand Procurement
              </span>
            </div>

            <h3 className="text-base sm:text-lg font-black text-white tracking-tight">
              Can&apos;t find what you&apos;re looking for in Calabar stores?
            </h3>

            <p className="text-xs text-slate-300 font-medium leading-relaxed">
              If an item is out of stock or unlisted, 9jaLive personal shoppers contact verified wholesalers &amp; boutiques across Calabar to locate it, inspect condition, and deliver to you.
            </p>

            <div className="flex items-center gap-4 text-[11px] text-emerald-300/80 pt-1">
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Verified Local Sellers</span>
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-emerald-400" />
                <span>Rapid WhatsApp Response</span>
              </span>
            </div>
          </div>

          <div className="shrink-0 flex items-center gap-2.5 w-full md:w-auto">
            <button
              onClick={() => handleOpenModal()}
              className="w-full md:w-auto px-5 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 active:scale-95 transition-all"
            >
              <MessageCircle className="w-4.5 h-4.5 fill-slate-950" />
              <span>Tell Us What You Need (+2348065373747)</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <ProductSourcingModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        initialQuery={typedQuery}
        sourceContext="Marketplace Bottom Concierge"
      />
    </>
  );
}
