import type { Metadata } from 'next';
import EventDetailClient from './event-detail-client';
import { fetchEventForMeta, buildEventMetadata } from '@/lib/seo';

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> },
): Promise<Metadata> {
  const { slug } = await params;
  const event = await fetchEventForMeta(slug);
  if (!event) return { title: 'Evento não encontrado' };
  return buildEventMetadata(event);
}

export default async function EventPage(
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  return <EventDetailClient slug={slug} />;
}
