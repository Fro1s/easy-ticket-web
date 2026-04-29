import * as React from 'react';
import { cn } from '@/lib/utils';

type InputProps = React.ComponentProps<'input'>;

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = 'text', ...props }, ref) => {
    return (
      <input
        ref={ref}
        type={type}
        data-slot="input"
        className={cn(
          'h-12 w-full bg-input border-[1.5px] border-border rounded-[4px] px-4',
          'font-body text-[15px] text-foreground placeholder:text-ink-dim',
          'outline-none transition-[border-color,box-shadow] duration-75',
          'focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent/30',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          'aria-[invalid=true]:border-destructive aria-[invalid=true]:ring-2 aria-[invalid=true]:ring-destructive/25',
          'file:inline-flex file:h-8 file:border-0 file:bg-transparent file:text-sm file:font-medium',
          className,
        )}
        {...props}
      />
    );
  },
);
Input.displayName = 'Input';

export { Input };
