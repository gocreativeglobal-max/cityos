'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  MessageCircle,
  Search,
  Sparkles,
  MapPin,
  Tag,
  CheckCircle2,
  HelpCircle,
  ArrowRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ProductSourcingModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialQuery?: string;
  sourceContext?: string;
}

const CALABAR_AREAS = [
  'Anywhere in Calabar',
  'Marian Road',
  'State Housing Estate',
  'Watt Market',
  'Etta Agbor',
  'Federal Housing',
  'Calabar South',
  'University of Calabar (UNICAL)',
];

const CONDITIONS = [
  { id: 'any', label: 'Any Condition' },
  { id: 'brand_new', label: 'Brand New (Sealed)' },
  { id: 'us_used', label: 'US-Used / Pre-owned' },
  { id: 'original_refurb', label: 'Refurbished' },
];

export default function ProductSourcingModal({
  isOpen,
  onClose,
  initialQuery = '',
  sourceContext = 'CityMart Storefront',
}: ProductSourcingModalProps) {
  const [productName, setProductName] = useState(initialQuery);
  const [condition, setCondition] = useState('any');
  const [budget, setBudget] = useState('');
  const [area, setArea] = useState('Anywhere in Calabar');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (initialQuery) {
      setProductName(initialQuery);
    }
  }, [initialQuery]);

  if (!isOpen) return null;

  const handleSendToWhatsApp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!productName.trim()) return;

    setIsSubmitting(true);

    const conditionLabel =
      CONDITIONS.find((c) => c.id === condition)?.label || 'Any Condition';

    const messageLines = [
      '🛍️ *PRODUCT SOURCING REQUEST — 9jaLive Calabar*',
      '━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
      `*Item Needed:* ${productName.trim()}`,
      `*Condition:* ${conditionLabel}`,
      budget.trim() ? `*Budget:* ₦${budget.trim().replace(/^₦/, '')}` : '*Budget:* Flexible / Best Market Price',
      `*Preferred Area:* ${area}`,
      notes.trim() ? `*Specific Details / Notes:* ${notes.trim()}` : null,
      `*Source:* ${sourceContext}`,
      '━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
      'Hello 9jaLive team, I could not find this item in the CityMart catalog.',
      'Please help me contact verified sellers and wholesalers in Calabar to check availability, real prices, and delivery!',
    ].filter(Boolean);

    const fullMessage = messageLines.join('\n');
    const waUrl = `https://wa.me/2348065373747?text=${encodeURIComponent(fullMessage)}`;

    // Open WhatsApp
    window.open(waUrl, '_blank', 'noopener,noreferrer');

    setTimeout(() => {
      setIsSubmitting(false);
      onClose();
    }, 600);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="bg-gradient-to-r from-emerald-700 via-emerald-600 to-teal-700 p-5 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition-colors"
            title="Close"
          >
            <X className="w-4.5 h-4.5" />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-white/20 border border-white/30 flex items-center justify-center text-white shadow-inner">
              <MessageCircle className="w-6 h-6 fill-white/30" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-black tracking-wider bg-white/20 px-2 py-0.5 rounded-full text-emerald-100">
                  9jaLive Concierge
                </span>
                <span className="text-[10px] font-semibold text-emerald-200">
                  Calabar Sourcing Desk
                </span>
              </div>
              <h2 className="text-lg font-black text-white tracking-tight mt-0.5">
                Can't find a product? We'll get it!
              </h2>
            </div>
          </div>
          <p className="text-xs text-emerald-100/90 font-medium mt-2 leading-relaxed">
            Tell us what you need. 9jaLive contacts verified merchants, electronics distributors, and markets across Calabar to negotiate the best price for you.
          </p>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSendToWhatsApp} className="p-5 space-y-4 overflow-y-auto flex-1">
          {/* Product Name Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-800 flex items-center justify-between">
              <span>What item are you looking for? <span className="text-rose-500">*</span></span>
              <span className="text-[11px] font-medium text-slate-400">e.g. Model, Brand, Spec</span>
            </label>
            <div className="relative">
              <input
                type="text"
                required
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                placeholder="e.g. iPhone 13 Pro 256GB, Oraimo FreePods 4, 2HP Inverter AC..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 text-sm font-medium text-slate-900 placeholder:text-slate-400 outline-none transition-all"
                autoFocus
              />
            </div>
          </div>

          {/* Condition Selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-slate-500" />
              <span>Preferred Condition</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              {CONDITIONS.map((c) => (
                <button
                  type="button"
                  key={c.id}
                  onClick={() => setCondition(c.id)}
                  className={cn(
                    'px-3 py-2 rounded-xl text-xs font-semibold text-left border transition-all',
                    condition === c.id
                      ? 'bg-emerald-50 border-emerald-600 text-emerald-800 font-bold shadow-2xs'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  )}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          {/* Budget & Area in 2 Columns */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Target Budget */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-800">
                Target Budget (₦) <span className="text-slate-400 font-normal">(Optional)</span>
              </label>
              <input
                type="text"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                placeholder="e.g. 150,000 or Flexible"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 text-xs font-medium text-slate-900 placeholder:text-slate-400 outline-none transition-all"
              />
            </div>

            {/* Delivery Area in Calabar */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-800 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-slate-500" />
                <span>Preferred Calabar Area</span>
              </label>
              <select
                value={area}
                onChange={(e) => setArea(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 text-xs font-medium text-slate-800 bg-white outline-none transition-all"
              >
                {CALABAR_AREAS.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Additional Notes */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-800 flex items-center justify-between">
              <span>Specific Details or Features <span className="text-slate-400 font-normal">(Optional)</span></span>
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Prefer Blue color, must include warranty, urgent delivery today..."
              className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 text-xs font-medium text-slate-900 placeholder:text-slate-400 outline-none transition-all resize-none"
            />
          </div>

          {/* Trust Banner */}
          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-start gap-2.5 text-[11px] text-slate-600">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-slate-800">Direct WhatsApp Concierge: </span>
              Your request routes straight to <strong>9jaLive Calabar desk (+2348065373747)</strong>. We contact registered sellers across Marian, Watt, and Bogobiri, then reply with actual photos and price quotes.
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-1">
            <button
              type="submit"
              disabled={!productName.trim() || isSubmitting}
              className={cn(
                'w-full py-3 px-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2 shadow-md transition-all',
                !productName.trim() || isSubmitting
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/25 active:scale-[0.99]'
              )}
            >
              <MessageCircle className="w-4.5 h-4.5 fill-white" />
              <span>Connect on WhatsApp (+2348065373747)</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
