import { getParts } from '@/lib/data/parts';
import PiecesPretesClient from './pieces-pretes-client';

export default async function PiecesPretesPage() {
  const parts = await getParts({ status: 'ACTIVE' });

  return <PiecesPretesClient initialParts={parts} />;
}
