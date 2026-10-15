import type { Metadata } from 'next';
import './globals.css';
import SyncStatus from '@/components/SyncStatus';

export const metadata: Metadata = {
  title: 'PartIVA Desktop',
  description: 'Catalogue pièces industrielles — mode hors-ligne (E8P)',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>
        <header className="app-header">
          <span className="app-title">PartIVA Desktop</span>
          <nav>
            <a href="/catalogue/">Catalogue</a>
            <a href="/recherche/">Recherche</a>
          </nav>
          <SyncStatus />
        </header>
        {children}
      </body>
    </html>
  );
}
