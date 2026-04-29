import { cn } from '@/lib/utils';

interface FeeBadgeProps {
  fee: number;
  competitor: number;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeMap = {
  sm: 'h-7 px-2.5 text-[11px]',
  md: 'h-[34px] px-3 text-[12px]',
  lg: 'h-10 px-3.5 text-[14px]',
};

export function FeeBadge({ fee, competitor, size = 'md', className }: FeeBadgeProps) {
  const pct = Math.round((1 - fee / competitor) * 100);

  return (
    <div
      className={cn(
        'inline-flex items-center gap-2 border-[1.5px] font-mono font-bold tracking-[1px] uppercase rounded-[2px]',
        'bg-[rgba(209,255,77,0.14)] border-[rgba(209,255,77,0.45)] text-accent',
        '[.light_&]:bg-ticket [.light_&]:border-ink [.light_&]:text-ink',
        sizeMap[size],
        className
      )}
    >
      −{pct}% TAXA
    </div>
  );
}
