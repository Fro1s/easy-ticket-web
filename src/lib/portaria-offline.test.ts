import { describe, expect, it } from 'vitest';
import {
  applyLocalValidation,
  buildState,
  sha256Hex,
  type ManifestTicket,
} from './portaria-offline';

function ticket(over: Partial<ManifestTicket> = {}): ManifestTicket {
  return {
    ticketId: 't1',
    qrTokenHash: 'hash1',
    shortCode: 'ET-A',
    sectorName: 'Pista',
    batchName: null,
    sectorColor: '#fff',
    holderFirstName: 'Ana',
    status: 'VALID',
    usedAt: null,
    ...over,
  };
}

describe('sha256Hex', () => {
  it('hashes deterministically to 64 hex chars', async () => {
    const h = await sha256Hex('et:o1:tok');
    expect(h).toMatch(/^[0-9a-f]{64}$/);
    expect(await sha256Hex('et:o1:tok')).toBe(h);
  });
});

describe('buildState / applyLocalValidation', () => {
  it('validates a VALID ticket, enqueues it, and blocks a re-scan', () => {
    const s0 = buildState([ticket()]);
    const { state: s1, result: r1 } = applyLocalValidation(
      s0,
      'hash1',
      '2026-07-21T20:00:00Z',
    );
    expect(r1.kind).toBe('success');
    expect(s1.pending).toEqual([
      { ticketId: 't1', validatedAt: '2026-07-21T20:00:00Z' },
    ]);

    const { result: r2 } = applyLocalValidation(
      s1,
      'hash1',
      '2026-07-21T20:01:00Z',
    );
    expect(r2.kind).toBe('already_used');
  });

  it('reports not_found for unknown hash', () => {
    const { result } = applyLocalValidation(
      buildState([ticket()]),
      'nope',
      '2026-07-21T20:00:00Z',
    );
    expect(result.kind).toBe('not_found');
  });

  it('reports already_used for tickets USED in the manifest', () => {
    const s = buildState([
      ticket({ status: 'USED', usedAt: '2026-07-21T19:00:00Z' }),
    ]);
    const { result } = applyLocalValidation(s, 'hash1', '2026-07-21T20:00:00Z');
    expect(result).toEqual({
      kind: 'already_used',
      usedAt: '2026-07-21T19:00:00Z',
    });
  });

  it('reports invalid_status for refunded/transferred', () => {
    const s = buildState([ticket({ status: 'REFUNDED' })]);
    const { result } = applyLocalValidation(s, 'hash1', '2026-07-21T20:00:00Z');
    expect(result).toEqual({ kind: 'invalid_status', status: 'REFUNDED' });
  });

  it('carries pending queue over a fresh manifest (fresh still says VALID)', () => {
    const pending = [{ ticketId: 't1', validatedAt: '2026-07-21T20:00:00Z' }];
    const s = buildState([ticket()], pending);
    expect(s.pending).toEqual(pending);
    expect(s.byHash['hash1'].status).toBe('USED');
  });
});
