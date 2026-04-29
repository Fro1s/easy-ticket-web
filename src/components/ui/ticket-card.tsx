'use client';

import { cn } from '@/lib/utils';
import { FeeBadge } from './fee-badge';
import { formatBRL } from '@/lib/format';
import { motion } from 'framer-motion';

interface TicketCardProps {
  title: string;
  category: string;
  venue: string;
  city: string;
  dateStr: string;
  number: string;
  priceFrom: number;
  fee: number;
  competitorFee: number;
  image: string;
  rotateDirection?: 'left' | 'right';
  className?: string;
  onClick?: () => void;
}

export function TicketCard({
  title,
  category,
  venue,
  city,
  dateStr,
  number,
  priceFrom,
  fee,
  competitorFee,
  image,
  rotateDirection = 'left',
  className,
  onClick,
}: TicketCardProps) {
  const initialRotate = rotateDirection === 'left' ? -0.5 : 0.4;

  return (
    <motion.div
      className={cn(
        'bg-card border-[1.5px] border-ink rounded-[4px] overflow-hidden relative cursor-pointer',
        className
      )}
      initial={{ rotate: initialRotate }}
      whileHover={{ y: -6, rotate: 0, boxShadow: '6px 6px 0 var(--ink)' }}
      transition={{ duration: 0.2 }}
      onClick={onClick}
    >
      <div
        className="relative aspect-[4/3] border-b-[1.5px] border-ink"
        style={{ background: image }}
      >
        <div className="absolute top-2.5 left-2.5 px-2 py-0.5 bg-paper border border-ink rounded-[2px] font-mono text-[10px] font-bold tracking-[1px] uppercase">
          {category}
        </div>
        <div className="absolute top-2.5 right-2.5">
          <FeeBadge fee={fee} competitor={competitorFee} size="sm" />
        </div>
        <div className="absolute bottom-2.5 left-2.5 right-2.5 flex justify-between font-mono text-[10px] text-white tracking-[1px] uppercase [text-shadow:0_1px_2px_rgba(0,0,0,0.4)]">
          <span>№ {number}</span>
          <span>{dateStr}</span>
        </div>
      </div>

      <div className="relative h-4 flex items-center">
        <div className="absolute -left-2 top-0 w-4 h-4 rounded-full bg-paper border-[1.5px] border-ink" />
        <div className="absolute -right-2 top-0 w-4 h-4 rounded-full bg-paper border-[1.5px] border-ink" />
        <div className="flex-1 border-t-[1.5px] border-dashed border-border mx-5" />
      </div>

      <div className="p-5">
        <div className="font-display text-2xl font-bold tracking-tight leading-[1.1] mb-2">
          {title}
        </div>
        <div className="text-xs text-ink-muted mb-4 flex items-center gap-1.5">
          📍 {venue} · {city}
        </div>
        <div className="flex justify-between items-baseline pt-3.5 border-t border-border">
          <div>
            <div className="font-mono text-[10px] text-ink-muted tracking-[1px] uppercase">
              A partir de
            </div>
            <div className="font-display text-2xl font-extrabold tracking-tight">
              {formatBRL(priceFrom)}
            </div>
          </div>
          <span className="text-ink text-xl">→</span>
        </div>
      </div>
    </motion.div>
  );
}
