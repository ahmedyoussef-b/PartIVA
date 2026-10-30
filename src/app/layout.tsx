import './globals.css';
import type { Metadata } from 'next';
import { inter, poppins, firaCode } from '@/app/fonts/index';
import { Providers } from './providers';
import { Toaster } from '@/components/ui/sonner';
import { RegisterSW } from '@/components/pwa/register-sw';

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
  manifest: '/manifest.json',
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
        <RegisterSW />
      </body>
    </html>
  );
}
