import { cn } from '@/lib/utils';
import { formatBRL } from '@/lib/format';

interface SectorRowProps {
  name: string;
  colorHex: string;
  price: number;
  available: number;
  selected?: boolean;
  onClick?: () => void;
  className?: string;
}

export function SectorRow({
  name,
  colorHex,
  price,
  available,
  selected = false,
  onClick,
  className,
}: SectorRowProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-center gap-3 px-3 py-2.5 rounded-[2px] border-[1.5px] cursor-pointer w-full text-left transition-colors',
        selected
          ? 'border-accent bg-accent text-accent-foreground'
          : 'border-border bg-transparent hover:border-foreground',
        className
      )}
    >
      <div
        className="w-3 h-3 border-[1.5px] border-ink shrink-0"
        style={{ backgroundColor: colorHex }}
      />
      <div className="flex-1 text-sm font-semibold">{name}</div>
      <div
        className={cn(
          'font-mono text-[11px]',
          selected ? 'text-accent-foreground/70' : 'text-ink-muted',
        )}
      >
        {available} disp.
      </div>
      <div className="font-display text-xl font-extrabold tracking-tight">
        {formatBRL(price)}
      </div>
    </button>
  );
}
