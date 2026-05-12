import { MetadataRoute } from 'next';
import { serverFetch } from '@/lib/fetchWithTimeout';

const BASE_URL = 'https://ai-festivals-platform.vercel.app';

interface Event {
  id: string;
  scrapedAt?: string;
}

interface EventsResponse {
  events: Event[];
  total: number;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: BASE_URL, lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
    { url: `${BASE_URL}/events`, lastModified: new Date(), changeFrequency: 'hourly', priority: 0.9 },
    { url: `${BASE_URL}/api-docs`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
  ];

  const { data } = await serverFetch<EventsResponse>('/api/events?limit=100&sort=date', 8000);
  if (!data?.events?.length) return staticRoutes;

  const eventRoutes: MetadataRoute.Sitemap = data.events.map((e) => ({
    url: `${BASE_URL}/events/${e.id}`,
    lastModified: e.scrapedAt ? new Date(e.scrapedAt) : new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }));

  return [...staticRoutes, ...eventRoutes];
}
