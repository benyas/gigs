import type { MetadataRoute } from 'next';
import { gigs, categories, cities } from '@/lib/api';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://gigs.ma';

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
    { url: `${baseUrl}/browse`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    { url: `${baseUrl}/a-propos`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    { url: `${baseUrl}/faq`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    { url: `${baseUrl}/contact`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.4 },
    { url: `${baseUrl}/conditions`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
    { url: `${baseUrl}/confidentialite`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
  ];

  // Dynamic gig pages
  let gigPages: MetadataRoute.Sitemap = [];
  try {
    const res = await gigs.list({ perPage: '1000' });
    gigPages = res.data.map((g: any) => ({
      url: `${baseUrl}/gig/${g.slug}`,
      lastModified: new Date(g.updatedAt || g.createdAt),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }));
  } catch {}

  // Category browse pages
  let categoryPages: MetadataRoute.Sitemap = [];
  try {
    const cats = await categories.list();
    categoryPages = cats.map((c: any) => ({
      url: `${baseUrl}/browse?categoryId=${c.id}`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.7,
    }));
  } catch {}

  // City browse pages
  let cityPages: MetadataRoute.Sitemap = [];
  try {
    const cityList = await cities.list();
    cityPages = cityList.map((c: any) => ({
      url: `${baseUrl}/browse?cityId=${c.id}`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.7,
    }));
  } catch {}

  return [...staticPages, ...gigPages, ...categoryPages, ...cityPages];
}
