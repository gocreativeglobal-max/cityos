'use client';

import React from 'react';
import Link from 'next/link';
import { MessageCircle, Store, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface MerchantOnboardingBannerProps {
  className?: string;
  sourceContext?: string;
}

export default function MerchantOnboardingBanner({
  className,
  sourceContext = 'Marketplace Feed',
}: MerchantOnboardingBannerProps) {
  const whatsappMessage = [
    '*ONLINE STORE REGISTRATION INQUIRY — 9jaLive Calabar*',
    '────────────────────────────',
    '*Interest:* Open an Online Store on 9jaLive',
    '*City:* Calabar',
    `*Source:* ${sourceContext}`,
    '────────────────────────────',
    'Hello 9jaLive Team,',
    'I would like to open an online store for my business in Calabar on 9jaLive to list my products and accept orders.',
    'Please share the onboarding requirements and steps with me!',
  ].join('\n');

  const waUrl = `https://wa.me/2348065373747?text=${encodeURIComponent(whatsappMessage)}`;

  return (
    <div className={cn('relative w-full', className)}>
      <a
        href={waUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="group relative block w-full overflow-hidden rounded-2xl sm:rounded-3xl border border-slate-200 bg-white shadow-xs hover:shadow-md transition-all duration-300"
        title="Open an Online Store on 9jaLive — Contact on WhatsApp"
      >
        {/* Animated GIF Banner Graphic */}
        <div className="relative w-full aspect-[2304/480] min-h-[70px] sm:min-h-[90px] md:min-h-[110px] bg-slate-100 overflow-hidden">
          <img
            src="/images/banners/open-online-store.gif"
            alt="Open an Online Store on 9jaLive Calabar"
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.01]"
            loading="lazy"
          />
        </div>

        {/* Hover / Accessibility Overlay Bar (Subtle & Professional) */}
        <div className="flex items-center justify-between px-3.5 py-2 sm:px-5 sm:py-2.5 bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 text-white text-[11px] sm:text-xs">
          <div className="flex items-center gap-2 font-medium text-slate-200">
            <Store className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>Own a business in Calabar? Start selling online today with 9jaLive.</span>
          </div>
          <div className="flex items-center gap-1.5 font-bold text-emerald-300 group-hover:text-emerald-200 transition-colors shrink-0">
            <MessageCircle className="w-3.5 h-3.5 fill-emerald-400 text-transparent" />
            <span className="hidden sm:inline">Chat with Onboarding Desk (+234 806 537 3747)</span>
            <span className="sm:hidden">Open on WhatsApp</span>
            <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </div>
      </a>
    </div>
  );
}
