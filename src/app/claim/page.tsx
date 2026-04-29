'use client';

import * as React from 'react';
import { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { isAxiosError } from 'axios';
import { AuthShell } from '@/components/auth-shell';
import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { useAuthControllerClaim } from '@/generated/api';
import { saveSession } from '@/lib/auth';

type FieldErrors = Partial<
  Record<'name' | 'cpf' | 'phone' | 'password' | 'token' | 'form', string>
>;

const onlyDigits = (v: string) => v.replace(/\D+/g, '');
const formatCpf = (raw: string) => {
  const d = onlyDigits(raw).slice(0, 11);
  return d
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
};
const formatPhone = (raw: string) => {
  const d = onlyDigits(raw).slice(0, 11);
  if (d.length <= 2) return d;
  if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
};

function ClaimInner() {
  const router = useRouter();
  const search = useSearchParams();
  const token = search.get('token') ?? '';
  const claim = useAuthControllerClaim();

  const [form, setForm] = React.useState({
    name: '',
    cpf: '',
    phone: '',
    password: '',
  });
  const [errors, setErrors] = React.useState<FieldErrors>({});

  const loading = claim.isPending;

  function setField<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }));
  }

  function validate(): FieldErrors {
    const e: FieldErrors = {};
    if (!token) e.token = 'Token ausente — verifique o link do e-mail.';
    if (form.name.trim().length < 2) e.name = 'Nome muito curto.';
    if (onlyDigits(form.cpf).length !== 11) e.cpf = 'CPF deve ter 11 dígitos.';
    if (onlyDigits(form.phone).length < 10) e.phone = 'Telefone incompleto.';
    if (form.password.length < 8) e.password = 'Mínimo 8 caracteres.';
    return e;
  }

  async function handleSubmit(ev: React.FormEvent<HTMLFormElement>) {
    ev.preventDefault();
    const v = validate();
    if (Object.keys(v).length) {
      setErrors(v);
      return;
    }
    setErrors({});
    try {
      const res = await claim.mutateAsync({
        data: {
          token,
          name: form.name.trim(),
          cpf: onlyDigits(form.cpf),
          phone: `+55${onlyDigits(form.phone)}`,
          password: form.password,
        },
      });
      saveSession({
        accessToken: res.data.accessToken,
        refreshToken: res.data.refreshToken,
        user: res.data.user,
      });
      router.push('/meus-ingressos');
    } catch (err: unknown) {
      if (isAxiosError(err)) {
        const msg = (err.response?.data as { message?: string | string[] })
          ?.message;
        const text = Array.isArray(msg) ? msg.join('; ') : String(msg ?? '');
        if (/already claimed/i.test(text)) {
          setErrors({ form: 'Conta já ativada — faça login normalmente.' });
          return;
        }
        if (/cpf does not match/i.test(text)) {
          setErrors({ cpf: 'CPF não bate com o cadastrado.' });
          return;
        }
        if (/expired|invalid|already used/i.test(text)) {
          setErrors({
            form: 'Link inválido ou expirado. Peça outro pro produtor.',
          });
          return;
        }
      }
      setErrors({ form: 'Não foi possível ativar sua conta agora.' });
    }
  }

  return (
    <AuthShell
      kicker="ATIVAR INGRESSO"
      title={
        <>
          Você foi
          <br />
          <span className="text-accent">convidado</span>
          <em className="italic">.</em>
        </>
      }
      subtitle="Crie sua senha pra acessar os ingressos que compraram pra você. O link expira em 24h."
      footerText="Já tem conta?"
      footerLinkLabel="Entrar"
      footerLinkHref="/entrar"
    >
      <div className="mb-8">
        <div className="font-mono text-[11px] tracking-[2px] uppercase text-accent mb-3">
          CLAIM
        </div>
        <h2 className="font-display text-[40px] font-extrabold leading-[0.95] tracking-[-1.5px]">
          Ativar minha conta
        </h2>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
        <Field label="Nome completo" htmlFor="name" error={errors.name}>
          <Input
            id="name"
            autoComplete="name"
            placeholder="Maria Silva"
            value={form.name}
            onChange={(e) => setField('name', e.target.value)}
            disabled={loading}
          />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="CPF" htmlFor="cpf" error={errors.cpf}>
            <Input
              id="cpf"
              inputMode="numeric"
              placeholder="000.000.000-00"
              value={form.cpf}
              onChange={(e) => setField('cpf', formatCpf(e.target.value))}
              disabled={loading}
            />
          </Field>
          <Field label="Telefone" htmlFor="phone" error={errors.phone}>
            <Input
              id="phone"
              inputMode="tel"
              placeholder="(11) 98765-4321"
              value={form.phone}
              onChange={(e) => setField('phone', formatPhone(e.target.value))}
              disabled={loading}
            />
          </Field>
        </div>

        <Field
          label="Senha"
          htmlFor="password"
          hint="Mínimo 8 caracteres."
          error={errors.password}
        >
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            placeholder="••••••••"
            value={form.password}
            onChange={(e) => setField('password', e.target.value)}
            disabled={loading}
          />
        </Field>

        {errors.token ? (
          <div className="border-l-2 border-destructive bg-destructive/10 px-3 py-2 text-[13px] text-foreground">
            {errors.token}
          </div>
        ) : null}
        {errors.form ? (
          <div className="border-l-2 border-destructive bg-destructive/10 px-3 py-2 text-[13px] text-foreground">
            {errors.form}
          </div>
        ) : null}

        <Button
          type="submit"
          variant="accent"
          size="lg"
          full
          disabled={loading || !token}
          className="mt-2"
        >
          {loading ? 'Ativando…' : 'Ativar e ver meus ingressos'}
        </Button>
      </form>
    </AuthShell>
  );
}

export default function ClaimPage() {
  return (
    <Suspense fallback={null}>
      <ClaimInner />
    </Suspense>
  );
}
