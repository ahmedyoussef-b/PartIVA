import fs from 'node:fs';
import path from 'node:path';

export interface DynamicIds {
  request: string;
  requestSearch: string;
  requestClient: string;
}

const IDS_FILE = path.resolve(process.cwd(), '.auth/ids.json');

export function saveIds(ids: DynamicIds): void {
  fs.mkdirSync(path.dirname(IDS_FILE), { recursive: true });
  fs.writeFileSync(IDS_FILE, JSON.stringify(ids, null, 2), 'utf-8');
}

export function loadIds(): DynamicIds {
  const raw = fs.readFileSync(IDS_FILE, 'utf-8');
  return JSON.parse(raw) as DynamicIds;
}

export function resolveId(ids: DynamicIds, key: NonNullable<RouteAccessDynamicKey>): string {
  return ids[key];
}

export type RouteAccessDynamicKey = 'request' | 'requestSearch' | 'requestClient';
