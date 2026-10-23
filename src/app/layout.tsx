import './globals.css';
import type { Metadata } from 'next';
import { Inter, Poppins, Fira_Code } from 'next/font/google';
import { Providers } from './providers';
import { Toaster } from '@/components/ui/sonner';

const inter = Inter({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-sans',
  display: 'swap',
});

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-heading',
  display: 'swap',
});

const firaCode = Fira_Code({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Atelier Pièces Industrielles — Fabrication Plastique à la demande',
  description:
    'Fabrication et rétro-ingénierie de pièces de rechange industrielles en plastique technique (POM-C, PTFE, UHMW-PE, PA6, PEEK) à la demande en Tunisie. Évitez les arrêts de ligne.',
  keywords: [
    'Usinage plastique Tunisie',
    'Pièces de rechange industrielles',
    'POM-C',
    'PTFE Téflon',
    'UHMW-PE PE1000',
    'Tournage fraisage CNC plastique',
    'Reverse engineering',
    'Sfax',
    'Tunis',
  ],
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${poppins.variable} ${firaCode.variable} font-sans antialiased`}
      >
        <Providers>{children}</Providers>
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
