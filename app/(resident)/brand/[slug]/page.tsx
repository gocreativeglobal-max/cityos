import { getResidentOrganization, getCanonicalOrganization } from '@/app/actions/org';
import BrandStorefrontView from '@/components/cityos/BrandStorefrontView';
import OrgProfile from '@/components/cityos/OrgProfile';
import Link from 'next/link';
import { Metadata } from 'next';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const resolved = await getResidentOrganization(slug);
  if (!resolved) {
    return { title: 'Brand Store | Calabar 9jaLive' };
  }
  const org = await getCanonicalOrganization(resolved.orgId);
  const brandTitle = org?.name || 'Official Brand Store';
  return {
    title: `${brandTitle} | Official Brand Flagship — Calabar 9jaLive`,
    description: org?.description || `Shop 100% genuine guaranteed products direct from the manufacturer in Calabar.`,
  };
}

export default async function BrandStorePage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { slug } = await params;
  const sParams = await searchParams;
  const initialSubBrand = typeof sParams?.brand === 'string' ? sParams.brand : 'all';

  const resolved = await getResidentOrganization(slug);

  if (!resolved) {
    return (
      <div className="max-w-lg mx-auto text-center py-20 space-y-4">
        <p className="text-5xl">🏢</p>
        <h1 className="text-lg font-black text-ink">Brand store not found</h1>
        <p className="text-sm text-slate-500">
          The requested official brand flagship is either not active or does not exist.
        </p>
        <Link
          href="/market"
          className="inline-block px-5 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-black hover:bg-blue-700 transition-colors"
        >
          Return to Market
        </Link>
      </div>
    );
  }

  const org = await getCanonicalOrganization(resolved.orgId);

  if (!org) {
    return (
      <div className="max-w-lg mx-auto text-center py-20 space-y-4">
        <p className="text-5xl">🏢</p>
        <h1 className="text-lg font-black text-ink">Brand data unavailable</h1>
        <Link
          href="/market"
          className="inline-block px-5 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-black hover:bg-blue-700 transition-colors"
        >
          Return to Market
        </Link>
      </div>
    );
  }

  // If this organization is flagged as an official brand store or is Unilever
  if (org.id === 'unilever-store' || org.metadata?.isOfficialBrandStore) {
    return (
      <div className="max-w-5xl mx-auto">
        <BrandStorefrontView
          org={org}
          products={org.productsData || []}
          initialSubBrand={initialSubBrand}
        />
      </div>
    );
  }

  // Fallback to standard OrgProfile
  return <OrgProfile id={org.id} />;
}
