# SEO Completo + Favicon Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give the web app branded icons, full site + per-event metadata, dynamic OpenGraph images, and a sitemap/robots, so events rank in search and render rich link previews.

**Architecture:** Push all testable logic into a pure `src/lib/seo.ts` module (constants, description/metadata builders, backend fetch helpers with safe fallbacks) covered by Vitest. The Next App Router files (`layout.tsx`, the event `page.tsx`, `opengraph-image.tsx`, `sitemap.ts`, `robots.ts`, `icon.svg`, `apple-icon.tsx`) are thin wrappers over that module. The client event page is split into a server component (`generateMetadata`) + a `'use client'` child so per-event metadata works.

**Tech Stack:** Next.js 16 (App Router), React 19, `next/og` (bundled — no new dep), Vitest 4 + jsdom.

## Global Constraints

- Package manager is **pnpm**; run all commands from `easy-ticket-web/`.
- Work on branch **`feat/seo-and-favicon`** (already created; spec + content edits already committed there).
- Brand palette (verbatim): accent lime `#D1FF4D`, ink/background `#0A0A0F`, text-on-accent `#0A0A0F`.
- Backend base URL server-side: `process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'`; endpoints under `/api/v1/`, public (no auth).
- Site public URL: `process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'` (new env var).
- Event fields available from `GET /api/v1/events/:slug`: `slug, title, artist, description, startsAt, posterUrl, venue{name,city,state}`.
- List endpoint `GET /api/v1/events?page=N&pageSize=M` returns `{ items: EventSummary[], total, page, pageSize }`.
- A backend outage must NEVER 500 a page: every fetch helper returns a safe fallback.
- Do NOT edit `src/generated/api.ts` (Orval-generated).

---

### Task 1: `src/lib/seo.ts` — constants + metadata builders (pure)

**Files:**
- Create: `src/lib/seo.ts`
- Test: `src/lib/seo.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `SITE_URL: string`, `API_BASE: string`
  - `interface EventMetaSource { slug: string; title: string; artist?: string | null; description?: string | null; startsAt?: string | null; posterUrl?: string | null; venue?: { name?: string | null; city?: string | null; state?: string | null } | null }`
  - `buildEventDescription(e: EventMetaSource): string`
  - `buildEventMetadata(e: EventMetaSource): import('next').Metadata`

- [ ] **Step 1: Write the failing tests**

```ts
// src/lib/seo.test.ts
import { describe, it, expect } from 'vitest';
import { buildEventDescription, buildEventMetadata, type EventMetaSource } from './seo';

const base: EventMetaSource = {
  slug: 'show-do-artista',
  title: 'Show do Artista',
  artist: 'Fulano',
  venue: { name: 'Arena X', city: 'São Paulo', state: 'SP' },
};

describe('buildEventDescription', () => {
  it('joins artist, venue name and city', () => {
    expect(buildEventDescription(base)).toBe('Fulano · Arena X · São Paulo. Ingressos no Easy Ticket.');
  });
  it('falls back when nothing but title is present', () => {
    expect(buildEventDescription({ slug: 's', title: 'T' })).toBe('Ingressos no Easy Ticket.');
  });
});

describe('buildEventMetadata', () => {
  it('sets title, canonical and openGraph', () => {
    const m = buildEventMetadata(base);
    expect(m.title).toBe('Show do Artista');
    expect(m.alternates?.canonical).toBe('/eventos/show-do-artista');
    expect((m.openGraph as { title?: string }).title).toBe('Show do Artista');
  });
});
```

- [ ] **Step 2: Run the tests, verify they fail**

Run: `pnpm test -- src/lib/seo.test.ts`
Expected: FAIL — `Failed to resolve import "./seo"`.

- [ ] **Step 3: Implement `src/lib/seo.ts`**

```ts
import type { Metadata } from 'next';

export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
export const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export interface EventMetaSource {
  slug: string;
  title: string;
  artist?: string | null;
  description?: string | null;
  startsAt?: string | null;
  posterUrl?: string | null;
  venue?: { name?: string | null; city?: string | null; state?: string | null } | null;
}

export function buildEventDescription(e: EventMetaSource): string {
  const parts = [e.artist, e.venue?.name, e.venue?.city].filter(Boolean) as string[];
  const head = parts.join(' · ');
  return head ? `${head}. Ingressos no Easy Ticket.` : 'Ingressos no Easy Ticket.';
}

export function buildEventMetadata(e: EventMetaSource): Metadata {
  const description = buildEventDescription(e);
  return {
    title: e.title,
    description,
    openGraph: { title: e.title, description, type: 'website' },
    alternates: { canonical: `/eventos/${e.slug}` },
  };
}
```

- [ ] **Step 4: Run the tests, verify they pass**

Run: `pnpm test -- src/lib/seo.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/seo.ts src/lib/seo.test.ts
git commit -m "feat(seo): pure metadata builders in lib/seo"
```

---

### Task 2: `src/lib/seo.ts` — backend fetch helpers (safe fallbacks)

**Files:**
- Modify: `src/lib/seo.ts` (append)
- Test: `src/lib/seo.test.ts` (append)

**Interfaces:**
- Consumes: `API_BASE`, `EventMetaSource` from Task 1.
- Produces:
  - `fetchEventForMeta(slug: string): Promise<EventMetaSource | null>`
  - `fetchPublishedEventSlugs(maxPages?: number, pageSize?: number): Promise<string[]>`

- [ ] **Step 1: Write the failing tests**

```ts
// append to src/lib/seo.test.ts
import { afterEach, beforeEach, vi } from 'vitest';
import { fetchEventForMeta, fetchPublishedEventSlugs } from './seo';

function mockFetchOnce(status: number, body: unknown) {
  (globalThis.fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  });
}

describe('fetch helpers', () => {
  beforeEach(() => { globalThis.fetch = vi.fn() as unknown as typeof fetch; });
  afterEach(() => { vi.restoreAllMocks(); });

  it('fetchEventForMeta returns the event on 200', async () => {
    mockFetchOnce(200, { slug: 's', title: 'T' });
    expect(await fetchEventForMeta('s')).toEqual({ slug: 's', title: 'T' });
  });
  it('fetchEventForMeta returns null on 404', async () => {
    mockFetchOnce(404, {});
    expect(await fetchEventForMeta('nope')).toBeNull();
  });
  it('fetchEventForMeta returns null when fetch throws', async () => {
    (globalThis.fetch as unknown as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('down'));
    expect(await fetchEventForMeta('s')).toBeNull();
  });
  it('fetchPublishedEventSlugs pages until total reached', async () => {
    mockFetchOnce(200, { items: [{ slug: 'a' }, { slug: 'b' }], total: 3, page: 1, pageSize: 2 });
    mockFetchOnce(200, { items: [{ slug: 'c' }], total: 3, page: 2, pageSize: 2 });
    expect(await fetchPublishedEventSlugs(10, 2)).toEqual(['a', 'b', 'c']);
  });
  it('fetchPublishedEventSlugs returns [] when backend is down', async () => {
    (globalThis.fetch as unknown as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('down'));
    expect(await fetchPublishedEventSlugs()).toEqual([]);
  });
});
```

- [ ] **Step 2: Run the tests, verify the new ones fail**

Run: `pnpm test -- src/lib/seo.test.ts`
Expected: FAIL — `fetchEventForMeta is not a function` (and `fetchPublishedEventSlugs`).

- [ ] **Step 3: Append the implementation to `src/lib/seo.ts`**

```ts
export async function fetchEventForMeta(slug: string): Promise<EventMetaSource | null> {
  try {
    const res = await fetch(`${API_BASE}/api/v1/events/${slug}`, { next: { revalidate: 300 } });
    if (!res.ok) return null;
    return (await res.json()) as EventMetaSource;
  } catch {
    return null;
  }
}

export async function fetchPublishedEventSlugs(maxPages = 10, pageSize = 100): Promise<string[]> {
  const slugs: string[] = [];
  for (let page = 1; page <= maxPages; page++) {
    let data: { items?: { slug?: string }[]; total?: number } | null = null;
    try {
      const res = await fetch(`${API_BASE}/api/v1/events?page=${page}&pageSize=${pageSize}`, {
        next: { revalidate: 3600 },
      });
      if (!res.ok) break;
      data = await res.json();
    } catch {
      break;
    }
    const items = data?.items ?? [];
    for (const it of items) if (it?.slug) slugs.push(it.slug);
    const total = data?.total ?? slugs.length;
    if (items.length < pageSize || slugs.length >= total) break;
  }
  return slugs;
}
```

- [ ] **Step 4: Run the tests, verify they pass**

Run: `pnpm test -- src/lib/seo.test.ts`
Expected: PASS (9 tests total).

- [ ] **Step 5: Commit**

```bash
git add src/lib/seo.ts src/lib/seo.test.ts
git commit -m "feat(seo): backend fetch helpers with safe fallbacks"
```

---

### Task 3: Branded icons

**Files:**
- Create: `src/app/icon.svg`
- Create: `src/app/apple-icon.tsx`
- Delete: `src/app/favicon.ico` (default create-next-app icon; superseded by `icon.svg`)

**Interfaces:**
- Consumes: brand palette constants (inline literals).
- Produces: browser-recognized icon routes (Next App Router file conventions). No importable symbols.

- [ ] **Step 1: Create `src/app/icon.svg`**

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  <rect width="32" height="32" rx="7" fill="#0A0A0F"/>
  <text x="14" y="23" font-family="Arial, Helvetica, sans-serif" font-size="22" font-weight="800" font-style="italic" fill="#D1FF4D" text-anchor="middle">e</text>
  <circle cx="25" cy="9" r="3" fill="#D1FF4D"/>
</svg>
```

- [ ] **Step 2: Create `src/app/apple-icon.tsx`**

```tsx
import { ImageResponse } from 'next/og';

export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0A0A0F',
          position: 'relative',
        }}
      >
        <span style={{ fontSize: 120, fontWeight: 800, fontStyle: 'italic', color: '#D1FF4D' }}>e</span>
        <div
          style={{
            position: 'absolute',
            top: 42,
            right: 46,
            width: 20,
            height: 20,
            borderRadius: 20,
            background: '#D1FF4D',
          }}
        />
      </div>
    ),
    { ...size },
  );
}
```

- [ ] **Step 3: Delete the default favicon**

```bash
git rm src/app/favicon.ico
```

- [ ] **Step 4: Verify the build compiles the icon routes**

Run: `pnpm build`
Expected: build succeeds; output lists `/icon.svg` and `/apple-icon` among the routes (no error about `favicon.ico`).

- [ ] **Step 5: Commit**

```bash
git add src/app/icon.svg src/app/apple-icon.tsx
git commit -m "feat(brand): branded svg favicon + apple touch icon"
```

---

### Task 4: Global metadata (`layout.tsx`)

**Files:**
- Modify: `src/app/layout.tsx:8-11` (the `metadata` export)

**Interfaces:**
- Consumes: `SITE_URL` from `src/lib/seo.ts`.
- Produces: site-wide default metadata + `metadata.title.template` (`'%s · Easy Ticket'`) that per-page `title` strings compose with.

- [ ] **Step 1: Replace the `metadata` export**

Replace the current lines:

```ts
export const metadata: Metadata = {
  title: 'Easy Ticket — Menor taxa do Brasil',
  description: 'A primeira plataforma do Brasil a mostrar a taxa antes da compra. Taxa fixa de 2,5%.',
};
```

with (add the `SITE_URL` import alongside the existing imports at the top):

```ts
import { SITE_URL } from '@/lib/seo';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
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

- [ ] **Step 2: Verify the build**

Run: `pnpm build`
Expected: build succeeds, no TypeScript error on the `Metadata` shape.

- [ ] **Step 3: Verify existing tests still pass**

Run: `pnpm test`
Expected: PASS (unchanged suites + the seo tests).

- [ ] **Step 4: Commit**

```bash
git add src/app/layout.tsx
git commit -m "feat(seo): expand global metadata (openGraph, twitter, robots)"
```

---

### Task 5: Split event detail into server + client (per-event metadata)

**Files:**
- Create: `src/app/(shop)/eventos/[slug]/event-detail-client.tsx` (moved body)
- Modify: `src/app/(shop)/eventos/[slug]/page.tsx` (becomes server component)

**Interfaces:**
- Consumes: `fetchEventForMeta`, `buildEventMetadata` from `src/lib/seo.ts`.
- Produces: `EventDetailClient({ slug }: { slug: string })` default export from `event-detail-client.tsx`.

- [ ] **Step 1: Create `event-detail-client.tsx` from the current page**

Copy the **entire current contents** of `src/app/(shop)/eventos/[slug]/page.tsx` into the new file `src/app/(shop)/eventos/[slug]/event-detail-client.tsx`, then apply exactly these three changes:

1. Keep the `'use client'` directive at the top.
2. Remove `useParams` from the `next/navigation` import on line 5. It currently reads:
   ```ts
   import { useParams, useRouter } from 'next/navigation';
   ```
   Change to:
   ```ts
   import { useRouter } from 'next/navigation';
   ```
3. Change the component signature + slug source. It currently reads (lines 32-33):
   ```ts
   export default function EventDetailPage() {
     const { slug } = useParams<{ slug: string }>();
   ```
   Change to:
   ```ts
   export default function EventDetailClient({ slug }: { slug: string }) {
   ```
   (Delete the `useParams` line — `slug` now comes from props.)

Leave everything else in the file byte-for-byte identical.

- [ ] **Step 2: Replace `page.tsx` with a server component**

Overwrite `src/app/(shop)/eventos/[slug]/page.tsx` entirely with:

```tsx
import type { Metadata } from 'next';
import EventDetailClient from './event-detail-client';
import { fetchEventForMeta, buildEventMetadata } from '@/lib/seo';

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> },
): Promise<Metadata> {
  const { slug } = await params;
  const event = await fetchEventForMeta(slug);
  if (!event) return { title: 'Evento não encontrado' };
  return buildEventMetadata(event);
}

export default async function EventPage(
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  return <EventDetailClient slug={slug} />;
}
```

- [ ] **Step 3: Verify the build (validates server/client boundary)**

Run: `pnpm build`
Expected: build succeeds. No "useParams is not allowed in a Server Component" or hook-in-server errors (all hooks now live in the client child).

- [ ] **Step 4: Verify existing tests still pass**

Run: `pnpm test`
Expected: PASS (no logic changed; only moved).

- [ ] **Step 5: Manual smoke check**

Run `pnpm dev`, open `http://localhost:3000/eventos/<any-published-slug>`, confirm the page renders and behaves as before (checkout, availability). View source and confirm `<title>` is the event title + `· Easy Ticket` and `og:title` matches.

- [ ] **Step 6: Commit**

```bash
git add "src/app/(shop)/eventos/[slug]/page.tsx" "src/app/(shop)/eventos/[slug]/event-detail-client.tsx"
git commit -m "feat(seo): split event page into server (generateMetadata) + client"
```

---

### Task 6: OpenGraph images (default + per-event)

**Files:**
- Create: `src/app/opengraph-image.tsx`
- Create: `src/app/(shop)/eventos/[slug]/opengraph-image.tsx`

**Interfaces:**
- Consumes: `fetchEventForMeta`, `buildEventDescription` from `src/lib/seo.ts`.
- Produces: OG image routes auto-linked by Next (`og:image` / `twitter:image`).

- [ ] **Step 1: Create the default OG image `src/app/opengraph-image.tsx`**

```tsx
import { ImageResponse } from 'next/og';

export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
export const alt = 'Easy Ticket — Menor taxa do Brasil';

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          justifyContent: 'center',
          background: '#0A0A0F',
          padding: 80,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 84, fontWeight: 800, fontStyle: 'italic', color: '#fff' }}>easy</span>
          <div style={{ width: 18, height: 18, borderRadius: 18, background: '#D1FF4D' }} />
          <span style={{ fontSize: 84, fontWeight: 500, color: '#fff' }}>ticket</span>
        </div>
        <span style={{ marginTop: 24, fontSize: 40, color: '#D1FF4D' }}>Menor taxa do Brasil</span>
      </div>
    ),
    { ...size },
  );
}
```

- [ ] **Step 2: Create the per-event OG image `src/app/(shop)/eventos/[slug]/opengraph-image.tsx`**

```tsx
import { ImageResponse } from 'next/og';
import { fetchEventForMeta, buildEventDescription } from '@/lib/seo';

export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
export const alt = 'Evento no Easy Ticket';

export default async function EventOgImage(
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const event = await fetchEventForMeta(slug);
  const title = event?.title ?? 'Easy Ticket';
  const subtitle = event ? buildEventDescription(event) : 'Menor taxa do Brasil';

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          background: event?.posterUrl
            ? `linear-gradient(rgba(10,10,15,0.72), rgba(10,10,15,0.92))`
            : '#0A0A0F',
          padding: 80,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 34, fontWeight: 800, fontStyle: 'italic', color: '#fff' }}>easy</span>
          <div style={{ width: 10, height: 10, borderRadius: 10, background: '#D1FF4D' }} />
          <span style={{ fontSize: 34, color: '#fff' }}>ticket</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontSize: 68, fontWeight: 800, color: '#fff', lineHeight: 1.05 }}>{title}</span>
          <span style={{ marginTop: 20, fontSize: 34, color: '#D1FF4D' }}>{subtitle}</span>
        </div>
      </div>
    ),
    { ...size },
  );
}
```

Note: `posterUrl` is used only to darken the background tone in v1 (next/og cannot layer a remote `<img>` without an absolute-URL fetch that risks failures); the event text is always legible on the solid/gradient base.

- [ ] **Step 3: Verify the build**

Run: `pnpm build`
Expected: build succeeds; routes `/opengraph-image` and `/eventos/[slug]/opengraph-image` appear.

- [ ] **Step 4: Manual check**

Run `pnpm dev`, open `http://localhost:3000/opengraph-image` → branded PNG renders; open `http://localhost:3000/eventos/<slug>/opengraph-image` → PNG with the event title renders.

- [ ] **Step 5: Commit**

```bash
git add "src/app/opengraph-image.tsx" "src/app/(shop)/eventos/[slug]/opengraph-image.tsx"
git commit -m "feat(seo): dynamic OpenGraph images (site + per-event)"
```

---

### Task 7: `sitemap.ts` + `robots.ts`

**Files:**
- Create: `src/app/sitemap.ts`
- Create: `src/app/robots.ts`

**Interfaces:**
- Consumes: `SITE_URL`, `fetchPublishedEventSlugs` from `src/lib/seo.ts`.
- Produces: `/sitemap.xml` and `/robots.txt`.

- [ ] **Step 1: Create `src/app/sitemap.ts`**

```ts
import type { MetadataRoute } from 'next';
import { SITE_URL, fetchPublishedEventSlugs } from '@/lib/seo';

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, changeFrequency: 'daily', priority: 1 },
    { url: `${SITE_URL}/eventos`, changeFrequency: 'daily', priority: 0.9 },
    { url: `${SITE_URL}/manifesto`, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${SITE_URL}/produtores`, changeFrequency: 'monthly', priority: 0.5 },
  ];

  const slugs = await fetchPublishedEventSlugs();
  const eventRoutes: MetadataRoute.Sitemap = slugs.map((slug) => ({
    url: `${SITE_URL}/eventos/${slug}`,
    changeFrequency: 'daily',
    priority: 0.8,
  }));

  return [...staticRoutes, ...eventRoutes];
}
```

- [ ] **Step 2: Create `src/app/robots.ts`**

```ts
import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/seo';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: '/', disallow: ['/admin', '/painel-produtor', '/minha-conta'] },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
```

- [ ] **Step 3: Verify the build**

Run: `pnpm build`
Expected: build succeeds; `/sitemap.xml` and `/robots.txt` appear in the route list.

- [ ] **Step 4: Manual check**

Run `pnpm dev`; `http://localhost:3000/robots.txt` shows the rules + sitemap line; `http://localhost:3000/sitemap.xml` lists static routes plus one `<url>` per published event (with the backend running).

- [ ] **Step 5: Commit**

```bash
git add src/app/sitemap.ts src/app/robots.ts
git commit -m "feat(seo): dynamic sitemap.xml + robots.txt"
```

---

### Task 8: Document the new env var

**Files:**
- Modify: `easy-ticket-web/README.md` (or create `.env.example` if the team prefers) — document `NEXT_PUBLIC_SITE_URL`.

**Interfaces:**
- Consumes: nothing. Produces: docs only.

- [ ] **Step 1: Add a short "Environment" note**

Add to `README.md`:

```markdown
## Environment

- `NEXT_PUBLIC_API_URL` — backend base URL (default `http://localhost:3001`).
- `NEXT_PUBLIC_SITE_URL` — the site's public URL, used for `metadataBase`, canonical URLs, OG images and the sitemap (default `http://localhost:3000`). Set this to the production domain on Vercel.
```

- [ ] **Step 2: Commit**

```bash
git add README.md
git commit -m "docs(web): document NEXT_PUBLIC_SITE_URL"
```

---

## Self-Review Notes

- **Spec coverage:** icons (Task 3), global metadata (Task 4), per-event metadata via server/client split (Tasks 1-2 + 5), dynamic OG default + per-event (Task 6), sitemap + robots (Task 7), env var (Task 8). All spec sections mapped.
- **Fallbacks:** `fetchEventForMeta`/`fetchPublishedEventSlugs` swallow errors → null/[] (Task 2 tests cover 404, throw, paging). Satisfies the "backend outage must not 500 a page" constraint.
- **Type consistency:** `EventMetaSource`, `buildEventDescription`, `buildEventMetadata`, `fetchEventForMeta`, `fetchPublishedEventSlugs`, `SITE_URL`, `API_BASE` are defined in Tasks 1-2 and consumed with identical signatures in Tasks 4-7. `EventDetailClient` default export defined in Task 5 and imported in the same task's `page.tsx`.
- **Testable core:** all branching logic lives in `seo.ts` (Vitest); App Router files are declarative wrappers verified by `pnpm build` + manual smoke checks, since Next file-convention modules aren't unit-testable in isolation.
