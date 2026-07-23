'use client';

import * as React from 'react';
import { Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { isAxiosError } from 'axios';
import { AuthShell } from '@/components/auth-shell';
import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { useAuthControllerResetPassword } from '@/generated/api';
import { saveSession } from '@/lib/auth';

function RedefinirSenhaInner() {
  const router = useRouter();
  const search = useSearchParams();
  const token = search.get('token');
  const reset = useAuthControllerResetPassword();

  const [password, setPassword] = React.useState('');
  const [confirm, setConfirm] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);
  const [linkDead, setLinkDead] = React.useState(!token);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError('A senha precisa ter pelo menos 8 caracteres.');
      return;
    }
    if (password !== confirm) {
      setError('As senhas não coincidem.');
      return;
    }
    if (!token) {
      setLinkDead(true);
      return;
    }

    try {
      const res = await reset.mutateAsync({ data: { token, password } });
      saveSession({
        accessToken: res.data.accessToken,
        refreshToken: res.data.refreshToken,
        user: res.data.user,
      });
      const role = res.data.user.role;
      if (role === 'ADMIN') router.replace('/admin');
      else if (role === 'PRODUCER') router.replace('/painel-produtor');
      else router.replace('/minha-conta');
    } catch (err) {
      if (isAxiosError(err)) {
        const msg = String(
          (err.response?.data as { message?: string })?.message ?? ''
        );
        if (/expired|invalid|already used/i.test(msg)) {
          setLinkDead(true);
          return;
        }
      }
      setError('Não foi possível redefinir agora. Tente de novo.');
    }
  }

  if (linkDead) {
    return (
      <AuthShell
        kicker="RECUPERAR ACESSO"
        title={
          <>
            Link expirado<span className="text-accent">.</span>
            <br />
            Pede outro<em className="italic">.</em>
          </>
        }
        subtitle="Links de recuperação valem 30 minutos e só podem ser usados uma vez."
        footerText="Lembrou a senha?"
        footerLinkLabel="Entrar"
        footerLinkHref="/entrar"
      >
        <div className="mb-10">
          <div className="font-mono text-[11px] tracking-[2px] uppercase text-destructive mb-3">
            LINK INVÁLIDO
          </div>
          <h2 className="font-display text-[44px] font-extrabold leading-[0.95] tracking-[-1.5px]">
            Esse link não vale mais
          </h2>
        </div>
        <p className="text-[14px] text-ink-muted leading-[1.55] mb-6">
          Ele pode ter expirado, já ter sido usado ou ter vindo incompleto.
          Peça um novo — leva alguns segundos.
        </p>
        <Link href="/auth/esqueci-senha">
          <Button variant="accent" size="lg" full>
            Pedir um novo link
          </Button>
        </Link>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      kicker="RECUPERAR ACESSO"
      title={
        <>
          Senha nova<span className="text-accent">.</span>
          <br />
          Conta de volta<em className="italic">.</em>
        </>
      }
      subtitle="Escolha uma senha nova. Ao salvar, desconectamos qualquer outro dispositivo."
      footerText="Lembrou a senha?"
      footerLinkLabel="Entrar"
      footerLinkHref="/entrar"
    >
      <div className="mb-10">
        <div className="font-mono text-[11px] tracking-[2px] uppercase text-accent mb-3">
          NOVA SENHA
        </div>
        <h2 className="font-display text-[44px] font-extrabold leading-[0.95] tracking-[-1.5px]">
          Criar nova senha
        </h2>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
        <Field label="Nova senha" htmlFor="password" hint="Mínimo de 8 caracteres.">
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            aria-invalid={Boolean(error) || undefined}
            disabled={reset.isPending}
          />
        </Field>

        <Field label="Confirmar nova senha" htmlFor="confirm">
          <Input
            id="confirm"
            type="password"
            autoComplete="new-password"
            placeholder="••••••••"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            aria-invalid={Boolean(error) || undefined}
            disabled={reset.isPending}
          />
        </Field>

        {error ? (
          <div className="border-l-2 border-destructive bg-destructive/10 px-3 py-2 text-[13px] text-foreground">
            {error}
          </div>
        ) : null}

        <Button
          type="submit"
          variant="accent"
          size="lg"
          full
          disabled={reset.isPending}
        >
          {reset.isPending ? 'Salvando…' : 'Salvar e entrar'}
        </Button>

        <p className="text-[11px] text-ink-dim text-center -mt-2">
          Por segurança, as sessões abertas em outros aparelhos serão encerradas.
        </p>
      </form>
    </AuthShell>
  );
}

export default function RedefinirSenhaPage() {
  return (
    <Suspense fallback={null}>
      <RedefinirSenhaInner />
    </Suspense>
  );
}
