'use client';

import { FormEvent, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { format as fmtDate } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarIcon, Loader2 } from 'lucide-react';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { customInstance } from '@/lib/api';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  CreateEventDtoCategory,
  CreateEventDtoPaymentProvider,
  CreateEventDtoPixKeyType,
  useProducerControllerCreateEvent,
  useVenuesControllerList,
  getVenuesControllerListQueryKey,
} from '@/generated/api';
import type { CreateEventDto, VenueResponse } from '@/generated/api';
import { CATEGORY_PT, PAYMENT_PROVIDER_PT, PIX_KEY_TYPE_PT, BR_STATES } from '@/lib/i18n';
import { cn } from '@/lib/utils';

type SectorRow = {
  name: string;
  colorHex: string;
  priceCents: number;
  capacity: number;
  producerOnly: boolean;
};

const CATEGORIES = Object.values(CreateEventDtoCategory);
const PIX_KEY_TYPES = Object.values(CreateEventDtoPixKeyType);

function combineDateTime(date: Date | undefined, hhmm: string): string | null {
  if (!date) return null;
  if (!/^\d{2}:\d{2}$/.test(hhmm)) return null;
  const [h, m] = hhmm.split(':').map(Number);
  const dt = new Date(date);
  dt.setHours(h, m, 0, 0);
  return dt.toISOString();
}

function brlFromCents(cents: number): string {
  return (cents / 100).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

function DatePickerField({
  label,
  date,
  setDate,
  time,
  setTime,
  required,
}: {
  label: string;
  date: Date | undefined;
  setDate: (d: Date | undefined) => void;
  time: string;
  setTime: (t: string) => void;
  required?: boolean;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="space-y-2">
      <Label className="font-mono text-[11px] tracking-[2px] uppercase text-ink-dim">
        {label}{required && ' *'}
      </Label>
      <div className="grid grid-cols-[1fr_120px] gap-2">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger
            className={cn(
              'inline-flex items-center h-12 px-4 rounded-[4px] border-[1.5px] border-border bg-input',
              'font-body text-[15px] text-foreground hover:border-accent/60 transition-colors',
              'outline-none focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent/30',
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
          required={required}
        />
      </div>
    </div>
  );
}

interface ViaCepResponse {
  cep?: string;
  logradouro?: string;
  bairro?: string;
  localidade?: string;
  uf?: string;
  erro?: boolean;
}

function maskCep(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 5) return digits;
  return `${digits.slice(0, 5)}-${digits.slice(5)}`;
}

function NewVenueDialog({
  onCreated,
}: {
  onCreated: (venue: VenueResponse) => void;
}) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [cep, setCep] = useState('');
  const [street, setStreet] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('SP');
  const [capacity, setCapacity] = useState('1000');
  const [error, setError] = useState<string | null>(null);
  const [cepLoading, setCepLoading] = useState(false);
  const [cepError, setCepError] = useState<string | null>(null);

  const createMut = useMutation({
    mutationFn: (data: { name: string; city: string; state: string; capacity: number }) =>
      customInstance<{ data: VenueResponse; status: number }>('/api/v1/venues', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }),
  });

  async function lookupCep(rawCep: string) {
    const digits = rawCep.replace(/\D/g, '');
    if (digits.length !== 8) return;
    setCepLoading(true);
    setCepError(null);
    try {
      const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
      const data: ViaCepResponse = await res.json();
      if (data.erro) {
        setCepError('CEP nÃ£o encontrado.');
        return;
      }
      if (data.logradouro) setStreet(data.logradouro);
      if (data.bairro) setNeighborhood(data.bairro);
      if (data.localidade) setCity(data.localidade);
      if (data.uf) setState(data.uf);
    } catch {
      setCepError('Erro ao buscar CEP. Preencha manualmente.');
    } finally {
      setCepLoading(false);
    }
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!name.trim() || !city.trim() || !state.trim() || Number(capacity) < 1) {
      setError('Preencha nome, cidade, UF e capacidade.');
      return;
    }
    try {
      const res = await createMut.mutateAsync({
        name: name.trim(),
        city: city.trim(),
        state: state.toUpperCase(),
        capacity: Number(capacity),
      });
      qc.invalidateQueries({ queryKey: getVenuesControllerListQueryKey() });
      onCreated(res.data);
      setOpen(false);
      setName('');
      setCep('');
      setStreet('');
      setNeighborhood('');
      setCity('');
      setCapacity('1000');
    } catch (err) {
      const m = (err as { response?: { data?: { message?: unknown } } })?.response?.data?.message;
      setError(Array.isArray(m) ? m.join('; ') : String(m ?? 'Erro ao criar local'));
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className="font-mono text-[11px] tracking-[2px] uppercase text-accent hover:opacity-80 transition-opacity px-3 py-1 outline-none focus-visible:ring-2 focus-visible:ring-accent/30 rounded-[3px]">
        + Novo local
      </DialogTrigger>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">Cadastrar local</DialogTitle>
          <DialogDescription>
            Digite o CEP para preencher cidade e UF automaticamente via ViaCEP.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label className="font-mono text-[11px] tracking-[2px] uppercase text-ink-dim">Nome do local *</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Allianz Parque" required />
          </div>

          <div className="space-y-2">
            <Label className="font-mono text-[11px] tracking-[2px] uppercase text-ink-dim">CEP</Label>
            <div className="relative">
              <Input
                value={cep}
                onChange={(e) => {
                  const v = maskCep(e.target.value);
                  setCep(v);
                  if (v.replace(/\D/g, '').length === 8) {
                    void lookupCep(v);
                  }
                }}
                onBlur={() => cep.replace(/\D/g, '').length === 8 && lookupCep(cep)}
                placeholder="00000-000"
                maxLength={9}
                inputMode="numeric"
              />
              {cepLoading && (
                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-accent" />
              )}
            </div>
            {cepError && <div className="text-xs text-yellow-300">{cepError}</div>}
          </div>

          {street && (
            <div className="space-y-2">
              <Label className="font-mono text-[11px] tracking-[2px] uppercase text-ink-dim">Logradouro / Bairro</Label>
              <div className="text-sm text-ink-muted">
                {street}{neighborhood ? ` Â· ${neighborhood}` : ''}
              </div>
            </div>
          )}

          <div className="grid grid-cols-[1fr_120px] gap-3">
            <div className="space-y-2">
              <Label className="font-mono text-[11px] tracking-[2px] uppercase text-ink-dim">Cidade *</Label>
              <Input value={city} onChange={(e) => setCity(e.target.value)} placeholder="SÃ£o Paulo" required />
            </div>
            <div className="space-y-2">
              <Label className="font-mono text-[11px] tracking-[2px] uppercase text-ink-dim">UF *</Label>
              <Select value={state} onValueChange={(v) => v && setState(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {BR_STATES.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="font-mono text-[11px] tracking-[2px] uppercase text-ink-dim">Capacidade total *</Label>
            <Input
              type="number"
              min={1}
              value={capacity}
              onChange={(e) => setCapacity(e.target.value)}
              required
            />
          </div>

          {error && <div className="text-red-400 text-sm">{error}</div>}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button type="submit" variant="accent" disabled={createMut.isPending}>
              {createMut.isPending ? 'Criandoâ€¦' : 'Criar local'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function NovoEventoPage() {
  const router = useRouter();
  const venuesQ = useVenuesControllerList();
  const create = useProducerControllerCreateEvent();
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [category, setCategory] = useState<CreateEventDto['category']>(CreateEventDtoCategory.SHOW);
  const [ageRating, setAgeRating] = useState('0');
  const [posterUrl, setPosterUrl] = useState('');
  const [description, setDescription] = useState('');
  const [venueId, setVenueId] = useState('');
  const [feePercent, setFeePercent] = useState('2.5'); // %
  const [provider, setProvider] = useState<CreateEventDtoPaymentProvider>(
    CreateEventDtoPaymentProvider.MANUAL_PIX,
  );
  const [pixKey, setPixKey] = useState('');
  const [pixKeyType, setPixKeyType] = useState<CreateEventDto['pixKeyType']>(CreateEventDtoPixKeyType.CNPJ);
  const [pixHolderName, setPixHolderName] = useState('');

  const [startsDate, setStartsDate] = useState<Date | undefined>(undefined);
  const [startsTime, setStartsTime] = useState('21:00');
  const [doorsDate, setDoorsDate] = useState<Date | undefined>(undefined);
  const [doorsTime, setDoorsTime] = useState('19:00');

  const [sectors, setSectors] = useState<SectorRow[]>([
    {
      name: 'Pista',
      colorHex: '#D1FF4D',
      priceCents: 5000,
      capacity: 100,
      producerOnly: false,
    },
  ]);

  const venues = venuesQ.data?.data ?? [];

  const validation = useMemo(() => {
    const errs: string[] = [];
    if (!title.trim()) errs.push('Informe o tÃ­tulo.');
    if (!artist.trim()) errs.push('Informe o artista.');
    if (!venueId) errs.push('Escolha o local.');
    if (!posterUrl.trim()) errs.push('Informe a URL do poster.');
    if (!description.trim()) errs.push('Informe a descriÃ§Ã£o.');
    const startsAt = combineDateTime(startsDate, startsTime);
    const doorsAt = combineDateTime(doorsDate, doorsTime);
    if (!startsAt) errs.push('Informe data e hora de inÃ­cio.');
    if (!doorsAt) errs.push('Informe data e hora de abertura.');
    if (startsAt && doorsAt && new Date(doorsAt) > new Date(startsAt)) {
      errs.push('Abertura precisa ser antes do inÃ­cio.');
    }
    const feeNum = Number(feePercent);
    if (Number.isNaN(feeNum) || feeNum < 0 || feeNum > 50) {
      errs.push('Taxa precisa estar entre 0% e 50%.');
    }
    if (provider === CreateEventDtoPaymentProvider.MANUAL_PIX) {
      if (!pixKey.trim()) errs.push('Informe a chave PIX.');
      if (!pixHolderName.trim()) errs.push('Informe o nome do beneficiÃ¡rio.');
    }
    sectors.forEach((s, i) => {
      if (!s.name.trim()) errs.push(`Setor ${i + 1}: nome obrigatÃ³rio.`);
      if (!(s.priceCents >= 0)) errs.push(`Setor ${i + 1}: preço inválido.`);
      if (!(s.capacity >= 1)) errs.push(`Setor ${i + 1}: capacidade â‰¥ 1.`);
    });
    return { errs, startsAt, doorsAt };
  }, [
    title, artist, venueId, posterUrl, description, startsDate, startsTime,
    doorsDate, doorsTime, feePercent, provider, pixKey, pixHolderName, sectors,
  ]);

  function updateSector(i: number, patch: Partial<SectorRow>) {
    setSectors((prev) => prev.map((s, j) => (j === i ? { ...s, ...patch } : s)));
  }

  async function onSubmit(ev: FormEvent<HTMLFormElement>) {
    ev.preventDefault();
    setError(null);
    if (validation.errs.length) {
      setError(validation.errs.join(' Â· '));
      return;
    }
    const dto: CreateEventDto = {
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
      pixKey: provider === CreateEventDtoPaymentProvider.MANUAL_PIX ? pixKey.trim() : undefined,
      pixKeyType: provider === CreateEventDtoPaymentProvider.MANUAL_PIX ? pixKeyType : undefined,
      pixHolderName: provider === CreateEventDtoPaymentProvider.MANUAL_PIX ? pixHolderName.trim() : undefined,
      platformFeeRate: Number(feePercent) / 100,
      sectors: sectors.map((s, i) => ({ ...s, sortOrder: i })),
    };
    try {
      const res = await create.mutateAsync({ data: dto });
      router.replace(`/painel-produtor/eventos/${res.data.slug}`);
    } catch (err) {
      const m = (err as { response?: { data?: { message?: unknown } } })?.response?.data?.message;
      setError(Array.isArray(m) ? m.join('; ') : String(m ?? 'Erro ao criar evento'));
    }
  }

  const canSubmit = validation.errs.length === 0 && !create.isPending;

  return (
    <RoleGate allow={['PRODUCER', 'ADMIN']}>
      {(user) => (
        <>
          <ProducerHeader scope={user.role === 'ADMIN' ? 'admin' : 'producer'} />
          <main className="min-h-screen bg-ink-deep px-6 md:px-8 py-10 text-foreground">
            <div className="mx-auto max-w-3xl">
              <Link
                href="/painel-produtor"
                className="inline-block mb-6 font-mono text-[11px] tracking-[2px] uppercase text-ink-dim hover:text-foreground"
              >
                â† Voltar
              </Link>

              <div className="font-mono text-[11px] tracking-[2px] uppercase text-accent mb-3">
                NOVO EVENTO Â· RASCUNHO
              </div>
            <h1 className="font-display text-[44px] font-extrabold leading-[0.95] tracking-[-2px] mb-10">
              Crie seu evento<span className="text-accent">.</span>
            </h1>

            <form onSubmit={onSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label className="font-mono text-[11px] tracking-[2px] uppercase text-ink-dim">TÃ­tulo *</Label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={200} required />
              </div>

              <div className="space-y-2">
                <Label className="font-mono text-[11px] tracking-[2px] uppercase text-ink-dim">Artista *</Label>
                <Input value={artist} onChange={(e) => setArtist(e.target.value)} maxLength={200} required />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="font-mono text-[11px] tracking-[2px] uppercase text-ink-dim">Categoria *</Label>
                  <Select value={category} onValueChange={(v) => v && setCategory(v as CreateEventDto['category'])}>
                    <SelectTrigger className="h-12">
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
                  <Label className="font-mono text-[11px] tracking-[2px] uppercase text-ink-dim">ClassificaÃ§Ã£o (idade) *</Label>
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
                  label="InÃ­cio"
                  date={startsDate}
                  setDate={setStartsDate}
                  time={startsTime}
                  setTime={setStartsTime}
                  required
                />
                <DatePickerField
                  label="Abertura dos portÃµes"
                  date={doorsDate}
                  setDate={setDoorsDate}
                  time={doorsTime}
                  setTime={setDoorsTime}
                  required
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="font-mono text-[11px] tracking-[2px] uppercase text-ink-dim">Local *</Label>
                  <NewVenueDialog
                    onCreated={(v) => {
                      venuesQ.refetch();
                      setVenueId(v.id);
                    }}
                  />
                </div>
                <Select
                  value={venueId}
                  onValueChange={(v) => v && setVenueId(v)}
                  items={venues.map((v) => ({
                    value: v.id,
                    label: `${v.name} â€” ${v.city}/${v.state} (cap. ${v.capacity.toLocaleString('pt-BR')})`,
                  }))}
                >
                  <SelectTrigger className="h-12">
                    <SelectValue placeholder="â€” escolha um local â€”" />
                  </SelectTrigger>
                  <SelectContent>
                    {venues.map((v) => (
                      <SelectItem key={v.id} value={v.id}>
                        {v.name} â€” {v.city}/{v.state} (cap. {v.capacity.toLocaleString('pt-BR')})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="font-mono text-[11px] tracking-[2px] uppercase text-ink-dim">URL do Poster *</Label>
                <Input
                  value={posterUrl}
                  onChange={(e) => setPosterUrl(e.target.value)}
                  placeholder="https://â€¦ ou linear-gradient(â€¦)"
                  maxLength={500}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label className="font-mono text-[11px] tracking-[2px] uppercase text-ink-dim">DescriÃ§Ã£o *</Label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                  maxLength={5000}
                  rows={4}
                  className="w-full min-h-[100px] bg-input border-[1.5px] border-border rounded-[4px] px-4 py-3 font-body text-[15px] text-foreground placeholder:text-ink-dim outline-none focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent/30"
                />
              </div>

              {/* Pagamento */}
              <div className="border-t border-border/40 pt-6">
                <div className="font-mono text-[11px] tracking-[2px] uppercase text-ink-dim mb-3">
                  Pagamento
                </div>
                <div className="flex gap-3 mb-4">
                  {(
                    [
                      CreateEventDtoPaymentProvider.MANUAL_PIX,
                      CreateEventDtoPaymentProvider.ABACATE_PAY,
                    ] as const
                  ).map((p) => (
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

                {provider === CreateEventDtoPaymentProvider.MANUAL_PIX && (
                  <div className="space-y-4 mb-4">
                    <div className="grid grid-cols-[1fr_180px] gap-3">
                      <div className="space-y-2">
                        <Label className="font-mono text-[11px] tracking-[2px] uppercase text-ink-dim">Chave PIX *</Label>
                        <Input
                          value={pixKey}
                          onChange={(e) => setPixKey(e.target.value)}
                          placeholder="Ex: 00.000.000/0001-00"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="font-mono text-[11px] tracking-[2px] uppercase text-ink-dim">Tipo *</Label>
                        <Select value={pixKeyType ?? ''} onValueChange={(v) => v && setPixKeyType(v as CreateEventDto['pixKeyType'])}>
                          <SelectTrigger className="h-12">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {PIX_KEY_TYPES.map((t) => (
                              <SelectItem key={t!} value={t!}>
                                {PIX_KEY_TYPE_PT[t!] ?? t}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="font-mono text-[11px] tracking-[2px] uppercase text-ink-dim">Nome do beneficiÃ¡rio *</Label>
                      <Input
                        value={pixHolderName}
                        onChange={(e) => setPixHolderName(e.target.value)}
                        placeholder="Como aparece no QR Code estÃ¡tico"
                        required
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label className="font-mono text-[11px] tracking-[2px] uppercase text-ink-dim">
                    Taxa Easy Ticket (%)
                  </Label>
                  <div className="grid grid-cols-[160px_1fr] gap-3 items-center">
                    <Input
                      type="number"
                      min={0}
                      max={50}
                      step={0.01}
                      value={feePercent}
                      onChange={(e) => setFeePercent(e.target.value)}
                      placeholder="2.5"
                    />
                    <div className="text-xs text-ink-dim">
                      Default 2,5%. Para evento sem taxa, use 0.
                    </div>
                  </div>
                </div>
              </div>

              {/* Setores */}
              <div className="border-t border-border/40 pt-6">
                <div className="flex items-center justify-between mb-3">
                  <div className="font-mono text-[11px] tracking-[2px] uppercase text-ink-dim">
                    Setores ({sectors.length}/10)
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={sectors.length >= 10}
                    onClick={() =>
                      setSectors([
                        ...sectors,
                        {
                          name: '',
                          colorHex: '#D1FF4D',
                          priceCents: 0,
                          capacity: 0,
                          producerOnly: false,
                        },
                      ])
                    }
                    className="text-accent hover:text-accent"
                  >
                    + Adicionar setor
                  </Button>
                </div>

                <div className="space-y-3">
                  {sectors.map((s, i) => (
                    <div
                      key={i}
                      className="border border-border/50 rounded-[6px] p-3 bg-card/40"
                    >
                      <div className="grid grid-cols-[1fr_60px_140px_100px_36px] gap-2 items-end">
                        <div className="space-y-1.5">
                          <Label className="font-mono text-[10px] tracking-[1.5px] uppercase text-ink-dim">Nome</Label>
                          <Input
                            value={s.name}
                            onChange={(e) => updateSector(i, { name: e.target.value })}
                            placeholder="Pista"
                            required
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="font-mono text-[10px] tracking-[1.5px] uppercase text-ink-dim">Cor</Label>
                          <input
                            type="color"
                            value={s.colorHex}
                            onChange={(e) => updateSector(i, { colorHex: e.target.value })}
                            className="h-12 w-full rounded-[4px] border-[1.5px] border-border bg-card cursor-pointer"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="font-mono text-[10px] tracking-[1.5px] uppercase text-ink-dim">PreÃ§o (R$)</Label>
                          <Input
                            type="number"
                            min={0}
                            step={0.01}
                            value={s.priceCents === 0 ? '' : (s.priceCents / 100).toFixed(2)}
                            onChange={(e) => {
                              const num = parseFloat(e.target.value);
                              updateSector(i, {
                                priceCents: Number.isFinite(num) ? Math.round(num * 100) : 0,
                              });
                            }}
                            placeholder="50.00"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="font-mono text-[10px] tracking-[1.5px] uppercase text-ink-dim">Cap.</Label>
                          <Input
                            type="number"
                            min={1}
                            value={s.capacity}
                            onChange={(e) => updateSector(i, { capacity: Number(e.target.value) })}
                            required
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => sectors.length > 1 && setSectors(sectors.filter((_, j) => j !== i))}
                          disabled={sectors.length <= 1}
                          className="h-12 grid place-items-center text-red-400 hover:text-red-300 disabled:opacity-30 text-xl"
                          aria-label="Remover setor"
                        >
                          Ã—
                        </button>
                      </div>
                      <label className="mt-3 flex items-start gap-2 rounded-[4px] border border-border/40 bg-ink-deep/40 px-3 py-2 text-xs text-ink-muted">
                        <input
                          type="checkbox"
                          checked={s.producerOnly}
                          onChange={(e) =>
                            updateSector(i, { producerOnly: e.target.checked })
                          }
                          className="mt-0.5 h-4 w-4 accent-accent"
                        />
                        <span>
                          Lote exclusivo para produtor/admin. Não aparece na venda
                          pública.
                        </span>
                      </label>
                      {s.priceCents > 0 && s.capacity > 0 && (
                        <div className="text-[11px] text-ink-dim mt-2 font-mono">
                          {s.capacity.toLocaleString('pt-BR')} ingressos Ã— {brlFromCents(s.priceCents)} = potencial {brlFromCents(s.priceCents * s.capacity)}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {error && (
                <div className="border-l-2 border-destructive bg-destructive/10 px-3 py-2 text-[13px] text-red-300">
                  {error}
                </div>
              )}

              <div className="flex gap-3 pt-4 border-t border-border/40">
                <Button
                  type="submit"
                  variant="accent"
                  size="lg"
                  disabled={!canSubmit}
                >
                  {create.isPending ? 'Criandoâ€¦' : 'Criar como rascunho'}
                </Button>
                <Link href="/painel-produtor">
                  <Button type="button" variant="outline" size="lg">
                    Cancelar
                  </Button>
                </Link>
              </div>
            </form>
            </div>
          </main>
        </>
      )}
    </RoleGate>
  );
}


