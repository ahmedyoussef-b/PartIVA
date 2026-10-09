'use client';

import * as React from 'react';

/**
 * Détection du mode d'exécution de l'application :
 * - Mode Tauri Hybride : réservé à l'atelier / administration desktop.
 * - Mode Web Public : réservé aux clients (Accueil, Contact, Espace Client Permanent).
 */
export function isTauriEnvironment(): boolean {
  if (typeof window === 'undefined') return false;

  // 1. Détection des variables globales injectées par le runtime Tauri
  const hasTauriGlobal =
    '__TAURI__' in window || '__TAURI_INTERNALS__' in window || '__TAURI_METADATA__' in window;

  // 2. Détection via variable d'environnement build
  const envMode = process.env.NEXT_PUBLIC_APP_MODE === 'tauri';

  // 3. Détection via localStorage ou paramètre URL de test (?mode=tauri)
  const queryParam =
    typeof window !== 'undefined' &&
    new URLSearchParams(window.location.search).get('mode') === 'tauri';

  const storageOverride =
    typeof window !== 'undefined' && window.localStorage?.getItem('partiva_mode') === 'tauri';

  return hasTauriGlobal || envMode || queryParam || storageOverride;
}

export function useAppMode() {
  // D74 — initialisation paresseuse SSR-safe : isTauri est calculé au premier
  // rendu client uniquement (isTauriEnvironment() retourne false en SSR car
  // typeof window === 'undefined'). Cela évite le setState synchrone dans
  // useEffect (react-hooks/set-state-in-effect, react-hooks@7 embarqué par
  // eslint-config-next@16) qui déclenche des rendus en cascade.
  // isClient est une constante dérivée : le hook n'est appelé que depuis des
  // composants 'use client', donc côté client isClient est toujours vrai.
  const [isTauri, setIsTauri] = React.useState<boolean>(() => isTauriEnvironment());
  const isClient = true;

  const setManualMode = (mode: 'web' | 'tauri') => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('partiva_mode', mode);
      setIsTauri(mode === 'tauri');
      window.location.reload();
    }
  };

  return {
    isTauri,
    isWeb: !isTauri,
    isLoaded: isClient,
    setManualMode,
  };
}
