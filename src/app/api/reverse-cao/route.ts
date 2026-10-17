import { NextResponse } from 'next/server';
import { getReverseEngineeringProjects } from '@/lib/data/reverse-engineering';

export async function GET() {
  const projects = await getReverseEngineeringProjects();
  return NextResponse.json(projects);
}
