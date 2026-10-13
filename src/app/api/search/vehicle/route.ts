import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { z } from 'zod';
import { searchTecDocByVehicle } from '@/lib/connectors/tecdoc';

/**
 * POST /api/search/vehicle (E6-S08)
 *
 * Recherche de pièces auto par véhicule (fitment).
 * Résolution Vehicle (make/model/year/engine) → Fitment → Part.
 * Filtrage optionnel sur autoCategory / material (focus plastique).
 *
 * Auth : VIEWER+ (cohérent avec POST /api/search).
 */
const VehicleSearchSchema = z.object({
  make: z.string().min(1).max(100),
  model: z.string().min(1).max(100),
  year: z.number().int().min(1950).max(2100),
  engine: z.string().max(100).optional(),
  autoCategory: z.string().max(50).optional(),
  material: z.string().max(50).optional(),
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
    const validated = VehicleSearchSchema.parse(body);

    const candidates = await searchTecDocByVehicle(
      {
        make: validated.make,
        model: validated.model,
        year: validated.year,
        engine: validated.engine,
      },
      {
        limit: validated.limit,
        autoCategory: validated.autoCategory,
        material: validated.material,
      },
    );

    return NextResponse.json({
      candidates,
      count: candidates.length,
      vehicle: {
        make: validated.make,
        model: validated.model,
        year: validated.year,
        engine: validated.engine ?? null,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: 'Payload invalide' }, { status: 400 });
    }
    console.error('Error searching by vehicle:', error);
    return NextResponse.json({ message: 'Erreur recherche véhicule' }, { status: 400 });
  }
}
