import { cn } from '@/lib/utils';

interface PosterHeaderProps {
  title: string;
  subtitle?: string;
  dateLabel: string;
  dateFormatted: string;
  venueLabel: string;
  image: string;
  className?: string;
}

export function PosterHeader({
  title,
  subtitle,
  dateLabel,
  dateFormatted,
  venueLabel,
  image,
  className,
}: PosterHeaderProps) {
  return (
    <div
      className={cn(
        'bg-card border-2 border-ink rounded-[4px] p-6 shadow-[6px_6px_0_var(--ink)]',
        className
      )}
    >
      <div className="flex justify-between pb-4 border-b-[1.5px] border-ink mb-4">
        <div>
          <div className="font-mono text-[11px] tracking-[1.5px] uppercase text-ink-muted">
            {dateLabel}
          </div>
          <div className="font-display text-[32px] font-extrabold italic tracking-tight">
            {dateFormatted}
          </div>
        </div>
        <div className="font-mono text-[11px] text-right tracking-[1.5px] uppercase">
          {venueLabel}
        </div>
      </div>

      <div
        className="aspect-[21/11] rounded-[2px] relative overflow-hidden mb-5"
        style={{ background: image }}
      >
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_20%_30%,rgba(255,255,255,0.25),transparent_55%)]" />
        <div className="absolute bottom-7 left-7 right-7">
          <div className="font-display text-[128px] font-bold text-white leading-[0.85] tracking-[-5px]">
            {title}
          </div>
          {subtitle && (
            <div className="font-display text-[32px] font-normal italic text-white mt-1.5">
              {subtitle}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
