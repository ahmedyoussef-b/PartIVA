/**
 * Déclaration des types Tauri pour `window.__TAURI_INTERNALS__`.
 * Injecté par Tauri v2 dans la fenêtre quand l'app tourne en mode desktop.
 * Absent en mode web (Vercel).
 *
 * Référence : https://tauri.app/reference/javascript/api/namespacecore/
 */

export {};

declare global {
  interface Window {
    __TAURI_INTERNALS__?: {
      invoke: <T = unknown>(cmd: string, args?: Record<string, unknown>) => Promise<T>;
    };
  }
}
