import * as React from 'react';
import { cn } from '@/lib/utils';

interface FieldProps {
  label: string;
  hint?: string;
  error?: string;
  htmlFor?: string;
  className?: string;
  children: React.ReactNode;
}

export function Field({ label, hint, error, htmlFor, className, children }: FieldProps) {
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <label
        htmlFor={htmlFor}
        className="font-mono text-[11px] tracking-[1.5px] uppercase text-ink-muted"
      >
        {label}
      </label>
      {children}
      {error ? (
        <p className="font-mono text-[11px] tracking-[0.5px] text-destructive mt-0.5">
          {error}
        </p>
      ) : hint ? (
        <p className="text-[12px] text-ink-dim leading-snug">{hint}</p>
      ) : null}
    </div>
  );
}
