'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  ChevronDown,
  LayoutDashboard,
  ShoppingBag,
  Settings,
  CalendarPlus,
  LogOut,
} from 'lucide-react';
import { BrandMark } from '@/components/brand-mark';
import { useAuth, clearSession } from '@/lib/auth';
import { ROLE_PT } from '@/lib/i18n';
import { cn } from '@/lib/utils';

const PRODUCER_LINKS = [
  { href: '/painel-produtor', label: 'Visão geral', icon: LayoutDashboard },
  { href: '/painel-produtor/eventos/novo', label: 'Novo evento', icon: CalendarPlus },
];

const ADMIN_LINKS = [
  { href: '/admin', label: 'Visão geral', icon: LayoutDashboard },
  { href: '/painel-produtor/eventos/novo', label: 'Novo evento', icon: CalendarPlus },
];

export function ProducerHeader({ scope = 'producer' }: { scope?: 'producer' | 'admin' }) {
  const { user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
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
    clearSession();
    setMenuOpen(false);
    router.replace('/');
  }

  const links = scope === 'admin' ? ADMIN_LINKS : PRODUCER_LINKS;

  return (
    <nav className="relative z-10 border-b border-border bg-background">
      <div className="flex items-center justify-between px-6 md:px-12 py-4">
        <div className="flex items-center gap-10">
          <Link href={scope === 'admin' ? '/admin' : '/painel-produtor'} className="flex items-center gap-3">
            <BrandMark size="sm" />
            <span
              className={cn(
                'font-mono text-[10px] tracking-[2px] uppercase px-2 py-1 rounded-[3px]',
                scope === 'admin'
                  ? 'bg-accent/15 text-accent'
                  : 'bg-foreground/10 text-foreground',
              )}
            >
              {scope === 'admin' ? 'Admin' : 'Painel produtor'}
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-1">
            {links.map((link) => {
              const Icon = link.icon;
              const active = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    'flex items-center gap-2 px-3 py-2 rounded-[4px] text-[13px] font-medium transition-colors',
                    active
                      ? 'text-foreground bg-elevated'
                      : 'text-ink-muted hover:text-foreground hover:bg-elevated/50',
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {link.label}
                </Link>
              );
            })}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="hidden sm:flex items-center gap-2 px-3 py-2 text-[13px] text-ink-muted hover:text-foreground transition-colors"
          >
            <ShoppingBag className="w-4 h-4" />
            Loja
          </Link>

          {user && (
            <div className="relative" ref={menuRef}>
              <button
                type="button"
                onClick={() => setMenuOpen((o) => !o)}
                className="flex items-center gap-2 h-9 pl-2 pr-3 border border-border hover:border-accent/60 rounded-full transition-colors"
              >
                <div className="w-6 h-6 rounded-full bg-accent text-accent-foreground grid place-items-center text-[11px] font-bold">
                  {(user.name ?? user.email).charAt(0).toUpperCase()}
                </div>
                <span className="text-[13px] font-medium max-w-[120px] truncate">
                  {(user.name ?? user.email).split(' ')[0]}
                </span>
                <ChevronDown
                  className={cn(
                    'w-3 h-3 text-ink-muted transition-transform',
                    menuOpen && 'rotate-180',
                  )}
                />
              </button>

              {menuOpen && (
                <div className="absolute right-0 mt-2 w-60 bg-card border border-border rounded-[6px] shadow-[0_20px_60px_rgba(0,0,0,0.4)] py-1 overflow-hidden">
                  <div className="px-4 py-3 border-b border-border">
                    <div className="text-[13px] font-semibold truncate">
                      {user.name ?? user.email}
                    </div>
                    <div className="text-[11px] text-ink-muted truncate">{user.email}</div>
                    <div className="font-mono text-[10px] tracking-[1.5px] uppercase text-accent mt-1">
                      {ROLE_PT[user.role] ?? user.role}
                    </div>
                  </div>
                  <MenuLink href="/meus-ingressos" onSelect={() => setMenuOpen(false)}>
                    Meus ingressos
                  </MenuLink>
                  <MenuLink href="/minha-conta" onSelect={() => setMenuOpen(false)}>
                    Minha conta
                  </MenuLink>
                  {scope === 'producer' && user.role === 'ADMIN' && (
                    <MenuLink href="/admin" onSelect={() => setMenuOpen(false)} icon={Settings}>
                      Painel admin
                    </MenuLink>
                  )}
                  {scope === 'admin' && (
                    <MenuLink
                      href="/painel-produtor"
                      onSelect={() => setMenuOpen(false)}
                      icon={LayoutDashboard}
                    >
                      Painel produtor
                    </MenuLink>
                  )}
                  <div className="h-px bg-border my-1" />
                  <button
                    type="button"
                    onClick={handleSignOut}
                    className="flex items-center gap-2 w-full text-left px-4 py-2 text-[13px] text-ink-muted hover:bg-elevated hover:text-foreground transition-colors"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    Sair
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}

function MenuLink({
  href,
  children,
  onSelect,
  icon: Icon,
}: {
  href: string;
  children: React.ReactNode;
  onSelect: () => void;
  icon?: React.ComponentType<{ className?: string }>;
}) {
  return (
    <Link
      href={href}
      onClick={onSelect}
      className="flex items-center gap-2 px-4 py-2 text-[13px] text-foreground hover:bg-elevated transition-colors"
    >
      {Icon && <Icon className="w-3.5 h-3.5 text-ink-muted" />}
      {children}
    </Link>
  );
}
