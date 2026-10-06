import { getRequestById } from '@/lib/data/requests';
import DemandeDetailClient from './demande-detail-client';

export default async function AdminDemandeDetailPage({ params }: { params: { id: string } }) {
  const request = await getRequestById(params.id);

  if (!request) {
    return <div className="p-8 text-center text-muted-foreground">Demande introuvable</div>;
  }

  return <DemandeDetailClient initialRequest={request} />;
}