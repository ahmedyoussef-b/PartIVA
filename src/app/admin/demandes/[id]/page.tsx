import { getRequestById } from '@/lib/data/requests';
import DemandeDetailClient from './demande-detail-client';

export default async function AdminDemandeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const request = await getRequestById(id);

  if (!request) {
    return <div className="text-muted-foreground p-8 text-center">Demande introuvable</div>;
  }

  return <DemandeDetailClient initialRequest={request} />;
}
