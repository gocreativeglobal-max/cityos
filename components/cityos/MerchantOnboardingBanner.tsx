'use client';

import React from 'react';
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
        className="group relative block w-full overflow-hidden rounded-2xl sm:rounded-3xl border border-slate-200/80 bg-white shadow-xs hover:shadow-md transition-all duration-300"
        title="Open an Online Store on 9jaLive — Contact on WhatsApp (+234 806 537 3747)"
      >
        {/* Animated GIF Banner Graphic */}
        <div className="relative w-full aspect-[2304/480] bg-slate-100 overflow-hidden">
          <img
            src="/images/banners/open-online-store.gif"
            alt="Open an Online Store on 9jaLive Calabar"
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.01]"
            loading="lazy"
          />
        </div>
      </a>
    </div>
  );
}
