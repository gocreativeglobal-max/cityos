'use client';

import React, { useState, useRef, useEffect } from 'react';
import { SlidersHorizontal, X, Check, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface PriceRangeValue {
  preset: string; // 'all' | 'under-10k' | '10k-50k' | '50k-200k' | '200k-500k' | 'above-500k' | 'custom'
  min?: number;
  max?: number;
}

export const PRICE_PRESETS: { id: string; label: string; min?: number; max?: number }[] = [
  { id: 'all', label: 'All Prices' },
  { id: 'under-10k', label: 'Under ₦10,000', max: 10000 },
  { id: '10k-50k', label: '₦10,000 – ₦50,000', min: 10000, max: 50000 },
  { id: '50k-200k', label: '₦50,000 – ₦200,000', min: 50000, max: 200000 },
  { id: '200k-500k', label: '₦200,000 – ₦500,000', min: 200000, max: 500000 },
  { id: 'above-500k', label: 'Above ₦500,000', min: 500000 },
];

export function getPriceFilterLabel(value: PriceRangeValue): string {
  if (value.preset === 'custom') {
    if (value.min !== undefined && value.max !== undefined) {
      return `₦${value.min.toLocaleString()} – ₦${value.max.toLocaleString()}`;
    }
    if (value.min !== undefined) {
      return `≥ ₦${value.min.toLocaleString()}`;
    }
    if (value.max !== undefined) {
      return `≤ ₦${value.max.toLocaleString()}`;
    }
    return 'Custom Price';
  }
  const found = PRICE_PRESETS.find((p) => p.id === value.preset);
  return found && found.id !== 'all' ? found.label : 'All Prices';
}

interface PriceFilterPopoverProps {
  value: PriceRangeValue;
  onChange: (val: PriceRangeValue) => void;
  className?: string;
  theme?: 'blue' | 'emerald' | 'slate';
}

export default function PriceFilterPopover({
  value,
  onChange,
  className,
  theme = 'slate',
}: PriceFilterPopoverProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [customMin, setCustomMin] = useState<string>(value.min !== undefined ? String(value.min) : '');
  const [customMax, setCustomMax] = useState<string>(value.max !== undefined ? String(value.max) : '');
  const containerRef = useRef<HTMLDivElement>(null);

  // Sync internal state if prop changes
  useEffect(() => {
    if (value.preset === 'custom') {
      setCustomMin(value.min !== undefined ? String(value.min) : '');
      setCustomMax(value.max !== undefined ? String(value.max) : '');
    } else {
      setCustomMin('');
      setCustomMax('');
    }
  }, [value]);

  // Click outside to close
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const isFiltered = value.preset !== 'all' && (value.preset !== 'custom' || value.min !== undefined || value.max !== undefined);
  const activeLabel = getPriceFilterLabel(value);

  const handleSelectPreset = (presetId: string) => {
    if (presetId === 'all') {
      onChange({ preset: 'all' });
      setCustomMin('');
      setCustomMax('');
      setIsOpen(false);
      return;
    }
    const found = PRICE_PRESETS.find((p) => p.id === presetId);
    if (found) {
      onChange({
        preset: found.id,
        min: found.min,
        max: found.max,
      });
      setIsOpen(false);
    }
  };

  const handleApplyCustom = (e: React.FormEvent) => {
    e.preventDefault();
    const minNum = customMin.trim() !== '' ? Math.max(0, parseFloat(customMin.replace(/,/g, ''))) : undefined;
    const maxNum = customMax.trim() !== '' ? Math.max(0, parseFloat(customMax.replace(/,/g, ''))) : undefined;

    if (minNum === undefined && maxNum === undefined) {
      onChange({ preset: 'all' });
      setIsOpen(false);
      return;
    }

    onChange({
      preset: 'custom',
      min: minNum,
      max: maxNum,
    });
    setIsOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange({ preset: 'all' });
    setCustomMin('');
    setCustomMax('');
  };

  const accentRing =
    theme === 'emerald'
      ? 'focus-within:ring-emerald-500'
      : theme === 'blue'
      ? 'focus-within:ring-blue-500'
      : 'focus-within:ring-slate-900';

  const activeBtnClass =
    theme === 'emerald'
      ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
      : theme === 'blue'
      ? 'bg-blue-50 border-blue-300 text-blue-800'
      : 'bg-slate-900 border-slate-900 text-white';

  const activeChipClass =
    theme === 'emerald'
      ? 'bg-emerald-600 text-white shadow-sm'
      : theme === 'blue'
      ? 'bg-blue-600 text-white shadow-sm'
      : 'bg-slate-900 text-white shadow-sm';

  const applyBtnClass =
    theme === 'emerald'
      ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
      : theme === 'blue'
      ? 'bg-blue-600 hover:bg-blue-700 text-white'
      : 'bg-slate-900 hover:bg-slate-800 text-white';

  return (
    <div ref={containerRef} className={cn('relative inline-block text-left', className)}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={cn(
          'inline-flex items-center gap-1.5 px-3 py-2 sm:py-2.5 rounded-xl border text-xs font-bold transition-all whitespace-nowrap shadow-2xs',
          isFiltered
            ? activeBtnClass
            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300'
        )}
      >
        <SlidersHorizontal className="w-3.5 h-3.5 shrink-0 opacity-70" />
        <span className="truncate max-w-[150px]">
          {isFiltered ? activeLabel : 'Price Range'}
        </span>
        {isFiltered ? (
          <span
            onClick={handleClear}
            className="ml-0.5 p-0.5 rounded-full hover:bg-black/10 transition-colors"
            title="Reset price filter"
          >
            <X className="w-3 h-3" />
          </span>
        ) : (
          <span className="text-[10px] text-slate-400 font-normal">▼</span>
        )}
      </button>

      {/* Floating Popover Panel */}
      {isOpen && (
        <div className="absolute left-0 sm:right-0 sm:left-auto mt-2 w-72 sm:w-80 rounded-2xl bg-white border border-slate-200 shadow-xl p-4 z-50 animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 mb-3">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-black text-slate-900">Filter by Price</span>
              {isFiltered && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              )}
            </div>
            {isFiltered && (
              <button
                type="button"
                onClick={() => {
                  onChange({ preset: 'all' });
                  setCustomMin('');
                  setCustomMax('');
                }}
                className="text-[11px] font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" />
                Reset
              </button>
            )}
          </div>

          {/* Quick Price Preset Chips */}
          <div className="space-y-1.5">
            <span className="text-[10px] uppercase tracking-wider font-extrabold text-slate-400 block">
              Quick Price Ranges
            </span>
            <div className="grid grid-cols-2 gap-1.5">
              {PRICE_PRESETS.map((p) => {
                const isSelected = value.preset === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleSelectPreset(p.id)}
                    className={cn(
                      'px-2.5 py-1.5 rounded-lg text-xs font-semibold text-left transition-all flex items-center justify-between',
                      isSelected
                        ? activeChipClass
                        : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
                    )}
                  >
                    <span className="truncate">{p.label}</span>
                    {isSelected && <Check className="w-3 h-3 shrink-0 ml-1" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom Price Range Form */}
          <form onSubmit={handleApplyCustom} className="mt-3.5 pt-3 border-t border-slate-100 space-y-2.5">
            <span className="text-[10px] uppercase tracking-wider font-extrabold text-slate-400 block">
              Custom Range (₦)
            </span>
            <div className="flex items-center gap-2">
              <div className={cn('flex-1 rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-1.5 transition-all ring-1 ring-transparent', accentRing)}>
                <label className="text-[9px] text-slate-400 uppercase font-black block">Min ₦</label>
                <input
                  type="number"
                  min="0"
                  step="500"
                  placeholder="0"
                  value={customMin}
                  onChange={(e) => setCustomMin(e.target.value)}
                  className="w-full bg-transparent text-xs font-bold text-slate-900 focus:outline-none"
                />
              </div>

              <span className="text-slate-300 font-bold">—</span>

              <div className={cn('flex-1 rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-1.5 transition-all ring-1 ring-transparent', accentRing)}>
                <label className="text-[9px] text-slate-400 uppercase font-black block">Max ₦</label>
                <input
                  type="number"
                  min="0"
                  step="500"
                  placeholder="Any"
                  value={customMax}
                  onChange={(e) => setCustomMax(e.target.value)}
                  className="w-full bg-transparent text-xs font-bold text-slate-900 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                type="submit"
                className={cn('flex-1 py-2 rounded-xl text-xs font-black shadow transition-all active:scale-95 text-center', applyBtnClass)}
              >
                Apply Range
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="px-3 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
