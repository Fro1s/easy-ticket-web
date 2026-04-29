'use client';

import { cn } from '@/lib/utils';

interface CategoryChipProps {
  label: string;
  active?: boolean;
  onClick?: () => void;
}

export function CategoryChip({ label, active, onClick }: CategoryChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'h-10 px-4 rounded-full border text-[14px] font-medium tracking-[-0.2px] transition-colors whitespace-nowrap',
        active
          ? 'bg-accent text-accent-foreground border-accent'
          : 'bg-transparent text-foreground border-border hover:border-foreground'
      )}
    >
      {label}
    </button>
  );
}
