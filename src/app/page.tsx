'use client';

import * as React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { EventCard } from '@/components/ui/event-card';
import { CategoryChip } from '@/components/category-chip';
import {
  useEventsControllerList,
  EventsControllerListCategory,
  type EventSummary,
} from '@/generated/api';
import { formatBRLFromCents, formatEventDate } from '@/lib/format';
import { cn } from '@/lib/utils';

const CATEGORIES: { key: 'TODOS' | keyof typeof EventsControllerListCategory; label: string }[] = [
  { key: 'TODOS', label: 'Tudo' },
  { key: 'SHOW', label: 'Shows' },
  { key: 'FESTIVAL', label: 'Festivais' },
  { key: 'BALADA', label: 'Baladas' },
  { key: 'INFANTIL', label: 'Infantil' },
  { key: 'TEATRO', label: 'Teatro' },
];

export default function HomePage() {
  const [activeCategory, setActiveCategory] = React.useState<typeof CATEGORIES[number]['key']>('TODOS');

  const { data, isLoading, isError } = useEventsControllerList({
    page: 1,
    pageSize: 20,
    ...(activeCategory !== 'TODOS' ? { category: activeCategory } : {}),
  });

  const events: EventSummary[] = data?.data.items ?? [];
  const featured = events[0];
  const grid = events.slice(1, 7);

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* ambient glow */}
      <div
        aria-hidden
        className="absolute -top-[200px] left-1/2 -translate-x-1/2 w-[900px] h-[900px] rounded-full pointer-events-none blur-[60px]"
        style={{
          background:
            'radial-gradient(circle, rgba(209,255,77,0.18) 0%, rgba(123,97,255,0.08) 40%, transparent 70%)',
        }}
      />

      <SiteHeader />

      {/* HERO */}
      <section className="relative z-[5] px-6 md:px-16 pt-12 md:pt-20 pb-12 md:pb-16 max-w-[1440px] mx-auto">
        <div className="grid lg:grid-cols-[1fr_0.9fr] gap-12 lg:gap-20 items-center">
          <div>
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-accent/10 border border-accent/30 text-accent font-mono text-[11px] font-semibold tracking-[0.5px] mb-7">
              <span className="w-1.5 h-1.5 rounded-full bg-accent" />
              A MENOR TAXA DO BRASIL · 93% MENOS
            </div>
            <h1 className="font-display font-extrabold leading-[0.92] tracking-[-1.5px] sm:tracking-[-3px] text-[44px] sm:text-[64px] md:text-[80px] lg:text-[92px] mb-6">
              Você vai.
              <br />
              <span className="italic font-medium">A taxa</span>
              <br />
              não.
            </h1>
            <p className="text-[18px] leading-[1.5] text-ink-muted max-w-[520px] mb-9">
              Compre ingressos com a menor taxa do mercado. Mostramos cada
              centavo antes de você pagar — sem surpresas, sem pegadinhas.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/eventos">
                <Button variant="accent" size="lg">
                  Ver eventos perto →
                </Button>
              </Link>
              <Link href="/manifesto">
                <Button variant="ghost" size="lg">
                  Como funciona
                </Button>
              </Link>
            </div>

            <div className="flex flex-wrap gap-8 mt-12 pt-7 border-t border-border">
              {[
                ['1.2M', 'ingressos vendidos'],
                ['R$ 47M', 'economizados em taxas'],
                ['4.9★', '38 mil avaliações'],
              ].map(([n, l]) => (
                <div key={l}>
                  <div className="font-display text-[28px] font-bold tracking-[-0.8px]">{n}</div>
                  <div className="text-xs text-ink-muted mt-0.5">{l}</div>
                </div>
              ))}
            </div>
          </div>

          {/* featured poster */}
          <div className="relative hidden lg:block">
            {featured ? (
              <FeaturedCard event={featured} />
            ) : (
              <div className="aspect-[4/5] rounded-[24px] bg-card border border-border animate-pulse" />
            )}
          </div>
        </div>
      </section>

      {/* CATEGORIES + GRID */}
      <section className="px-6 md:px-16 max-w-[1440px] mx-auto pb-16">
        <div className="flex items-end justify-between mb-6 gap-4">
          <h2 className="font-display text-[28px] sm:text-[36px] md:text-[48px] font-bold tracking-[-1.5px]">
            Rolando agora.
          </h2>
          <Link
            href="/eventos"
            className="text-[14px] text-ink-muted hover:text-foreground flex items-center gap-1.5 transition-colors"
          >
            Ver tudo →
          </Link>
        </div>

        <div className="flex gap-2.5 flex-wrap mb-8">
          {CATEGORIES.map((c) => (
            <CategoryChip
              key={c.key}
              label={c.label}
              active={activeCategory === c.key}
              onClick={() => setActiveCategory(c.key)}
            />
          ))}
        </div>

        {isError ? (
          <div className="border border-destructive/40 bg-destructive/10 text-foreground rounded-[4px] px-4 py-6 text-center">
            Não conseguimos carregar os eventos agora. Tente recarregar a página.
          </div>
        ) : isLoading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="aspect-[4/5] bg-card border border-border rounded-[20px] animate-pulse"
              />
            ))}
          </div>
        ) : grid.length === 0 ? (
          <div className="border border-border bg-card rounded-[20px] p-10 text-center">
            <div className="font-display text-2xl font-bold mb-2">
              Nenhum evento por aqui.
            </div>
            <div className="text-ink-muted text-sm">
              Tente outra categoria ou volte em breve.
            </div>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {grid.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        )}
      </section>

      {/* FEE TRANSPARENCY STRIP */}
      <FeeTransparencyStrip />

      <SiteFooter />
    </div>
  );
}

function FeaturedCard({ event }: { event: EventSummary }) {
  return (
    <div className="relative">
      <Link href={`/eventos/${event.slug}`}>
        <div
          className="relative aspect-[4/5] rounded-[24px] overflow-hidden border border-border"
          style={{
            background: event.posterUrl,
            boxShadow: '0 40px 100px rgba(255,61,138,0.30)',
          }}
        >
          <div
            aria-hidden
            className="absolute inset-0"
            style={{
              background:
                'radial-gradient(ellipse at 30% 20%, rgba(255,255,255,0.20), transparent 50%)',
            }}
          />
          <div className="absolute top-5 left-5 right-5 flex justify-between items-start">
            <div className="px-3 py-1.5 rounded-full bg-black/50 backdrop-blur-md text-[11px] font-mono font-semibold tracking-[0.6px] uppercase text-white">
              Destaque da semana
            </div>
          </div>
          <div className="absolute inset-x-0 bottom-0 p-6 bg-gradient-to-t from-black/90 to-transparent">
            <div className="font-mono text-[11px] text-accent tracking-[1px] mb-2">
              {formatEventDate(event.startsAt)} · {event.venue.name.toUpperCase()}
            </div>
            <div className="font-display text-[28px] md:text-[34px] font-bold tracking-[-1px] leading-none mb-4 text-white">
              {event.title}
            </div>
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-[10px] text-white/60 uppercase tracking-[0.8px] font-mono">
                  A partir de
                </div>
                <div className="font-display text-[22px] font-bold text-white">
                  {formatBRLFromCents(event.priceFromCents)}
                </div>
              </div>
              <Button variant="accent" size="md">Garantir</Button>
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
}

function FeeTransparencyStrip() {
  const competitors = [
    { name: 'easy·ticket', fee: 'R$ 4,75', pct: '2,5%', bar: 18, highlight: true },
    { name: 'Concorrente A', fee: 'R$ 38,00', pct: '20%', bar: 100 },
    { name: 'Concorrente B', fee: 'R$ 32,30', pct: '17%', bar: 85 },
    { name: 'Concorrente C', fee: 'R$ 28,50', pct: '15%', bar: 75 },
  ];

  return (
    <section className="px-6 md:px-16 py-16 md:py-24 max-w-[1440px] mx-auto">
      <div className="relative bg-card border border-border rounded-[32px] p-8 md:p-14 overflow-hidden">
        <div
          aria-hidden
          className="absolute -top-24 -right-24 w-[400px] h-[400px] rounded-full"
          style={{
            background:
              'radial-gradient(circle, rgba(209,255,77,0.15), transparent 70%)',
          }}
        />
        <div className="relative grid md:grid-cols-2 gap-10 md:gap-16">
          <div>
            <div className="font-mono text-[11px] text-accent tracking-[1px] mb-4 uppercase">
              Nossa promessa
            </div>
            <h3 className="font-display text-[40px] md:text-[56px] font-bold tracking-[-1.8px] leading-[0.95] mb-5">
              Taxa cristalina.
              <br />
              <span className="text-accent">Sem pegadinha.</span>
            </h3>
            <p className="text-[16px] text-ink-muted leading-[1.5] max-w-[440px]">
              Nossa taxa é fixa e mostrada antes de você começar a compra. A
              média do mercado cobra 20% sobre o ingresso. A gente cobra 2,5%.
            </p>
          </div>

          <div className="flex flex-col gap-4">
            {competitors.map((r) => (
              <div key={r.name}>
                <div className="flex justify-between text-sm mb-2">
                  <span
                    className={cn(
                      r.highlight ? 'text-accent font-bold' : 'text-foreground font-medium'
                    )}
                  >
                    {r.name}
                  </span>
                  <span className="font-mono text-ink-muted">
                    {r.fee} · {r.pct}
                  </span>
                </div>
                <div className="h-2.5 bg-input rounded-full overflow-hidden">
                  <div
                    className={cn(
                      'h-full rounded-full',
                      r.highlight ? 'bg-accent' : 'bg-white/15'
                    )}
                    style={{ width: `${r.bar}%` }}
                  />
                </div>
              </div>
            ))}
            <div className="text-[11px] text-ink-dim font-mono mt-1">
              *Em um ingresso de R$ 190.
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
