import Link from 'next/link';
import { cn } from '@/lib/utils';

interface BrandMarkProps {
  size?: 'sm' | 'md' | 'lg';
  asLink?: boolean;
  className?: string;
}

const sizeMap = {
  sm: 'text-[22px]',
  md: 'text-[30px]',
  lg: 'text-[44px]',
};

export function BrandMark({ size = 'md', asLink = true, className }: BrandMarkProps) {
  const dotSize = size === 'lg' ? 'w-2 h-2' : size === 'md' ? 'w-1.5 h-1.5' : 'w-1 h-1';
  const translate = size === 'lg' ? '-translate-y-2' : '-translate-y-1.5';

  const content = (
    <div className={cn('inline-flex items-baseline gap-1', className)}>
      <span className={cn('font-display font-extrabold tracking-tight italic', sizeMap[size])}>
        easy
      </span>
      <div className={cn('rounded-full bg-accent', dotSize, translate)} />
      <span className={cn('font-display tracking-tight', sizeMap[size])}>ticket</span>
    </div>
  );

  return asLink ? <Link href="/">{content}</Link> : content;
}
