import { MetadataRoute } from 'next';
import { ALL_FORMAT_KEYS } from '@/lib/constants';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://mtg-common-uncommon-vercel.vercel.app';

export default function sitemap(): MetadataRoute.Sitemap {
  const formatUrls: MetadataRoute.Sitemap = ALL_FORMAT_KEYS
    .filter((key) => key !== 'y1993_2003')
    .map((key) => ({
      url: `${siteUrl}/${key}`,
      changeFrequency: 'hourly',
      priority: 0.8,
    }));

  return [
    {
      url: siteUrl,
      changeFrequency: 'hourly',
      priority: 1.0,
    },
    ...formatUrls,
  ];
}
