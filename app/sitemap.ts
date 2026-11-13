import type { MetadataRoute } from 'next';
import { db } from '@/src/prisma/db';
import { isTestOrDemoOrganization } from '@/lib/storefront-filter';

export const dynamic = 'force-dynamic';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl =
    process.env.NEXTAUTH_URL && !process.env.NEXTAUTH_URL.includes('vercel.app')
      ? process.env.NEXTAUTH_URL
      : 'https://9jalive.online';

  const now = new Date();

  // Core public surfaces
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/market`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/food`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/stay`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/directory`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.85,
    },
    {
      url: `${baseUrl}/events`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/jobs`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/services`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/business/register`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/business/claim`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.6,
    },
  ];

  const dynamicRoutes: MetadataRoute.Sitemap = [];

  try {
    // 1. Published Microsite Storefronts
    const microsites = await db.orm.public.Microsite.where({ status: 'published' }).all();
    for (const site of microsites) {
      if (site.slug) {
        dynamicRoutes.push({
          url: `${baseUrl}/site/${site.slug}`,
          lastModified: now,
          changeFrequency: 'weekly',
          priority: 0.8,
        });
      }
    }
  } catch (err) {
    console.error('[Sitemap] Failed to load microsites:', err);
  }

  try {
    // 2. Verified Active Organizations & Restaurants
    const orgs = await db.orm.public.Organization.where({ status: 'ACTIVE' }).all();
    for (const org of orgs) {
      if (
        !isTestOrDemoOrganization({
          id: org.id,
          name: org.name,
        })
      ) {
        if (org.type === 'RESTAURANT') {
          dynamicRoutes.push({
            url: `${baseUrl}/food/${org.id}`,
            lastModified: now,
            changeFrequency: 'daily',
            priority: 0.8,
          });
        }
        dynamicRoutes.push({
          url: `${baseUrl}/org/${org.id}`,
          lastModified: now,
          changeFrequency: 'weekly',
          priority: 0.7,
        });
      }
    }
  } catch (err) {
    console.error('[Sitemap] Failed to load organizations:', err);
  }

  return [...staticRoutes, ...dynamicRoutes];
}
