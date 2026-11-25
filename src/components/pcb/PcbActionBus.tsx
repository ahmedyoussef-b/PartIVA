'use client';

import { createContext, useCallback, useContext, useRef, type ReactNode } from 'react';

type Action = () => void;

interface ActionBus {
  register: (id: string, action: Action) => void;
  run: (id: string) => boolean;
}

const ActionBusContext = createContext<ActionBus | null>(null);

/**
 * Pont entre le wizard (bas du split gauche) et les boutons du panneau Sourcing
 * (droite) : les deux utilisent exactement les mêmes fonctions, sans événements
 * globaux ni duplication de logique.
 */
export function PcbActionBusProvider({ children }: { children: ReactNode }) {
  const actions = useRef(new Map<string, Action>());

  const register = useCallback((id: string, action: Action) => {
    actions.current.set(id, action);
  }, []);

  const run = useCallback((id: string) => {
    const action = actions.current.get(id);
    if (!action) return false;
    action();
    return true;
  }, []);

  return (
    <ActionBusContext.Provider value={{ register, run }}>{children}</ActionBusContext.Provider>
  );
}

export function usePcbActionBus(): ActionBus {
  const bus = useContext(ActionBusContext);
  if (!bus) throw new Error('usePcbActionBus doit être utilisé dans PcbActionBusProvider');
  return bus;
}
