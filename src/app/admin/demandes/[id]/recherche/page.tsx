import { getRequestById } from '@/lib/data/requests';
import RechercheClient from './recherche-client';

export const dynamic = 'force-dynamic';

export default async function RechercheMultiSourcePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ sequential?: string }>;
}) {
  const { id } = await params;
  const { sequential } = await searchParams;
  const isSequential = sequential === '1';
  const request = await getRequestById(id);

  if (!request) {
    return <div className="p-8 text-center text-muted-foreground">Demande introuvable</div>;
  }

  return (
    <RechercheClient initialRequest={request} initialCandidates={[]} isSequential={isSequential} />
  );
}
