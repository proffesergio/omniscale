import type { MetadataRoute } from 'next';
import { blueprints } from '@/lib/blueprints';
export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  return [
    '/',
    '/calculator',
    '/case-studies',
    '/audit',
    '/booking',
    '/privacy',
    ...blueprints.map((b) => `/case-studies/${b.slug}`),
  ].map((path) => ({
    url: `${base}${path}`,
    changeFrequency: 'monthly',
    priority: path === '/' ? 1 : 0.7,
  }));
}
