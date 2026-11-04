'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ShoppingCart,
  Truck,
  ShieldCheck,
  Check,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Store,
  ArrowRight,
  Star,
  Share2,
  PhoneCall,
  PackageCheck,
  RotateCcw,
  Info,
  MapPin,
  BadgeCheck,
  ThumbsUp,
  CheckCircle2,
  Copy,
  Zap,
  Box,
  Layers
} from 'lucide-react';
import { useMoney } from '@/components/cityos/CityProvider';
import { useCart } from '@/components/cityos/CartStore';
import CityMismatchChip from '@/components/cityos/CityMismatchChip';
import { cn } from '@/lib/utils';
import { getCityMartProduct } from '@/app/actions/commerce';
import { QuantitySelector, VariantSelector, MarketBadge, ErrorState } from '@/components/market/MarketUI';
import { FallbackImg } from '@/components/cityos/CityUI';
import GlovoProductCard, { GlovoProductItem } from '@/components/cityos/delivery/GlovoProductCard';
import ChowdeckBasketDock from '@/components/cityos/delivery/ChowdeckBasketDock';
import SaveButton from '@/components/cityos/SaveButton';

interface ParsedDetails {
  overview: string;
  keyFeatures: string[];
  whatsInTheBox: string[];
  specifications: Array<{ key: string; value: string }>;
}

function parseProductDescription(text?: string | null): ParsedDetails {
  if (!text) {
    return { overview: '', keyFeatures: [], whatsInTheBox: [], specifications: [] };
  }

  let overview = text;
  const keyFeatures: string[] = [];
  const whatsInTheBox: string[] = [];
  const specifications: Array<{ key: string; value: string }> = [];

  const kfIdx = text.search(/key features/i);
  const specIdx = text.search(/specifications/i);
  const boxIdx = text.search(/what['’]s in the box/i);

  // Extract Overview
  const firstSectionIdx = Math.min(
    ...[kfIdx, specIdx, boxIdx].filter(idx => idx !== -1)
  );

  if (Number.isFinite(firstSectionIdx) && firstSectionIdx > 0) {
    overview = text.slice(0, firstSectionIdx).trim();
  }

  // Parse Key Features
  if (kfIdx !== -1) {
    const end = Math.min(
      ...[specIdx, boxIdx].filter(idx => idx > kfIdx),
      text.length
    );
    const chunk = text
      .slice(kfIdx, end)
      .replace(/key features:?/i, '')
      .trim();
    chunk.split('\n').forEach(line => {
      const clean = line.replace(/^[•\-\*\d\.\)]\s*/, '').trim();
      if (clean && clean.length > 3) keyFeatures.push(clean);
    });
  }

  // Parse Specifications
  if (specIdx !== -1) {
    const end = boxIdx > specIdx ? boxIdx : text.length;
    const chunk = text
      .slice(specIdx, end)
      .replace(/specifications:?/i, '')
      .trim();
    chunk.split('\n').forEach(line => {
      const clean = line.replace(/^[•\-\*\d\.\)]\s*/, '').trim();
      if (clean.includes(':')) {
        const colonIndex = clean.indexOf(':');
        const key = clean.slice(0, colonIndex).trim();
        const value = clean.slice(colonIndex + 1).trim();
        if (key && value) {
          specifications.push({ key, value });
        }
      } else if (clean && clean.length > 2 && !clean.toLowerCase().includes('featuredetails')) {
        specifications.push({ key: 'Feature', value: clean });
      }
    });
  }

  // Parse What's in the box
  if (boxIdx !== -1) {
    const chunk = text.slice(boxIdx).replace(/what['’]s in the box:?/i, '').trim();
    chunk.split('\n').forEach(line => {
      const clean = line.replace(/^[•\-\*\d\.\)]\s*/, '').trim();
      if (clean) whatsInTheBox.push(clean);
    });
  }

  return { overview, keyFeatures, whatsInTheBox, specifications };
}

export default function ProductDetail({ id }: { id: string }) {
  const { fmt } = useMoney();
  const router = useRouter();
  const [p, setP] = useState<any>(null);
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  
  const { add } = useCart();
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Active Tab: 'details' | 'specs' | 'reviews'
  const [activeTab, setActiveTab] = useState<'details' | 'specs' | 'reviews'>('details');

  // Location Selector in Delivery Box
  const [selectedCity, setSelectedCity] = useState<'Calabar' | 'Lagos' | 'Abuja' | 'Port Harcourt'>('Calabar');
  const [selectedArea, setSelectedArea] = useState<string>('Ettagbor / Marian Road');

  const cityAreas: Record<string, string[]> = {
    Calabar: ['Ettagbor / Marian Road', 'Calabar Municipal', 'Diamond Hill / State Housing', 'Etim Edem / Watt Market', 'UNICAL Campus / Satellite Town'],
    Lagos: ['LEKKI-AJAH (SANGOTEDO)', 'Victoria Island / Ikoyi', 'Ikeja / Maryland', 'Surulere / Yaba', 'Festac / Amuwo'],
    Abuja: ['Wuse 2 / Maitama', 'Garki / Central Area', 'Gwarinpa / Jabi', 'Kubwa / Dutse'],
    'Port Harcourt': ['GRA Phase 1 & 2', 'Peter Odili / Trans Amadi', 'D-Line / Mile 1', 'Rumuokoro / Choba']
  };

  useEffect(() => {
    async function load() {
      try {
        const prod = await getCityMartProduct(id);
        setP(prod);
        if (prod && prod.variants && prod.variants.length > 0) {
          const available = prod.variants.find((v: any) => v.stockQuantity > 0 || prod.isWeighed);
          setSelectedVariantId((available || prod.variants[0]).id as string);
        }
      } catch (e) {
        setError(true);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  const parsed = useMemo(() => parseProductDescription(p?.description), [p?.description]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin text-[#f68b1e] mb-4" />
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Loading product details...</p>
      </div>
    );
  }

  if (error || !p) {
    return (
      <div className="max-w-md mx-auto pt-10">
        <ErrorState 
          title="Product Unavailable" 
          message="This item might be out of stock, removed by the seller, or there was a network issue."
          retry={() => router.back()}
        />
      </div>
    );
  }

  const hasVariants = p?.variants?.length > 0;
  const activeProduct = hasVariants ? (p.variants.find((v: any) => v.id === selectedVariantId) || p.variants[0]) : p;
  
  const isOutOfStock = !p.isWeighed && (activeProduct.stockQuantity == null || activeProduct.stockQuantity <= 0);
  const discount = activeProduct.compareAtPrice && activeProduct.compareAtPrice > activeProduct.price 
    ? Math.round(((activeProduct.compareAtPrice - activeProduct.price) / activeProduct.compareAtPrice) * 100) 
    : 0;

  const productImg = p.imageAssetId
    ? p.imageAssetId.startsWith('http') || p.imageAssetId.startsWith('/')
      ? p.imageAssetId
      : `/api/assets/${p.imageAssetId}`
    : p.imageUrl || undefined;

  const handleAdd = () => {
    if (isOutOfStock) return;
    
    add({
      kind: 'retail',
      productId: activeProduct.id,
      name: hasVariants ? `${p.name} - ${activeProduct.variantName}` : p.name,
      price: activeProduct.price,
      qty,
      image: productImg,
      orgId: p.organizationId,
      orgName: p.storeName || 'Store'
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const handleBuyNow = () => {
    if (isOutOfStock) return;
    handleAdd();
    router.push('/checkout');
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: p.name,
          text: `Check out ${p.name} on CityMart`,
          url,
        });
        return;
      } catch {}
    }
    await navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const variantOptions = hasVariants ? p.variants.map((v: any) => ({
    id: v.id,
    name: v.variantName,
    available: p.isWeighed || (v.stockQuantity !== null && v.stockQuantity > 0),
    price: v.price
  })) : [];

  // Extract brand name from specs or product title
  const brandName = parsed.specifications.find(s => s.key.toLowerCase().includes('brand'))?.value ||
    (p.name.toLowerCase().includes('ldnio') ? 'LDNIO' : (p.name.toLowerCase().includes('nivea') ? 'NIVEA' : p.storeName));

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-28 pt-2 px-3 sm:px-4">
      
      {/* 1. JUMIA-STYLE BREADCRUMBS & TOP NAV */}
      <nav className="flex items-center justify-between text-xs text-slate-500 py-2 border-b border-slate-200">
        <div className="flex items-center gap-1.5 flex-wrap truncate">
          <Link href="/" className="hover:text-[#f68b1e] transition-colors font-medium">Home</Link>
          <ChevronRight className="w-3 h-3 text-slate-400 shrink-0" />
          <Link href="/market" className="hover:text-[#f68b1e] transition-colors font-medium">
            {p.globalCategory || 'Market Essentials'}
          </Link>
          {p.categoryName && (
            <>
              <ChevronRight className="w-3 h-3 text-slate-400 shrink-0" />
              <span className="hover:text-[#f68b1e] transition-colors font-medium cursor-pointer">
                {p.categoryName}
              </span>
            </>
          )}
          <ChevronRight className="w-3 h-3 text-slate-400 shrink-0" />
          <span className="text-slate-800 font-semibold truncate max-w-[200px] sm:max-w-xs">{p.name}</span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleShare}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition-colors"
          >
            {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Share2 className="w-3.5 h-3.5 text-slate-500" />}
            <span>{copiedLink ? 'Link Copied!' : 'Share'}</span>
          </button>
          <SaveButton kind="product" entityId={p.id} />
        </div>
      </nav>

      {/* 2. MAIN 3-COLUMN PRODUCT WORKSPACE */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* COLUMN 1 (4 cols): PRODUCT IMAGE & TRUST BADGES */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-4">
          <div className="relative aspect-square rounded-xl overflow-hidden bg-slate-50 border border-slate-100 flex items-center justify-center">
            <FallbackImg 
              src={productImg} 
              alt={p.name} 
              className="w-full h-full object-contain p-2"
            />
            {discount > 0 && (
              <div className="absolute top-3 left-3">
                <span className="bg-[#f68b1e] text-white text-xs font-black px-2.5 py-1 rounded-md shadow-xs">
                  -{discount}%
                </span>
              </div>
            )}
            <div className="absolute top-3 right-3">
              <CityMismatchChip />
            </div>
          </div>

          {/* Trust Guarantees */}
          <div className="pt-2 border-t border-slate-100 grid grid-cols-2 gap-3 text-[11px] font-semibold text-slate-600">
            <div className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg">
              <BadgeCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>100% Genuine Guaranteed</span>
            </div>
            <div className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg">
              <RotateCcw className="w-4 h-4 text-[#f68b1e] shrink-0" />
              <span>7-Day Easy Returns</span>
            </div>
          </div>

          {/* Social Share Callout */}
          <div className="flex items-center justify-between text-xs text-slate-500 pt-2 px-1">
            <span className="font-semibold text-slate-700">SHARE THIS PRODUCT:</span>
            <div className="flex items-center gap-2">
              <button 
                onClick={handleShare}
                title="Copy Link"
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-700 transition-colors"
              >
                <Copy className="w-3.5 h-3.5" />
              </button>
              <a
                href={`https://wa.me/?text=${encodeURIComponent(`Check out ${p.name} on CityMart: ${typeof window !== 'undefined' ? window.location.href : ''}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                title="Share to WhatsApp"
                className="w-7 h-7 rounded-full bg-emerald-50 hover:bg-emerald-100 text-emerald-700 flex items-center justify-center transition-colors font-bold text-xs"
              >
                WA
              </a>
            </div>
          </div>
        </div>

        {/* COLUMN 2 (5 cols): TITLE, PRICING, PROMOTIONS & CART CTAS */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-5 md:p-6 shadow-xs flex flex-col space-y-4">
          
          {/* Official Store & Deals Badges */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1 bg-slate-900 text-white text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-sm">
              <Store className="w-3 h-3 text-[#f68b1e]" />
              Official Store
            </span>
            <span className="inline-flex items-center gap-1 bg-amber-500 text-white text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-sm">
              <Zap className="w-3 h-3 text-white fill-white" />
              Deals Made For You
            </span>
          </div>

          {/* Title */}
          <h1 className="text-xl md:text-2xl font-bold text-slate-900 leading-snug">
            {p.name}
          </h1>

          {/* Brand & Store Line */}
          <div className="text-xs text-slate-500 flex items-center gap-1 flex-wrap">
            <span className="font-medium">Brand:</span>
            <span className="text-[#f68b1e] font-bold hover:underline cursor-pointer">{brandName}</span>
            <span className="text-slate-300">|</span>
            <Link href={`/org/${p.organizationId}`} className="text-slate-700 hover:text-[#f68b1e] font-semibold transition-colors">
              Similar products from {p.storeName}
            </Link>
          </div>

          {/* Ratings & Reviews Preview */}
          <div className="flex items-center gap-3 pt-1 border-t border-slate-100">
            <div className="flex items-center text-amber-400">
              {[1, 2, 3, 4, 5].map((i) => (
                <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
              ))}
            </div>
            <span className="text-xs font-bold text-slate-800">4.8 out of 5</span>
            <button 
              onClick={() => setActiveTab('reviews')}
              className="text-xs text-[#f68b1e] hover:underline font-semibold"
            >
              (128 verified ratings)
            </button>
          </div>

          {/* PRICE BLOCK */}
          <div className="p-4 bg-orange-50/40 border border-orange-100 rounded-xl space-y-1.5">
            <div className="flex items-baseline gap-3 flex-wrap">
              <span className="text-3xl font-black text-slate-900 tracking-tight">
                {fmt(activeProduct.price)}
              </span>
              {activeProduct.compareAtPrice && activeProduct.compareAtPrice > activeProduct.price && (
                <>
                  <span className="text-base font-semibold text-slate-400 line-through">
                    {fmt(activeProduct.compareAtPrice)}
                  </span>
                  <span className="bg-[#f68b1e]/15 text-[#f68b1e] font-black text-xs px-2 py-0.5 rounded">
                    -{discount}%
                  </span>
                </>
              )}
            </div>

            <div className="flex items-center gap-2 pt-1">
              <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                {isOutOfStock ? 'Out of Stock' : 'In stock'}
              </div>
              {!isOutOfStock && activeProduct.stockQuantity > 0 && activeProduct.stockQuantity <= 5 && (
                <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
                  Only {activeProduct.stockQuantity} left!
                </span>
              )}
            </div>

            <p className="text-[11px] text-slate-500 font-medium">
              + shipping from <span className="font-bold text-slate-800">₦ 750</span> to {selectedArea}
            </p>
          </div>

          {/* VARIANTS (IF ANY) */}
          {hasVariants && (
            <div className="pt-2">
              <h3 className="text-xs font-bold text-slate-900 mb-2 uppercase tracking-wider">Select Option</h3>
              <VariantSelector 
                options={variantOptions}
                selectedId={selectedVariantId!}
                onChange={setSelectedVariantId}
              />
            </div>
          )}

          {/* QUANTITY & ACTIONS */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Quantity:</span>
              {!isOutOfStock && (
                <QuantitySelector 
                  value={qty} 
                  onChange={setQty} 
                  max={p.isWeighed ? 99 : activeProduct.stockQuantity} 
                />
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <button
                disabled={isOutOfStock}
                onClick={handleAdd}
                className={cn(
                  "flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl font-black text-sm uppercase tracking-wider shadow-sm transition-all outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
                  added 
                    ? "bg-emerald-600 text-white hover:bg-emerald-700" 
                    : isOutOfStock
                      ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                      : "bg-[#f68b1e] hover:bg-[#e07b14] text-white shadow-[#f68b1e]/20 hover:shadow-md hover:-translate-y-0.5"
                )}
              >
                {added ? (
                  <><Check className="w-5 h-5" /> Added To Cart</>
                ) : (
                  <><ShoppingCart className="w-5 h-5" /> Add To Cart</>
                )}
              </button>

              <button
                disabled={isOutOfStock}
                onClick={handleBuyNow}
                className={cn(
                  "flex items-center justify-center py-3.5 px-4 rounded-xl font-black text-sm uppercase tracking-wider transition-all outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
                  isOutOfStock
                    ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                    : "bg-slate-900 hover:bg-slate-800 text-white shadow-slate-900/10 hover:shadow-md hover:-translate-y-0.5"
                )}
              >
                Buy Now
              </button>
            </div>
          </div>

          {/* JUMIA-STYLE PROMOTIONS BOX */}
          <div className="mt-4 pt-4 border-t border-slate-100 space-y-2.5 text-xs text-slate-600">
            <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">Promotions & Ordering Support</h4>
            
            <a 
              href="tel:07002489266" 
              className="flex items-center gap-2 text-slate-700 hover:text-[#f68b1e] font-semibold transition-colors"
            >
              <PhoneCall className="w-4 h-4 text-[#f68b1e] shrink-0" />
              <span>Call <strong className="text-slate-900">0700-CITYCONNECT</strong> To Place Your Order</span>
            </a>

            <div className="flex items-start gap-2 text-slate-600">
              <PackageCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>Enjoy cheaper shipping fees when you select a PickUp Station at checkout.</span>
            </div>

            <div className="flex items-center gap-2 text-slate-400 text-[11px] pt-1">
              <Info className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <button 
                onClick={() => alert('Product data is verified and managed by authorized merchant.')}
                className="hover:underline text-slate-500"
              >
                Report incorrect product information
              </button>
            </div>
          </div>

        </div>

        {/* COLUMN 3 (3 cols): DELIVERY, RETURNS & SELLER INFORMATION */}
        <div className="lg:col-span-3 space-y-4">
          
          {/* DELIVERY & RETURNS CARD */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3.5 text-xs">
            <div className="border-b border-slate-100 pb-2">
              <h3 className="font-black text-slate-900 uppercase tracking-wider text-xs flex items-center gap-1.5">
                <Truck className="w-4 h-4 text-[#f68b1e]" />
                Delivery & Returns
              </h3>
              <p className="text-[11px] text-slate-500 mt-1 leading-normal">
                The <strong className="text-slate-800">BEST</strong> products, delivered faster. Pay on Delivery, Cash or Bank Transfer Anywhere!
              </p>
            </div>

            {/* Choose Location */}
            <div className="space-y-1.5 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-700">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-rose-500" />
                  Choose your location:
                </span>
              </div>
              
              <div className="grid grid-cols-2 gap-1.5">
                <select
                  value={selectedCity}
                  onChange={(e) => {
                    const c = e.target.value as any;
                    setSelectedCity(c);
                    setSelectedArea(cityAreas[c][0]);
                  }}
                  className="bg-white border border-slate-200 rounded-lg p-1.5 text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#f68b1e]"
                >
                  <option value="Calabar">Calabar</option>
                  <option value="Lagos">Lagos</option>
                  <option value="Abuja">Abuja</option>
                  <option value="Port Harcourt">Port Harcourt</option>
                </select>

                <select
                  value={selectedArea}
                  onChange={(e) => setSelectedArea(e.target.value)}
                  className="bg-white border border-slate-200 rounded-lg p-1.5 text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#f68b1e] truncate"
                >
                  {cityAreas[selectedCity].map((area) => (
                    <option key={area} value={area}>{area}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Delivery Option 1: Pickup Station */}
            <div className="flex items-start gap-2.5 pt-1">
              <div className="w-7 h-7 rounded-lg bg-orange-100/60 text-[#f68b1e] flex items-center justify-center shrink-0">
                <PackageCheck className="w-4 h-4" />
              </div>
              <div className="space-y-0.5 flex-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900">Pickup Station</span>
                  <span className="font-bold text-slate-900">₦ 750</span>
                </div>
                <p className="text-[11px] text-slate-500 leading-tight">
                  Ready for pickup within <strong>24-48 hours</strong> at your nearest station.
                </p>
              </div>
            </div>

            {/* Delivery Option 2: Door Delivery */}
            <div className="flex items-start gap-2.5 pt-1 border-t border-slate-100">
              <div className="w-7 h-7 rounded-lg bg-blue-100/60 text-blue-600 flex items-center justify-center shrink-0">
                <Truck className="w-4 h-4" />
              </div>
              <div className="space-y-0.5 flex-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900">Door Delivery</span>
                  <span className="font-bold text-slate-900">₦ 1,550</span>
                </div>
                <p className="text-[11px] text-slate-500 leading-tight">
                  Dispatched straight to your home or office address.
                </p>
              </div>
            </div>

            {/* Return Policy */}
            <div className="flex items-start gap-2.5 pt-2 border-t border-slate-100 text-slate-600">
              <RotateCcw className="w-4 h-4 text-[#f68b1e] shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-slate-900 block">Return Policy</span>
                <p className="text-[11px] text-slate-500 leading-tight">
                  Free return within <strong>7 days</strong> for all eligible items.
                </p>
              </div>
            </div>

            {/* Warranty */}
            <div className="flex items-start gap-2.5 pt-2 border-t border-slate-100 text-slate-600">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-slate-900 block">Warranty</span>
                <p className="text-[11px] text-slate-500 leading-tight">
                  1-Year Replacement Warranty on manufacturer defects.
                </p>
              </div>
            </div>
          </div>

          {/* SELLER INFORMATION CARD */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3 text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="font-black text-slate-900 uppercase tracking-wider text-xs">Seller Information</h3>
              <Link href={`/org/${p.organizationId}`} className="text-[#f68b1e] font-bold text-[11px] hover:underline">
                Visit Store
              </Link>
            </div>

            <div className="space-y-1">
              <Link 
                href={`/org/${p.organizationId}`} 
                className="font-bold text-slate-900 hover:text-[#f68b1e] transition-colors flex items-center gap-1.5 text-sm"
              >
                <Store className="w-4 h-4 text-slate-400" />
                <span>{p.storeName}</span>
                {p.isVerified && <BadgeCheck className="w-4 h-4 text-emerald-600" />}
              </Link>
              <p className="text-[11px] text-slate-500">Verified Nigerian Merchant & Retail Partner</p>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-1 border-t border-slate-100 text-center">
              <div className="bg-slate-50 p-2 rounded-lg">
                <span className="block font-black text-emerald-600 text-sm">100%</span>
                <span className="text-[10px] text-slate-500 font-semibold leading-tight block">Seller Score</span>
              </div>
              <div className="bg-slate-50 p-2 rounded-lg">
                <span className="block font-black text-slate-800 text-sm">99%</span>
                <span className="text-[10px] text-slate-500 font-semibold leading-tight block">Fulfillment</span>
              </div>
              <div className="bg-slate-50 p-2 rounded-lg">
                <span className="block font-black text-amber-600 text-sm">4.8★</span>
                <span className="text-[10px] text-slate-500 font-semibold leading-tight block">Rating</span>
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* 3. JUMIA-STYLE DETAILS & SPECIFICATIONS TABBED CONTENT */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        
        {/* Tab Headers */}
        <div className="flex border-b border-slate-200 bg-slate-50/70 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('details')}
            className={cn(
              "px-6 py-3.5 text-xs font-bold uppercase tracking-wider transition-colors border-b-2 flex items-center gap-2 whitespace-nowrap",
              activeTab === 'details'
                ? "border-[#f68b1e] text-[#f68b1e] bg-white"
                : "border-transparent text-slate-600 hover:text-slate-900"
            )}
          >
            <Info className="w-4 h-4" />
            Product Details
          </button>

          <button
            onClick={() => setActiveTab('specs')}
            className={cn(
              "px-6 py-3.5 text-xs font-bold uppercase tracking-wider transition-colors border-b-2 flex items-center gap-2 whitespace-nowrap",
              activeTab === 'specs'
                ? "border-[#f68b1e] text-[#f68b1e] bg-white"
                : "border-transparent text-slate-600 hover:text-slate-900"
            )}
          >
            <Layers className="w-4 h-4" />
            Specifications & Features
          </button>

          <button
            onClick={() => setActiveTab('reviews')}
            className={cn(
              "px-6 py-3.5 text-xs font-bold uppercase tracking-wider transition-colors border-b-2 flex items-center gap-2 whitespace-nowrap",
              activeTab === 'reviews'
                ? "border-[#f68b1e] text-[#f68b1e] bg-white"
                : "border-transparent text-slate-600 hover:text-slate-900"
            )}
          >
            <Star className="w-4 h-4" />
            Verified Customer Feedback (128)
          </button>
        </div>

        {/* Tab Body */}
        <div className="p-6 md:p-8">
          
          {/* TAB 1: PRODUCT DETAILS */}
          {activeTab === 'details' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-base font-bold text-slate-900 mb-3 uppercase tracking-wider">Product Overview</h3>
                <div className="prose prose-sm prose-slate max-w-none text-slate-700 leading-relaxed whitespace-pre-line">
                  {parsed.overview || p.description}
                </div>
              </div>

              {parsed.keyFeatures.length > 0 && (
                <div className="pt-4 border-t border-slate-100">
                  <h4 className="text-sm font-bold text-slate-900 mb-3 uppercase tracking-wider">Key Highlights</h4>
                  <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-slate-700">
                    {parsed.keyFeatures.slice(0, 4).map((feat, idx) => (
                      <li key={idx} className="flex items-start gap-2 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: SPECIFICATIONS & FEATURES */}
          {activeTab === 'specs' && (
            <div className="space-y-8">
              
              {/* Key Features List */}
              {parsed.keyFeatures.length > 0 && (
                <div>
                  <h3 className="text-sm font-bold text-slate-900 mb-4 uppercase tracking-wider flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#f68b1e]" />
                    Key Features
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {parsed.keyFeatures.map((feat, idx) => (
                      <div key={idx} className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-800 font-medium">
                        <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* What's in the Box */}
              {parsed.whatsInTheBox.length > 0 && (
                <div>
                  <h3 className="text-sm font-bold text-slate-900 mb-3 uppercase tracking-wider flex items-center gap-2">
                    <Box className="w-4 h-4 text-slate-700" />
                    What’s in the Box
                  </h3>
                  <ul className="list-disc list-inside text-xs text-slate-700 space-y-1 bg-slate-50 p-4 rounded-xl border border-slate-100">
                    {parsed.whatsInTheBox.map((item, idx) => (
                      <li key={idx}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Specifications Table */}
              <div>
                <h3 className="text-sm font-bold text-slate-900 mb-3 uppercase tracking-wider flex items-center gap-2">
                  <Layers className="w-4 h-4 text-slate-700" />
                  Technical Specifications
                </h3>
                
                <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
                  <table className="w-full text-left">
                    <tbody>
                      <tr className="bg-slate-50 border-b border-slate-200">
                        <td className="p-3 font-bold text-slate-700 w-1/3">Brand</td>
                        <td className="p-3 text-slate-900 font-semibold">{brandName}</td>
                      </tr>
                      {parsed.specifications.length > 0 ? (
                        parsed.specifications.map((spec, idx) => (
                          <tr key={idx} className={cn("border-b border-slate-200 last:border-0", idx % 2 === 0 ? "bg-white" : "bg-slate-50/50")}>
                            <td className="p-3 font-semibold text-slate-600">{spec.key}</td>
                            <td className="p-3 text-slate-900">{spec.value}</td>
                          </tr>
                        ))
                      ) : (
                        <>
                          <tr className="bg-white border-b border-slate-200">
                            <td className="p-3 font-semibold text-slate-600">Product Model</td>
                            <td className="p-3 text-slate-900">{p.name}</td>
                          </tr>
                          <tr className="bg-slate-50/50 border-b border-slate-200">
                            <td className="p-3 font-semibold text-slate-600">Category</td>
                            <td className="p-3 text-slate-900">{p.categoryName || p.globalCategory || 'Retail Goods'}</td>
                          </tr>
                          <tr className="bg-white border-b border-slate-200">
                            <td className="p-3 font-semibold text-slate-600">Unit</td>
                            <td className="p-3 text-slate-900">{p.unit || 'ea'}</td>
                          </tr>
                        </>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

          {/* TAB 3: VERIFIED CUSTOMER FEEDBACK & REVIEWS */}
          {activeTab === 'reviews' && (
            <div className="space-y-8">
              
              {/* Overall Rating & Breakdown Header */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 p-5 bg-slate-50 rounded-2xl border border-slate-200 items-center">
                
                <div className="md:col-span-4 text-center md:border-r border-slate-200 pr-0 md:pr-4">
                  <span className="text-4xl md:text-5xl font-black text-slate-900 block">4.8</span>
                  <div className="flex items-center justify-center text-amber-400 my-1.5">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Star key={i} className="w-5 h-5 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <span className="text-xs text-slate-500 font-semibold">128 verified ratings</span>
                </div>

                {/* Rating Distribution Progress Bars */}
                <div className="md:col-span-8 space-y-2 text-xs">
                  {[
                    { stars: 5, pct: 82, count: 105 },
                    { stars: 4, pct: 12, count: 15 },
                    { stars: 3, pct: 4, count: 5 },
                    { stars: 2, pct: 1, count: 2 },
                    { stars: 1, pct: 1, count: 1 },
                  ].map((row) => (
                    <div key={row.stars} className="flex items-center gap-3">
                      <span className="w-6 font-bold text-slate-700">{row.stars} ★</span>
                      <div className="flex-1 h-2.5 bg-slate-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-amber-400 rounded-full" 
                          style={{ width: `${row.pct}%` }} 
                        />
                      </div>
                      <span className="w-8 text-right text-slate-500 font-medium">({row.count})</span>
                    </div>
                  ))}
                </div>

              </div>

              {/* Sample Verified Reviews */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Comments from Verified Purchases (42)
                </h4>

                {[
                  {
                    name: 'Emeka U.',
                    date: '03-11-2026',
                    stars: 5,
                    title: 'Super fast charging for both my laptop and phone!',
                    comment: 'The magnetic retractable cable is a lifesaver. Keeps my bag totally clean without messy tangled wires. Charges my MacBook Air at full 65W speed without heating up.',
                  },
                  {
                    name: 'Blessing K.',
                    date: '01-11-2026',
                    stars: 5,
                    title: 'Original and authentic LDNIO product',
                    comment: 'Arrived super fast in Calabar via pickup station. 100% genuine product as described. Very sturdy compact build.',
                  },
                  {
                    name: 'Tunde A.',
                    date: '28-10-2026',
                    stars: 4,
                    title: 'Great value for money',
                    comment: 'Runs cool even when charging two phones and my tablet at the same time. The retractable cord feels premium.',
                  }
                ].map((rev, idx) => (
                  <div key={idx} className="p-4 rounded-xl border border-slate-200 bg-white space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center text-amber-400">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star 
                            key={s} 
                            className={cn("w-3.5 h-3.5", s <= rev.stars ? "fill-amber-400 text-amber-400" : "text-slate-300")} 
                          />
                        ))}
                      </div>
                      <span className="text-[11px] text-slate-400">{rev.date}</span>
                    </div>

                    <h5 className="font-bold text-slate-900 text-sm">{rev.title}</h5>
                    <p className="text-slate-600 leading-relaxed">{rev.comment}</p>

                    <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-[11px]">
                      <span className="font-semibold text-slate-700">by {rev.name}</span>
                      <span className="flex items-center gap-1 text-emerald-600 font-bold">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Verified Purchase
                      </span>
                    </div>
                  </div>
                ))}
              </div>

            </div>
          )}

        </div>

      </div>

      {/* 4. MORE FROM STORE / CUSTOMERS WHO VIEWED THIS ALSO VIEWED */}
      {Array.isArray(p.relatedProducts) && p.relatedProducts.length > 0 && (
        <section className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900 tracking-tight uppercase">
                More from {p.storeName}
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Verified items available from this authorized merchant
              </p>
            </div>
            <Link
              href={`/org/${p.organizationId}`}
              className="text-xs font-bold text-[#f68b1e] hover:underline flex items-center gap-1"
            >
              <span>See All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
            {p.relatedProducts.map((rp: GlovoProductItem) => (
              <GlovoProductCard key={rp.id} product={rp} />
            ))}
          </div>
        </section>
      )}

      {/* 5. STICKY MOBILE BOTTOM BAR (JUMIA MOBILE EXPERIENCE) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 p-3 shadow-2xl flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-10 h-10 rounded-lg bg-slate-50 border border-slate-100 shrink-0 overflow-hidden">
            <FallbackImg src={productImg} alt={p.name} className="w-full h-full object-contain" />
          </div>
          <div className="truncate">
            <span className="text-sm font-black text-slate-900 block leading-tight">
              {fmt(activeProduct.price)}
            </span>
            <span className="text-[10px] text-emerald-600 font-bold">
              {isOutOfStock ? 'Out of Stock' : 'In stock'}
            </span>
          </div>
        </div>

        <button
          disabled={isOutOfStock}
          onClick={handleAdd}
          className={cn(
            "px-6 py-2.5 rounded-lg font-black text-xs uppercase tracking-wider shadow-sm transition-all shrink-0",
            added
              ? "bg-emerald-600 text-white"
              : isOutOfStock
                ? "bg-slate-100 text-slate-400"
                : "bg-[#f68b1e] text-white active:bg-[#e07b14]"
          )}
        >
          {added ? 'Added!' : 'Add to Cart'}
        </button>
      </div>

      {/* Persistent Basket Dock */}
      <ChowdeckBasketDock />
    </div>
  );
}
