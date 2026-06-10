import { jsPDF } from 'jspdf';
import QRCode from 'qrcode';
import type { MyTicketItem } from '@/generated/api';
import { ticketLabel } from '@/lib/sector-label';

function fmtDateTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString('pt-BR', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  } catch {
    return iso;
  }
}

async function renderTicketPage(doc: jsPDF, ticket: MyTicketItem): Promise<void> {
  const qrDataUrl = await QRCode.toDataURL(ticket.qrToken, {
    errorCorrectionLevel: 'M',
    margin: 1,
    width: 600,
  });

  const holder = ticket.holderName ?? '';
  doc.setFontSize(10);
  doc.setTextColor(120);
  doc.text('EASY TICKET', 20, 20);

  doc.setTextColor(20);
  doc.setFontSize(22);
  doc.text(ticket.event.artist, 20, 34);
  doc.setFontSize(13);
  doc.setTextColor(90);
  doc.text(ticket.event.title, 20, 43);

  doc.setFontSize(11);
  doc.setTextColor(40);
  const lines = [
    `Data: ${fmtDateTime(ticket.event.startsAt)}`,
    `Abertura: ${fmtDateTime(ticket.event.doorsAt)}`,
    `Local: ${ticket.event.venueName} — ${ticket.event.venueCity}/${ticket.event.venueState}`,
    `Setor: ${ticketLabel(ticket.batchName, ticket.sector.name)}`,
    holder ? `Portador: ${holder}` : '',
    `Código: ${ticket.shortCode}`,
  ].filter(Boolean);
  let y = 58;
  for (const line of lines) {
    doc.text(line, 20, y);
    y += 8;
  }

  doc.addImage(qrDataUrl, 'PNG', 20, y + 4, 60, 60);

  doc.setFontSize(9);
  doc.setTextColor(140);
  doc.text('Apresente este QR no portão. Não precisa imprimir.', 20, y + 74);
}

export async function downloadTicketPdf(ticket: MyTicketItem): Promise<void> {
  const doc = new jsPDF();
  await renderTicketPage(doc, ticket);
  doc.save(`ingresso-${ticket.shortCode}.pdf`);
}

export async function downloadOrderTicketsPdf(
  tickets: MyTicketItem[],
): Promise<void> {
  if (!tickets.length) return;
  const doc = new jsPDF();
  for (let i = 0; i < tickets.length; i++) {
    if (i > 0) doc.addPage();
    await renderTicketPage(doc, tickets[i]);
  }
  doc.save(`ingressos-${tickets[0].orderId.slice(-8)}.pdf`);
}
