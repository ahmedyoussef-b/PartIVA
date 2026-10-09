import { getRequestById } from '@/lib/data/requests';
import { getSearchCandidates } from '@/lib/data/search-candidates';
import RechercheClient from './recherche-client';

export default async function RechercheMultiSourcePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const request = await getRequestById(id);
  const initialCandidates = await getSearchCandidates();

  if (!request) {
    return <div className="text-muted-foreground p-8 text-center">Demande introuvable</div>;
  }

  return <RechercheClient initialRequest={request} initialCandidates={initialCandidates} />;
}
