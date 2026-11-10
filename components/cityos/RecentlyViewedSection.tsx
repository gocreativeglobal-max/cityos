'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  Clock,
  ChevronRight,
  ChevronLeft,
  Star,
  ShoppingCart,
  Trash2,
  Check,
  Eye,
  X,
} from 'lucide-react';
import {
  RecentlyViewedItem,
  getRecentlyViewedProducts,
  clearRecentlyViewedProducts,
  removeRecentlyViewedProduct,
} from '@/lib/recently-viewed';
import { FallbackImg } from '@/components/cityos/CityUI';
import { useMoney } from '@/components/cityos/CityProvider';
import { useCart } from '@/components/cityos/CartStore';
import { cn } from '@/lib/utils';

interface RecentlyViewedSectionProps {
  currentProductId?: string;
  className?: string;
  title?: string;
  showClear?: boolean;
  maxItems?: number;
}

export default function RecentlyViewedSection({
  currentProductId,
  className,
  title = 'Recently viewed',
  showClear = true,
  maxItems = 12,
}: RecentlyViewedSectionProps) {
  const { fmt } = useMoney();
  const { add } = useCart();
  const scrollRef = useRef<HTMLDivElement>(null);

  const [items, setItems] = useState<RecentlyViewedItem[]>([]);
  const [mounted, setMounted] = useState(false);
  const [addedIds, setAddedIds] = useState<Record<string, boolean>>({});
  const [isSeeAllOpen, setIsSeeAllOpen] = useState(false);

  // Load from localStorage on client mount
  useEffect(() => {
    setMounted(true);
    const loadItems = () => {
      let stored = getRecentlyViewedProducts(maxItems * 2);
      // Filter out the product currently being viewed
      if (currentProductId) {
        stored = stored.filter((item) => item.id !== currentProductId);
      }
      setItems(stored.slice(0, maxItems));
    };

    loadItems();

    // Listen to real-time additions from any product page
    const handleUpdate = () => {
      loadItems();
    };

    window.addEventListener('cityos:recently-viewed-updated', handleUpdate);
    return () => {
      window.removeEventListener('cityos:recently-viewed-updated', handleUpdate);
    };
  }, [currentProductId, maxItems]);

  const handleScroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const offset = direction === 'left' ? -340 : 340;
      scrollRef.current.scrollBy({ left: offset, behavior: 'smooth' });
    }
  };

  const handleAddToCart = (e: React.MouseEvent, item: RecentlyViewedItem) => {
    e.preventDefault();
    e.stopPropagation();

    const resolvedImg = item.image || item.imageUrl || undefined;

    add({
      kind: 'retail',
      productId: item.id,
      name: item.name,
      price: item.price,
      qty: 1,
      image: resolvedImg,
      orgId: item.organizationId || 'cygroup-calabar',
      orgName: item.storeName || 'Store',
    });

    setAddedIds((prev) => ({ ...prev, [item.id]: true }));
    setTimeout(() => {
      setAddedIds((prev) => ({ ...prev, [item.id]: false }));
    }, 2000);
  };

  const handleClear = () => {
    if (confirm('Clear your recently viewed items?')) {
      clearRecentlyViewedProducts();
      setItems([]);
    }
  };

  const handleRemoveOne = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    removeRecentlyViewedProduct(id);
    setItems((prev) => prev.filter((p) => p.id !== id));
  };

  if (!mounted || items.length === 0) {
    return null;
  }

  return (
    <section className={cn('bg-white rounded-2xl border border-slate-200/90 p-4 md:p-5 shadow-xs space-y-4', className)}>
      {/* SECTION HEADER (Jumia Exact Pattern) */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-orange-50 border border-orange-200/70 flex items-center justify-center text-orange-600">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm md:text-base font-black text-slate-900 tracking-tight">
              {title}
            </h2>
            <p className="text-[11px] text-slate-500 font-medium hidden sm:block">
              Based on your browsing history
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Scroll Navigation Arrows (Desktop) */}
          <div className="hidden md:flex items-center gap-1">
            <button
              onClick={() => handleScroll('left')}
              className="w-7 h-7 rounded-lg border border-slate-200 hover:bg-slate-50 flex items-center justify-center text-slate-600 transition-colors shadow-2xs"
              title="Scroll left"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleScroll('right')}
              className="w-7 h-7 rounded-lg border border-slate-200 hover:bg-slate-50 flex items-center justify-center text-slate-600 transition-colors shadow-2xs"
              title="Scroll right"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {showClear && (
            <button
              onClick={handleClear}
              className="text-xs text-slate-400 hover:text-rose-600 transition-colors flex items-center gap-1 font-semibold"
              title="Clear all recently viewed items"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Clear</span>
            </button>
          )}

          {/* See All Action */}
          <button
            onClick={() => setIsSeeAllOpen(true)}
            className="text-xs font-bold text-orange-600 hover:text-orange-700 hover:underline flex items-center gap-1 uppercase tracking-wider"
          >
            <span>See All</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* HORIZONTAL CAROUSEL (JUMIA STYLE) */}
      <div
        ref={scrollRef}
        className="flex gap-3 overflow-x-auto pb-2 scrollbar-none snap-x scroll-smooth -mx-1 px-1"
      >
        {items.map((item) => {
          const isAdded = Boolean(addedIds[item.id]);
          const discountPct =
            item.discountPct ??
            (item.compareAtPrice && item.compareAtPrice > item.price
              ? Math.round(((item.compareAtPrice - item.price) / item.compareAtPrice) * 100)
              : 0);

          let resolvedImg = item.image || item.imageUrl;
          if (item.imageAssetId?.startsWith('[')) {
            try {
              const parsed = JSON.parse(item.imageAssetId);
              if (Array.isArray(parsed) && parsed[0]) resolvedImg = parsed[0];
            } catch {}
          } else if (item.imageAssetId) {
            resolvedImg = item.imageAssetId;
          }

          return (
            <div
              key={item.id}
              className="group relative flex-none w-[160px] sm:w-[185px] bg-white rounded-xl border border-slate-200 hover:border-slate-300 hover:shadow-md transition-all duration-200 snap-start flex flex-col justify-between overflow-hidden p-2.5"
            >
              <Link href={`/product/${item.id}`} className="block flex-1">
                {/* Product Image Container */}
                <div className="relative aspect-square w-full rounded-lg bg-slate-50 flex items-center justify-center p-2 mb-2 overflow-hidden border border-slate-100">
                  <FallbackImg
                    src={resolvedImg}
                    alt={item.name}
                    className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                  />

                  {/* Jumia Red/Orange Discount Tag (-XX%) */}
                  {discountPct > 0 && (
                    <span className="absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded-md bg-rose-600 text-white text-[10px] font-black uppercase tracking-wider shadow-xs">
                      -{discountPct}%
                    </span>
                  )}

                  <button
                    onClick={(e) => handleRemoveOne(e, item.id)}
                    className="absolute top-1.5 left-1.5 w-6 h-6 rounded-full bg-white/90 hover:bg-rose-50 hover:text-rose-600 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center shadow-xs"
                    title="Remove from history"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>

                {/* Title */}
                <h3 className="text-xs font-semibold text-slate-800 line-clamp-2 leading-snug group-hover:text-orange-600 transition-colors min-h-[32px]">
                  {item.name}
                </h3>

                {/* Rating Row (Jumia Exact: Star + Score + (Count)) */}
                {item.rating ? (
                  <div className="flex items-center gap-1 mt-1 text-[11px] font-semibold text-slate-700">
                    <Star className="w-3 h-3 fill-amber-400 text-amber-400 shrink-0" />
                    <span>{item.rating.toFixed(1)}</span>
                    {item.reviewsCount && (
                      <span className="text-slate-400 text-[10px]">({item.reviewsCount})</span>
                    )}
                  </div>
                ) : (
                  <div className="h-4" />
                )}

                {/* Price Row */}
                <div className="mt-1.5 leading-tight">
                  <div className="text-xs sm:text-sm font-black text-slate-950">
                    {fmt(item.price)}
                  </div>
                  {item.compareAtPrice && item.compareAtPrice > item.price ? (
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-[10px] text-slate-400 line-through font-semibold">
                        {fmt(item.compareAtPrice)}
                      </span>
                      {discountPct > 0 && (
                        <span className="text-[10px] font-bold text-rose-600 sm:hidden">
                          -{discountPct}%
                        </span>
                      )}
                    </div>
                  ) : (
                    <div className="h-3" />
                  )}
                </div>
              </Link>

              {/* Quick Add to Cart Button */}
              <div className="mt-2.5 pt-2 border-t border-slate-100">
                <button
                  onClick={(e) => handleAddToCart(e, item)}
                  className={cn(
                    'w-full py-1.5 px-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-2xs',
                    isAdded
                      ? 'bg-emerald-600 text-white'
                      : 'bg-orange-50 hover:bg-orange-600 text-orange-700 hover:text-white border border-orange-200/80 hover:border-orange-600'
                  )}
                >
                  {isAdded ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Added</span>
                    </>
                  ) : (
                    <>
                      <ShoppingCart className="w-3.5 h-3.5" />
                      <span>Add to Cart</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* "SEE ALL" FULL MODAL / DRAWER */}
      {isSeeAllOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[85vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
            {/* Modal Header */}
            <div className="p-4 md:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    All Recently Viewed Items ({items.length})
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    Easily access and re-order products you previously browsed
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    handleClear();
                    setIsSeeAllOpen(false);
                  }}
                  className="px-3 py-1.5 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-bold transition-colors"
                >
                  Clear History
                </button>
                <button
                  onClick={() => setIsSeeAllOpen(false)}
                  className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Modal Grid */}
            <div className="p-4 md:p-6 overflow-y-auto flex-1">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {items.map((item) => {
                  const isAdded = Boolean(addedIds[item.id]);
                  const discountPct =
                    item.discountPct ??
                    (item.compareAtPrice && item.compareAtPrice > item.price
                      ? Math.round(((item.compareAtPrice - item.price) / item.compareAtPrice) * 100)
                      : 0);

                  let resolvedImg = item.image || item.imageUrl;
                  if (item.imageAssetId?.startsWith('[')) {
                    try {
                      const parsed = JSON.parse(item.imageAssetId);
                      if (Array.isArray(parsed) && parsed[0]) resolvedImg = parsed[0];
                    } catch {}
                  } else if (item.imageAssetId) {
                    resolvedImg = item.imageAssetId;
                  }

                  return (
                    <div
                      key={item.id}
                      className="group bg-white rounded-xl border border-slate-200 p-3 hover:shadow-md transition-all flex flex-col justify-between"
                    >
                      <Link
                        href={`/product/${item.id}`}
                        onClick={() => setIsSeeAllOpen(false)}
                        className="block flex-1"
                      >
                        <div className="relative aspect-square w-full rounded-lg bg-slate-50 flex items-center justify-center p-2 mb-2 overflow-hidden border border-slate-100">
                          <FallbackImg
                            src={resolvedImg}
                            alt={item.name}
                            className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                          />
                          {discountPct > 0 && (
                            <span className="absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded-md bg-rose-600 text-white text-[10px] font-black uppercase tracking-wider">
                              -{discountPct}%
                            </span>
                          )}
                        </div>

                        <h4 className="text-xs font-semibold text-slate-800 line-clamp-2 leading-snug group-hover:text-orange-600 transition-colors min-h-[32px]">
                          {item.name}
                        </h4>

                        {item.rating && (
                          <div className="flex items-center gap-1 mt-1 text-[11px] font-semibold text-slate-700">
                            <Star className="w-3 h-3 fill-amber-400 text-amber-400 shrink-0" />
                            <span>{item.rating.toFixed(1)}</span>
                            {item.reviewsCount && (
                              <span className="text-slate-400 text-[10px]">({item.reviewsCount})</span>
                            )}
                          </div>
                        )}

                        <div className="mt-1.5">
                          <div className="text-sm font-black text-slate-950">
                            {fmt(item.price)}
                          </div>
                          {item.compareAtPrice && item.compareAtPrice > item.price && (
                            <div className="text-[10px] text-slate-400 line-through font-semibold">
                              {fmt(item.compareAtPrice)}
                            </div>
                          )}
                        </div>
                      </Link>

                      <button
                        onClick={(e) => handleAddToCart(e, item)}
                        className={cn(
                          'mt-2.5 w-full py-1.5 px-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-2xs',
                          isAdded
                            ? 'bg-emerald-600 text-white'
                            : 'bg-orange-50 hover:bg-orange-600 text-orange-700 hover:text-white border border-orange-200/80 hover:border-orange-600'
                        )}
                      >
                        {isAdded ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>Added</span>
                          </>
                        ) : (
                          <>
                            <ShoppingCart className="w-3.5 h-3.5" />
                            <span>Add to Cart</span>
                          </>
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
