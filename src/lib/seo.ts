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
