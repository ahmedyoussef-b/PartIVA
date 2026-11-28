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
  // Génération incrémentée à chaque rendu serveur, et numéro de séquence des
  // requêtes : une réponse en vol ne doit jamais écraser un état plus récent.
  const [generation, setGeneration] = useState(0);
  const requestSeq = useRef(0);

  // Un rendu serveur (router.refresh) prime sur le dernier polling : on invalide
  // le snapshot local pendant le rendu, comme recommandé par React.
  if (initial !== previousInitial) {
    setPreviousInitial(initial);
    setPolled(null);
    setGeneration((g) => g + 1);
  }
  const state = polled ?? initial;

  const refresh = useCallback(async () => {
    const gen = generation;
    const seq = ++requestSeq.current;
    try {
      const res = await fetch(`/api/pcb/projects/${projectId}/wizard-state`, { cache: 'no-store' });
      if (!res.ok) return;
      const data = (await res.json()) as { ok: boolean; state: PcbWizardState };
      // Plus récent rendu serveur ou polling plus récent : on ignore cette réponse.
      if (gen !== generation || seq !== requestSeq.current) return;
      if (data.ok && data.state) setPolled(data.state);
    } catch {
      // Le dernier état connu reste affiché ; le prochain polling réessaiera.
    }
  }, [projectId, generation]);

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
