'use client';

import * as React from 'react';
import { Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { isAxiosError } from 'axios';
import { BrandMark } from '@/components/brand-mark';
import { useAuthControllerConsumeMagicLink } from '@/generated/api';
import { saveSession } from '@/lib/auth';

function MagicInner() {
  const router = useRouter();
  const search = useSearchParams();
  const token = search.get('token');
  const consume = useAuthControllerConsumeMagicLink();

  const [error, setError] = React.useState<string | null>(null);
  const triggered = React.useRef(false);

  React.useEffect(() => {
    if (triggered.current) return;
    triggered.current = true;
    if (!token) {
      setError('Link incompleto. Solicite um novo do seu e-mail.');
      return;
    }
    (async () => {
      try {
        const res = await consume.mutateAsync({ data: { token } });
        saveSession({
          accessToken: res.data.accessToken,
          refreshToken: res.data.refreshToken,
          user: res.data.user,
        });
        const role = res.data.user.role;
        if (role === 'ADMIN') router.replace('/admin');
        else if (role === 'PRODUCER') router.replace('/painel-produtor');
        else router.replace('/meus-ingressos');
      } catch (err) {
        if (isAxiosError(err)) {
          const msg = (err.response?.data as { message?: string })?.message;
          if (/expired|invalid|already used/i.test(String(msg ?? ''))) {
            setError('Link inválido ou já usado. Peça outro em /entrar.');
            return;
          }
        }
        setError('Não foi possível autenticar agora. Tente de novo.');
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  return (
    <main className="min-h-screen bg-ink-deep flex items-center justify-center px-6 text-foreground">
      <div className="max-w-md w-full text-center">
        <div className="flex justify-center mb-8">
          <BrandMark size="md" />
        </div>
        {!error ? (
          <>
            <div className="font-mono text-[11px] tracking-[2px] uppercase text-accent mb-3">
              ENTRANDO
            </div>
            <h1 className="font-display text-[36px] font-extrabold leading-[1] mb-3">
              Validando seu link…
            </h1>
            <p className="text-ink-dim text-sm">
              Em instantes você será redirecionado.
            </p>
          </>
        ) : (
          <>
            <div className="font-mono text-[11px] tracking-[2px] uppercase text-destructive mb-3">
              UPS
            </div>
            <h1 className="font-display text-[36px] font-extrabold leading-[1] mb-3">
              Link inválido
            </h1>
            <p className="text-ink-dim text-sm mb-8">{error}</p>
            <Link
              href="/entrar"
              className="inline-block bg-accent text-[#0A0A0F] px-6 py-3 rounded-[4px] font-mono text-[11px] tracking-[2px] uppercase"
            >
              Pedir outro link
            </Link>
          </>
        )}
      </div>
    </main>
  );
}

export default function MagicPage() {
  return (
    <Suspense fallback={null}>
      <MagicInner />
    </Suspense>
  );
}
