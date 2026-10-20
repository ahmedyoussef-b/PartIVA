'use client';

import type { RequestWithRelations } from '@/lib/utils/request-mappers';
import type { MachineWithRelations } from '@/lib/data/machines';
import type { MaterialWithDetails } from '@/lib/data/materials';

export const isTauri = () => {
  if (typeof window === 'undefined') return false;
  return '__TAURI_INTERNALS__' in window;
};

export interface DashboardData {
  requests: RequestWithRelations[];
  machines: MachineWithRelations[];
}

export async function getDashboard(): Promise<DashboardData> {
  if (isTauri()) {
    return window.__TAURI_INTERNALS__!.invoke<DashboardData>('get_dashboard');
  }

  // Mode web — en export statique (NEXT_EXPORT=true) les Route Handlers ne
  // sont pas servis : la réponse peut être une page 404/HTML → r.json() levait
  // `SyntaxError: Unexpected token '<'`. Fallback propre vers des listes vides.
  try {
    const res = await fetch('/api/dashboard');
    if (!res.ok) {
      console.warn('[data-client] /api/dashboard returned', res.status);
      return { requests: [], machines: [] };
    }
    const contentType = res.headers.get('content-type');
    if (!contentType?.includes('application/json')) {
      console.warn('[data-client] /api/dashboard returned non-JSON');
      return { requests: [], machines: [] };
    }
    return res.json();
  } catch (error) {
    console.warn('[data-client] /api/dashboard fetch failed:', error);
    return { requests: [], machines: [] };
  }
}

type AuditEntityType = 'request' | 'part' | 'sync';

type AuditSeverity = 'info' | 'success' | 'warning';

type AuditAction =
  | 'sync_pull'
  | 'request_received'
  | 'search_launched'
  | 'candidate_selected'
  | 'reverse_started'
  | 'machining_started'
  | 'completed';

interface AuditEntry {
  id: string;
  ts: string;
  action: AuditAction;
  actor: string;
  entityId: string;
  entityType: AuditEntityType;
  description: string;
  severity: AuditSeverity;
}

export async function getAuditLogs(): Promise<AuditEntry[]> {
  if (isTauri()) return window.__TAURI_INTERNALS__!.invoke<AuditEntry[]>('get_audit_logs');

  // Mode web — en export statique (NEXT_EXPORT=true) les Route Handlers ne
  // sont pas servis : la réponse peut être une page 404/HTML → r.json() levait
  // `SyntaxError: Unexpected token '<'`. Fallback propre vers un tableau vide.
  try {
    const res = await fetch('/api/audit');
    if (!res.ok) {
      console.warn('[data-client] /api/audit returned', res.status);
      return [];
    }
    const contentType = res.headers.get('content-type');
    if (!contentType?.includes('application/json')) {
      console.warn('[data-client] /api/audit returned non-JSON');
      return [];
    }
    return (await res.json()) as AuditEntry[];
  } catch (error) {
    console.warn('[data-client] /api/audit fetch failed:', error);
    return [];
  }
}

export async function getMaterials(): Promise<MaterialWithDetails[]> {
  if (isTauri()) return window.__TAURI_INTERNALS__!.invoke<MaterialWithDetails[]>('get_materials');

  try {
    const res = await fetch('/api/materials');
    if (!res.ok) {
      console.warn('[data-client] /api/materials returned', res.status);
      return [];
    }
    const contentType = res.headers.get('content-type');
    if (!contentType?.includes('application/json')) {
      console.warn('[data-client] /api/materials returned non-JSON');
      return [];
    }
    return (await res.json()) as MaterialWithDetails[];
  } catch (error) {
    console.warn('[data-client] /api/materials fetch failed:', error);
    return [];
  }
}

export async function getMaterialBySlug(slug: string): Promise<MaterialWithDetails | null> {
  if (isTauri())
    return window.__TAURI_INTERNALS__!.invoke<MaterialWithDetails | null>('get_material_by_slug', {
      slug,
    });

  // TODO(D-E18-MATERIAL-SLUG-GETTER): route /api/materials/[slug] inexistante côté web.
  try {
    const res = await fetch(`/api/materials/${slug}`);
    if (!res.ok) {
      console.warn('[data-client] /api/materials/${slug} returned', res.status);
      return null;
    }
    const contentType = res.headers.get('content-type');
    if (!contentType?.includes('application/json')) {
      console.warn('[data-client] /api/materials/${slug} returned non-JSON');
      return null;
    }
    return (await res.json()) as MaterialWithDetails | null;
  } catch (error) {
    console.warn('[data-client] /api/materials/${slug} fetch failed:', error);
    return null;
  }
}

export async function getDemandesFile(): Promise<RequestWithRelations[]> {
  if (isTauri())
    return window.__TAURI_INTERNALS__!.invoke<RequestWithRelations[]>('get_demandes_file');
  return fetch('/api/requests').then((r) => r.json() as Promise<RequestWithRelations[]>);
}

// TODO(E9-R4): route API web absente — getter prêt pour usage futur
export async function getReverseCao() {
  if (isTauri()) return window.__TAURI_INTERNALS__!.invoke('get_reverse_cao');
  return fetch('/api/reverse-cao').then((r) => r.json());
}

// TODO(E9-R4): route API web absente — getter prêt pour usage futur
export async function getPlastiques() {
  if (isTauri()) return window.__TAURI_INTERNALS__!.invoke('get_plastiques');
  return fetch('/api/plastiques').then((r) => r.json());
}

// ─── Authentification ─────────────────────────────────────────
// Commandes Rust : login, save_token, load_token, logout (lib.rs)
// Le token est stocké dans le keyring Windows (géré par auth.rs)

export async function login(email: string, password: string): Promise<void> {
  if (isTauri()) {
    return window.__TAURI_INTERNALS__!.invoke('login', { email, password });
  }
  // Web : BetterAuth gère le login via /api/auth/sign-in
  const res = await fetch('/api/auth/sign-in/email', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) throw new Error('Login failed');
}

export async function saveToken(token: string): Promise<void> {
  if (isTauri()) {
    return window.__TAURI_INTERNALS__!.invoke('save_token', { token });
  }
  // Web : le token est géré par les cookies BetterAuth
  localStorage.setItem('partiva_token', token);
}

export async function loadToken(): Promise<string | null> {
  if (isTauri()) {
    return window.__TAURI_INTERNALS__!.invoke<string | null>('load_token');
  }
  // Web : le token est géré par les cookies BetterAuth
  return localStorage.getItem('partiva_token');
}

export async function logout(): Promise<void> {
  if (isTauri()) {
    return window.__TAURI_INTERNALS__!.invoke('logout');
  }
  // Web : BetterAuth gère le logout via /api/auth/sign-out
  await fetch('/api/auth/sign-out', { method: 'POST' });
  localStorage.removeItem('partiva_token');
}
