import type { Metadata } from 'next'

export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
export const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

export interface EventMetaSource {
  slug: string
  title: string
  artist?: string | null
  description?: string | null
  startsAt?: string | null
  posterUrl?: string | null
  venue?: { name?: string | null; city?: string | null; state?: string | null } | null
}

export function buildEventDescription(e: EventMetaSource): string {
  const parts = [e.artist, e.venue?.name, e.venue?.city].filter(Boolean) as string[]
  const head = parts.join(' · ')
  return head ? `${head}. Ingressos no Easy Ticket.` : 'Ingressos no Easy Ticket.'
}

export function buildEventMetadata(e: EventMetaSource): Metadata {
  const description = buildEventDescription(e)
  return {
    title: e.title,
    description,
    openGraph: { title: e.title, description, type: 'website' },
    alternates: { canonical: `/eventos/${e.slug}` },
  }
}

export async function fetchEventForMeta(slug: string): Promise<EventMetaSource | null> {
  try {
    const res = await fetch(`${API_BASE}/api/v1/events/${slug}`, { next: { revalidate: 300 } });
    if (!res.ok) return null;
    return (await res.json()) as EventMetaSource;
  } catch {
    return null;
  }
}

export async function fetchPublishedEventSlugs(maxPages = 10, pageSize = 100): Promise<string[]> {
  const slugs: string[] = [];
  for (let page = 1; page <= maxPages; page++) {
    let data: { items?: { slug?: string }[]; total?: number } | null = null;
    try {
      const res = await fetch(`${API_BASE}/api/v1/events?page=${page}&pageSize=${pageSize}`, {
        next: { revalidate: 3600 },
      });
      if (!res.ok) break;
      data = await res.json();
    } catch {
      break;
    }
    const items = data?.items ?? [];
    for (const it of items) if (it?.slug) slugs.push(it.slug);
    const total = data?.total ?? slugs.length;
    if (items.length < pageSize || slugs.length >= total) break;
  }
  return slugs;
}
