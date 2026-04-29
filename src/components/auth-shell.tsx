import Link from 'next/link';
import { BrandMark } from './brand-mark';

interface AuthShellProps {
  kicker: string;
  title: React.ReactNode;
  subtitle?: string;
  children: React.ReactNode;
  footerText: string;
  footerLinkLabel: string;
  footerLinkHref: string;
}

export function AuthShell({
  kicker,
  title,
  subtitle,
  children,
  footerText,
  footerLinkLabel,
  footerLinkHref,
}: AuthShellProps) {
  return (
    <div className="min-h-screen grid lg:grid-cols-[1.05fr_1fr]">
      {/* LEFT — poster / brand side */}
      <aside className="relative overflow-hidden hidden lg:flex flex-col justify-between p-12 border-r border-border">
        {/* neon gradient glow */}
        <div
          aria-hidden
          className="absolute inset-0 -z-10"
          style={{
            background:
              'radial-gradient(circle at 18% 22%, rgba(209,255,77,0.18), transparent 55%), radial-gradient(circle at 78% 72%, rgba(123,97,255,0.22), transparent 60%), radial-gradient(circle at 80% 10%, rgba(255,61,138,0.14), transparent 55%)',
          }}
        />

        <div className="flex items-center justify-between">
          <BrandMark size="md" />
          <div className="font-mono text-[11px] tracking-[1.5px] uppercase text-ink-muted">
            SP · BR
          </div>
        </div>

        <div className="relative max-w-lg">
          <div className="font-mono text-[11px] tracking-[2px] uppercase text-accent mb-4">
            {kicker}
          </div>
          <h1 className="font-display text-[48px] md:text-[60px] lg:text-[72px] font-extrabold leading-[0.92] tracking-[-2px] mb-6">
            {title}
          </h1>
          {subtitle ? (
            <p className="text-[17px] text-ink-muted leading-relaxed max-w-md">
              {subtitle}
            </p>
          ) : null}

          {/* floating transparency card — brand proof */}
          <div
            className="mt-12 bg-card border border-border rounded-2xl p-5 w-[260px] rotate-[-2deg]"
            style={{ boxShadow: '0 24px 60px rgba(0,0,0,0.45)' }}
          >
            <div className="font-mono text-[10px] tracking-[1px] uppercase text-ink-muted mb-2">
              Taxa neste evento
            </div>
            <div className="flex justify-between items-baseline mb-1">
              <span className="text-[13px] text-ink-dim line-through">R$ 56,70</span>
              <span className="text-[10px] text-ink-dim">concorrente</span>
            </div>
            <div className="flex justify-between items-baseline mt-2 pt-2 border-t border-border">
              <span className="font-display text-2xl font-bold text-accent">R$ 4,73</span>
              <span className="text-[10px] font-semibold text-accent">na easy·ticket</span>
            </div>
          </div>
        </div>

        <div className="font-mono text-[11px] tracking-[1.5px] uppercase text-ink-dim flex justify-between">
          <span>© 2026 · EASY TICKET</span>
          <span>A MENOR TAXA DO BRASIL · 2,5%</span>
        </div>
      </aside>

      {/* RIGHT — form side */}
      <main className="flex flex-col p-6 sm:p-12 lg:p-16">
        <div className="lg:hidden mb-10">
          <BrandMark size="md" />
        </div>

        <div className="flex-1 flex flex-col justify-center max-w-[440px] w-full mx-auto lg:mx-0">
          {children}
        </div>

        <div className="mt-10 text-[13px] text-ink-muted text-center lg:text-left">
          {footerText}{' '}
          <Link
            href={footerLinkHref}
            className="text-accent font-semibold hover:underline underline-offset-4"
          >
            {footerLinkLabel}
          </Link>
        </div>
      </main>
    </div>
  );
}
