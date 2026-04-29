'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { formatBRLFromCents, formatEventDate } from '@/lib/format';
import { cn } from '@/lib/utils';

export interface EventCardData {
  slug: string;
  title: string;
  category: string;
  startsAt: string;
  posterUrl: string;
  priceFromCents: number;
  venue: { name: string; city: string };
}

interface EventCardProps {
  event: EventCardData;
  className?: string;
}

const CATEGORY_LABEL: Record<string, string> = {
  SHOW: 'Show',
  FESTIVAL: 'Festival',
  BALADA: 'Balada',
  INFANTIL: 'Infantil',
  TEATRO: 'Teatro',
};

export function EventCard({ event, className }: EventCardProps) {
  const time = new Date(event.startsAt).toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <Link href={`/eventos/${event.slug}`} className="block">
      <motion.div
        className={cn(
          'group bg-card border border-border rounded-[20px] overflow-hidden cursor-pointer',
          'hover:border-accent transition-colors',
          className
        )}
        whileHover={{ y: -4 }}
        transition={{ duration: 0.18 }}
      >
        <div
          className="relative aspect-[4/3]"
          style={{ background: event.posterUrl }}
        >
          <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-[10px] font-mono font-semibold tracking-[0.5px] uppercase text-white">
            {CATEGORY_LABEL[event.category] ?? event.category}
          </div>
          <div className="absolute bottom-3 left-3 font-mono text-[11px] text-white tracking-[0.8px] [text-shadow:0_1px_2px_rgba(0,0,0,0.6)]">
            {formatEventDate(event.startsAt)} · {time}
          </div>
        </div>

        <div className="p-[18px]">
          <div className="font-display text-[20px] font-bold tracking-[-0.4px] leading-[1.15] mb-1.5 line-clamp-2">
            {event.title}
          </div>
          <div className="text-[13px] text-ink-muted mb-3.5 flex items-center gap-1.5">
            <PinIcon className="w-3 h-3 shrink-0" />
            <span className="truncate">
              {event.venue.name} · {event.venue.city}
            </span>
          </div>
          <div className="flex items-end justify-between gap-3">
            <div>
              <div className="text-[10px] text-ink-dim font-mono tracking-[0.6px] uppercase">
                A partir de
              </div>
              <div className="font-display text-[22px] font-bold tracking-[-0.4px]">
                {formatBRLFromCents(event.priceFromCents)}
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </Link>
  );
}

function PinIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M12 21s-7-6.5-7-12a7 7 0 0114 0c0 5.5-7 12-7 12z"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <circle cx="12" cy="9" r="2.5" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}
