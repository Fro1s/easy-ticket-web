import { cn } from '@/lib/utils';

interface StampProps {
  children: React.ReactNode;
  rotate?: number;
  color?: 'accent' | 'ink' | 'forest';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const colorMap = {
  accent: 'border-vermillion text-vermillion',
  ink: 'border-ink text-ink',
  forest: 'border-forest text-forest',
};

const sizeMap = {
  sm: 'px-2.5 py-1 text-[11px]',
  md: 'px-3.5 py-1.5 text-[14px]',
  lg: 'px-4 py-2 text-[16px]',
};

export function Stamp({
  children,
  rotate = -4,
  color = 'accent',
  size = 'md',
  className,
}: StampProps) {
  return (
    <div
      className={cn(
        'inline-block border-2 font-mono font-bold tracking-[1.5px] uppercase rounded-[2px]',
        colorMap[color],
        sizeMap[size],
        className
      )}
      style={{ transform: `rotate(${rotate}deg)` }}
    >
      {children}
    </div>
  );
}
