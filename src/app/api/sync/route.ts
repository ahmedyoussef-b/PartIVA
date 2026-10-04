import { NextResponse } from 'next/server'

export async function POST() {
  // Simulates cloud Neon pull
  return NextResponse.json({
    status: 'success',
    received: 2,
    ids: [1041, 1042],
    timestamp: new Date().toISOString(),
  })
}
