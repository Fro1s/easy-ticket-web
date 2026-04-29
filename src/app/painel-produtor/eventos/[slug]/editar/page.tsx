'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { format as fmtDate } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarIcon } from 'lucide-react';
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import {
  UpdateEventDtoCategory,
  UpdateEventDtoPaymentProvider,
  UpdateEventDtoPixKeyType,
  useProducerControllerGetEvent,
  useProducerControllerUpdateEvent,
  useVenuesControllerList,
} from '@/generated/api';
import type { UpdateEventDto } from '@/generated/api';
import { CATEGORY_PT, PAYMENT_PROVIDER_PT, PIX_KEY_TYPE_PT } from '@/lib/i18n';
import { cn } from '@/lib/utils';

const CATEGORIES = Object.values(UpdateEventDtoCategory);
const PIX_KEY_TYPES = Object.values(UpdateEventDtoPixKeyType);

function combineDateTime(date: Date | undefined, hhmm: string): string | null {
  if (!date) return null;
  if (!/^\d{2}:\d{2}$/.test(hhmm)) return null;
  const [h, m] = hhmm.split(':').map(Number);
  const dt = new Date(date);
  dt.setHours(h, m, 0, 0);
  return dt.toISOString();
}

function timeFromIso(iso: string): string {
  const d = new Date(iso);
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
}

function DatePickerField({
  label,
  date,
  setDate,
  time,
  setTime,
}: {
  label: string;
  date: Date | undefined;
  setDate: (d: Date | undefined) => void;
  time: string;
  setTime: (t: string) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="space-y-2">
      <Label className="font-mono text-[11px] tracking-[2px] uppercase text-ink-dim">
        {label}
      </Label>
      <div className="grid grid-cols-[1fr_120px] gap-2">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger
            className={cn(
              'inline-flex items-center h-12 px-4 rounded-[4px] border-[1.5px] border-border bg-input',
              'font-body text-[15px] text-foreground hover:border-accent/60 transition-colors',
              !date && 'text-ink-dim',
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date ? fmtDate(date, "dd 'de' MMMM 'de' yyyy", { locale: ptBR }) : 'Escolha a data'}
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={date}
              onSelect={(d) => {
                setDate(d);
                setOpen(false);
              }}
              locale={ptBR}
              autoFocus
            />
          </PopoverContent>
        </Popover>
        <Input
          type="time"
          value={time}
          onChange={(e) => setTime(e.target.value)}
        />
      </div>
    </div>
  );
}

export default function EditarEventoPage() {
  const router = useRouter();
  const { slug } = useParams<{ slug: string }>();
  const venuesQ = useVenuesControllerList();
  const detailQ = useProducerControllerGetEvent(slug);
  const update = useProducerControllerUpdateEvent();

  const detail = detailQ.data?.data;
  const venues = venuesQ.data?.data ?? [];

  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [category, setCategory] = useState<UpdateEventDto['category']>(UpdateEventDtoCategory.SHOW);
  const [ageRating, setAgeRating] = useState('0');
  const [posterUrl, setPosterUrl] = useState('');
  const [description, setDescription] = useState('');
  const [venueId, setVenueId] = useState('');
  const [feePercent, setFeePercent] = useState('2.5');
  const [provider, setProvider] = useState<UpdateEventDtoPaymentProvider>(UpdateEventDtoPaymentProvider.MANUAL_PIX);
  const [pixKey, setPixKey] = useState('');
  const [pixKeyType, setPixKeyType] = useState<UpdateEventDto['pixKeyType']>(UpdateEventDtoPixKeyType.CNPJ);
  const [pixHolderName, setPixHolderName] = useState('');
  const [startsDate, setStartsDate] = useState<Date | undefined>(undefined);
  const [startsTime, setStartsTime] = useState('21:00');
  const [doorsDate, setDoorsDate] = useState<Date | undefined>(undefined);
  const [doorsTime, setDoorsTime] = useState('19:00');

  const [error, setError] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (!detail || hydrated) return;
    setTitle(detail.title);
    setArtist(detail.artist);
    setCategory(detail.category as UpdateEventDto['category']);
    setAgeRating(String(detail.ageRating));
    setPosterUrl(detail.posterUrl);
    setDescription(detail.description ?? '');
    setVenueId(detail.venue.id);
    setFeePercent(String((detail.platformFeeRate * 100).toFixed(2)));
    setProvider(detail.paymentProvider as UpdateEventDtoPaymentProvider);
    setPixKey(detail.pixKey ?? '');
    setPixKeyType((detail.pixKeyType ?? UpdateEventDtoPixKeyType.CNPJ) as UpdateEventDto['pixKeyType']);
    setPixHolderName(detail.pixHolderName ?? '');
    setStartsDate(new Date(detail.startsAt));
    setStartsTime(timeFromIso(detail.startsAt));
    setDoorsDate(new Date(detail.doorsAt));
    setDoorsTime(timeFromIso(detail.doorsAt));
    setHydrated(true);
  }, [detail, hydrated]);

  const validation = useMemo(() => {
    const errs: string[] = [];
    if (!title.trim()) errs.push('Informe o título.');
    if (!artist.trim()) errs.push('Informe o artista.');
    if (!venueId) errs.push('Escolha o local.');
    if (!posterUrl.trim()) errs.push('Informe a URL do poster.');
    if (!description.trim()) errs.push('Informe a descrição.');
    const startsAt = combineDateTime(startsDate, startsTime);
    const doorsAt = combineDateTime(doorsDate, doorsTime);
    if (!startsAt || !doorsAt) errs.push('Datas obrigatórias.');
    if (startsAt && doorsAt && new Date(doorsAt) > new Date(startsAt)) {
      errs.push('Abertura precisa ser antes do início.');
    }
    const feeNum = Number(feePercent);
    if (Number.isNaN(feeNum) || feeNum < 0 || feeNum > 50) {
      errs.push('Taxa precisa estar entre 0 e 50%.');
    }
    return { errs, startsAt, doorsAt };
  }, [
    title, artist, venueId, posterUrl, description, startsDate, startsTime,
    doorsDate, doorsTime, feePercent,
  ]);

  async function onSubmit(ev: FormEvent<HTMLFormElement>) {
    ev.preventDefault();
    setError(null);
    if (!detail) return;
    if (validation.errs.length) {
      setError(validation.errs.join(' · '));
      return;
    }
    const dto: UpdateEventDto = {
      title: title.trim(),
      artist: artist.trim(),
      category,
      startsAt: validation.startsAt!,
      doorsAt: validation.doorsAt!,
      ageRating: Number(ageRating),
      posterUrl: posterUrl.trim(),
      description: description.trim(),
      venueId,
      paymentProvider: provider,
      pixKey: provider === UpdateEventDtoPaymentProvider.MANUAL_PIX ? pixKey.trim() : undefined,
      pixKeyType: provider === UpdateEventDtoPaymentProvider.MANUAL_PIX ? pixKeyType : undefined,
      pixHolderName: provider === UpdateEventDtoPaymentProvider.MANUAL_PIX ? pixHolderName.trim() : undefined,
      platformFeeRate: Number(feePercent) / 100,
    };
    try {
      await update.mutateAsync({ id: detail.id, data: dto });
      router.replace(`/painel-produtor/eventos/${slug}`);
    } catch (err) {
      const m = (err as { response?: { data?: { message?: unknown } } })?.response?.data?.message;
      setError(Array.isArray(m) ? m.join('; ') : String(m ?? 'Erro ao atualizar evento'));
    }
  }

  if (detail && detail.status !== 'DRAFT') {
    return (
      <RoleGate allow={['PRODUCER', 'ADMIN']}>
        {(user) => (
          <>
            <ProducerHeader scope={user.role === 'ADMIN' ? 'admin' : 'producer'} />
            <main className="min-h-screen bg-ink-deep px-6 md:px-8 py-10 text-foreground">
              <div className="mx-auto max-w-3xl text-center py-20">
                <div className="font-mono text-[11px] tracking-[2px] uppercase text-ink-dim mb-3">
                  Edição não disponível
                </div>
                <h1 className="font-display text-3xl font-bold mb-4">
                  Apenas eventos em rascunho podem ser editados
                </h1>
                <p className="text-ink-muted mb-6">
                  Este evento está {detail.status}. Para alterar dados, fale com o
                  Easy Ticket.
                </p>
                <Link href={`/painel-produtor/eventos/${slug}`}>
                  <Button variant="outline">Voltar ao evento</Button>
                </Link>
              </div>
            </main>
          </>
        )}
      </RoleGate>
    );
  }

  return (
    <RoleGate allow={['PRODUCER', 'ADMIN']}>
      {(user) => (
        <>
          <ProducerHeader scope={user.role === 'ADMIN' ? 'admin' : 'producer'} />
          <main className="min-h-screen bg-ink-deep px-6 md:px-8 py-10 text-foreground">
            <div className="mx-auto max-w-3xl">
              <Link
                href={`/painel-produtor/eventos/${slug}`}
                className="inline-block mb-6 font-mono text-[11px] tracking-[2px] uppercase text-ink-dim hover:text-foreground"
              >
                ← Voltar ao evento
              </Link>

              <div className="font-mono text-[11px] tracking-[2px] uppercase text-accent mb-3">
                EDITAR RASCUNHO
              </div>
              <h1 className="font-display text-[44px] font-extrabold leading-[0.95] tracking-[-2px] mb-10">
                {title || 'Carregando…'}
                <span className="text-accent">.</span>
              </h1>

              {!detail || !hydrated ? (
                <div className="text-ink-dim">Carregando…</div>
              ) : (
                <form onSubmit={onSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <Label className="font-mono text-[11px] tracking-[2px] uppercase text-ink-dim">Título *</Label>
                    <Input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={200} required />
                  </div>

                  <div className="space-y-2">
                    <Label className="font-mono text-[11px] tracking-[2px] uppercase text-ink-dim">Artista *</Label>
                    <Input value={artist} onChange={(e) => setArtist(e.target.value)} maxLength={200} required />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="font-mono text-[11px] tracking-[2px] uppercase text-ink-dim">Categoria *</Label>
                      <Select value={category} onValueChange={(v) => v && setCategory(v as UpdateEventDto['category'])}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {CATEGORIES.map((c) => (
                            <SelectItem key={c} value={c}>
                              {CATEGORY_PT[c] ?? c}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="font-mono text-[11px] tracking-[2px] uppercase text-ink-dim">Classificação *</Label>
                      <Input
                        type="number"
                        min={0}
                        max={21}
                        value={ageRating}
                        onChange={(e) => setAgeRating(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <DatePickerField
                      label="Início"
                      date={startsDate}
                      setDate={setStartsDate}
                      time={startsTime}
                      setTime={setStartsTime}
                    />
                    <DatePickerField
                      label="Abertura dos portões"
                      date={doorsDate}
                      setDate={setDoorsDate}
                      time={doorsTime}
                      setTime={setDoorsTime}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="font-mono text-[11px] tracking-[2px] uppercase text-ink-dim">Local *</Label>
                    <Select value={venueId} onValueChange={(v) => v && setVenueId(v)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {venues.map((v) => (
                          <SelectItem key={v.id} value={v.id}>
                            {v.name} — {v.city}/{v.state}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="font-mono text-[11px] tracking-[2px] uppercase text-ink-dim">URL do Poster *</Label>
                    <Input value={posterUrl} onChange={(e) => setPosterUrl(e.target.value)} required />
                  </div>

                  <div className="space-y-2">
                    <Label className="font-mono text-[11px] tracking-[2px] uppercase text-ink-dim">Descrição *</Label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      required
                      rows={4}
                      className="w-full min-h-[100px] bg-input border-[1.5px] border-border rounded-[4px] px-4 py-3 font-body text-[15px] text-foreground outline-none focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent/30"
                    />
                  </div>

                  <div className="border-t border-border/40 pt-6">
                    <div className="font-mono text-[11px] tracking-[2px] uppercase text-ink-dim mb-3">
                      Pagamento
                    </div>
                    <div className="flex gap-3 mb-4">
                      {([UpdateEventDtoPaymentProvider.MANUAL_PIX, UpdateEventDtoPaymentProvider.ABACATE_PAY] as const).map((p) => (
                        <button
                          type="button"
                          key={p}
                          onClick={() => setProvider(p)}
                          className={cn(
                            'px-4 py-2 rounded-[4px] font-mono text-[11px] tracking-[2px] uppercase border transition-colors',
                            provider === p
                              ? 'border-accent text-accent bg-accent/10'
                              : 'border-border/50 text-ink-dim hover:text-foreground',
                          )}
                        >
                          {PAYMENT_PROVIDER_PT[p] ?? p}
                        </button>
                      ))}
                    </div>

                    {provider === UpdateEventDtoPaymentProvider.MANUAL_PIX && (
                      <div className="space-y-4 mb-4">
                        <div className="grid grid-cols-[1fr_180px] gap-3">
                          <div className="space-y-2">
                            <Label className="font-mono text-[11px] tracking-[2px] uppercase text-ink-dim">Chave PIX *</Label>
                            <Input value={pixKey} onChange={(e) => setPixKey(e.target.value)} required />
                          </div>
                          <div className="space-y-2">
                            <Label className="font-mono text-[11px] tracking-[2px] uppercase text-ink-dim">Tipo *</Label>
                            <Select value={pixKeyType ?? ''} onValueChange={(v) => v && setPixKeyType(v as UpdateEventDto['pixKeyType'])}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {PIX_KEY_TYPES.map((t) => (
                                  <SelectItem key={t} value={t}>
                                    {PIX_KEY_TYPE_PT[t] ?? t}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label className="font-mono text-[11px] tracking-[2px] uppercase text-ink-dim">Nome do beneficiário *</Label>
                          <Input value={pixHolderName} onChange={(e) => setPixHolderName(e.target.value)} required />
                        </div>
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label className="font-mono text-[11px] tracking-[2px] uppercase text-ink-dim">Taxa Easy Ticket (%)</Label>
                      <Input
                        type="number"
                        min={0}
                        max={50}
                        step={0.01}
                        value={feePercent}
                        onChange={(e) => setFeePercent(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="border-t border-border/40 pt-6 text-sm text-ink-muted">
                    Os setores não são editáveis aqui — para alterar, exclua o
                    rascunho e crie um novo evento.
                  </div>

                  {error && (
                    <div className="border-l-2 border-destructive bg-destructive/10 px-3 py-2 text-[13px] text-red-300">
                      {error}
                    </div>
                  )}

                  <div className="flex gap-3 pt-4 border-t border-border/40">
                    <Button type="submit" variant="accent" size="lg" disabled={update.isPending}>
                      {update.isPending ? 'Salvando…' : 'Salvar alterações'}
                    </Button>
                    <Link href={`/painel-produtor/eventos/${slug}`}>
                      <Button type="button" variant="outline" size="lg">
                        Cancelar
                      </Button>
                    </Link>
                  </div>
                </form>
              )}
            </div>
          </main>
        </>
      )}
    </RoleGate>
  );
}
