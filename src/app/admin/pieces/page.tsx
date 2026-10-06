import { getParts } from '@/lib/data/parts';
import PiecesClient from './pieces-client';

export default async function AdminPiecesPage() {
  const parts = await getParts();

  return <PiecesClient initialParts={parts} />;
}
