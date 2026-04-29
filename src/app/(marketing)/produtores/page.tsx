import Link from 'next/link';
import type { Metadata } from 'next';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { Button } from '@/components/ui/button';

export const metadata: Metadata = {
  title: 'Para Produtores · Easy Ticket',
  description:
    'A plataforma que devolve mais ingresso pra galera e mais margem pra você. Taxa transparente, repasse rápido e zero pegadinha.',
};

const FEATURES = [
  {
    icon: '01',
    title: 'Taxa de 2,5% — e ponto.',
    body: 'Sem split escondido, sem fee de antecipação, sem mensalidade. O que a gente cobra está no contrato e no checkout do seu público.',
  },
  {
    icon: '02',
    title: 'Repasse em D+1.',
    body: 'Pix entra na sua conta no dia útil seguinte ao pagamento. Cartão segue o calendário de antifraude — sempre transparente no painel.',
  },
  {
    icon: '03',
    title: 'Painel em tempo real.',
    body: 'Vendas por setor, conversão por canal, taxa de devolução, NPS pós-evento. Tudo exportável em CSV.',
  },
  {
    icon: '04',
    title: 'Antifraude embutido.',
    body: 'Score por dispositivo, BIN, e CPF. Bloqueio automático de comportamento de bot e marketplace de revenda.',
  },
  {
    icon: '05',
    title: 'Check-in offline.',
    body: 'App de validação roda sem internet, sincroniza quando volta. Aguenta porteira lotada às 22h.',
  },
  {
    icon: '06',
    title: 'Suporte com gente.',
    body: 'Account manager dedicado pra eventos acima de R$ 100k. Pra todos os outros, resposta em até 2h em horário comercial.',
  },
];

const STEPS = [
  {
    n: '01',
    title: 'Crie a conta de produtor',
    body: 'CNPJ ativo, dados bancários e contrato assinado por SignWell. Aprovação em até 1 dia útil.',
  },
  {
    n: '02',
    title: 'Monte seu evento',
    body: 'Sobe arte, define setores, lotes e regras. Preview do checkout antes de publicar.',
  },
  {
    n: '03',
    title: 'Bora vender',
    body: 'Compartilha o link. A gente cuida da emissão, do antifraude, do pagamento e do check-in.',
  },
  {
    n: '04',
    title: 'Recebe e analisa',
    body: 'Repasse em D+1 no Pix. Painel mostra cada centavo do funil — de impressão a check-in.',
  },
];

export default function ProdutoresPage() {
  return (
    <div className="relative min-h-screen overflow-hidden">
      <div
        aria-hidden
        className="absolute -top-[160px] -right-[200px] w-[700px] h-[700px] rounded-full pointer-events-none blur-[80px]"
        style={{
          background:
            'radial-gradient(circle, rgba(123,97,255,0.18) 0%, rgba(209,255,77,0.10) 50%, transparent 75%)',
        }}
      />

      <SiteHeader />

      {/* HERO */}
      <section className="relative z-[5] max-w-[1280px] mx-auto px-6 md:px-16 pt-16 md:pt-24 pb-16">
        <div className="grid lg:grid-cols-[1fr_460px] gap-12 lg:gap-20 items-center">
          <div>
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-accent/10 border border-accent/30 text-accent font-mono text-[11px] font-semibold tracking-[0.5px] mb-7">
              <span className="w-1.5 h-1.5 rounded-full bg-accent" />
              PARA PRODUTORES E CASAS
            </div>
            <h1 className="font-display text-[52px] md:text-[88px] font-extrabold tracking-[-2.5px] md:tracking-[-3.5px] leading-[0.92]">
              Mais ingresso<br />
              pra galera.<br />
              <span className="italic font-medium text-accent">Mais margem</span><br />
              pra você.
            </h1>
            <p className="text-[18px] leading-[1.5] text-ink-muted max-w-[520px] mt-7 mb-9">
              Plataforma de bilheteria com taxa fixa de 2,5%, repasse em D+1
              no Pix e checkout que converte 38% mais que a média do mercado.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="#interesse">
                <Button variant="accent" size="lg">
                  Quero vender aqui →
                </Button>
              </Link>
              <a href="mailto:produtores@easyticket.com.br">
                <Button variant="ghost" size="lg">
                  Falar com vendas
                </Button>
              </a>
            </div>
          </div>

          {/* COMP CARD */}
          <div className="relative hidden lg:block">
            <div
              className="bg-card border border-border rounded-[24px] p-7"
              style={{ boxShadow: '0 30px 80px rgba(0,0,0,0.4)' }}
            >
              <div className="font-mono text-[11px] text-accent tracking-[1px] mb-5 uppercase">
                Quanto sobra de R$ 200 em ingresso
              </div>

              <div className="space-y-4">
                <CompetitorRow name="easy·ticket" pct="2,5%" repasse="R$ 195,00" highlight />
                <CompetitorRow name="Concorrente A" pct="14%" repasse="R$ 172,00" />
                <CompetitorRow name="Concorrente B" pct="10%" repasse="R$ 180,00" />
                <CompetitorRow name="Concorrente C" pct="8%" repasse="R$ 184,00" />
              </div>

              <div className="mt-6 pt-5 border-t border-border text-[11px] text-ink-dim font-mono">
                *Sobre 1.000 ingressos vendidos, isso é R$ 23 mil a mais no seu bolso.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES GRID */}
      <section className="relative z-[5] max-w-[1280px] mx-auto px-6 md:px-16 py-20">
        <div className="font-mono text-[11px] tracking-[2px] uppercase text-ink-muted mb-4">
          O QUE VEM JUNTO
        </div>
        <h2 className="font-display text-[40px] md:text-[56px] font-bold tracking-[-2px] leading-[0.95] mb-14 max-w-[720px]">
          Bilheteria fim a fim.<br />
          <span className="italic font-medium">Sem amarra.</span>
        </h2>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES.map((f) => (
            <div
              key={f.icon}
              className="bg-card border border-border rounded-[20px] p-7 hover:border-accent transition-colors"
            >
              <div className="font-mono text-[12px] text-accent tracking-[1px] mb-4">
                № {f.icon}
              </div>
              <h3 className="font-display text-[22px] font-bold tracking-[-0.5px] leading-[1.15] mb-3">
                {f.title}
              </h3>
              <p className="text-[14px] text-ink-muted leading-[1.55]">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="relative z-[5] max-w-[1280px] mx-auto px-6 md:px-16 py-20">
        <div className="font-mono text-[11px] tracking-[2px] uppercase text-ink-muted mb-4">
          COMO FUNCIONA
        </div>
        <h2 className="font-display text-[40px] md:text-[56px] font-bold tracking-[-2px] leading-[0.95] mb-14 max-w-[720px]">
          Do contrato ao palco<br />
          em <span className="text-accent">4 passos</span>.
        </h2>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
          {STEPS.map((s) => (
            <div
              key={s.n}
              className="relative bg-card border border-border rounded-[20px] p-6"
            >
              <div className="font-display text-[56px] font-extrabold text-accent/30 leading-none mb-5">
                {s.n}
              </div>
              <h3 className="font-display text-[20px] font-bold tracking-[-0.4px] mb-2.5">
                {s.title}
              </h3>
              <p className="text-[13px] text-ink-muted leading-[1.55]">{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section
        id="interesse"
        className="relative z-[5] max-w-[1280px] mx-auto px-6 md:px-16 py-20"
      >
        <div className="relative overflow-hidden bg-card border border-border rounded-[32px] p-10 md:p-20 text-center">
          <div
            aria-hidden
            className="absolute -top-32 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full"
            style={{
              background:
                'radial-gradient(circle, rgba(209,255,77,0.18), transparent 65%)',
            }}
          />
          <div className="relative">
            <h2 className="font-display text-[40px] md:text-[64px] font-bold tracking-[-2px] leading-[0.95] mb-5">
              Pronto pra vender<br />
              <span className="italic font-medium">do jeito certo?</span>
            </h2>
            <p className="text-ink-muted text-[16px] md:text-[18px] mb-9 max-w-[560px] mx-auto">
              Conta pra gente sobre o seu evento. Respondemos em até 24h com
              uma proposta clara — sem letrinha miúda, sem call de uma hora.
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <a href="mailto:produtores@easyticket.com.br?subject=Quero vender na Easy Ticket">
                <Button variant="accent" size="lg">
                  Falar com vendas →
                </Button>
              </a>
              <Link href="/manifesto">
                <Button variant="ghost" size="lg">
                  Ler o manifesto
                </Button>
              </Link>
            </div>
            <div className="mt-8 font-mono text-[11px] text-ink-dim tracking-[1px]">
              produtores@easyticket.com.br · (11) 4040-0000
            </div>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}

function CompetitorRow({
  name,
  pct,
  repasse,
  highlight,
}: {
  name: string;
  pct: string;
  repasse: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={
        highlight
          ? 'flex items-center justify-between py-2.5 px-3 rounded-[8px] bg-accent/10 border border-accent/30'
          : 'flex items-center justify-between py-2.5 px-3'
      }
    >
      <div className="flex items-center gap-3">
        <div
          className={
            highlight
              ? 'w-1.5 h-1.5 rounded-full bg-accent'
              : 'w-1.5 h-1.5 rounded-full bg-border'
          }
        />
        <span
          className={
            highlight
              ? 'text-[14px] font-bold text-accent'
              : 'text-[14px] text-foreground'
          }
        >
          {name}
        </span>
        <span className="text-[11px] text-ink-muted font-mono">{pct}</span>
      </div>
      <span
        className={
          highlight
            ? 'font-display text-[18px] font-bold text-accent tracking-[-0.4px]'
            : 'font-display text-[16px] font-medium text-foreground/70 tracking-[-0.4px]'
        }
      >
        {repasse}
      </span>
    </div>
  );
}
