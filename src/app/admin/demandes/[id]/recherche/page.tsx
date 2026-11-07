import { getRequestById } from '@/lib/data/requests';
import RechercheClient from './recherche-client';

export const dynamic = 'force-dynamic';

export default async function RechercheMultiSourcePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const request = await getRequestById(id);

  if (!request) {
    return <div className="p-8 text-center text-muted-foreground">Demande introuvable</div>;
  }

  return <RechercheClient initialRequest={request} initialCandidates={[]} />;
}
