import { getReverseEngineeringProjectById } from '@/lib/data/reverse-engineering';
import ReverseEngineeringContent from '../reverse-engineering-content';

export const dynamic = 'force-dynamic';

export default async function ReverseEngineeringProjectPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ sequential?: string }>;
}) {
  const { id } = await params;
  const { sequential } = await searchParams;
  const isSequential = sequential === '1';
  const project = await getReverseEngineeringProjectById(id);

  if (!project) {
    return <div className="p-8 text-center text-muted-foreground">Projet introuvable</div>;
  }

  return <ReverseEngineeringContent project={project} isSequential={isSequential} />;
}

export async function generateStaticParams() {
  return [{ id: 'placeholder' }];
}
