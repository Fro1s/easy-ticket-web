import type { MetadataRoute } from 'next';
import { SITE_URL, fetchPublishedEventSlugs } from '@/lib/seo';

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, changeFrequency: 'daily', priority: 1 },
    { url: `${SITE_URL}/eventos`, changeFrequency: 'daily', priority: 0.9 },
    { url: `${SITE_URL}/manifesto`, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${SITE_URL}/produtores`, changeFrequency: 'monthly', priority: 0.5 },
  ];

  const slugs = await fetchPublishedEventSlugs();
  const eventRoutes: MetadataRoute.Sitemap = slugs.map((slug) => ({
    url: `${SITE_URL}/eventos/${slug}`,
    changeFrequency: 'daily',
    priority: 0.8,
  }));

  return [...staticRoutes, ...eventRoutes];
}
