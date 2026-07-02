import type { Metadata } from 'next';
import { ThemeProvider } from 'next-themes';
import { Toaster } from 'sonner';
import { Providers } from '@/components/providers';
import { SITE_URL } from '@/lib/seo';
import { fraunces, interTight, jetbrainsMono, syne } from './fonts';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'Easy Ticket — Menor taxa do Brasil',
    template: '%s · Easy Ticket',
  },
  description:
    'A primeira plataforma do Brasil a mostrar a taxa antes da compra. Compre ingressos com a menor taxa do mercado.',
  keywords: ['ingressos', 'eventos', 'shows', 'festas', 'comprar ingresso', 'Easy Ticket'],
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    siteName: 'Easy Ticket',
    title: 'Easy Ticket — Menor taxa do Brasil',
    description: 'Compre ingressos com a menor taxa do mercado.',
  },
  twitter: { card: 'summary_large_image', title: 'Easy Ticket', description: 'Menor taxa do Brasil.' },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="pt-BR"
      className={`${fraunces.variable} ${interTight.variable} ${jetbrainsMono.variable} ${syne.variable}`}
      suppressHydrationWarning
    >
      <body>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
          <Providers>
            {children}
          </Providers>
          <Toaster richColors position="top-center" theme="dark" />
        </ThemeProvider>
      </body>
    </html>
  );
}
