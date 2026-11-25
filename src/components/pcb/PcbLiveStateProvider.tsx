'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import type { PcbWizardState } from '@/lib/pcb/wizard-state';

interface LiveState {
  state: PcbWizardState;
  refresh: () => Promise<void>;
}

const LiveStateContext = createContext<LiveState | null>(null);

/**
 * Fournit à l'ensemble de l'éditeur un état BDD + plateau toujours à jour.
 * Le serveur reste l'unique source de vérité (même calcul que la page) ; le
 * client se contente de poller et de réagir aux actions qui modifient l'état.
 */
export function PcbLiveStateProvider({
  projectId,
  initial,
  children,
}: {
  projectId: string;
  initial: PcbWizardState;
  children: ReactNode;
}) {
  const [polled, setPolled] = useState<PcbWizardState | null>(null);
  const [previousInitial, setPreviousInitial] = useState(initial);
  const inFlight = useRef(false);

  // Un rendu serveur (router.refresh) prime sur le dernier polling : on invalide
  // le snapshot local pendant le rendu, comme recommandé par React.
  if (initial !== previousInitial) {
    setPreviousInitial(initial);
    setPolled(null);
  }
  const state = polled ?? initial;

  const refresh = useCallback(async () => {
    if (inFlight.current) return;
    inFlight.current = true;
    try {
      const res = await fetch(`/api/pcb/projects/${projectId}/wizard-state`, { cache: 'no-store' });
      if (res.ok) {
        const data = (await res.json()) as { ok: boolean; state: PcbWizardState };
        if (data.ok && data.state) setPolled(data.state);
      }
    } catch {
      // Le dernier état connu reste affiché ; le prochain polling réessaiera.
    } finally {
      inFlight.current = false;
    }
  }, [projectId]);

  useEffect(() => {
    // Le setState arrive après le fetch asynchrone, pas pendant le rendu.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void refresh();
    const interval = window.setInterval(() => void refresh(), 3000);
    const onVisible = () => {
      if (document.visibilityState === 'visible') void refresh();
    };
    const onBoardChange = () => void refresh();
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('pcb:board-refresh', onBoardChange);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('pcb:board-refresh', onBoardChange);
    };
  }, [refresh]);

  return (
    <LiveStateContext.Provider value={{ state, refresh }}>{children}</LiveStateContext.Provider>
  );
}

export function usePcbLiveState(): LiveState {
  const ctx = useContext(LiveStateContext);
  if (!ctx) throw new Error('usePcbLiveState doit être utilisé dans PcbLiveStateProvider');
  return ctx;
}
