'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { isAxiosError } from 'axios';
import { AuthShell } from '@/components/auth-shell';
import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import {
  useAuthControllerLogin,
  useAuthControllerMagicLink,
} from '@/generated/api';
import { saveSession } from '@/lib/auth';

export default function EntrarPage() {
  const router = useRouter();
  const login = useAuthControllerLogin();
  const magic = useAuthControllerMagicLink();

  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);
  const [magicSent, setMagicSent] = React.useState(false);
  const [magicError, setMagicError] = React.useState<string | null>(null);

  const loading = login.isPending;

  async function handleMagicLink() {
    setMagicError(null);
    setMagicSent(false);
    if (!email) {
      setMagicError('Digite seu e-mail acima primeiro.');
      return;
    }
    try {
      await magic.mutateAsync({ data: { email } });
      setMagicSent(true);
    } catch {
      setMagicError('Não foi possível enviar agora. Tente de novo.');
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (!email || !password) {
      setError('Preencha e-mail e senha para continuar.');
      return;
    }

    try {
      const res = await login.mutateAsync({ data: { email, password } });
      saveSession({
        accessToken: res.data.accessToken,
        refreshToken: res.data.refreshToken,
        user: res.data.user,
      });

      const nextParam =
        typeof window !== 'undefined'
          ? new URLSearchParams(window.location.search).get('next')
          : null;
      if (nextParam) {
        router.push(nextParam);
      } else if (res.data.user.role === 'ADMIN') {
        router.push('/admin');
      } else if (res.data.user.role === 'PRODUCER') {
        router.push('/painel-produtor');
      } else {
        router.push('/');
      }
    } catch (err: unknown) {
      if (isAxiosError(err) && err.response?.status === 401) {
        setError('E-mail ou senha inválidos.');
      } else {
        setError('Não foi possível entrar agora. Tente novamente.');
      }
    }
  }

  return (
    <AuthShell
      kicker="BEM-VINDO DE VOLTA"
      title={
        <>
          Entra<span className="text-accent">.</span>
          <br />
          E a festa segue<em className="italic">.</em>
        </>
      }
      subtitle="Acesse sua conta pra ver ingressos, transferir pra galera e acompanhar pedidos em tempo real."
      footerText="Ainda não tem conta?"
      footerLinkLabel="Cadastre-se"
      footerLinkHref="/cadastro"
    >
      <div className="mb-10">
        <div className="font-mono text-[11px] tracking-[2px] uppercase text-accent mb-3">
          ENTRAR
        </div>
        <h2 className="font-display text-[44px] font-extrabold leading-[0.95] tracking-[-1.5px]">
          Acesse sua conta
        </h2>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
        <Field label="E-mail" htmlFor="email">
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="voce@exemplo.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            aria-invalid={Boolean(error) || undefined}
            disabled={loading}
          />
        </Field>

        <Field label="Senha" htmlFor="password">
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            aria-invalid={Boolean(error) || undefined}
            disabled={loading}
          />
        </Field>

        {error ? (
          <div className="border-l-2 border-destructive bg-destructive/10 px-3 py-2 text-[13px] text-foreground">
            {error}
          </div>
        ) : null}

        <Button type="submit" variant="accent" size="lg" full disabled={loading}>
          {loading ? 'Entrando…' : 'Entrar na conta'}
        </Button>

        <div className="flex items-center gap-3 my-1">
          <div className="flex-1 h-px bg-border" />
          <span className="font-mono text-[10px] tracking-[1.5px] uppercase text-ink-dim">
            OU
          </span>
          <div className="flex-1 h-px bg-border" />
        </div>

        <Button
          type="button"
          variant="outline"
          size="lg"
          full
          onClick={handleMagicLink}
          disabled={magic.isPending || magicSent}
        >
          {magic.isPending
            ? 'Enviando…'
            : magicSent
              ? 'Link enviado — confira seu e-mail'
              : 'Entrar com link mágico'}
        </Button>
        {magicSent ? (
          <p className="text-[11px] text-accent text-center -mt-2">
            Se houver conta com esse e-mail, o link chega em instantes (válido por 15 min).
          </p>
        ) : magicError ? (
          <p className="text-[11px] text-destructive text-center -mt-2">
            {magicError}
          </p>
        ) : (
          <p className="text-[11px] text-ink-dim text-center -mt-2">
            Sem senha? Mandamos um link pro seu e-mail.
          </p>
        )}
      </form>
    </AuthShell>
  );
}
