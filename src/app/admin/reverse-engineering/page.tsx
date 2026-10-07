import { getReverseEngineeringProjects } from '@/lib/data/reverse-engineering';
import ReverseEngineeringListClient from './reverse-engineering-list-client';

export default async function ReverseEngineeringPage() {
  const projects = await getReverseEngineeringProjects();

  return <ReverseEngineeringListClient initialProjects={projects} />;
}
