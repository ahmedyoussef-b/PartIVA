import { NextRequest, NextResponse } from 'next/server';
import { readFileSync } from 'fs';
import { resolve } from 'path';

export async function GET(_req: NextRequest) {
  return NextResponse.json({ releases: [] });
}
