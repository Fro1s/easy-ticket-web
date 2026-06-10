import type { SectorResponse } from '@/generated/api';

/** Vitrine: nome do lote ativo, com fallback pro nome do setor. */
export function displaySectorLabel(sector: SectorResponse): string {
  return sector.activeBatch?.name || sector.name;
}

/** Ingresso: nome do lote comprado, com fallback pro nome do setor. */
export function ticketLabel(
  batchName: string | null | undefined,
  sectorName: string,
): string {
  return batchName || sectorName;
}
