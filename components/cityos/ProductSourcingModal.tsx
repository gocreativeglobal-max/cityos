'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  MessageCircle,
  MapPin,
  Tag,
  CheckCircle2,
  ArrowRight,
  PackageSearch,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ProductSourcingModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialQuery?: string;
  sourceContext?: string;
}

const CONDITIONS = [
  { id: 'any', label: 'Any Condition' },
  { id: 'brand_new', label: 'Brand New (Sealed)' },
  { id: 'pre_owned', label: 'Pre-owned / Foreign Used' },
  { id: 'refurbished', label: 'Refurbished' },
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
      '*PRODUCT SOURCING INQUIRY — 9jaLive Calabar*',
      '────────────────────────────',
      `*Item Requested:* ${productName.trim()}`,
      `*Preferred Condition:* ${conditionLabel}`,
      budget.trim() ? `*Budget / Target Price:* ₦${budget.trim().replace(/^₦/, '')}` : '*Budget:* Market Rate / Flexible',
      '*City:* Calabar',
      notes.trim() ? `*Specifications / Notes:* ${notes.trim()}` : null,
      `*Inquiry Channel:* ${sourceContext}`,
      '────────────────────────────',
      'Hello 9jaLive Team,',
      'I am requesting assistance to locate this product in Calabar.',
      'Please check availability with verified merchants and share confirmed pricing and delivery details.',
    ].filter(Boolean);

    const fullMessage = messageLines.join('\n');
    const waUrl = `https://wa.me/2348065373747?text=${encodeURIComponent(fullMessage)}`;

    window.open(waUrl, '_blank', 'noopener,noreferrer');

    setTimeout(() => {
      setIsSubmitting(false);
      onClose();
    }, 600);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-slate-900 p-5 text-white relative border-b border-slate-800">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
              <PackageSearch className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-400">
                  9jaLive Sourcing Desk
                </span>
                <span className="text-slate-500 text-xs">•</span>
                <span className="text-[11px] font-medium text-slate-300 flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-emerald-400" />
                  Calabar
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight mt-0.5">
                Can&apos;t find a product? Request Sourcing
              </h2>
            </div>
          </div>
          <p className="text-xs text-slate-300 font-normal mt-2.5 leading-relaxed">
            Provide the product details below. Our team coordinates directly with verified merchants in Calabar to confirm stock, specifications, and pricing.
          </p>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSendToWhatsApp} className="p-5 space-y-4 overflow-y-auto flex-1">
          {/* Product Name Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-800 flex items-center justify-between">
              <span>Product Name or Description <span className="text-rose-500">*</span></span>
              <span className="text-[11px] font-normal text-slate-400">Brand, model, or specs</span>
            </label>
            <input
              type="text"
              required
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              placeholder="e.g. iPhone 13 Pro 256GB, HP EliteBook 840 G7, 1.5HP Inverter AC"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-slate-800 focus:ring-1 focus:ring-slate-800 text-sm font-medium text-slate-900 placeholder:text-slate-400 outline-none transition-all"
              autoFocus
            />
          </div>

          {/* Condition Selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
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
                    'px-3 py-2 rounded-xl text-xs font-medium text-left border transition-all',
                    condition === c.id
                      ? 'bg-slate-900 border-slate-900 text-white font-semibold shadow-xs'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  )}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          {/* Budget and Location */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Target Budget */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-800">
                Target Budget (₦) <span className="text-slate-400 font-normal">(Optional)</span>
              </label>
              <input
                type="text"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                placeholder="e.g. 180,000"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:border-slate-800 focus:ring-1 focus:ring-slate-800 text-xs font-medium text-slate-900 placeholder:text-slate-400 outline-none transition-all"
              />
            </div>

            {/* City Location - Clean Static Display */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-800 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-slate-500" />
                <span>Service City</span>
              </label>
              <div className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-800 flex items-center justify-between">
                <span>Calabar</span>
                <span className="text-[10px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                  Active City
                </span>
              </div>
            </div>
          </div>

          {/* Additional Notes */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-800 flex items-center justify-between">
              <span>Additional Specifications <span className="text-slate-400 font-normal">(Optional)</span></span>
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Color preference, required warranty, urgency, or specific model variant..."
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:border-slate-800 focus:ring-1 focus:ring-slate-800 text-xs font-medium text-slate-900 placeholder:text-slate-400 outline-none transition-all resize-none"
            />
          </div>

          {/* Desk Routing Notice */}
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/90 flex items-start gap-2.5 text-[11px] text-slate-600">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-slate-800">Calabar Sourcing Desk: </span>
              Inquiries are received by the <strong>9jaLive team (+234 806 537 3747)</strong>, who check verified merchant stock in Calabar and reply with genuine item photos and current prices.
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-1">
            <button
              type="submit"
              disabled={!productName.trim() || isSubmitting}
              className={cn(
                'w-full py-3 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-sm transition-all',
                !productName.trim() || isSubmitting
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white active:scale-[0.99]'
              )}
            >
              <MessageCircle className="w-4.5 h-4.5 fill-white" />
              <span>Contact Sourcing Desk (+234 806 537 3747)</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
