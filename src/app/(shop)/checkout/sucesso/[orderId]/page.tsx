'use client';

import * as React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { Button } from '@/components/ui/button';
import { RequireAuth } from '@/components/require-auth';
import {
  useOrdersControllerFindOne,
  useMeControllerTickets,
  useMeControllerProfile,
} from '@/generated/api';
import { formatBRLFromCents, formatEventDate, formatTime } from '@/lib/format';
import { buildIcs, downloadIcs } from '@/lib/ics';

export default function SuccessPage() {
  return (
    <div className="relative min-h-screen overflow-hidden">
      <div
        aria-hidden
        className="absolute -top-[300px] left-1/2 -translate-x-1/2 w-[1000px] h-[600px] pointer-events-none blur-[80px]"
        style={{
          background: 'radial-gradient(ellipse, rgba(209,255,77,0.20) 0%, transparent 70%)',
        }}
      />
      <SiteHeader />
      <RequireAuth>{(user) => <SuccessContent name={user.name ?? user.email} />}</RequireAuth>
      <SiteFooter />
    </div>
  );
}

function SuccessContent({ name }: { name: string }) {
  const { orderId } = useParams<{ orderId: string }>();
  const orderQuery = useOrdersControllerFindOne(orderId);
  const ticketsQuery = useMeControllerTickets({ page: 1, pageSize: 60 });
  const profileQuery = useMeControllerProfile();

  const order = orderQuery.data?.data;
  const myTickets = ticketsQuery.data?.data.items ?? [];
  const orderTickets = myTickets.filter((t) => t.orderId === orderId);
  const referralCode = profileQuery.data?.data.referralCode ?? null;
  const [shareState, setShareState] = React.useState<'idle' | 'copied' | 'error'>('idle');

  if (!order) {
    return (
      <div className="max-w-[900px] mx-auto px-6 md:px-16 py-16">
        <div className="h-[520px] bg-card border border-border rounded-[24px] animate-pulse" />
      </div>
    );
  }

  if (order.status !== 'PAID') {
    return (
      <div className="max-w-[600px] mx-auto px-6 py-24 text-center">
        <div className="font-display text-3xl font-bold mb-3">
          Pagamento ainda não confirmado
        </div>
        <p className="text-ink-muted mb-8">
          Este pedido aparece como <b>{order.status}</b>. Volte pro checkout pra continuar.
        </p>
        <Link href={`/checkout/${orderId}`}>
          <Button variant="accent">Voltar ao pagamento</Button>
        </Link>
      </div>
    );
  }

  const firstName = name.split(' ')[0];
  const shortOrderId = `ET-${orderId.slice(-8).toUpperCase()}`;

  return (
    <section className="relative z-[5] max-w-[1100px] mx-auto px-6 md:px-16 py-12 md:py-16">
      {/* success banner */}
      <div className="text-center mb-10">
        <div className="w-16 h-16 rounded-full bg-accent grid place-items-center mx-auto mb-5">
          <CheckIcon className="w-8 h-8 text-accent-foreground" />
        </div>
        <h1 className="font-display text-[52px] md:text-[72px] font-extrabold tracking-[-2px] leading-[0.95]">
          Bora!
        </h1>
        <p className="text-[17px] text-ink-muted mt-3">
          Seus ingressos estão no app e no seu e-mail. Nos vemos no show, {firstName}.
        </p>
        <div className="font-mono text-[11px] text-ink-dim mt-3 tracking-[1px]">
          PEDIDO {shortOrderId}
        </div>
      </div>

      {/* Tickets list */}
      <div className="flex flex-col gap-4 mb-10">
        {orderTickets.length === 0 ? (
          <div className="bg-card border border-border rounded-[20px] p-8 text-center">
            <div className="font-display text-xl font-bold mb-2">Gerando seus ingressos…</div>
            <p className="text-ink-muted text-sm mb-5">
              Isso leva só alguns segundos. Atualize a página se não aparecer em breve.
            </p>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.location.reload()}
            >
              Atualizar
            </Button>
          </div>
        ) : (
          orderTickets.map((t, i) => (
            <TicketStub
              key={t.id}
              index={i + 1}
              total={orderTickets.length}
              artist={t.event.artist}
              title={t.event.title}
              venueName={t.event.venueName}
              venueCity={t.event.venueCity}
              startsAt={t.event.startsAt}
              doorsAt={t.event.doorsAt}
              sectorName={t.sector.name}
              shortCode={t.shortCode}
              posterUrl={t.event.posterUrl}
              ticketId={t.id}
            />
          ))
        )}
      </div>

      {/* action bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 mb-10">
        <ActionButton label="Baixar PDF" disabled />
        <ActionButton label="Reenviar e-mail" disabled />
        <ActionButton
          label="Google Calendar"
          disabled={orderTickets.length === 0}
          onClick={() => {
            const t = orderTickets[0];
            if (!t) return;
            const ics = buildIcs({
              uid: `easy-ticket-${orderId}@easy-ticket.com.br`,
              title: `${t.event.artist} · ${t.event.title}`,
              description: `Setor ${t.sector.name}. Portões ${formatTime(t.event.doorsAt)}. Pedido ${shortOrderId}.`,
              location: `${t.event.venueName}, ${t.event.venueCity} - ${t.event.venueState}`,
              startsAt: t.event.startsAt,
              endsAt: new Date(
                new Date(t.event.startsAt).getTime() + 4 * 60 * 60_000,
              ).toISOString(),
            });
            const slug = (t.event.slug || 'evento').replace(/[^a-z0-9-]/gi, '-');
            downloadIcs(`easy-ticket-${slug}.ics`, ics);
          }}
        />
        <ActionButton
          label={
            shareState === 'copied'
              ? 'Link copiado!'
              : shareState === 'error'
                ? 'Tente de novo'
                : 'Convidar amigos'
          }
          disabled={!referralCode}
          onClick={async () => {
            if (!referralCode) return;
            const t = orderTickets[0];
            const origin =
              typeof window !== 'undefined' ? window.location.origin : '';
            const url = `${origin}/?ref=${encodeURIComponent(referralCode)}`;
            const text = t
              ? `Vou no ${t.event.artist}! Compra junto com 2,5% de taxa: ${url}`
              : `Compre ingressos com 2,5% de taxa no Easy Ticket: ${url}`;
            try {
              if (typeof navigator !== 'undefined' && navigator.share) {
                await navigator.share({
                  title: 'Easy Ticket',
                  text,
                  url,
                });
                setShareState('idle');
                return;
              }
              await navigator.clipboard.writeText(url);
              setShareState('copied');
              setTimeout(() => setShareState('idle'), 2500);
            } catch (err) {
              if ((err as Error).name === 'AbortError') return;
              setShareState('error');
              setTimeout(() => setShareState('idle'), 2500);
            }
          }}
        />
      </div>

      {/* Savings + referral */}
      <div className="grid md:grid-cols-2 gap-5">
        <div className="bg-accent text-accent-foreground rounded-[20px] p-7 relative overflow-hidden">
          <div className="font-mono text-[11px] tracking-[1px] mb-3 uppercase">
            Você economizou
          </div>
          <div className="font-display text-[52px] md:text-[64px] font-extrabold tracking-[-2.5px] leading-[0.9]">
            {formatBRLFromCents(order.savingsCents)}
          </div>
          <div className="text-[13px] mt-2.5">
            comparado à taxa média dos concorrentes.
          </div>
        </div>

        <div className="bg-card border border-border rounded-[20px] p-7">
          <div className="font-mono text-[11px] text-accent tracking-[1px] uppercase mb-2">
            Chama a galera
          </div>
          <h3 className="font-display text-[20px] font-bold tracking-[-0.4px] leading-[1.2] mb-4">
            Convide amigos, ganhe R$ 20 em crédito.
          </h3>
          <Link href="/minha-conta">
            <Button variant="ghost" size="sm" full>
              Ver meu código →
            </Button>
          </Link>
        </div>
      </div>

      <div className="text-center mt-10">
        <Link href="/meus-ingressos">
          <Button variant="accent" size="lg">
            Ver meus ingressos →
          </Button>
        </Link>
      </div>
    </section>
  );
}

function TicketStub({
  index,
  total,
  artist,
  title,
  venueName,
  venueCity,
  startsAt,
  doorsAt,
  sectorName,
  shortCode,
  posterUrl,
  ticketId,
}: {
  index: number;
  total: number;
  artist: string;
  title: string;
  venueName: string;
  venueCity: string;
  startsAt: string;
  doorsAt: string;
  sectorName: string;
  shortCode: string;
  posterUrl: string;
  ticketId: string;
}) {
  return (
    <Link
      href={`/meus-ingressos/${ticketId}`}
      className="group flex flex-col md:flex-row bg-card border border-border rounded-[20px] overflow-hidden hover:border-accent transition-colors"
      style={{ boxShadow: '0 20px 50px rgba(0,0,0,0.25)' }}
    >
      {/* poster side */}
      <div
        className="md:w-[220px] aspect-[16/10] md:aspect-auto relative shrink-0"
        style={{ background: posterUrl || 'var(--bg-input)' }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent md:bg-gradient-to-r md:from-transparent md:to-black/20" />
        <div className="absolute bottom-4 left-4 right-4 text-white">
          <div className="font-mono text-[10px] text-accent tracking-[1px] mb-1">
            {formatEventDate(startsAt).toUpperCase()}
          </div>
          <div className="font-display text-[22px] md:text-[24px] font-extrabold tracking-[-0.8px] leading-[1]">
            {artist}
          </div>
        </div>
      </div>

      {/* body */}
      <div className="flex-1 p-6 grid grid-cols-2 gap-5 items-center">
        <Meta label="Evento" value={title} />
        <Meta label="Local" value={venueName} sub={venueCity} />
        <Meta label="Portão" value={formatTime(doorsAt)} />
        <Meta label="Show" value={formatTime(startsAt)} />
        <Meta label="Setor" value={sectorName} />
        <Meta label="№" value={shortCode} mono />
      </div>

      {/* right stub */}
      <div className="border-t md:border-t-0 md:border-l-2 md:border-dashed border-border p-6 flex flex-col items-center justify-center gap-2 md:w-[200px]">
        <div className="font-mono text-[10px] text-ink-muted tracking-[1px] uppercase">
          Ingresso {index} de {total}
        </div>
        <div className="font-mono text-[13px] tracking-[2px] font-bold">{shortCode}</div>
        <div className="text-[12px] text-accent group-hover:underline underline-offset-2">
          Ver QR →
        </div>
      </div>
    </Link>
  );
}

function Meta({
  label,
  value,
  sub,
  mono,
}: {
  label: string;
  value: string;
  sub?: string;
  mono?: boolean;
}) {
  return (
    <div className="min-w-0">
      <div className="font-mono text-[10px] text-ink-dim tracking-[0.8px] uppercase mb-1">
        {label}
      </div>
      <div
        className={`text-[15px] font-semibold truncate ${mono ? 'font-mono tracking-[1px]' : ''}`}
      >
        {value}
      </div>
      {sub ? <div className="text-[11px] text-ink-muted truncate">{sub}</div> : null}
    </div>
  );
}

function ActionButton({
  label,
  disabled,
  onClick,
}: {
  label: string;
  disabled?: boolean;
  onClick?: () => void;
}) {
  const isComingSoon = disabled && !onClick;
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="py-3.5 rounded-[12px] bg-card border border-border text-foreground text-[13px] disabled:opacity-50 disabled:cursor-not-allowed hover:border-foreground transition-colors"
    >
      {label}
      {isComingSoon ? (
        <span className="block text-[10px] text-ink-dim font-mono mt-0.5">em breve</span>
      ) : null}
    </button>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M5 12l5 5 9-11"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
