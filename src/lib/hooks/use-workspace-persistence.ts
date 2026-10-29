'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { EngineResult } from '@/core/ai-engine/engine';

const STORAGE_KEY = 'partiva-workspace-state';

export interface PersistedWorkspaceState {
  photos: string[];
  cadFiles: string[];
  dimensions: {
    length?: number;
    width?: number;
    height?: number;
    diameter?: number;
    unit: 'mm' | 'cm';
  };
  description: string;
  mode: 'quick' | 'deep';
  result: EngineResult | null;
}

const DEFAULT_STATE: PersistedWorkspaceState = {
  photos: [],
  cadFiles: [],
  dimensions: { unit: 'mm' },
  description: '',
  mode: 'quick',
  result: null,
};

function loadState(): PersistedWorkspaceState | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<PersistedWorkspaceState>;
    return {
      ...DEFAULT_STATE,
      ...parsed,
      dimensions: { ...DEFAULT_STATE.dimensions, ...(parsed.dimensions || {}) },
      result: parsed.result ?? null,
    };
  } catch {
    return null;
  }
}

export function useWorkspacePersistence() {
  const [state, setState] = useState<PersistedWorkspaceState>(DEFAULT_STATE);
  const isRestored = useRef(false);

  // Restaure l'état depuis localStorage au premier rendu côté client uniquement.
  // Évite le mismatch d'hydratation Next.js (SSR rend DEFAULT_STATE, client restaure après).
  useEffect(() => {
    const saved = loadState();
    if (saved) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setState(saved);
    }
    isRestored.current = true;
  }, []);

  // Sauvegarde l'état à chaque changement, après la restauration initiale.
  useEffect(() => {
    if (!isRestored.current) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Ignorer erreurs de quota ou d'accès
    }
  }, [state]);

  type DimensionsSetter =
    | PersistedWorkspaceState['dimensions']
    | ((prev: PersistedWorkspaceState['dimensions']) => PersistedWorkspaceState['dimensions']);

  const setPhotos = useCallback((photos: string[]) => {
    setState((prev) => ({ ...prev, photos }));
  }, []);

  const setCadFiles = useCallback((cadFiles: string[]) => {
    setState((prev) => ({ ...prev, cadFiles }));
  }, []);

  const setDimensions = useCallback((next: DimensionsSetter) => {
    setState((prev) => ({
      ...prev,
      dimensions: typeof next === 'function' ? next(prev.dimensions) : next,
    }));
  }, []);

  const setDescription = useCallback((description: string) => {
    setState((prev) => ({ ...prev, description }));
  }, []);

  const setMode = useCallback((mode: 'quick' | 'deep') => {
    setState((prev) => ({ ...prev, mode }));
  }, []);

  const setResult = useCallback((result: EngineResult | null) => {
    setState((prev) => ({ ...prev, result }));
  }, []);

  const clearWorkspace = useCallback(() => {
    setState(DEFAULT_STATE);
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  return {
    state,
    setPhotos,
    setCadFiles,
    setDimensions,
    setDescription,
    setMode,
    setResult,
    clearWorkspace,
  };
}
