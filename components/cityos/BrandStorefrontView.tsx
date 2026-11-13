'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  Phone,
  MessageSquare,
  Search,
  X,
  SlidersHorizontal,
  Sparkles,
  CheckCircle2,
  ChevronRight,
  Flame,
  ArrowRight,
  Heart,
  Share2,
  PackageCheck,
  ArrowUpRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useMoney } from '@/components/cityos/CityProvider';
import GlovoProductCard, { GlovoProductItem } from '@/components/cityos/delivery/GlovoProductCard';
import ChowdeckBasketDock from '@/components/cityos/delivery/ChowdeckBasketDock';
import { FallbackImg } from '@/components/cityos/CityUI';

interface SubBrandItem {
  id: string;
  name: string;
  icon: string;
  logo?: string;
  tag: string;
  description?: string;
}

const UNILEVER_SUB_BRANDS: SubBrandItem[] = [
  { id: 'all', name: 'All Brands', icon: '✨', tag: 'all', description: 'Complete official Unilever portfolio' },
  { id: 'knorr', name: 'Knorr', icon: '🍲', logo: '/images/brands/unilever/subbrands/knorr.png', tag: 'Knorr', description: 'Flavor-packed seasoning cubes & Jollof mix' },
  { id: 'vaseline', name: 'Vaseline', icon: '🧴', logo: '/images/products/unilever/vaseline-blueseal-original-petroleum-jelly-50ml.jpg', tag: 'Vaseline', description: 'Deep healing petroleum jelly & moisture lotions' },
  { id: 'closeup', name: 'Closeup', icon: '🪥', logo: '/images/products/unilever/closeup-pack-of-8-closeup-175gm.jpg', tag: 'Closeup', description: 'Triple fresh anti-bacterial toothpaste & gels' },
  { id: 'rexona', name: 'Rexona', icon: '🌬️', logo: '/images/brands/unilever/rexona-tile.jpg', tag: 'Rexona', description: '48H non-stop sweat & odor protection' },
  { id: 'pepsodent', name: 'Pepsodent', icon: '🦷', logo: '/images/products/unilever/pepsodent-triple-protection-complete-toothpaste-tw.jpg', tag: 'Pepsodent', description: 'Triple action cavity & enamel protection' },
  { id: 'royco', name: 'Royco', icon: '🍲', logo: '/images/brands/unilever/subbrands/royco.png', tag: 'Royco', description: 'Rich aroma beef & seasoning cubes' },
  { id: 'pears', name: 'Pears', icon: '👶', logo: '/images/brands/unilever/subbrands/pears.png', tag: 'Pears', description: 'Gentle dermatological baby lotion & oils' },
];

const INFINIX_SUB_BRANDS: SubBrandItem[] = [
  { id: 'all', name: 'All Series', icon: '✨', tag: 'all', description: 'Complete official Infinix smartphone & gadget ecosystem' },
  { id: 'gt-series', name: 'GT Gaming', icon: '🎮', logo: '/images/products/infinix/gt-50-pro-512gb.jpg', tag: 'GT Gaming Series', description: 'Ultra gaming flagships with 144Hz & Dimensity' },
  { id: 'zero-series', name: 'Zero Series', icon: '🌟', logo: '/images/products/infinix/zero-flip-512gb.jpg', tag: 'Zero Series', description: 'Zero Flip foldable & 4K vlog photography' },
  { id: 'note-series', name: 'Note Series', icon: '⚡', logo: '/images/products/infinix/note-edge-256gb.jpg', tag: 'Note Series', description: 'Curved AMOLED, 108MP camera & FastCharge' },
  { id: 'hot-series', name: 'Hot Series', icon: '🔥', logo: '/images/products/infinix/hot-70-pro-5g-128gb.jpg', tag: 'Hot Series', description: 'Helio G100 gaming, 120Hz displays & 7000mAh' },
  { id: 'smart-series', name: 'Smart Series', icon: '📱', logo: '/images/products/infinix/smart-20-128gb.jpg', tag: 'Smart Series', description: 'Value champions with big batteries & Dynamic Bar' },
  { id: 'wearables-audio', name: 'Wearables & Audio', icon: '🎧', logo: '/images/products/infinix/xwatch-n4-pro.jpg', tag: 'Wearables & Audio', description: 'AMOLED smartwatches & ANC wireless earbuds' },
  { id: 'power-accessories', name: 'Power & Tech', icon: '🔋', logo: '/images/products/infinix/powerbank-30000mah.jpg', tag: 'Power & Accessories', description: 'High-density fast power banks & accessories' },
];

const UNILEVER_CAMPAIGN_SLIDES = [
  {
    id: 'hero',
    title: 'Unilever Official Flagship Store',
    tagline: '100% Genuine Guaranteed Direct from Manufacturer',
    badge: 'Official Factory Direct',
    image: '/images/brands/unilever/hero-banner.jpg',
    targetBrand: 'all',
  },
  {
    id: 'vaseline',
    title: 'Vaseline Skin Radiance & Deep Moisture',
    tagline: 'Pure Petroleum Jelly & Intensive Care Cocoa Lotions',
    badge: 'Skin Health Deals',
    image: '/images/brands/unilever/vaseline-banner.jpg',
    targetBrand: 'Vaseline',
  },
  {
    id: 'knorr',
    title: 'Knorr Great Flavor & Real Nutrition',
    tagline: 'Authentic Chicken & Beef Cubes for Every Nigerian Dish',
    badge: 'Kitchen Best Sellers',
    image: '/images/brands/unilever/knorr-banner.jpg',
    targetBrand: 'Knorr',
  },
];

const INFINIX_CAMPAIGN_SLIDES = [
  {
    id: 'hero',
    title: 'Infinix Official Flagship Store',
    tagline: '100% Genuine Guaranteed + Official Carlcare Warranty in Calabar',
    badge: 'Carlcare Authorized Hub',
    image: '/images/brands/infinix/hero-banner.jpg',
    targetBrand: 'all',
  },
  {
    id: 'hot70',
    title: 'Infinix Hot 70 Series',
    tagline: 'Ultra Fast Helio G100 Gaming, 120Hz Displays & Long-Lasting Battery',
    badge: 'New Flagship Arrival',
    image: '/images/brands/infinix/hot70-banner.jpg',
    targetBrand: 'Hot Series',
  },
  {
    id: 'smart20',
    title: 'Infinix Smart 20 Series',
    tagline: 'Everyday Champion with 120Hz Display, Dynamic Bar & 5200mAh Power',
    badge: 'Smart Value Pick',
    image: '/images/brands/infinix/smart20-banner.png',
    targetBrand: 'Smart Series',
  },
];

export interface BrandStorefrontViewProps {
  org: any;
  products: any[];
  initialSubBrand?: string;
}

export default function BrandStorefrontView({
  org,
  products = [],
  initialSubBrand = 'all',
}: BrandStorefrontViewProps) {
  const { fmt } = useMoney();
  const isInfinix =
    org?.id === 'infinix-store' ||
    /infinix/i.test(org?.name || '') ||
    org?.metadata?.brandName === 'Infinix';

  const brandName = org?.name || (isInfinix ? 'Infinix Official Store' : 'Unilever Official Store');
  const brandShortName = isInfinix ? 'Infinix' : 'Unilever';
  const brandLogo = org?.logoAssetId || (isInfinix ? '/images/brands/infinix/logo.jpg' : '/images/brands/unilever/logo.svg');
  const subBrandsList = isInfinix ? INFINIX_SUB_BRANDS : UNILEVER_SUB_BRANDS;
  const campaignSlides = isInfinix ? INFINIX_CAMPAIGN_SLIDES : UNILEVER_CAMPAIGN_SLIDES;
  const defaultOrgId = org?.id || (isInfinix ? 'infinix-store' : 'unilever-store');

  const [activeSubBrand, setActiveSubBrand] = useState<string>(initialSubBrand);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [inStockOnly, setInStockOnly] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<'featured' | 'price-asc' | 'price-desc' | 'discount'>('featured');
  const [activeSlideIdx, setActiveSlideIdx] = useState<number>(0);
  const [isFollowing, setIsFollowing] = useState<boolean>(false);
  const [copiedShare, setCopiedShare] = useState<boolean>(false);

  const rawPhone = org?.contactPoints?.find((c: any) => c.type === 'PHONE')?.value || org?.metadata?.phone || '+2348065373747';
  const rawWa = org?.contactPoints?.find((c: any) => c.type === 'WHATSAPP')?.value || org?.metadata?.whatsapp || '2348065373747';
  const whatsappClean = String(rawWa).replace(/[^0-9]/g, '');

  // Auto-rotate hero slider
  useEffect(() => {
    if (campaignSlides.length <= 1) return;
    const timer = setInterval(() => {
      setActiveSlideIdx((prev) => (prev + 1) % campaignSlides.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [campaignSlides.length]);

  // Sync initialSubBrand prop changes
  useEffect(() => {
    if (initialSubBrand) {
      setActiveSubBrand(initialSubBrand);
    }
  }, [initialSubBrand]);

  // Extract categories dynamically
  const categories = useMemo(() => {
    const set = new Set<string>();
    for (const p of products) {
      const cat = p.globalCategory || p.categoryName;
      if (cat) set.add(cat.trim());
    }
    return ['all', ...Array.from(set)];
  }, [products]);

  // Filter products
  const filteredProducts = useMemo(() => {
    let list = products.filter((p) => {
      // Sub-brand / Series filter
      if (activeSubBrand && activeSubBrand !== 'all') {
        const q = activeSubBrand.toLowerCase();
        const brandMatch = (p.brand || '').toLowerCase().includes(q);
        const nameMatch = (p.name || '').toLowerCase().includes(q);
        const catMatch =
          (p.categoryName || '').toLowerCase().includes(q) ||
          (p.globalCategory || '').toLowerCase().includes(q);
        const tagWords = q.split(/\s+/).filter((w) => w.length > 2 && w !== 'series');
        const wordMatch = tagWords.some(
          (w) =>
            (p.name || '').toLowerCase().includes(w) ||
            (p.categoryName || '').toLowerCase().includes(w)
        );
        if (!brandMatch && !nameMatch && !catMatch && !wordMatch) return false;
      }

      // Category filter
      if (activeCategory && activeCategory !== 'all') {
        const cat = (p.globalCategory || p.categoryName || '').toLowerCase();
        if (!cat.includes(activeCategory.toLowerCase())) return false;
      }

      // In stock
      if (inStockOnly) {
        const qty = typeof p.stockQuantity === 'number' ? p.stockQuantity : 100;
        if (qty <= 0) return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = (p.name || '').toLowerCase().includes(q);
        const matchDesc = (p.description || '').toLowerCase().includes(q);
        const matchBrand = (p.brand || '').toLowerCase().includes(q);
        const matchCat = (p.globalCategory || p.categoryName || '').toLowerCase().includes(q);
        if (!matchName && !matchDesc && !matchBrand && !matchCat) return false;
      }

      return true;
    });

    if (sortBy === 'price-asc') {
      list = [...list].sort((a, b) => (a.price || 0) - (b.price || 0));
    } else if (sortBy === 'price-desc') {
      list = [...list].sort((a, b) => (b.price || 0) - (a.price || 0));
    } else if (sortBy === 'discount') {
      list = [...list].sort((a, b) => {
        const discA = a.compareAtPrice && a.compareAtPrice > a.price ? (a.compareAtPrice - a.price) / a.compareAtPrice : 0;
        const discB = b.compareAtPrice && b.compareAtPrice > b.price ? (b.compareAtPrice - b.price) / b.compareAtPrice : 0;
        return discB - discA;
      });
    }

    return list;
  }, [products, activeSubBrand, activeCategory, inStockOnly, searchQuery, sortBy]);

  // Extract top deals (discount >= 20% or multi-packs / pro editions)
  const topDeals = useMemo(() => {
    return products
      .filter((p) => {
        const hasDiscount =
          p.compareAtPrice &&
          p.compareAtPrice > p.price &&
          (p.compareAtPrice - p.price) / p.compareAtPrice >= (isInfinix ? 0.05 : 0.2);
        const isBundle = /pack|combo|triple|twin|8|pro/i.test(p.name);
        return hasDiscount || isBundle;
      })
      .slice(0, 8);
  }, [products, isInfinix]);

  const handleSubBrandSelect = (tag: string) => {
    setActiveSubBrand(tag);
    // Smooth scroll to catalog section
    const el = document.getElementById('brand-catalog-anchor');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: `${brandName} - Calabar 9jaLive`,
          text: `Shop 100% genuine guaranteed ${brandShortName} products in Calabar with fast doorstep delivery!`,
          url: window.location.href,
        });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        setCopiedShare(true);
        setTimeout(() => setCopiedShare(false), 2000);
      }
    } catch {}
  };

  const activeSlide = campaignSlides[activeSlideIdx % campaignSlides.length] || campaignSlides[0];

  return (
    <div className="space-y-6 pb-28 animate-in fade-in duration-300">
      {/* 1. Official Brand Flagship Hero Header */}
      <div
        className={cn(
          'relative overflow-hidden rounded-3xl text-white p-6 sm:p-8 md:p-10 border shadow-2xl transition-colors',
          isInfinix
            ? 'bg-gradient-to-br from-[#071f1a] via-[#06181b] to-[#020b0c] border-emerald-900/40'
            : 'bg-gradient-to-br from-[#0c1f6d] via-[#091547] to-[#03091e] border-blue-900/40'
        )}
      >
        {/* Subtle decorative glow */}
        <div
          className={cn(
            'absolute -top-24 -right-24 w-96 h-96 rounded-full blur-3xl pointer-events-none',
            isInfinix ? 'bg-emerald-500/15' : 'bg-blue-500/15'
          )}
        />
        <div
          className={cn(
            'absolute -bottom-24 -left-24 w-80 h-80 rounded-full blur-3xl pointer-events-none',
            isInfinix ? 'bg-teal-500/15' : 'bg-teal-500/10'
          )}
        />

        <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
            {/* Official Logo Badge */}
            <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-white p-3 shadow-xl ring-4 ring-white/20 flex items-center justify-center shrink-0">
              <img
                src={brandLogo}
                alt={`${brandName} Official Mark`}
                className="w-full h-full object-contain"
              />
              <div className="absolute -bottom-2 -right-2 w-7 h-7 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center shadow-md font-black text-xs ring-2 ring-slate-900" title="Official Gold Flagship">
                ★
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/20 text-amber-300 text-xs font-black border border-amber-400/30 shadow-sm">
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                  Official Brand Flagship
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/30">
                  <PackageCheck className="w-3.5 h-3.5" />
                  {isInfinix ? 'Carlcare 12+1 Mo. Warranty' : 'Direct Manufacturer Supply'}
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/10 text-white text-xs font-medium backdrop-blur-sm">
                  {isInfinix ? 'Marian Hub · Calabar' : 'Calabar Depot'}
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight text-white">
                {brandName}
              </h1>

              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-300 font-medium">
                <span className="text-emerald-400 font-semibold flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  {isInfinix ? 'Carlcare Hub Open · Official Warranty Service' : 'Depot Open · Dispatches in 2 Hours'}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Contact & Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => setIsFollowing(!isFollowing)}
              className={cn(
                'px-4 py-2.5 rounded-xl text-xs font-black transition-all shadow-md flex items-center gap-1.5 active:scale-95',
                isFollowing
                  ? 'bg-white/20 text-white hover:bg-white/30'
                  : 'bg-white text-slate-900 hover:bg-slate-100'
              )}
            >
              <Heart className={cn('w-3.5 h-3.5', isFollowing && 'fill-rose-500 text-rose-500')} />
              {isFollowing ? 'Following' : 'Follow Brand'}
            </button>

            <a
              href={`https://wa.me/${whatsappClean}?text=${encodeURIComponent(
                `Hello ${brandName} Desk, I am reaching out via Calabar 9jaLive to make an enquiry or place an order.`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black shadow-lg transition-all flex items-center gap-1.5 active:scale-95"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              WhatsApp Hotline
            </a>

            <a
              href={`tel:${rawPhone}`}
              className="px-3.5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-colors flex items-center gap-1.5"
              title="Call Central Depot"
            >
              <Phone className="w-3.5 h-3.5" />
              Call
            </a>

            <button
              type="button"
              onClick={handleShare}
              className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-colors"
              title="Share Brand Store"
            >
              <Share2 className="w-4 h-4" />
            </button>
            {copiedShare && (
              <span className="text-[11px] text-emerald-400 font-bold animate-in fade-in">Link Copied!</span>
            )}
          </div>
        </div>
      </div>

      {/* 2. Interactive Campaign Banner Carousel */}
      <div className="relative overflow-hidden rounded-2xl bg-slate-900 shadow-md group">
        <div className="relative w-full aspect-[21/9] sm:aspect-[24/8] md:aspect-[28/9] max-h-[340px] overflow-hidden">
          <img
            src={activeSlide.image}
            alt={activeSlide.title}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/30 to-transparent flex flex-col justify-end p-5 sm:p-7 md:p-8">
            <div className="max-w-xl space-y-2">
              <span className="inline-block px-3 py-1 rounded-full bg-amber-400 text-slate-950 text-[11px] font-black uppercase tracking-wider shadow">
                {activeSlide.badge}
              </span>
              <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-white leading-tight drop-shadow-sm">
                {activeSlide.title}
              </h2>
              <p className="text-xs sm:text-sm text-slate-200 font-medium line-clamp-2 drop-shadow">
                {activeSlide.tagline}
              </p>
              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => handleSubBrandSelect(activeSlide.targetBrand)}
                  className="px-4 py-2 rounded-xl bg-white text-slate-950 text-xs font-black hover:bg-slate-100 transition-colors inline-flex items-center gap-1.5 shadow"
                >
                  Shop Now <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Slider Navigation Dots */}
        {campaignSlides.length > 1 && (
          <div className="absolute bottom-3 right-4 flex items-center gap-1.5 z-20">
            {campaignSlides.map((slide, idx) => (
              <button
                key={slide.id}
                type="button"
                onClick={() => setActiveSlideIdx(idx)}
                className={cn(
                  'h-2 rounded-full transition-all',
                  activeSlideIdx === idx ? 'w-6 bg-white' : 'w-2 bg-white/40 hover:bg-white/60'
                )}
                aria-label={`Slide ${idx + 1}`}
              />
            ))}
          </div>
        )}
      </div>

      {/* 3. Sub-Brand Interactive Filter Rail (Jumia mlp exact pattern) */}
      <section className="space-y-3 bg-white rounded-3xl p-5 md:p-6 border border-slate-100 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm md:text-base font-black text-slate-900 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-600" />
              {isInfinix ? 'Explore Infinix Series & Ecosystem' : 'Explore Unilever Sub-Brands'}
            </h3>
            <p className="text-xs text-slate-500 font-medium">
              {isInfinix
                ? 'Click a series to browse smartphones, smartwatches, audio & power gear'
                : 'Click a brand to browse its official authentic catalog'}
            </p>
          </div>
          {activeSubBrand !== 'all' && (
            <button
              type="button"
              onClick={() => setActiveSubBrand('all')}
              className="text-xs font-bold text-blue-600 hover:text-blue-800 underline"
            >
              View All {isInfinix ? 'Series' : 'Brands'} ({products.length})
            </button>
          )}
        </div>

        <div className="grid grid-cols-4 sm:grid-cols-8 gap-3 pt-2">
          {subBrandsList.map((sb) => {
            const isSelected = activeSubBrand.toLowerCase() === sb.tag.toLowerCase();
            const itemCount = sb.tag === 'all'
              ? products.length
              : products.filter((p) => {
                  const q = sb.tag.toLowerCase();
                  return (
                    (p.brand || '').toLowerCase().includes(q) ||
                    (p.name || '').toLowerCase().includes(q) ||
                    (p.categoryName || '').toLowerCase().includes(q)
                  );
                }).length;

            return (
              <button
                key={sb.id}
                type="button"
                onClick={() => handleSubBrandSelect(sb.tag)}
                className={cn(
                  'flex flex-col items-center gap-2 p-2.5 rounded-2xl transition-all group text-center',
                  isSelected
                    ? 'bg-blue-50 ring-2 ring-blue-600 shadow-sm scale-105'
                    : 'bg-slate-50/70 hover:bg-slate-100/80 hover:scale-102'
                )}
              >
                <div
                  className={cn(
                    'w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center p-2 shadow-sm transition-transform group-hover:scale-105 overflow-hidden',
                    isSelected ? 'bg-white ring-2 ring-blue-500' : 'bg-white border border-slate-200'
                  )}
                >
                  {sb.logo ? (
                    <img
                      src={sb.logo}
                      alt={sb.name}
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <span className="text-2xl">{sb.icon}</span>
                  )}
                </div>
                <div className="space-y-0.5">
                  <span
                    className={cn(
                      'text-xs font-black block truncate max-w-[75px]',
                      isSelected ? 'text-blue-900' : 'text-slate-800'
                    )}
                  >
                    {sb.name}
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium block">
                    {itemCount} items
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* 5. Top Deals & Value Bundles Shelf (Jumia Exact Pattern) */}
      {topDeals.length > 0 && activeSubBrand === 'all' && !searchQuery.trim() && (
        <section className="space-y-3 bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-rose-500/10 p-5 md:p-6 rounded-3xl border border-amber-200/60 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-amber-500 text-white shadow-sm">
                <Flame className="w-4 h-4" />
              </span>
              <div>
                <h3 className="text-sm md:text-base font-black text-slate-900">
                  {isInfinix ? 'Infinix Official Deals & Flagship Offers' : 'Unilever Mega Deals & Multi-Packs'}
                </h3>
                <p className="text-xs text-slate-600 font-medium">
                  {isInfinix
                    ? 'Authentic smartphones and gadgets with official manufacturer discounts'
                    : 'Direct manufacturer bulk bundles at maximum discount'}
                </p>
              </div>
            </div>
            <span className="text-xs font-bold text-amber-800 bg-amber-100/80 px-2.5 py-1 rounded-full border border-amber-300">
              {isInfinix ? 'Official Carlcare Hub' : 'Up to 35% Off'}
            </span>
          </div>

          <div className="flex gap-4 overflow-x-auto pb-2 pt-1 scrollbar-thin scrollbar-thumb-amber-300">
            {topDeals.map((deal) => {
              const discount = deal.compareAtPrice && deal.compareAtPrice > deal.price
                ? Math.round(((deal.compareAtPrice - deal.price) / deal.compareAtPrice) * 100)
                : (isInfinix ? 8 : 25);
              const prodItem: GlovoProductItem = {
                id: deal.id,
                name: deal.name,
                price: Number(deal.price),
                compareAtPrice: deal.compareAtPrice ? Number(deal.compareAtPrice) : null,
                description: deal.description,
                imageAssetId: deal.imageAssetId,
                imageUrl: deal.imageAssetId,
                storeName: brandName,
                organizationId: defaultOrgId,
                brand: deal.brand || brandShortName,
                globalCategory: deal.globalCategory,
                stockQuantity: 100,
              };

              return (
                <div key={deal.id} className="min-w-[220px] max-w-[240px] shrink-0">
                  <div className="relative">
                    <span className="absolute top-2 left-2 z-10 px-2 py-0.5 rounded-md bg-rose-600 text-white text-[10px] font-black shadow">
                      -{discount}% DEAL
                    </span>
                    <GlovoProductCard product={prodItem} className="bg-white" />
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* 6. Main Filterable & Searchable Catalog */}
      <section id="brand-catalog-anchor" className="space-y-4 pt-2">
        {/* Search & Sort Controls Bar (Sticky) */}
        <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md p-4 rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={
                  isInfinix
                    ? `Search across ${products.length} Infinix devices (e.g. Hot 70, GT 50, Note Edge, XWatch, Earbuds)...`
                    : `Search across ${products.length} Unilever products (e.g. Knorr beef, Vaseline 400ml, Closeup red hot)...`
                }
                className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-xs font-medium text-slate-900 bg-slate-50/50"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-2">
              <select
                value={sortBy}
                onChange={(e: any) => setSortBy(e.target.value)}
                className="px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="featured">Featured / Best Match</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="discount">Biggest Discount %</option>
              </select>

              <button
                type="button"
                onClick={() => setInStockOnly(!inStockOnly)}
                className={cn(
                  'px-3 py-2.5 rounded-xl border text-xs font-bold transition-colors whitespace-nowrap',
                  inStockOnly
                    ? 'bg-blue-50 border-blue-300 text-blue-700'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                )}
              >
                In Stock
              </button>
            </div>
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1 scrollbar-none">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setActiveCategory(cat)}
                className={cn(
                  'px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all',
                  activeCategory === cat
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200/80'
                )}
              >
                {cat === 'all' ? 'All Aisle Categories' : cat}
              </button>
            ))}
          </div>
        </div>

        {/* Results Header */}
        <div className="flex items-center justify-between px-1 text-xs">
          <p className="font-bold text-slate-600">
            Showing <span className="text-slate-900 font-black">{filteredProducts.length}</span> of {products.length} {brandShortName} {isInfinix ? 'devices' : 'products'}
            {activeSubBrand !== 'all' && (
              <span className="ml-1.5 px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 font-black">
                {activeSubBrand}
              </span>
            )}
          </p>

          {(activeSubBrand !== 'all' || activeCategory !== 'all' || searchQuery.trim() || inStockOnly) && (
            <button
              type="button"
              onClick={() => {
                setActiveSubBrand('all');
                setActiveCategory('all');
                setSearchQuery('');
                setInStockOnly(false);
              }}
              className="font-bold text-rose-600 hover:text-rose-700 hover:underline"
            >
              Clear Filters
            </button>
          )}
        </div>

        {/* Products Grid */}
        {filteredProducts.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
            {filteredProducts.map((p) => {
              const prodItem: GlovoProductItem = {
                id: p.id,
                name: p.name,
                price: Number(p.price),
                compareAtPrice: p.compareAtPrice ? Number(p.compareAtPrice) : null,
                description: p.description,
                imageAssetId: p.imageAssetId,
                imageUrl: p.imageAssetId,
                storeName: brandName,
                organizationId: defaultOrgId,
                brand: p.brand || brandShortName,
                globalCategory: p.globalCategory || p.categoryName,
                stockQuantity: typeof p.stockQuantity === 'number' ? p.stockQuantity : 100,
              };

              return (
                <GlovoProductCard key={p.id} product={prodItem} />
              );
            })}
          </div>
        ) : (
          <div className="text-center py-16 bg-white rounded-3xl border border-slate-100 p-8 space-y-3">
            <span className="text-4xl">🔍</span>
            <h4 className="text-base font-black text-slate-900">
              No matching {brandShortName} {isInfinix ? 'devices' : 'products'} found
            </h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Try adjusting your search query or switching to &ldquo;{isInfinix ? 'All Series' : 'All Brands'}&rdquo; to see the full catalog.
            </p>
            <button
              type="button"
              onClick={() => {
                setActiveSubBrand('all');
                setActiveCategory('all');
                setSearchQuery('');
              }}
              className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition-colors inline-block"
            >
              Reset Filters
            </button>
          </div>
        )}
      </section>

      {/* Floating Checkout Basket Dock */}
      <ChowdeckBasketDock />
    </div>
  );
}
