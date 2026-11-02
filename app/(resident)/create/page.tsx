import CityCreate from '@/components/cityos/CityCreate';
import { PILOT_SHOP_ONLY_MODE, BUSINESS_CREATION_ENABLED } from '@/lib/verticals-constants';
import VerticalPausedNotice from '@/components/cityos/VerticalPausedNotice';

export default function CityCreatePage() {
  if (PILOT_SHOP_ONLY_MODE || !BUSINESS_CREATION_ENABLED) {
    return (
      <VerticalPausedNotice
        verticalName="Business & Hub Creation"
        verticalId="create"
        description="Business registration is temporarily paused for this phase of the shopping pilot. Explore our verified stores and goods in the 9jaLive Shop."
      />
    );
  }

  return (
    <div className="py-6">
      <CityCreate />
    </div>
  );
}