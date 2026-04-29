'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { isAxiosError } from 'axios';
import { AuthShell } from '@/components/auth-shell';
import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { useAuthControllerRegister } from '@/generated/api';
import { saveSession } from '@/lib/auth';

type FieldErrors = Partial<Record<'email' | 'name' | 'cpf' | 'phone' | 'password' | 'form', string>>;

function onlyDigits(v: string) {
  return v.replace(/\D+/g, '');
}

function formatCpf(raw: string) {
  const d = onlyDigits(raw).slice(0, 11);
  return d
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
}

function formatPhone(raw: string) {
  const d = onlyDigits(raw).slice(0, 11);
  if (d.length <= 2) return d;
  if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

export default function CadastroPage() {
  const router = useRouter();
  const register = useAuthControllerRegister();

  const [form, setForm] = React.useState({
    name: '',
    email: '',
    cpf: '',
    phone: '',
    password: '',
  });
  const [errors, setErrors] = React.useState<FieldErrors>({});

  const loading = register.isPending;

  function setField<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }));
  }

  function validate(): FieldErrors {
    const e: FieldErrors = {};
    if (form.name.trim().length < 2) e.name = 'Nome muito curto.';
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email)) e.email = 'E-mail inválido.';
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
      const res = await register.mutateAsync({
        data: {
          name: form.name.trim(),
          email: form.email.trim().toLowerCase(),
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
        const status = err.response?.status;
        const msg = (err.response?.data as { message?: string | string[] })?.message;
        if (status === 400 && typeof msg === 'string' && /email/i.test(msg)) {
          setErrors({ email: 'Esse e-mail já está cadastrado.' });
          return;
        }
        if (Array.isArray(msg)) {
          setErrors({ form: msg[0] });
          return;
        }
      }
      setErrors({ form: 'Não foi possível criar sua conta agora. Tente novamente.' });
    }
  }

  return (
    <AuthShell
      kicker="NOVO POR AQUI"
      title={
        <>
          Crie sua<br />
          <span className="text-accent">easy·</span>ticket<em className="italic">.</em>
        </>
      }
      subtitle="Cadastro rápido. 2,5% de taxa fixa, do primeiro ao último ingresso — sem pegadinha."
      footerText="Já tem conta?"
      footerLinkLabel="Entrar"
      footerLinkHref="/entrar"
    >
      <div className="mb-8">
        <div className="font-mono text-[11px] tracking-[2px] uppercase text-accent mb-3">
          CADASTRO
        </div>
        <h2 className="font-display text-[40px] font-extrabold leading-[0.95] tracking-[-1.5px]">
          Bora começar
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
            aria-invalid={Boolean(errors.name) || undefined}
            disabled={loading}
          />
        </Field>

        <Field label="E-mail" htmlFor="email" error={errors.email}>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="voce@exemplo.com"
            value={form.email}
            onChange={(e) => setField('email', e.target.value)}
            aria-invalid={Boolean(errors.email) || undefined}
            disabled={loading}
          />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="CPF" htmlFor="cpf" error={errors.cpf}>
            <Input
              id="cpf"
              inputMode="numeric"
              autoComplete="off"
              placeholder="000.000.000-00"
              value={form.cpf}
              onChange={(e) => setField('cpf', formatCpf(e.target.value))}
              aria-invalid={Boolean(errors.cpf) || undefined}
              disabled={loading}
            />
          </Field>
          <Field label="Telefone" htmlFor="phone" error={errors.phone}>
            <Input
              id="phone"
              inputMode="tel"
              autoComplete="tel-national"
              placeholder="(11) 98765-4321"
              value={form.phone}
              onChange={(e) => setField('phone', formatPhone(e.target.value))}
              aria-invalid={Boolean(errors.phone) || undefined}
              disabled={loading}
            />
          </Field>
        </div>

        <Field
          label="Senha"
          htmlFor="password"
          hint="Mínimo 8 caracteres. Escolha algo que você vai lembrar."
          error={errors.password}
        >
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            placeholder="••••••••"
            value={form.password}
            onChange={(e) => setField('password', e.target.value)}
            aria-invalid={Boolean(errors.password) || undefined}
            disabled={loading}
          />
        </Field>

        {errors.form ? (
          <div className="border-l-2 border-destructive bg-destructive/10 px-3 py-2 text-[13px] text-foreground">
            {errors.form}
          </div>
        ) : null}

        <Button type="submit" variant="accent" size="lg" full disabled={loading} className="mt-2">
          {loading ? 'Criando conta…' : 'Criar minha conta'}
        </Button>

        <p className="text-[11px] text-ink-dim leading-relaxed text-center mt-1">
          Ao criar sua conta, você concorda com os{' '}
          <span className="underline">termos de uso</span> e a{' '}
          <span className="underline">política de privacidade</span> da easy·ticket.
        </p>
      </form>
    </AuthShell>
  );
}
