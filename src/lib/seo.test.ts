import { describe, it, expect } from 'vitest'
import { buildEventDescription, buildEventMetadata, type EventMetaSource } from './seo'

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
