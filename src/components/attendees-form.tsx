'use client';
import { useEffect } from 'react';
import { cn } from '@/lib/utils';

export type AttendeeValue = { name: string; email: string };
export type AttendeesValue = AttendeeValue[];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isValid(a: AttendeeValue, requireEmail: boolean): { name: boolean; email: boolean } {
  const emailEmpty = !a.email;
  return {
    name: a.name.trim().length >= 2,
    email: requireEmail ? !emailEmpty && EMAIL_RE.test(a.email) : (emailEmpty || EMAIL_RE.test(a.email)),
  };
}

export function attendeesAllValid(
  v: AttendeesValue,
  expected: number,
  requireEmail = false,
): boolean {
  if (v.length !== expected) return false;
  return v.every((a) => {
    const r = isValid(a, requireEmail);
    return r.name && r.email;
  });
}

export function AttendeesForm({
  expectedCount,
  value,
  onChange,
  defaultFirst,
  requireEmail = false,
}: {
  expectedCount: number;
  value: AttendeesValue;
  onChange: (v: AttendeesValue) => void;
  defaultFirst?: AttendeeValue;
  requireEmail?: boolean;
}) {
  useEffect(() => {
    if (value.length === expectedCount) return;
    const next: AttendeesValue = [];
    for (let i = 0; i < expectedCount; i++) {
      next.push(
        value[i] ??
          (i === 0 && defaultFirst ? defaultFirst : { name: '', email: '' }),
      );
    }
    onChange(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expectedCount]);

  const update = (i: number, patch: Partial<AttendeeValue>) => {
    const next = value.map((a, idx) => (idx === i ? { ...a, ...patch } : a));
    onChange(next);
  };

  return (
    <div className="space-y-3">
      {value.map((a, i) => {
        const v = isValid(a, requireEmail);
        const showNameErr = !v.name && a.name.length > 0;
        const emailEmpty = !a.email;
        const showEmailErr = requireEmail ? !v.email && (a.email.length > 0 || emailEmpty) : !v.email;
        const emailMsg = requireEmail && emailEmpty ? 'Email obrigatório.' : 'Email inválido.';
        return (
          <div
            key={i}
            className="grid grid-cols-1 md:grid-cols-[40px_1fr_1fr] gap-2 items-start"
          >
            <div className="font-mono text-xs text-ink-dim pt-2">#{i + 1}</div>
            <div>
              <input
                aria-label={`Nome do ingresso ${i + 1}`}
                value={a.name}
                onChange={(e) => update(i, { name: e.target.value })}
                placeholder="Nome do portador"
                className={cn(
                  'w-full bg-card/40 border border-border/50 rounded-[6px] px-3 py-2 text-sm',
                  showNameErr && 'border-red-400/50',
                )}
              />
              {showNameErr && (
                <p className="text-[11px] text-red-300 mt-1">
                  Nome inválido (mín. 2 caracteres).
                </p>
              )}
            </div>
            <div>
              <input
                aria-label={`Email do ingresso ${i + 1}`}
                value={a.email}
                onChange={(e) => update(i, { email: e.target.value })}
                placeholder={requireEmail ? 'Email' : 'Email (opcional)'}
                className={cn(
                  'w-full bg-card/40 border border-border/50 rounded-[6px] px-3 py-2 text-sm',
                  showEmailErr && 'border-red-400/50',
                )}
              />
              {showEmailErr && (
                <p className="text-[11px] text-red-300 mt-1">{emailMsg}</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
