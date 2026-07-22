import { get, set } from 'idb-keyval';

export interface ManifestTicket {
  ticketId: string;
  qrTokenHash: string;
  shortCode: string;
  sectorName: string;
  batchName: string | null;
  sectorColor: string;
  holderFirstName: string;
  status: string;
  usedAt: string | null;
}

export interface PendingValidation {
  ticketId: string;
  validatedAt: string;
}

export interface PortariaState {
  byHash: Record<string, ManifestTicket>;
  pending: PendingValidation[];
}

export type LocalResult =
  | { kind: 'success'; ticket: ManifestTicket }
  | { kind: 'already_used'; usedAt: string | null }
  | { kind: 'not_found' }
  | { kind: 'invalid_status'; status: string };

export async function sha256Hex(text: string): Promise<string> {
  const data = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Indexa o manifest por hash e re-aplica validações offline ainda não
 * sincronizadas (o manifest fresco do servidor ainda as mostra VALID).
 */
export function buildState(
  tickets: ManifestTicket[],
  carryPending: PendingValidation[] = [],
): PortariaState {
  const byHash: Record<string, ManifestTicket> = {};
  for (const t of tickets) byHash[t.qrTokenHash] = t;
  const pendingByTicketId = new Map(
    carryPending.map((p) => [p.ticketId, p.validatedAt]),
  );
  for (const t of Object.values(byHash)) {
    const pendingAt = pendingByTicketId.get(t.ticketId);
    if (pendingAt && t.status === 'VALID') {
      byHash[t.qrTokenHash] = { ...t, status: 'USED', usedAt: pendingAt };
    }
  }
  return { byHash, pending: carryPending };
}

export function applyLocalValidation(
  state: PortariaState,
  hash: string,
  nowIso: string,
): { state: PortariaState; result: LocalResult } {
  const ticket = state.byHash[hash];
  if (!ticket) return { state, result: { kind: 'not_found' } };
  if (ticket.status === 'USED') {
    return {
      state,
      result: { kind: 'already_used', usedAt: ticket.usedAt },
    };
  }
  if (ticket.status !== 'VALID') {
    return { state, result: { kind: 'invalid_status', status: ticket.status } };
  }
  const used: ManifestTicket = { ...ticket, status: 'USED', usedAt: nowIso };
  return {
    state: {
      byHash: { ...state.byHash, [hash]: used },
      pending: [
        ...state.pending,
        { ticketId: ticket.ticketId, validatedAt: nowIso },
      ],
    },
    result: { kind: 'success', ticket: used },
  };
}

const stateKey = (slug: string) => `portaria:${slug}:state`;

export async function loadState(slug: string): Promise<PortariaState | null> {
  return ((await get(stateKey(slug))) as PortariaState | undefined) ?? null;
}

export async function saveState(
  slug: string,
  state: PortariaState,
): Promise<void> {
  await set(stateKey(slug), state);
}
