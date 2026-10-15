import type { Metadata } from 'next';
import './globals.css';
import AppNav from '@/components/AppNav';

export const metadata: Metadata = {
  title: 'PartIVA Desktop',
  description: 'Catalogue pièces industrielles — mode hors-ligne (E8P)',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>
        <AppNav />
        {children}
      </body>
    </html>
  );
}
