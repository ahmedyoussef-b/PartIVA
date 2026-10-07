import { getParts } from '@/lib/data/parts';
import PiecesPretesClient from './pieces-pretes-client';

// TODO E1: filtrer par clientId quand le modèle Part aura une relation User/Client
export default async function PiecesPretesPage() {
  const parts = await getParts({ status: 'ACTIVE' });

  return <PiecesPretesClient initialParts={parts} />;
}
