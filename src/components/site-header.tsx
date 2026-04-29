'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { BrandMark } from '@/components/brand-mark';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth';
import { cn } from '@/lib/utils';

const NAV_LINKS = [
  { href: '/eventos', label: 'Eventos' },
  { href: '/eventos?perto=1', label: 'Perto de mim' },
  { href: '/produtores', label: 'Para empresas' },
  { href: '/manifesto', label: 'Ajuda' },
];

export function SiteHeader() {
  const { user, ready, signOut } = useAuth();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = React.useState(false);
  const menuRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    if (!menuOpen) return;
    function onClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    window.addEventListener('mousedown', onClick);
    return () => window.removeEventListener('mousedown', onClick);
  }, [menuOpen]);

  function handleSignOut() {
    signOut();
    setMenuOpen(false);
    router.push('/');
  }

  return (
    <nav className="relative z-10 flex items-center justify-between gap-3 border-b border-border px-4 sm:px-6 md:px-16 py-5">
      <div className="flex items-center gap-6 md:gap-12 min-w-0">
        <BrandMark size="sm" />
        <div className="hidden md:flex gap-7 text-sm text-ink-muted">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="hover:text-foreground transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        <div className="hidden lg:flex items-center gap-2 px-4 h-10 bg-input border border-border rounded-full w-60">
          <SearchIcon className="w-4 h-4 text-ink-muted" />
          <input
            placeholder="Artista, evento ou cidade"
            className="bg-transparent outline-none text-sm text-foreground placeholder:text-ink-dim flex-1"
          />
        </div>

        {!ready ? (
          <div className="h-9 w-24 rounded-md bg-input animate-pulse" />
        ) : user ? (
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setMenuOpen((o) => !o)}
              className="flex items-center gap-2 h-9 pl-2 pr-3.5 border border-border hover:border-accent rounded-full transition-colors"
            >
              <div className="w-6 h-6 rounded-full bg-accent text-accent-foreground grid place-items-center text-[11px] font-bold">
                {(user.name ?? user.email).charAt(0).toUpperCase()}
              </div>
              <span className="text-[13px] font-medium max-w-[120px] truncate">
                {(user.name ?? user.email).split(' ')[0]}
              </span>
              <ChevronDownIcon
                className={cn(
                  'w-3 h-3 text-ink-muted transition-transform',
                  menuOpen && 'rotate-180'
                )}
              />
            </button>

            {menuOpen ? (
              <div className="absolute right-0 mt-2 w-56 bg-card border border-border rounded-[4px] shadow-[0_20px_60px_rgba(0,0,0,0.4)] py-1 overflow-hidden">
                <div className="px-4 py-3 border-b border-border">
                  <div className="text-[13px] font-semibold truncate">{user.name ?? user.email}</div>
                  <div className="text-[11px] text-ink-muted truncate">{user.email}</div>
                </div>
                <MenuLink href="/meus-ingressos" onSelect={() => setMenuOpen(false)}>
                  Meus ingressos
                </MenuLink>
                <MenuLink href="/minha-conta" onSelect={() => setMenuOpen(false)}>
                  Minha conta
                </MenuLink>
                {(user.role === 'PRODUCER' || user.role === 'ADMIN') && (
                  <>
                    <div className="h-px bg-border my-1" />
                    <MenuLink href="/painel-produtor" onSelect={() => setMenuOpen(false)}>
                      Painel do produtor
                    </MenuLink>
                    {user.role === 'ADMIN' && (
                      <MenuLink href="/admin" onSelect={() => setMenuOpen(false)}>
                        Painel admin
                      </MenuLink>
                    )}
                  </>
                )}
                <div className="h-px bg-border my-1" />
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="w-full text-left px-4 py-2 text-[13px] text-ink-muted hover:bg-elevated hover:text-foreground transition-colors"
                >
                  Sair
                </button>
              </div>
            ) : null}
          </div>
        ) : (
          <>
            <Link href="/entrar">
              <Button variant="ghost" size="sm">Entrar</Button>
            </Link>
            <Link href="/cadastro" className="hidden sm:inline-flex">
              <Button variant="accent" size="sm">Criar conta</Button>
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}

function MenuLink({
  href,
  children,
  onSelect,
}: {
  href: string;
  children: React.ReactNode;
  onSelect: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onSelect}
      className="block px-4 py-2 text-[13px] text-foreground hover:bg-elevated transition-colors"
    >
      {children}
    </Link>
  );
}

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.8" />
      <path d="M20 20l-3.5-3.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function ChevronDownIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M6 9l6 6 6-6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
