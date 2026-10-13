import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { z } from 'zod';
import { searchTecDocByVIN } from '@/lib/connectors/tecdoc';

/**
 * POST /api/search/vin (E6-S08)
 *
 * Recherche de pièces auto par VIN (VIN2OE — innovation #1).
 * Décodage VIN (TecDoc) → Vehicle → Fitment → Part.
 *
 * Auth : VIEWER+ (cohérent avec POST /api/search).
 */
const VinSearchSchema = z.object({
  vin: z.string().min(11).max(17),
  limit: z.number().int().min(1).max(50).default(20),
});

export async function POST(req: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    if (!session?.user) {
      return NextResponse.json({ message: 'Non authentifié' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const validated = VinSearchSchema.parse(body);

    const { candidates, vehicle } = await searchTecDocByVIN(validated.vin, {
      limit: validated.limit,
    });

    return NextResponse.json({
      candidates,
      count: candidates.length,
      vehicle,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: 'Payload invalide' }, { status: 400 });
    }
    console.error('Error searching by VIN:', error);
    return NextResponse.json({ message: 'Erreur recherche VIN' }, { status: 400 });
  }
}
