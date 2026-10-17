'use client';

export const isTauri = () => {
  if (typeof window === 'undefined') return false;
  return '__TAURI_INTERNALS__' in window;
};

export async function getDashboard() {
  if (isTauri()) return (window as any).__TAURI_INTERNALS__.invoke('get_dashboard');
  return fetch('/api/dashboard').then((r) => r.json());
}

export async function getAuditLogs() {
  if (isTauri()) return (window as any).__TAURI_INTERNALS__.invoke('get_audit_logs');
  return fetch('/api/audit').then((r) => r.json());
}

export async function getMaterials() {
  if (isTauri()) return (window as any).__TAURI_INTERNALS__.invoke('get_materials');
  return fetch('/api/materials').then((r) => r.json());
}

export async function getMaterialBySlug(slug: string) {
  if (isTauri()) return (window as any).__TAURI_INTERNALS__.invoke('get_material_by_slug', { slug });
  return fetch(`/api/materials/${slug}`).then((r) => r.json());
}