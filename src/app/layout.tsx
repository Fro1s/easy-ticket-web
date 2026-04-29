import type { Metadata } from 'next';
import { ThemeProvider } from 'next-themes';
import { Providers } from '@/components/providers';
import { fraunces, interTight, jetbrainsMono, syne } from './fonts';
import './globals.css';

export const metadata: Metadata = {
  title: 'Easy Ticket — Menor taxa do Brasil',
  description: 'A primeira plataforma do Brasil a mostrar a taxa antes da compra. Taxa fixa de 2,5%.',
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
        </ThemeProvider>
      </body>
    </html>
  );
}
