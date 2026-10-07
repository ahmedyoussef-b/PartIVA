import { getReverseEngineeringProjectById } from '@/lib/data/reverse-engineering';
import ReverseEngineeringContent from '../reverse-engineering-content';

export default async function ReverseEngineeringProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const project = await getReverseEngineeringProjectById(id);

  if (!project) {
    return <div className="p-8 text-center text-muted-foreground">Projet introuvable</div>;
  }

  return <ReverseEngineeringContent project={project} />;
}
