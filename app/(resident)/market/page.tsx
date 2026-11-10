import { Suspense } from 'react';
import { getVerticalsConfig } from '@/lib/actions/verticals-config';
import { getCityMarketFeed } from '@/app/actions/commerce';
import VerticalPausedNotice from '@/components/cityos/VerticalPausedNotice';
import CityMarket from '@/components/cityos/CityMarket';

export const dynamic = 'force-dynamic';

export default async function MarketPage() {
  const config = await getVerticalsConfig();
  if (!config.shops) {
    return <VerticalPausedNotice verticalName="Shop" verticalId="shops" />;
  }

  // Pre-fetch market feed on server so initial HTML is instantly rendered without blank skeleton
  const initialFeed = await getCityMarketFeed('calabar', 'All').catch(() => null);

  return (
    <Suspense fallback={<div className="min-h-screen" />}>
      <CityMarket initialFeed={initialFeed} />
    </Suspense>
  );
}
