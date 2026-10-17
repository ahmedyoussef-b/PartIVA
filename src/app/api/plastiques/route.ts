import { NextResponse } from 'next/server';
import { getMaterials } from '@/lib/data/materials';

export async function GET() {
  const materials = await getMaterials();
  return NextResponse.json(materials);
}
