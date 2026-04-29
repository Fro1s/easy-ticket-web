import { cn } from '@/lib/utils';

interface SectionHeadingProps {
  kicker: string;
  children: React.ReactNode;
  className?: string;
}

export function SectionHeading({ kicker, children, className }: SectionHeadingProps) {
  return (
    <div className={cn(className)}>
      <div className="font-mono text-xs tracking-[2px] uppercase text-vermillion mb-2">
        — {kicker}
      </div>
      <h2 className="font-display text-6xl font-normal tracking-tight leading-[0.95] m-0">
        {children}
      </h2>
    </div>
  );
}
