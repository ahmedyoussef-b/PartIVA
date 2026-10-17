'use client';

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

export async function getDemandesFile() {
  if (isTauri()) return window.__TAURI_INTERNALS__!.invoke('get_demandes_file');
  return fetch('/api/requests').then((r) => r.json());
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
