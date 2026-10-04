import { NextResponse } from 'next/server'
import { INITIAL_PARTS } from '@/lib/mock-data'

let partsMemory = [...INITIAL_PARTS]

export async function GET() {
  return NextResponse.json(partsMemory)
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const newPart = {
      id: `part-${Date.now()}`,
      reference: `PL-${Math.floor(100000 + Math.random() * 900000)}`,
      name: body.name || 'Nouvelle pièce usinée',
      description: body.description || '',
      material: body.material || 'POM-C',
      dimensions: body.dimensions || {},
      tolerances: body.tolerances || {},
      version: 'V1',
      status: 'validated' as const,
      files: body.files || { cad: [], plans: [], photos: [] },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    partsMemory.unshift(newPart)
    return NextResponse.json(newPart, { status: 201 })
  } catch (err) {
    return NextResponse.json({ message: 'Erreur création pièce' }, { status: 400 })
  }
}
