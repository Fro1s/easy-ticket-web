'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Camera, Check, Mail, Send, Pencil, Copy } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { RoleGate } from '@/components/role-gate';
import { ProducerHeader } from '@/components/producer-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  ProducerControllerListOrdersStatus,
  useProducerControllerConfirmManualPayment,
  useProducerControllerGetEvent,
  useProducerControllerListOrders,
  useProducerControllerPublishEvent,
  useProducerControllerSell,
} from '@/generated/api';
import type { ProducerEventDetail, SellByEmailResponse } from '@/generated/api';
import {
  ORDER_STATUS_PT,
  EVENT_STATUS_PT,
  PAYMENT_PROVIDER_PT,
  PAYMENT_METHOD_PT,
  tr,
} from '@/lib/i18n';
import { cn } from '@/lib/utils';

const FILTERS = [
  'TODOS',
  'PENDING',
  'PAID',
  'EXPIRED',
  'CANCELLED',
] as const;
type FilterValue = (typeof FILTERS)[number];

const FILTER_LABELS: Record<FilterValue, string> = {
  TODOS: 'Todos',
  PENDING: 'Pendente',
  PAID: 'Pago',
  EXPIRED: 'Expirado',
  CANCELLED: 'Cancelado',
};

const fmtBRL = (c: number) =>
  (c / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const fmtDT = (s: string) => new Date(s).toLocaleString('pt-BR');

function extractErr(e: unknown): string {
  const m = (e as { response?: { data?: { message?: unknown } } })?.response
    ?.data?.message;
  return Array.isArray(m) ? m.join('; ') : String(m ?? 'Erro');
}

function Kpi({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div
      className={cn(
        'border rounded-[6px] p-3',
        accent ? 'border-accent/60 bg-accent/5' : 'border-border/50 bg-card/40',
      )}
    >
      <div className="font-mono text-[10px] tracking-[1.5px] uppercase text-ink-dim mb-1">
        {label}
      </div>
      <div className={cn('font-display text-lg font-bold', accent && 'text-accent')}>
        {value}
      </div>
    </div>
  );
}

function ConfirmManualPaymentDialog({
  orderId,
  open,
  onOpenChange,
  onConfirm,
}: {
  orderId: string | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onConfirm: (orderId: string, reference: string) => Promise<void>;
}) {
  const [reference, setReference] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (!orderId) return;
    setBusy(true);
    try {
      await onConfirm(orderId, reference.trim());
      setReference('');
      onOpenChange(false);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">Confirmar pagamento manual</DialogTitle>
          <DialogDescription>
            Adicione uma referência (opcional) — vai ficar no histórico de auditoria.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label className="font-mono text-[11px] tracking-[2px] uppercase text-ink-dim">
            Referência
          </Label>
          <Input
            value={reference}
            onChange={(e) => setReference(e.target.value)}
            placeholder='Ex.: "PIX recebido 14:32 R$ 50 via Caixa"'
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>
            Cancelar
          </Button>
          <Button variant="accent" onClick={submit} disabled={busy}>
            <Check className="w-4 h-4" />
            {busy ? 'Confirmando…' : 'Confirmar pago'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function EventoDetailPage() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug;
  const [filter, setFilter] = useState<FilterValue>('TODOS');
  const [err, setErr] = useState<string | null>(null);
  const [sellOpen, setSellOpen] = useState(false);
  const [confirmOrderId, setConfirmOrderId] = useState<string | null>(null);

  const ev = useProducerControllerGetEvent(slug);
  const orders = useProducerControllerListOrders(
    slug,
    filter === 'TODOS'
      ? {}
      : {
          status:
            ProducerControllerListOrdersStatus[
              filter as keyof typeof ProducerControllerListOrdersStatus
            ],
        },
  );
  const publish = useProducerControllerPublishEvent();
  const confirm = useProducerControllerConfirmManualPayment();

  const detail = ev.data?.data;
  const list = orders.data?.data;

  async function onPublish() {
    if (!detail) return;
    setErr(null);
    try {
      await publish.mutateAsync({ id: detail.id });
      ev.refetch();
    } catch (e) {
      setErr(extractErr(e));
    }
  }

  async function handleConfirm(orderId: string, reference: string) {
    setErr(null);
    try {
      await confirm.mutateAsync({
        id: orderId,
        data: { reference: reference || undefined },
      });
      orders.refetch();
      ev.refetch();
    } catch (e) {
      setErr(extractErr(e));
      orders.refetch();
    }
  }

  return (
    <RoleGate allow={['PRODUCER', 'ADMIN']}>
      {(user) => (
        <>
          <ProducerHeader scope={user.role === 'ADMIN' ? 'admin' : 'producer'} />
          <main className="min-h-screen bg-ink-deep px-6 md:px-8 py-10 text-foreground">
            <div className="mx-auto max-w-6xl">
              <Link
                href="/painel-produtor"
                className="inline-block mb-6 font-mono text-[11px] tracking-[2px] uppercase text-ink-dim hover:text-foreground"
              >
                ← Voltar para visão geral
              </Link>

            {ev.isLoading ? (
              <div className="text-ink-dim">Carregando…</div>
            ) : !detail ? (
              <div className="text-red-400">Evento não encontrado</div>
            ) : (
              <>
                <div className="grid md:grid-cols-[280px_1fr] gap-8 mb-12">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={detail.posterUrl}
                    alt={detail.title}
                    className="w-full aspect-[3/4] object-cover rounded-[6px]"
                  />
                  <div>
                    <div className="flex flex-wrap items-center gap-3 mb-3">
                      <span
                        className={cn(
                          'font-mono text-[10px] tracking-[1.5px] uppercase px-2 py-1 rounded-[3px]',
                          detail.status === 'PUBLISHED'
                            ? 'bg-accent/15 text-accent'
                            : 'bg-ink-dim/20 text-ink-dim',
                        )}
                      >
                        {tr(EVENT_STATUS_PT, detail.status)}
                      </span>
                      <span className="font-mono text-[10px] tracking-[1.5px] uppercase text-ink-dim">
                        {tr(PAYMENT_PROVIDER_PT, detail.paymentProvider)} · taxa{' '}
                        {(detail.platformFeeRate * 100).toFixed(2).replace('.', ',')}%
                      </span>
                    </div>
                    <h1 className="font-display text-[40px] font-extrabold leading-[1] tracking-[-1.5px] mb-2">
                      {detail.title}
                    </h1>
                    <div className="text-ink-dim mb-6">
                      {detail.artist} · {fmtDT(detail.startsAt)} ·{' '}
                      {detail.venue.name} · {detail.venue.city}/{detail.venue.state}
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                      <Kpi label="Vendidos" value={String(detail.kpis.ticketsSold)} />
                      <Kpi label="Bruto" value={fmtBRL(detail.kpis.grossRevenueCents)} />
                      <Kpi label="Taxa" value={fmtBRL(detail.kpis.platformFeeCents)} />
                      <Kpi label="Líquido" value={fmtBRL(detail.kpis.netCents)} accent />
                    </div>

                    <div className="flex gap-3 flex-wrap">
                      {detail.status === 'DRAFT' && (
                        <>
                          <Button onClick={onPublish} variant="accent" disabled={publish.isPending}>
                            {publish.isPending ? 'Publicando…' : 'Publicar evento'}
                          </Button>
                          <Link href={`/painel-produtor/eventos/${slug}/editar`}>
                            <Button variant="outline">
                              <Pencil className="w-4 h-4" />
                              Editar
                            </Button>
                          </Link>
                        </>
                      )}
                      <Button
                        onClick={() => setSellOpen(true)}
                        variant="outline"
                        disabled={detail.status !== 'PUBLISHED'}
                        className="border-accent/60 text-accent hover:bg-accent/10 hover:text-accent"
                      >
                        <Mail className="w-4 h-4" />
                        Vender por e-mail
                      </Button>
                      <Link href={`/painel-produtor/eventos/${slug}/portaria`}>
                        <Button variant="outline">
                          <Camera className="w-4 h-4" />
                          Portaria
                        </Button>
                      </Link>
                    </div>
                    {err && <div className="text-red-400 text-sm mt-3">{err}</div>}
                  </div>
                </div>

                <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                  <h2 className="font-display text-2xl font-bold">Pedidos</h2>
                  <div className="flex gap-2 flex-wrap">
                    {FILTERS.map((s) => (
                      <button
                        key={s}
                        onClick={() => setFilter(s)}
                        className={cn(
                          'px-3 py-1 rounded-[3px] font-mono text-[10px] tracking-[1.5px] uppercase transition-colors',
                          filter === s
                            ? 'bg-accent text-[#0A0A0F]'
                            : 'bg-card/40 text-ink-dim border border-border/50 hover:text-foreground',
                        )}
                      >
                        {FILTER_LABELS[s]}
                      </button>
                    ))}
                  </div>
                </div>

                {sellOpen && detail && (
                  <SellByEmailDialog
                    event={detail}
                    open={sellOpen}
                    onOpenChange={setSellOpen}
                    onSold={() => {
                      orders.refetch();
                      ev.refetch();
                    }}
                  />
                )}

                <ConfirmManualPaymentDialog
                  orderId={confirmOrderId}
                  open={!!confirmOrderId}
                  onOpenChange={(v) => !v && setConfirmOrderId(null)}
                  onConfirm={handleConfirm}
                />

                {orders.isLoading ? (
                  <div className="text-ink-dim">Carregando pedidos…</div>
                ) : (
                  <ul className="space-y-2">
                    {(list?.items ?? []).map((o) => (
                      <li
                        key={o.id}
                        className="border border-border/50 rounded-[6px] p-4 bg-card/40 grid grid-cols-1 md:grid-cols-[120px_1fr_1fr_auto] gap-4 items-center"
                      >
                        <div>
                          <div className="font-mono text-[11px] text-foreground">
                            #{o.shortId}
                          </div>
                          <div className="font-mono text-[10px] text-ink-dim">
                            {fmtDT(o.createdAt)}
                          </div>
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm truncate">{o.buyerEmail}</div>
                          <div className="text-xs text-ink-dim">
                            {o.buyerName ?? '—'} · {o.qty} ingresso(s)
                          </div>
                        </div>
                        <div>
                          <div className="font-mono text-sm">{fmtBRL(o.totalCents)}</div>
                          <div className="font-mono text-[10px] text-ink-dim">
                            <span
                              className={cn(
                                'mr-2 px-1.5 py-0.5 rounded-[3px]',
                                o.status === 'PAID'
                                  ? 'bg-accent/15 text-accent'
                                  : o.status === 'PENDING'
                                    ? 'bg-yellow-500/15 text-yellow-300'
                                    : 'bg-ink-dim/20 text-ink-dim',
                              )}
                            >
                              {tr(ORDER_STATUS_PT, o.status)}
                            </span>
                            {o.paymentMethod ? tr(PAYMENT_METHOD_PT, o.paymentMethod) : 'sem método'}
                          </div>
                        </div>
                        <div>
                          {o.isManualPending && (
                            <Button
                              onClick={() => setConfirmOrderId(o.id)}
                              variant="accent"
                              size="sm"
                            >
                              <Check className="w-4 h-4" />
                              Marcar pago
                            </Button>
                          )}
                        </div>
                      </li>
                    ))}
                    {!list?.items?.length && (
                      <li className="text-ink-dim text-center border border-dashed border-border/50 rounded-[6px] p-8">
                        Nenhum pedido neste filtro.
                      </li>
                    )}
                  </ul>
                )}
              </>
            )}
            </div>
          </main>
        </>
      )}
    </RoleGate>
  );
}

function SellByEmailDialog({
  event,
  open,
  onOpenChange,
  onSold,
}: {
  event: ProducerEventDetail;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSold: () => void;
}) {
  const sell = useProducerControllerSell();
  const sectors = event.sectors ?? [];
  const firstSectorId = sectors[0]?.id ?? '';
  const [email, setEmail] = useState('');
  const [buyerName, setBuyerName] = useState('');
  const [sectorId, setSectorId] = useState(firstSectorId);
  const [qty, setQty] = useState(1);
  const [markPaid, setMarkPaid] = useState(true);
  const [result, setResult] = useState<SellByEmailResponse | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const sector = sectors.find((s) => s.id === sectorId);
  const total = sector ? (sector.priceCents * qty) / 100 : 0;
  const remaining = sector
    ? sector.capacity - sector.sold - sector.reserved
    : 0;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    if (!email.trim() || !sectorId || qty < 1) {
      setErr('Preencha e-mail, setor e quantidade.');
      return;
    }
    try {
      const res = await sell.mutateAsync({
        id: event.id,
        data: {
          email: email.trim().toLowerCase(),
          sectorId,
          qty,
          buyerName: buyerName.trim() || undefined,
          markPaid,
        },
      });
      setResult(res.data);
      onSold();
    } catch (e) {
      const m = (e as { response?: { data?: { message?: unknown } } })?.response
        ?.data?.message;
      setErr(Array.isArray(m) ? m.join('; ') : String(m ?? 'Falha ao vender.'));
    }
  }

  function reset() {
    setResult(null);
    setEmail('');
    setBuyerName('');
    setQty(1);
    setErr(null);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) reset();
        onOpenChange(v);
      }}
    >
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <div className="font-mono text-[10px] tracking-[2px] uppercase text-accent mb-1">
            VENDA DIRETA
          </div>
          <DialogTitle className="font-display text-2xl">Vender por e-mail</DialogTitle>
          <DialogDescription>
            Cria conta-fantasma se necessário e envia o ingresso com QR + claim link.
          </DialogDescription>
        </DialogHeader>

        {result ? (
          <div className="space-y-4">
            <div className="border border-accent/60 bg-accent/5 rounded-[6px] p-4">
              <div className="font-mono text-[10px] tracking-[1.5px] uppercase text-accent mb-2">
                {result.status === 'PAID' ? 'INGRESSO EMITIDO' : 'PEDIDO PENDENTE'}
              </div>
              <div className="text-sm">
                {result.ticketIds.length > 0
                  ? `${result.ticketIds.length} ingresso(s) emitido(s)`
                  : 'Aguardando confirmação do pagamento'}
                {result.emailSent ? ' · e-mail enviado' : ''}
              </div>
              {result.ghostUserCreated && (
                <div className="text-xs text-ink-dim mt-1">
                  Conta-fantasma criada — comprador precisa ativar via claim link.
                </div>
              )}
            </div>

            {result.pixCopyPaste && (
              <div className="border border-yellow-500/40 bg-yellow-500/5 rounded-[6px] p-4">
                <div className="font-mono text-[10px] tracking-[1.5px] uppercase text-yellow-300 mb-3">
                  PIX para venda presencial
                </div>
                <div className="flex flex-col sm:flex-row gap-4 items-center">
                  <div className="bg-white p-2 rounded-[4px] shrink-0">
                    <QRCodeSVG
                      value={result.pixCopyPaste}
                      size={140}
                      level="M"
                      marginSize={0}
                      bgColor="#FFFFFF"
                      fgColor="#0A0A0F"
                    />
                  </div>
                  <div className="flex-1 min-w-0 text-xs">
                    <div className="text-ink-dim mb-1">Mostre o QR para o comprador escanear no banco.</div>
                    {result.totalCents != null && (
                      <div className="font-display text-lg font-bold mb-2">
                        {(result.totalCents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        if (result.pixCopyPaste) {
                          navigator.clipboard?.writeText(result.pixCopyPaste);
                        }
                      }}
                      className="inline-flex items-center gap-1.5 font-mono text-[10px] tracking-[1.5px] uppercase text-accent hover:opacity-80"
                    >
                      <Copy className="w-3 h-3" /> Copiar código
                    </button>
                  </div>
                </div>
                <div className="text-[11px] text-ink-dim mt-3">
                  Após o pagamento, marque o pedido como pago na lista abaixo. O ingresso vai pro e-mail do comprador.
                </div>
              </div>
            )}
            {result.claimUrl && (
              <div>
                <div className="font-mono text-[10px] tracking-[1.5px] uppercase text-ink-dim mb-1">
                  Claim URL (cópia manual se preciso)
                </div>
                <div className="font-mono text-[11px] break-all bg-card/40 border border-border/50 rounded-[4px] p-2">
                  {result.claimUrl}
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={reset}>
                Vender outro
              </Button>
              <Button variant="accent" onClick={() => onOpenChange(false)}>
                Fechar
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="space-y-4" noValidate>
            <div className="space-y-2">
              <Label className="font-mono text-[10px] tracking-[1.5px] uppercase text-ink-dim">
                E-mail do comprador *
              </Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="comprador@exemplo.com"
                required
              />
            </div>
            <div className="space-y-2">
              <Label className="font-mono text-[10px] tracking-[1.5px] uppercase text-ink-dim">
                Nome (opcional)
              </Label>
              <Input
                value={buyerName}
                onChange={(e) => setBuyerName(e.target.value)}
                placeholder="Maria Silva"
              />
            </div>
            <div className="grid grid-cols-[1fr_100px] gap-3">
              <div className="space-y-2">
                <Label className="font-mono text-[10px] tracking-[1.5px] uppercase text-ink-dim">
                  Setor *
                </Label>
                <Select
                  value={sectorId}
                  onValueChange={(v) => v && setSectorId(v)}
                  items={sectors.map((s) => ({
                    value: s.id,
                    label: `${s.name} — ${(s.priceCents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`,
                  }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Escolha o setor" />
                  </SelectTrigger>
                  <SelectContent>
                    {sectors.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        <span className="flex items-center gap-2">
                          <span
                            className="w-2 h-2 rounded-full inline-block"
                            style={{ backgroundColor: s.colorHex }}
                          />
                          {s.name} — {(s.priceCents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="font-mono text-[10px] tracking-[1.5px] uppercase text-ink-dim">
                  Qtd *
                </Label>
                <Input
                  type="number"
                  min={1}
                  max={Math.min(6, Math.max(1, remaining))}
                  value={qty}
                  onChange={(e) => setQty(Number(e.target.value))}
                />
              </div>
            </div>
            <div className="text-xs text-ink-dim">
              {remaining} disponível(is) · Total:{' '}
              <span className="text-foreground font-mono">
                {total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </span>
            </div>

            <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
              <input
                type="checkbox"
                checked={markPaid}
                onChange={(e) => setMarkPaid(e.target.checked)}
                className="w-4 h-4 accent-accent"
              />
              <span>Marcar como pago já (emite ingresso na hora)</span>
            </label>

            {err && (
              <div className="border-l-2 border-destructive bg-destructive/10 px-3 py-2 text-[13px] text-red-300">
                {err}
              </div>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={sell.isPending}
              >
                Cancelar
              </Button>
              <Button type="submit" variant="accent" disabled={sell.isPending}>
                {sell.isPending ? 'Enviando…' : 'Vender e enviar'}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
