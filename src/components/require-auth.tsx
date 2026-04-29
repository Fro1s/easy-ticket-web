'use client';

import * as React from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth, type AuthUser } from '@/lib/auth';

interface RequireAuthProps {
  children: (user: AuthUser) => React.ReactNode;
  fallback?: React.ReactNode;
}

export function RequireAuth({ children, fallback }: RequireAuthProps) {
  const { user, ready } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  React.useEffect(() => {
    if (ready && !user) {
      const next = encodeURIComponent(pathname);
      router.replace(`/entrar?next=${next}`);
    }
  }, [ready, user, router, pathname]);

  if (!ready || !user) {
    return (
      fallback ?? (
        <div className="min-h-[40vh] grid place-items-center text-ink-muted text-sm">
          Carregando…
        </div>
      )
    );
  }

  return <>{children(user)}</>;
}
