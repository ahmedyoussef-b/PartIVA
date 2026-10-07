import { getRequestById } from '@/lib/data/requests';
import DemandeDetailClient from './demande-detail-client';

export default async function ClientDemandeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const request = await getRequestById(id);

  if (!request) {
    return <div className="p-8 text-center text-muted-foreground">Demande introuvable</div>;
  }

  return <DemandeDetailClient initialRequest={request} />;
}
