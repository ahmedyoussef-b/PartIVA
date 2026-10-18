'use client';

import type { RequestWithRelations } from '@/lib/utils/request-mappers';

export const isTauri = () => {
  if (typeof window === 'undefined') return false;
  return '__TAURI_INTERNALS__' in window;
};

export async function getDashboard() {
  if (isTauri()) return window.__TAURI_INTERNALS__!.invoke('get_dashboard');
  return fetch('/api/dashboard').then((r) => r.json());
}

export async function getAuditLogs() {
  if (isTauri()) return window.__TAURI_INTERNALS__!.invoke('get_audit_logs');
  return fetch('/api/audit').then((r) => r.json());
}

export async function getMaterials() {
  if (isTauri()) return window.__TAURI_INTERNALS__!.invoke('get_materials');
  return fetch('/api/materials').then((r) => r.json());
}

export async function getMaterialBySlug(slug: string) {
  if (isTauri()) return window.__TAURI_INTERNALS__!.invoke('get_material_by_slug', { slug });
  return fetch(`/api/materials/${slug}`).then((r) => r.json());
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
