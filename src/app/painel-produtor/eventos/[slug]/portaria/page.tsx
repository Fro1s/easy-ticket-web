'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { Check, X, AlertTriangle, WifiOff } from 'lucide-react';
import { RoleGate } from '@/components/role-gate';
import { useProducerControllerGetEvent } from '@/generated/api';
import { customInstance } from '@/lib/api';

interface ValidateTicketResponse {
  ok: boolean;
  ticket?: {
    shortCode: string;
    sectorName: string;
    sectorColor: string;
    holderFirstName: string;
    validatedAt: string;
  };
}

type FeedbackKind =
  | { kind: 'idle' }
  | {
      kind: 'success';
      shortCode: string;
      sectorName: string;
      sectorColor: string;
      holderFirstName: string;
    }
  | { kind: 'already_used'; usedAt: string }
  | { kind: 'wrong_event' }
  | { kind: 'not_found' }
  | { kind: 'invalid_status' }
  | { kind: 'network_error' };

function fmtTime(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

function FeedbackPanel({ feedback }: { feedback: FeedbackKind }) {
  if (feedback.kind === 'success') {
    return (
      <div className="w-full rounded-[8px] border-2 border-green-400 bg-green-400/10 p-6 text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Check className="w-4 h-4 text-green-400" />
          <p className="font-mono text-xs text-green-400 uppercase tracking-widest">Bem-vindo</p>
        </div>
        <p className="text-4xl font-bold text-green-400">{feedback.holderFirstName}</p>
        <p className="text-sm text-muted-foreground mt-2">
          {feedback.sectorName} · {feedback.shortCode}
        </p>
        <div
          className="mt-3 mx-auto w-3 h-3 rounded-full"
          style={{ backgroundColor: feedback.sectorColor }}
        />
      </div>
    );
  }

  if (feedback.kind === 'already_used') {
    return (
      <div className="w-full rounded-[8px] border-2 border-red-500 bg-red-500/10 p-6 text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <X className="w-4 h-4 text-red-400" />
          <p className="font-mono text-xs text-red-400 uppercase tracking-widest">Já usado</p>
        </div>
        {feedback.usedAt && (
          <p className="text-sm text-muted-foreground">às {fmtTime(feedback.usedAt)}</p>
        )}
      </div>
    );
  }

  if (feedback.kind === 'wrong_event') {
    return (
      <div className="w-full rounded-[8px] border-2 border-yellow-400 bg-yellow-400/10 p-6 text-center">
        <p className="font-mono text-xs text-yellow-400 uppercase tracking-widest">
          Outro evento
        </p>
      </div>
    );
  }

  if (feedback.kind === 'not_found') {
    return (
      <div className="w-full rounded-[8px] border-2 border-red-500 bg-red-500/10 p-6 text-center">
        <p className="font-mono text-xs text-red-400 uppercase tracking-widest">
          Não encontrado
        </p>
      </div>
    );
  }

  if (feedback.kind === 'invalid_status') {
    return (
      <div className="w-full rounded-[8px] border-2 border-yellow-400 bg-yellow-400/10 p-6 text-center">
        <p className="font-mono text-xs text-yellow-400 uppercase tracking-widest">
          Reembolsado / Transferido
        </p>
      </div>
    );
  }

  if (feedback.kind === 'network_error') {
    return (
      <div className="w-full rounded-[8px] border-2 border-orange-400 bg-orange-400/10 p-6 text-center">
        <p className="font-mono text-xs text-orange-400 uppercase tracking-widest animate-pulse">
          Sem conexão — tentando…
        </p>
      </div>
    );
  }

  // idle
  return (
    <div className="flex flex-col items-center gap-3 text-muted-foreground py-6">
      <div className="w-3 h-3 rounded-full bg-accent animate-pulse" />
      <p className="font-mono text-xs uppercase tracking-widest">Aguardando leitura</p>
    </div>
  );
}

export default function PortariaPage() {
  const { slug } = useParams<{ slug: string }>();

  const videoRef = useRef<HTMLVideoElement>(null);
  const readerRef = useRef<{ reset: () => void } | null>(null);
  const lastScannedRef = useRef<{ token: string; at: number } | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const consecutiveFailRef = useRef(0);
  const dismissTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Keep the latest mutateAsync in a ref so the scanner callback always uses fresh version
  const mutateRef = useRef<typeof validateMutation.mutateAsync | null>(null);

  const [feedback, setFeedback] = useState<FeedbackKind>({ kind: 'idle' });
  const [sessionCount, setSessionCount] = useState(0);
  const [isOffline, setIsOffline] = useState(false);

  const { data: eventRes } = useProducerControllerGetEvent(slug);
  const totalTickets =
    (eventRes as { data?: { kpis?: { ticketsSold?: number } } })?.data?.kpis
      ?.ticketsSold ?? '?';

  const validateMutation = useMutation({
    mutationFn: (qrToken: string) =>
      customInstance<{ data: ValidateTicketResponse; status: number }>(
        '/api/v1/producer/tickets/validate',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ qrToken }),
        },
      ),
  });

  // Keep ref in sync
  useEffect(() => {
    mutateRef.current = validateMutation.mutateAsync;
  });

  function primeAudio() {
    if (!audioCtxRef.current) audioCtxRef.current = new AudioContext();
  }

  function playBeep(type: 'success' | 'error' | 'warn') {
    try {
      if (!audioCtxRef.current) audioCtxRef.current = new AudioContext();
      const ctx = audioCtxRef.current;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = type === 'success' ? 880 : type === 'error' ? 220 : 440;
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.25);
    } catch {}
  }

  function scheduleAutoDismiss() {
    if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);
    dismissTimerRef.current = setTimeout(() => setFeedback({ kind: 'idle' }), 3000);
  }

  const handleScan = useCallback(async (token: string) => {
    const now = Date.now();
    if (
      lastScannedRef.current?.token === token &&
      now - lastScannedRef.current.at < 3000
    ) {
      return;
    }
    lastScannedRef.current = { token, at: now };

    if (!mutateRef.current) return;

    try {
      const res = await mutateRef.current(token);
      consecutiveFailRef.current = 0;
      setIsOffline(false);
      const t = res.data.ticket!;
      setSessionCount((c) => c + 1);
      setFeedback({
        kind: 'success',
        shortCode: t.shortCode,
        sectorName: t.sectorName,
        sectorColor: t.sectorColor,
        holderFirstName: t.holderFirstName,
      });
      playBeep('success');
    } catch (err: unknown) {
      const axiosErr = err as {
        response?: { status?: number; data?: { reason?: string; usedAt?: string } };
      };
      const status = axiosErr?.response?.status;
      const body = axiosErr?.response?.data;

      if (!status) {
        consecutiveFailRef.current++;
        if (consecutiveFailRef.current >= 3) setIsOffline(true);
        setFeedback({ kind: 'network_error' });
        playBeep('warn');
      } else {
        consecutiveFailRef.current = 0;
        setIsOffline(false);
        if (status === 409) {
          setFeedback({ kind: 'already_used', usedAt: body?.usedAt ?? '' });
          playBeep('error');
        } else if (status === 403) {
          setFeedback({ kind: 'wrong_event' });
          playBeep('warn');
        } else if (status === 404) {
          setFeedback({ kind: 'not_found' });
          playBeep('error');
        } else {
          setFeedback({ kind: 'invalid_status' });
          playBeep('warn');
        }
      }
    }

    scheduleAutoDismiss();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Initialize camera scanner
  useEffect(() => {
    let active = true;

    async function init() {
      if (!videoRef.current) return;
      try {
        const { BrowserMultiFormatReader } = await import('@zxing/library');
        const reader = new BrowserMultiFormatReader();
        readerRef.current = { reset: () => reader.reset() };
        await reader.decodeFromVideoDevice(
          null,
          videoRef.current,
          (result) => {
            if (result && active) void handleScan(result.getText());
          },
        );
      } catch (e) {
        console.error('[portaria] camera init error', e);
      }
    }

    void init();

    return () => {
      active = false;
      readerRef.current?.reset();
      if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);
    };
  }, [handleScan]);

  return (
    <RoleGate allow={['PRODUCER', 'ADMIN']}>
      {() => (
        <div
          className="min-h-screen bg-background flex flex-col"
          onClick={primeAudio}
        >
          {/* Top bar */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border/40">
            <Link
              href={`/painel-produtor/eventos/${slug}`}
              className="font-mono text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              ← voltar
            </Link>
            <div className="flex items-center gap-3">
              {isOffline && (
                <span className="flex items-center gap-1 font-mono text-xs text-orange-400 animate-pulse">
                  <WifiOff className="w-3 h-3" /> offline
                </span>
              )}
              <span className="font-mono text-sm text-accent font-medium">
                {sessionCount} / {totalTickets} validados
              </span>
            </div>
          </div>

          {/* Camera viewport */}
          <div className="relative w-full bg-black overflow-hidden" style={{ aspectRatio: '1/1' }}>
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              className="absolute inset-0 w-full h-full object-cover"
            />
            {/* Scan guide overlay */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="relative w-56 h-56">
                {/* corner brackets */}
                <div className="absolute top-0 left-0 w-8 h-8 border-t-[3px] border-l-[3px] border-accent" />
                <div className="absolute top-0 right-0 w-8 h-8 border-t-[3px] border-r-[3px] border-accent" />
                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-[3px] border-l-[3px] border-accent" />
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-[3px] border-r-[3px] border-accent" />
              </div>
            </div>
          </div>

          {/* Feedback panel */}
          <div className="flex-1 flex flex-col p-4 w-full max-w-sm mx-auto">
            <FeedbackPanel feedback={feedback} />
            <p className="font-mono text-xs text-muted-foreground/50 text-center mt-auto pt-6 uppercase tracking-widest">
              Portaria · {slug}
            </p>
          </div>
        </div>
      )}
    </RoleGate>
  );
}
