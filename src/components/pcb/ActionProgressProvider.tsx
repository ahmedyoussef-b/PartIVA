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

type Status = 'idle' | 'running' | 'done' | 'error';

interface ProgressState {
  label: string;
  status: Status;
  elapsedMs: number;
}

interface ActionProgressApi {
  start: (label: string) => void;
  finish: (status?: Exclude<Status, 'idle' | 'running'>) => void;
  progress: ProgressState;
}

const ActionProgressContext = createContext<ActionProgressApi | null>(null);

const INITIAL: ProgressState = { label: '', status: 'idle', elapsedMs: 0 };

export function ActionProgressProvider({ children }: { children: ReactNode }) {
  const [progress, setProgress] = useState<ProgressState>(INITIAL);
  const startedAt = useRef<number | null>(null);
  const hideTimer = useRef<number | null>(null);

  const start = useCallback((label: string) => {
    if (hideTimer.current !== null) window.clearTimeout(hideTimer.current);
    startedAt.current = Date.now();
    setProgress({ label, status: 'running', elapsedMs: 0 });
  }, []);

  const finish = useCallback((status: Exclude<Status, 'idle' | 'running'> = 'done') => {
    const elapsedMs = startedAt.current === null ? 0 : Date.now() - startedAt.current;
    startedAt.current = null;
    setProgress((current) => ({ ...current, status, elapsedMs }));
    hideTimer.current = window.setTimeout(() => setProgress(INITIAL), 5000);
  }, []);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setProgress((current) =>
        current.status === 'running' && startedAt.current !== null
          ? { ...current, elapsedMs: Date.now() - startedAt.current! }
          : current,
      );
    }, 200);
    return () => {
      window.clearInterval(interval);
      if (hideTimer.current !== null) window.clearTimeout(hideTimer.current);
    };
  }, []);

  return (
    <ActionProgressContext.Provider value={{ start, finish, progress }}>
      {children}
    </ActionProgressContext.Provider>
  );
}

export function useActionProgress(): ActionProgressApi {
  const api = useContext(ActionProgressContext);
  if (!api) throw new Error('useActionProgress doit être utilisé dans ActionProgressProvider');
  return api;
}

export function ActionProgressBar() {
  const { progress } = useActionProgress();
  if (progress.status === 'idle') return null;

  const seconds = (progress.elapsedMs / 1000).toFixed(1);
  const color =
    progress.status === 'error'
      ? 'bg-red-500'
      : progress.status === 'done'
        ? 'bg-green-500'
        : 'bg-blue-500';
  const width = progress.status === 'running' ? '72%' : '100%';

  return (
    <div className="mt-2" role="status" aria-live="polite">
      <div className="mb-1 flex items-center justify-between text-[11px] text-gray-600">
        <span className="font-medium">{progress.label}</span>
        <span>
          {progress.status === 'running'
            ? `En cours… ${seconds} s`
            : progress.status === 'done'
              ? `Terminé en ${seconds} s`
              : `Échec après ${seconds} s`}
        </span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded bg-gray-200">
        <div
          className={`h-full rounded transition-all duration-300 ${color} ${
            progress.status === 'running' ? 'animate-pulse' : ''
          }`}
          style={{ width }}
        />
      </div>
    </div>
  );
}
