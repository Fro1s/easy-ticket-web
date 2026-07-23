'use client';

import * as React from 'react';
import { AuthShell } from '@/components/auth-shell';
import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { useAuthControllerForgotPassword } from '@/generated/api';

export default function EsqueciSenhaPage() {
  const forgot = useAuthControllerForgotPassword();

  const [email, setEmail] = React.useState('');
  const [sent, setSent] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (!email) {
      setError('Digite o e-mail da sua conta.');
      return;
    }

    try {
      await forgot.mutateAsync({ data: { email } });
      setSent(true);
    } catch {
      setError('Não foi possível enviar agora. Tente de novo.');
    }
  }

  return (
    <AuthShell
      kicker="RECUPERAR ACESSO"
      title={
        <>
          Esqueceu<span className="text-accent">?</span>
          <br />
          A gente resolve<em className="italic">.</em>
        </>
      }
      subtitle="Manda seu e-mail que enviamos um link pra você criar uma senha nova."
      footerText="Lembrou a senha?"
      footerLinkLabel="Entrar"
      footerLinkHref="/entrar"
    >
      <div className="mb-10">
        <div className="font-mono text-[11px] tracking-[2px] uppercase text-accent mb-3">
          ESQUECI MINHA SENHA
        </div>
        <h2 className="font-display text-[44px] font-extrabold leading-[0.95] tracking-[-1.5px]">
          Recuperar senha
        </h2>
      </div>

      {sent ? (
        <div className="flex flex-col gap-5">
          <div className="border-l-2 border-accent bg-accent/10 px-4 py-3.5">
            <div className="font-mono text-[11px] tracking-[1.5px] uppercase text-accent mb-1.5">
              E-MAIL ENVIADO
            </div>
            <p className="text-[14px] leading-[1.55] text-foreground">
              Se houver uma conta com esse e-mail, o link chega em instantes.
              Ele vale por 30 minutos e só pode ser usado uma vez.
            </p>
          </div>
          <p className="text-[13px] text-ink-muted leading-[1.55]">
            Não chegou? Confira a caixa de spam ou{' '}
            <button
              type="button"
              onClick={() => setSent(false)}
              className="text-accent underline underline-offset-2"
            >
              tente outro e-mail
            </button>
            .
          </p>
        </div>
      ) : (
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
              disabled={forgot.isPending}
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
            disabled={forgot.isPending}
          >
            {forgot.isPending ? 'Enviando…' : 'Enviar link de recuperação'}
          </Button>

          <p className="text-[11px] text-ink-dim text-center -mt-2">
            Enviamos um link seguro pro seu e-mail. Sua senha atual continua
            valendo até você criar uma nova.
          </p>
        </form>
      )}
    </AuthShell>
  );
}
