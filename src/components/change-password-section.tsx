'use client';

import * as React from 'react';
import { isAxiosError } from 'axios';
import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { useMeControllerChangePassword } from '@/generated/api';
import { saveSession } from '@/lib/auth';

interface ChangePasswordSectionProps {
  /**
   * Contas criadas por venda-por-e-mail ou que só usaram link mágico ainda não
   * têm senha — nesse caso não há senha atual a confirmar.
   */
  hasPassword: boolean;
}

export function ChangePasswordSection({
  hasPassword,
}: ChangePasswordSectionProps) {
  const change = useMeControllerChangePassword();

  const [open, setOpen] = React.useState(false);
  const [current, setCurrent] = React.useState('');
  const [next, setNext] = React.useState('');
  const [confirm, setConfirm] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);
  const [done, setDone] = React.useState(false);

  function reset() {
    setCurrent('');
    setNext('');
    setConfirm('');
    setError(null);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (hasPassword && !current) {
      setError('Digite sua senha atual.');
      return;
    }
    if (next.length < 8) {
      setError('A nova senha precisa ter pelo menos 8 caracteres.');
      return;
    }
    if (next !== confirm) {
      setError('As senhas não coincidem.');
      return;
    }

    try {
      const res = await change.mutateAsync({
        data: {
          newPassword: next,
          ...(hasPassword ? { currentPassword: current } : {}),
        },
      });
      // A troca revoga as sessões antigas; guardamos o par novo para esta aba
      // continuar autenticada.
      saveSession({
        accessToken: res.data.accessToken,
        refreshToken: res.data.refreshToken,
        user: res.data.user,
      });
      reset();
      setOpen(false);
      setDone(true);
    } catch (err) {
      if (isAxiosError(err) && err.response?.status === 401) {
        setError('Senha atual incorreta.');
        return;
      }
      setError('Não foi possível alterar a senha agora. Tente de novo.');
    }
  }

  const title = hasPassword ? 'Senha' : 'Criar senha';

  return (
    <section className="bg-card border border-border rounded-[20px] p-6 md:p-7">
      <div className="flex items-center justify-between mb-5">
        <h2 className="font-display text-[20px] font-bold tracking-[-0.4px]">
          {title}
        </h2>
        {!open ? (
          <button
            type="button"
            onClick={() => {
              setDone(false);
              setOpen(true);
            }}
            className="text-[12px] text-accent hover:underline underline-offset-2"
          >
            {hasPassword ? 'Alterar' : 'Definir senha'}
          </button>
        ) : (
          <button
            type="button"
            onClick={() => {
              reset();
              setOpen(false);
            }}
            className="text-[12px] text-ink-muted hover:underline underline-offset-2"
          >
            Cancelar
          </button>
        )}
      </div>

      {!open ? (
        done ? (
          <div className="border-l-2 border-accent bg-accent/10 px-3 py-2.5 text-[13px] text-foreground">
            Senha atualizada. Os outros aparelhos foram desconectados.
          </div>
        ) : (
          <p className="text-[14px] text-ink-muted leading-[1.55]">
            {hasPassword
              ? 'Sua senha é usada pra entrar com e-mail. Alterar desconecta os outros aparelhos.'
              : 'Você ainda não tem senha — entra pelo link mágico. Defina uma pra poder entrar direto com e-mail e senha.'}
          </p>
        )
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
          {hasPassword ? (
            <Field label="Senha atual" htmlFor="current-password">
              <Input
                id="current-password"
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                value={current}
                onChange={(e) => setCurrent(e.target.value)}
                disabled={change.isPending}
              />
            </Field>
          ) : null}

          <Field
            label="Nova senha"
            htmlFor="new-password"
            hint="Mínimo de 8 caracteres."
          >
            <Input
              id="new-password"
              type="password"
              autoComplete="new-password"
              placeholder="••••••••"
              value={next}
              onChange={(e) => setNext(e.target.value)}
              disabled={change.isPending}
            />
          </Field>

          <Field label="Confirmar nova senha" htmlFor="confirm-password">
            <Input
              id="confirm-password"
              type="password"
              autoComplete="new-password"
              placeholder="••••••••"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              disabled={change.isPending}
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
            size="sm"
            disabled={change.isPending}
          >
            {change.isPending ? 'Salvando…' : 'Salvar nova senha'}
          </Button>

          <p className="text-[11px] text-ink-dim">
            Por segurança, as sessões abertas em outros aparelhos serão
            encerradas.
          </p>
        </form>
      )}
    </section>
  );
}
