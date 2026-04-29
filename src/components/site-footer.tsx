import Link from 'next/link';
import { BrandMark } from '@/components/brand-mark';

const FOOTER_LINKS = [
  { href: '/manifesto', label: 'Sobre' },
  { href: '/manifesto', label: 'Carreiras' },
  { href: '/produtores', label: 'Produtores' },
  { href: '/manifesto', label: 'Segurança' },
  { href: '/manifesto', label: 'Termos' },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-border px-6 md:px-16 py-12 max-w-[1440px] mx-auto">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-6 mb-6">
        <BrandMark size="sm" />
        <div className="flex flex-wrap gap-7 text-[13px] text-ink-muted">
          {FOOTER_LINKS.map((link, i) => (
            <Link
              key={`${link.label}-${i}`}
              href={link.href}
              className="hover:text-foreground transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>
      <div className="text-[11px] text-ink-dim font-mono">
        © 2026 Easy Ticket · CNPJ 00.000.000/0001-00 · SAC 0800-000-0000
      </div>
    </footer>
  );
}
