import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl =
    process.env.NEXTAUTH_URL && !process.env.NEXTAUTH_URL.includes('vercel.app')
      ? process.env.NEXTAUTH_URL
      : 'https://9jalive.online';

  return {
    rules: [
      {
        userAgent: '*',
        allow: [
          '/',
          '/market',
          '/food',
          '/stay',
          '/directory',
          '/events',
          '/jobs',
          '/services',
          '/site/',
          '/org/',
        ],
        disallow: [
          '/hq/',
          '/(hq)/',
          '/admin/',
          '/(admin)/',
          '/courier/',
          '/api/',
          '/checkout/',
          '/profile/',
          '/wallet/',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
