import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { buildEventDescription, buildEventMetadata, fetchEventForMeta, fetchPublishedEventSlugs, type EventMetaSource } from './seo'

const base: EventMetaSource = {
  slug: 'show-do-artista',
  title: 'Show do Artista',
  artist: 'Fulano',
  venue: { name: 'Arena X', city: 'São Paulo', state: 'SP' },
}

describe('buildEventDescription', () => {
  it('joins artist, venue name and city', () => {
    expect(buildEventDescription(base)).toBe('Fulano · Arena X · São Paulo. Ingressos no Easy Ticket.')
  })
  it('falls back when nothing but title is present', () => {
    expect(buildEventDescription({ slug: 's', title: 'T' })).toBe('Ingressos no Easy Ticket.')
  })
})

describe('buildEventMetadata', () => {
  it('sets title, canonical and openGraph', () => {
    const m = buildEventMetadata(base)
    expect(m.title).toBe('Show do Artista')
    expect(m.alternates?.canonical).toBe('/eventos/show-do-artista')
    expect((m.openGraph as { title?: string }).title).toBe('Show do Artista')
  })
})

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
})
