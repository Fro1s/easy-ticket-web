# SEO Completo + Favicon — Design Spec

**Date:** 2026-07-01
**Status:** Approved

---

## Overview

Give the web app real search-engine and social-share presence, plus a proper branded favicon. Today `src/app/layout.tsx` exports only a global `title` + `description`, there is no OpenGraph/Twitter metadata, no per-event metadata, no sitemap, and the favicon is the default Next.js one.

The event detail page (`src/app/(shop)/eventos/[slug]/page.tsx`) is a client component, so it cannot export `generateMetadata`. Per-event SEO requires splitting it into a server page + client child.

All event data is public (no auth) via `GET /api/v1/events` (paginated summaries) and `GET /api/v1/events/:slug` (`EventDetail`), reachable server-side at `NEXT_PUBLIC_API_URL || http://localhost:3001`.

---

## Scope

**New files (all under `src/app/`):**
- `icon.svg` — primary favicon (branded monogram)
- `apple-icon.png` — Apple touch icon
- `opengraph-image.tsx` — default site OG image (next/og)
- `sitemap.ts` — dynamic sitemap
- `robots.ts` — robots.txt
- `(shop)/eventos/[slug]/opengraph-image.tsx` — per-event OG image (next/og)
- `(shop)/eventos/[slug]/event-detail-client.tsx` — the current page body, marked `'use client'`

**Modified files:**
- `src/app/layout.tsx` — expand `metadata` (metadataBase, openGraph, twitter, keywords, robots)
- `src/app/(shop)/eventos/[slug]/page.tsx` — becomes a server component with `generateMetadata`, renders `<EventDetailClient slug={slug} />`

**Replaced:** existing `src/app/favicon.ico` (regenerated from the brand monogram).

**No new dependencies.** `next/og` ships with Next.

---

## Brand basis for icons/images

The brand is the text wordmark `BrandMark`: **easy** (extrabold italic) · lime dot · **ticket**, on near-black.

Palette (from `globals.css`):
- accent (lime): `#D1FF4D`
- ink / background: `#0A0A0F`
- accent-ink (text on lime): `#0A0A0F`

**Icon design:** lowercase **`e`** monogram in the display font weight, lime `#D1FF4D` on `#0A0A0F`, with the signature accent dot to the upper-right of the `e`. Rounded-square background. Delivered as `icon.svg` (crisp at all sizes) with a rasterized `favicon.ico` + `apple-icon.png` fallback.

---

## 1. Global metadata (`layout.tsx`)

Replace the current `metadata` object with:

```ts
export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'),
  title: {
    default: 'Easy Ticket — Menor taxa do Brasil',
    template: '%s · Easy Ticket',
  },
  description:
    'A primeira plataforma do Brasil a mostrar a taxa antes da compra. Compre ingressos com a menor taxa do mercado.',
  keywords: ['ingressos', 'eventos', 'shows', 'festas', 'comprar ingresso', 'Easy Ticket'],
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    siteName: 'Easy Ticket',
    title: 'Easy Ticket — Menor taxa do Brasil',
    description: 'Compre ingressos com a menor taxa do mercado.',
  },
  twitter: { card: 'summary_large_image', title: 'Easy Ticket', description: 'Menor taxa do Brasil.' },
  robots: { index: true, follow: true },
};
```

New env var **`NEXT_PUBLIC_SITE_URL`** (the web app's public URL, e.g. the Vercel/custom domain). Falls back to `http://localhost:3000`. Added to `.env.example` / documented. `metadataBase` makes all relative OG image URLs absolute; the `template` gives every page a `"<page> · Easy Ticket"` title.

---

## 2. Per-event page split

`page.tsx` (server component):

```tsx
import type { Metadata } from 'next';
import { EventDetailClient } from './event-detail-client';

async function fetchEvent(slug: string) {
  const base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  const res = await fetch(`${base}/api/v1/events/${slug}`, { next: { revalidate: 300 } });
  if (!res.ok) return null;
  return res.json();
}

export async function generateMetadata({ params }): Promise<Metadata> {
  const { slug } = await params;
  const event = await fetchEvent(slug);
  if (!event) return { title: 'Evento não encontrado' };
  const city = event.venue?.city;
  return {
    title: event.title,
    description: `${event.artist ? event.artist + ' · ' : ''}${event.venue?.name ?? ''}${city ? ' · ' + city : ''}. Ingressos no Easy Ticket.`,
    openGraph: { title: event.title, type: 'website' },
    alternates: { canonical: `/eventos/${slug}` },
  };
}

export default async function EventPage({ params }) {
  const { slug } = await params;
  return <EventDetailClient slug={slug} />;
}
```

`event-detail-client.tsx` = the **entire current** `page.tsx` body, verbatim, with two changes:
1. Keep `'use client'`.
2. Accept `slug` as a **prop** instead of reading `useParams()` (server already has it). Everything else — the TanStack hooks, checkout flow, availability polling — is unchanged.

This is a mechanical move; no behavior change. The OG image (below) is picked up automatically by Next from the co-located `opengraph-image.tsx`.

---

## 3. OG images (dynamic, next/og)

**Default** `src/app/opengraph-image.tsx`: 1200×630 branded card — `easy●ticket` wordmark + tagline "Menor taxa do Brasil" on `#0A0A0F`, lime accent.

**Per-event** `src/app/(shop)/eventos/[slug]/opengraph-image.tsx`: 1200×630 card built from the fetched event —
- Event `title` (large display), `artist`, and `venue.name · city` + formatted `startsAt`.
- If `event.posterUrl` is present, use it as a dimmed background layer; otherwise solid `#0A0A0F`.
- Lime accent dot + small `easy●ticket` lockup in a corner.

Both use `ImageResponse` from `next/og` with `size = { width: 1200, height: 630 }` and `contentType = 'image/png'`. Fonts: use a bundled weight loaded via `fetch` of a `.ttf` in `public/`, or fall back to the default next/og font if font-loading adds risk (decided at implementation; default font is acceptable for v1).

---

## 4. `sitemap.ts` + `robots.ts`

`sitemap.ts`: returns static routes (`/`, `/eventos`, `/manifesto`, `/produtores`) plus one entry per published event. Pages through `GET /api/v1/events?page=N&pageSize=100` until exhausted (cap at a sane max, e.g. 10 pages / 1000 events for v1, logged if truncated). Each event entry uses `lastModified` = now and `changeFrequency: 'daily'`.

`robots.ts`: allow all, point `sitemap` at `${NEXT_PUBLIC_SITE_URL}/sitemap.xml`, host set.

---

## Error handling & edge cases

- `generateMetadata` / OG / sitemap fetches that fail return safe fallbacks (generic title, brand-only OG, static-routes-only sitemap) — a backend outage must never 500 the page.
- Unknown slug → `generateMetadata` returns `{ title: 'Evento não encontrado' }`; the client child already handles the 404 UI.
- `revalidate: 300` on server fetches keeps metadata fresh without hammering the API.

---

## Testing

- `pnpm build` must pass (validates server/client split + metadata typing).
- Manual: `/eventos/<slug>` view-source shows event-specific `<title>`/`og:*`; `/opengraph-image` and `/eventos/<slug>/opengraph-image` return PNGs; `/sitemap.xml` and `/robots.txt` resolve; favicon shows the branded monogram.
- Existing Vitest suite must stay green (no logic touched in the moved client component).

---

## Out of scope

- JSON-LD structured data (`Event` schema.org) — candidate for a follow-up.
- Per-event OG font embedding beyond v1 default.
- Metadata for authenticated `(app)` routes (intentionally `noindex` territory; not addressed here).
- The CNPJ/phone content edits and "textos gerais" — tracked as separate Grupo A items.
