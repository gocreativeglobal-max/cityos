import React from 'react';
import type { Metadata } from 'next';
import { getDirectoryListings } from '@/app/actions/directory';
import DirectoryView from '@/components/cityos/DirectoryView';
import { PILOT_SHOP_ONLY_MODE } from '@/lib/verticals-constants';
import VerticalPausedNotice from '@/components/cityos/VerticalPausedNotice';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Calabar Business Directory | 9jaLive',
  description: 'Find verified businesses, mechanics, pharmacies, legal chambers, artisans, and hotels across Calabar. Call or WhatsApp directly.',
};

export default async function DirectoryPage() {
  if (PILOT_SHOP_ONLY_MODE) {
    return (
      <VerticalPausedNotice
        verticalName="Business Directory"
        verticalId="directory"
        description="The City Business Directory is temporarily paused for this pilot stage. Explore our verified stores and products in the 9jaLive Shop."
      />
    );
  }

  const data = await getDirectoryListings();

  return (
    <DirectoryView
      initialListings={data.listings}
      zones={data.zones}
      cityName={data.cityName}
    />
  );
}
