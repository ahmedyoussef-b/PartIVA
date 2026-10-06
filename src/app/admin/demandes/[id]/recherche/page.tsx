import { getRequestById } from '@/lib/data/requests';
import RechercheClient from './recherche-client';

export default async function RechercheMultiSourcePage({ params }: { params: { id: string } }) {
  const request = await getRequestById(params.id);

  if (!request) {
    return <div className="p-8 text-center text-muted-foreground">Demande introuvable</div>;
  }

  return <RechercheClient initialRequest={request} />;
}