'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { Button } from '@/components/ui/button';
import { RequireAuth } from '@/components/require-auth';
import {
  useMeControllerProfile,
  useMeControllerOrders,
} from '@/generated/api';
import { clearSession } from '@/lib/auth';
import { formatBRLFromCents, formatEventDate } from '@/lib/format';
import { cn } from '@/lib/utils';

const ORDER_STATUS_LABEL: Record<string, { label: string; tone: 'ok' | 'warn' | 'mute' }> = {
  PENDING: { label: 'Aguardando pagamento', tone: 'warn' },
  PAID: { label: 'Pago', tone: 'ok' },
  CANCELLED: { label: 'Cancelado', tone: 'mute' },
  REFUNDED: { label: 'Reembolsado', tone: 'mute' },
  EXPIRED: { label: 'Expirado', tone: 'mute' },
};

export default function MinhaContaPage() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <RequireAuth>{() => <ProfileContent />}</RequireAuth>
      <SiteFooter />
    </div>
  );
}

function ProfileContent() {
  const router = useRouter();
  const profileQuery = useMeControllerProfile();
  const ordersQuery = useMeControllerOrders({ page: 1, pageSize: 3 });

  const profile = profileQuery.data?.data;
  const recentOrders = ordersQuery.data?.data.items ?? [];

  function handleSignOut() {
    clearSession();
    router.push('/');
  }

  if (!profile) {
    return (
      <div className="max-w-[1100px] mx-auto px-6 md:px-16 py-16">
        <div className="h-10 w-48 bg-card border border-border rounded animate-pulse mb-6" />
        <div className="grid lg:grid-cols-[280px_1fr] gap-8">
          <div className="h-64 bg-card border border-border rounded-[20px] animate-pulse" />
          <div className="h-96 bg-card border border-border rounded-[20px] animate-pulse" />
        </div>
      </div>
    );
  }

  const cpfMasked = profile.cpf ? formatCpf(profile.cpf) : '—';
  const phoneMasked = profile.phone ? formatPhone(profile.phone) : '—';
  const referralUrl = `https://easyticket.com.br/r/${profile.referralCode}`;

  return (
    <div className="max-w-[1100px] mx-auto px-6 md:px-16 py-12 md:py-16">
      <div className="font-mono text-[11px] tracking-[2px] uppercase text-accent mb-3">
        SUA CONTA
      </div>
      <h1 className="font-display text-[40px] md:text-[56px] font-bold tracking-[-1.8px] leading-[0.95] mb-2">
        Olá, <span className="italic font-medium">{(profile.name ?? profile.email).split(' ')[0]}</span>.
      </h1>
      <p className="text-ink-muted text-[15px]">
        Membro desde {new Date(profile.createdAt).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}.
      </p>

      <div className="grid lg:grid-cols-[300px_1fr] gap-6 lg:gap-10 mt-10">
        {/* LEFT — profile card */}
        <aside className="lg:sticky lg:top-6 lg:self-start">
          <div className="bg-card border border-border rounded-[20px] p-6">
            <div className="flex items-center gap-4 mb-5">
              <div className="w-14 h-14 rounded-full bg-accent text-accent-foreground grid place-items-center font-display font-bold text-[22px]">
                {(profile.name ?? profile.email).charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <div className="font-semibold text-[15px] truncate">{profile.name ?? profile.email}</div>
                <div className="text-[12px] text-ink-muted truncate">{profile.email}</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-px bg-border rounded-[8px] overflow-hidden mb-5 border border-border">
              <Stat n={profile.ticketCount} label="ingressos" />
              <Stat n={profile.orderCount} label="pedidos" />
            </div>

            <Button variant="ghost" size="sm" full onClick={handleSignOut}>
              Sair da conta
            </Button>
          </div>
        </aside>

        {/* RIGHT — sections */}
        <div className="flex flex-col gap-6">
          {/* Personal data */}
          <Section title="Dados pessoais" action="Editar (em breve)">
            <DataRow label="Nome" value={profile.name ?? '—'} />
            <DataRow label="E-mail" value={profile.email} />
            <DataRow label="CPF" value={cpfMasked} mono />
            <DataRow label="Telefone" value={phoneMasked} mono />
          </Section>

          {/* Referral */}
          <Section title="Indique e ganhe">
            <p className="text-[14px] text-ink-muted mb-5 leading-[1.55]">
              Quando alguém compra o primeiro ingresso usando seu código,{' '}
              <span className="text-accent font-semibold">vocês dois ganham R$ 10</span>{' '}
              de crédito pra próxima compra.
            </p>
            <CopyField label="Seu código" value={profile.referralCode} mono />
            <CopyField label="Link compartilhável" value={referralUrl} />
          </Section>

          {/* Recent orders */}
          <Section
            title="Pedidos recentes"
            action={profile.orderCount > 3 ? 'Ver todos' : undefined}
          >
            {recentOrders.length === 0 ? (
              <div className="text-[14px] text-ink-muted py-6 text-center">
                Você ainda não comprou nada.{' '}
                <Link href="/eventos" className="text-accent underline underline-offset-2">
                  Ver eventos
                </Link>
              </div>
            ) : (
              <div className="flex flex-col gap-2.5">
                {recentOrders.map((o) => {
                  const meta = ORDER_STATUS_LABEL[o.status];
                  return (
                    <div
                      key={o.id}
                      className="flex items-center gap-3 p-3 rounded-[12px] border border-border bg-background/40"
                    >
                      <div
                        className="w-12 h-12 rounded-[8px] shrink-0"
                        style={{ background: o.event.posterUrl || 'var(--bg-input)' }}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-[14px] font-semibold truncate">
                          {o.event.title}
                        </div>
                        <div className="text-[11px] text-ink-muted font-mono mt-0.5">
                          {formatEventDate(o.event.startsAt)} · {formatBRLFromCents(o.totalCents)}
                        </div>
                      </div>
                      <span
                        className={cn(
                          'shrink-0 text-[10px] font-mono uppercase tracking-[1px] px-2.5 py-1 rounded-full border',
                          meta?.tone === 'ok' && 'border-accent/40 text-accent bg-accent/10',
                          meta?.tone === 'warn' &&
                            'border-[var(--accent-2)]/40 text-[var(--accent-2)] bg-[var(--accent-2)]/10',
                          (!meta || meta.tone === 'mute') &&
                            'border-border text-ink-muted bg-transparent'
                        )}
                      >
                        {meta?.label ?? o.status}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </Section>
        </div>
      </div>
    </div>
  );
}

function Section({
  title,
  action,
  children,
}: {
  title: string;
  action?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="bg-card border border-border rounded-[20px] p-6 md:p-7">
      <div className="flex items-center justify-between mb-5">
        <h2 className="font-display text-[20px] font-bold tracking-[-0.4px]">{title}</h2>
        {action ? <span className="text-[12px] text-ink-muted">{action}</span> : null}
      </div>
      {children}
    </section>
  );
}

function Stat({ n, label }: { n: number; label: string }) {
  return (
    <div className="bg-card p-3 text-center">
      <div className="font-display text-[24px] font-extrabold leading-none">{n}</div>
      <div className="text-[10px] text-ink-muted mt-1 uppercase tracking-[1px] font-mono">
        {label}
      </div>
    </div>
  );
}

function DataRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex justify-between items-baseline py-2.5 border-b border-border last:border-b-0">
      <span className="text-[12px] text-ink-muted uppercase tracking-[1px] font-mono">
        {label}
      </span>
      <span className={cn('text-[14px] text-foreground', mono && 'font-mono')}>
        {value}
      </span>
    </div>
  );
}

function CopyField({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  const [copied, setCopied] = React.useState(false);

  function handleCopy() {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      void navigator.clipboard.writeText(value).then(() => {
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1800);
      });
    }
  }

  return (
    <div className="mb-3 last:mb-0">
      <div className="text-[11px] text-ink-muted uppercase tracking-[1px] font-mono mb-1.5">
        {label}
      </div>
      <div className="flex items-stretch border border-border rounded-[6px] overflow-hidden bg-input">
        <div
          className={cn(
            'flex-1 px-3.5 py-2.5 text-[14px] truncate',
            mono ? 'font-mono tracking-[1px]' : ''
          )}
        >
          {value}
        </div>
        <button
          type="button"
          onClick={handleCopy}
          className="px-4 bg-foreground text-background text-[12px] font-semibold uppercase tracking-wide hover:bg-accent hover:text-accent-foreground transition-colors"
        >
          {copied ? 'Copiado!' : 'Copiar'}
        </button>
      </div>
    </div>
  );
}

function formatCpf(cpf: string): string {
  const d = cpf.replace(/\D/g, '');
  if (d.length !== 11) return cpf;
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
}

function formatPhone(phone: string): string {
  const d = phone.replace(/\D/g, '');
  if (d.length === 13 && d.startsWith('55')) {
    return `+55 (${d.slice(2, 4)}) ${d.slice(4, 9)}-${d.slice(9)}`;
  }
  if (d.length === 11) {
    return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  }
  return phone;
}
