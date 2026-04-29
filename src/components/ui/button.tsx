import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2.5 whitespace-nowrap font-body font-semibold uppercase tracking-wide transition-transform duration-75 cursor-pointer disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        primary:
          'bg-foreground text-background border-[1.5px] border-foreground rounded-[4px] hover:translate-y-[-1px] active:translate-y-0',
        accent:
          'bg-accent text-accent-foreground border-[1.5px] border-accent rounded-[4px] hover:translate-y-[-1px] active:translate-y-0',
        outline:
          'bg-transparent text-foreground border-[1.5px] border-foreground rounded-[4px] hover:bg-foreground hover:text-background',
        ghost:
          'bg-transparent text-foreground border-[1.5px] border-border rounded-[4px] hover:bg-elevated',
      },
      size: {
        sm: 'h-9 px-3.5 text-[13px]',
        md: 'h-12 px-5.5 text-[14px]',
        lg: 'h-[58px] px-7.5 text-[16px]',
        icon: 'h-9 w-9 p-0',
        'icon-sm': 'h-7 w-7 p-0',
      },
      full: { true: 'w-full' },
    },
    defaultVariants: { variant: 'primary', size: 'md' },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  full?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, full, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, full, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
