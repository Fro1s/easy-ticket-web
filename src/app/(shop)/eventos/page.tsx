'use client';

import * as React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { EventCard } from '@/components/ui/event-card';
import { CategoryChip } from '@/components/category-chip';
import {
  useEventsControllerList,
  EventsControllerListCategory,
} from '@/generated/api';

const CATEGORIES: { key: 'TODOS' | keyof typeof EventsControllerListCategory; label: string }[] = [
  { key: 'TODOS', label: 'Tudo' },
  { key: 'SHOW', label: 'Shows' },
  { key: 'FESTIVAL', label: 'Festivais' },
  { key: 'BALADA', label: 'Baladas' },
  { key: 'INFANTIL', label: 'Infantil' },
  { key: 'TEATRO', label: 'Teatro' },
];

export default function EventosPage() {
  return (
    <React.Suspense fallback={<EventosFallback />}>
      <EventosBrowser />
    </React.Suspense>
  );
}

function EventosFallback() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <div className="max-w-[1440px] mx-auto px-6 md:px-16 py-16">
        <div className="h-12 w-48 bg-card border border-border rounded animate-pulse mb-6" />
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="aspect-[4/5] bg-card border border-border rounded-[20px] animate-pulse"
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function EventosBrowser() {
  const router = useRouter();
  const params = useSearchParams();

  const urlCategory = (params.get('cat') ?? 'TODOS') as typeof CATEGORIES[number]['key'];
  const urlCity = params.get('cidade') ?? '';
  const urlQuery = params.get('q') ?? '';

  const [city, setCity] = React.useState(urlCity);
  const [query, setQuery] = React.useState(urlQuery);

  React.useEffect(() => setCity(urlCity), [urlCity]);
  React.useEffect(() => setQuery(urlQuery), [urlQuery]);

  function updateParams(next: Record<string, string | null>) {
    const sp = new URLSearchParams(params.toString());
    Object.entries(next).forEach(([k, v]) => {
      if (v == null || v === '') sp.delete(k);
      else sp.set(k, v);
    });
    const qs = sp.toString();
    router.replace(qs ? `/eventos?${qs}` : '/eventos', { scroll: false });
  }

  const { data, isLoading, isError } = useEventsControllerList({
    page: 1,
    pageSize: 60,
    ...(urlCategory !== 'TODOS' ? { category: urlCategory } : {}),
    ...(urlCity ? { city: urlCity } : {}),
    ...(urlQuery ? { q: urlQuery } : {}),
  });

  const events = data?.data.items ?? [];
  const total = data?.data.total ?? 0;

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    updateParams({ q: query, cidade: city });
  }

  function clearAll() {
    setCity('');
    setQuery('');
    router.replace('/eventos', { scroll: false });
  }

  const hasFilters =
    urlCategory !== 'TODOS' || urlCity.length > 0 || urlQuery.length > 0;

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div
        aria-hidden
        className="absolute -top-[200px] left-1/2 -translate-x-1/2 w-[700px] h-[700px] rounded-full pointer-events-none blur-[60px]"
        style={{
          background:
            'radial-gradient(circle, rgba(209,255,77,0.10) 0%, rgba(123,97,255,0.06) 40%, transparent 70%)',
        }}
      />

      <SiteHeader />

      <section className="relative z-[5] px-6 md:px-16 pt-12 pb-6 max-w-[1440px] mx-auto">
        <div className="font-mono text-[11px] tracking-[2px] uppercase text-accent mb-3">
          CATÁLOGO
        </div>
        <h1 className="font-display text-[44px] md:text-[64px] font-bold tracking-[-2px] leading-[0.95]">
          Tudo que <em className="font-medium">tá rolando</em>.
        </h1>
        <p className="text-ink-muted text-[16px] mt-3 max-w-[560px]">
          Filtre por categoria, cidade ou nome do artista. A taxa aparece em
          cada cartão — sem letrinha miúda.
        </p>
      </section>

      <section className="px-6 md:px-16 max-w-[1440px] mx-auto pb-16">
        <div className="flex flex-col gap-4 mb-8">
          <div className="flex gap-2.5 flex-wrap">
            {CATEGORIES.map((c) => (
              <CategoryChip
                key={c.key}
                label={c.label}
                active={urlCategory === c.key}
                onClick={() => updateParams({ cat: c.key === 'TODOS' ? null : c.key })}
              />
            ))}
          </div>

          <form
            onSubmit={handleSearchSubmit}
            className="flex flex-wrap gap-2 items-center"
          >
            <div className="flex items-center gap-2 px-4 h-11 bg-input border border-border rounded-full flex-1 min-w-[220px] max-w-[420px]">
              <SearchIcon className="w-4 h-4 text-ink-muted shrink-0" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Artista, evento ou palavra-chave"
                className="bg-transparent outline-none text-sm text-foreground placeholder:text-ink-dim flex-1 min-w-0"
              />
            </div>
            <div className="flex items-center gap-2 px-4 h-11 bg-input border border-border rounded-full w-[200px]">
              <PinIcon className="w-4 h-4 text-ink-muted shrink-0" />
              <input
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Cidade"
                className="bg-transparent outline-none text-sm text-foreground placeholder:text-ink-dim flex-1 min-w-0"
              />
            </div>
            <button
              type="submit"
              className="h-11 px-5 rounded-full bg-foreground text-background border border-foreground text-sm font-semibold uppercase tracking-wide hover:translate-y-[-1px] active:translate-y-0 transition-transform"
            >
              Buscar
            </button>
            {hasFilters ? (
              <button
                type="button"
                onClick={clearAll}
                className="h-11 px-4 text-sm text-ink-muted hover:text-foreground transition-colors"
              >
                Limpar filtros
              </button>
            ) : null}
          </form>
        </div>

        <div className="flex items-center justify-between text-[13px] text-ink-muted mb-5 font-mono tracking-[0.5px]">
          <span>
            {isLoading
              ? 'CARREGANDO…'
              : `${total} EVENTO${total === 1 ? '' : 'S'}`}
          </span>
        </div>

        {isError ? (
          <div className="border border-destructive/40 bg-destructive/10 text-foreground rounded-[4px] px-4 py-6 text-center">
            Não conseguimos carregar os eventos. Tente recarregar a página.
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
        ) : events.length === 0 ? (
          <div className="border border-border bg-card rounded-[20px] p-12 text-center">
            <div className="font-display text-2xl font-bold mb-2">
              Nada por aqui ainda.
            </div>
            <div className="text-ink-muted text-sm">
              Tente outra categoria ou limpe os filtros.
            </div>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {events.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        )}
      </section>

      <SiteFooter />
    </div>
  );
}

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M20 20l-3.5-3.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function PinIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M12 21s-7-6.5-7-12a7 7 0 0114 0c0 5.5-7 12-7 12z"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <circle cx="12" cy="9" r="2.5" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}
