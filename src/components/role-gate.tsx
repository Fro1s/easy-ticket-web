'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { RequireAuth } from './require-auth';
import type { AuthUser } from '@/lib/auth';

interface RoleGateProps {
  allow: Array<AuthUser['role']>;
  children: (user: AuthUser) => React.ReactNode;
  redirectTo?: string;
}

/**
 * Wraps RequireAuth and additionally bounces users whose role is not in
 * `allow`. Used by /admin and /painel-produtor placeholder pages.
 */
export function RoleGate({ allow, children, redirectTo = '/' }: RoleGateProps) {
  const router = useRouter();
  return (
    <RequireAuth>
      {(user) => {
        if (!allow.includes(user.role)) {
          router.replace(redirectTo);
          return (
            <div className="min-h-[40vh] grid place-items-center text-ink-muted text-sm">
              Redirecionando…
            </div>
          );
        }
        return children(user);
      }}
    </RequireAuth>
  );
}
