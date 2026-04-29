import Link from 'next/link';
import type { Metadata } from 'next';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { Button } from '@/components/ui/button';

export const metadata: Metadata = {
  title: 'Manifesto · Easy Ticket',
  description:
    'A taxa esconde a verdade. A gente acabou com isso. Conheça por que a Easy Ticket cobra 2,5% e mostra cada centavo antes do pagamento.',
};

const PRINCIPLES = [
  {
    no: '01',
    title: 'A taxa é o ingresso oculto.',
    body: 'A maioria das plataformas cobra até 20% sem te avisar. A gente cobra 2,5% e mostra antes — porque preço justo só vale se ele aparece.',
  },
  {
    no: '02',
    title: 'O que vc vê é o que vc paga.',
    body: 'Sem letrinha miúda. Sem "taxa de conveniência". Sem etapa surpresa no checkout. O preço final aparece desde o primeiro clique.',
  },
  {
    no: '03',
    title: 'Produtor não é vilão. É parceiro.',
    body: 'Repassamos o que dá pra repassar. Cobramos o que precisamos pra manter o serviço de pé, sem inflar margem em cima da galera que faz o evento acontecer.',
  },
  {
    no: '04',
    title: 'Pix por padrão. PIX em segundos.',
    body: 'Pagamento aprovado em ≤30s na maioria dos casos. Se quiser parcelar no cartão, dá. Mas o caminho rápido é o caminho honesto.',
  },
  {
    no: '05',
    title: 'Ingresso é bem público.',
    body: 'Você pode transferir, presentear, devolver dentro das regras do produtor. Não é nosso, é seu. Nunca vamos te trancar dentro do app.',
  },
];

const NUMBERS = [
  ['2,5%', 'taxa fixa, sempre visível'],
  ['R$ 47M', 'já economizados em taxas'],
  ['≤30s', 'aprovação média no Pix'],
  ['0', 'pegadinhas no checkout'],
];

export default function ManifestoPage() {
  return (
    <div className="relative min-h-screen overflow-hidden">
      <div
        aria-hidden
        className="absolute -top-[200px] left-1/2 -translate-x-1/2 w-[800px] h-[800px] rounded-full pointer-events-none blur-[80px]"
        style={{
          background:
            'radial-gradient(circle, rgba(209,255,77,0.14) 0%, rgba(255,61,138,0.08) 40%, transparent 70%)',
        }}
      />

      <SiteHeader />

      {/* HERO */}
      <section className="relative z-[5] max-w-[1100px] mx-auto px-6 md:px-16 pt-16 md:pt-28 pb-16">
        <div className="font-mono text-[11px] tracking-[2px] uppercase text-accent mb-5">
          MANIFESTO · EDIÇÃO 01
        </div>
        <h1 className="font-display text-[56px] md:text-[120px] font-extrabold tracking-[-3px] md:tracking-[-5px] leading-[0.88]">
          A taxa<br />
          escondia<br />
          <span className="italic font-medium">a verdade.</span><br />
          <span className="text-accent">Acabou.</span>
        </h1>
        <p className="text-[18px] md:text-[22px] leading-[1.45] text-ink-muted max-w-[680px] mt-9">
          Você paga R$ 190 num ingresso e leva R$ 228 no boleto. De onde veio
          esse rombo? De uma taxa que nasceu pra não ser vista. A gente
          construiu a Easy Ticket pra mudar isso — uma única vez, pra todo
          mundo.
        </p>
      </section>

      {/* NUMBERS BAR */}
      <section className="relative z-[5] max-w-[1280px] mx-auto px-6 md:px-16 pb-20">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-border rounded-[20px] overflow-hidden border border-border">
          {NUMBERS.map(([n, l]) => (
            <div key={l} className="bg-card p-6 md:p-8">
              <div className="font-display text-[32px] md:text-[44px] font-extrabold tracking-[-1.5px] leading-none">
                {n}
              </div>
              <div className="text-[12px] text-ink-muted mt-2 leading-snug">{l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* PRINCIPLES */}
      <section className="relative z-[5] max-w-[1100px] mx-auto px-6 md:px-16 pb-20">
        <div className="font-mono text-[11px] tracking-[2px] uppercase text-ink-muted mb-4">
          O QUE A GENTE ACREDITA
        </div>
        <h2 className="font-display text-[40px] md:text-[64px] font-bold tracking-[-2px] leading-[0.95] mb-14 max-w-[720px]">
          Cinco princípios.<br />
          <span className="italic font-medium">Zero asterisco.</span>
        </h2>

        <div className="flex flex-col">
          {PRINCIPLES.map((p, i) => (
            <article
              key={p.no}
              className={`grid md:grid-cols-[120px_1fr] gap-6 md:gap-12 py-10 md:py-12 ${
                i > 0 ? 'border-t border-border' : ''
              }`}
            >
              <div className="font-mono text-[14px] text-accent tracking-[1px]">
                № {p.no}
              </div>
              <div>
                <h3 className="font-display text-[28px] md:text-[40px] font-bold tracking-[-1px] leading-[1.05] mb-4">
                  {p.title}
                </h3>
                <p className="text-[16px] md:text-[18px] text-ink-muted leading-[1.55] max-w-[640px]">
                  {p.body}
                </p>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* PULL QUOTE */}
      <section className="relative z-[5] max-w-[1100px] mx-auto px-6 md:px-16 py-20">
        <div className="bg-card border border-border rounded-[28px] p-8 md:p-16 relative overflow-hidden">
          <div
            aria-hidden
            className="absolute -top-32 -right-32 w-[420px] h-[420px] rounded-full"
            style={{
              background:
                'radial-gradient(circle, rgba(209,255,77,0.18), transparent 70%)',
            }}
          />
          <div className="relative">
            <div className="font-display text-[64px] md:text-[96px] leading-none text-accent mb-2">
              “
            </div>
            <p className="font-display text-[28px] md:text-[44px] font-bold tracking-[-1.2px] leading-[1.1] max-w-[820px]">
              Se a taxa é justa, ela não precisa se esconder.
            </p>
            <div className="font-mono text-[12px] text-ink-muted mt-6 tracking-[1px]">
              — TIME EASY TICKET
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative z-[5] max-w-[1100px] mx-auto px-6 md:px-16 pb-28 text-center">
        <h2 className="font-display text-[36px] md:text-[56px] font-bold tracking-[-1.8px] leading-[0.95] mb-6">
          Bora começar pelo<br />
          <span className="text-accent">próximo show.</span>
        </h2>
        <p className="text-ink-muted text-[16px] mb-10 max-w-[520px] mx-auto">
          Olha quem tá tocando esse mês — e vê a taxa cair na sua frente.
        </p>
        <div className="flex flex-wrap gap-3 justify-center">
          <Link href="/eventos">
            <Button variant="accent" size="lg">
              Ver eventos →
            </Button>
          </Link>
          <Link href="/produtores">
            <Button variant="ghost" size="lg">
              Sou produtor
            </Button>
          </Link>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
