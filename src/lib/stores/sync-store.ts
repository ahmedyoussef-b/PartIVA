import { create } from 'zustand';

export interface SyncLog {
  id: string;
  timestamp: string;
  itemsCount: number;
  status: 'success' | 'warning' | 'error';
  message: string;
}

interface SyncState {
  lastSyncAt: string | null;
  pendingCount: number;
  isSyncing: boolean;
  logs: SyncLog[];
  setPendingCount: (count: number) => void;
  triggerSync: () => Promise<{ received: number }>;
}

export const useSyncStore = create<SyncState>((set) => ({
  lastSyncAt: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
  pendingCount: 3,
  isSyncing: false,
  logs: [
    {
      id: 'log-1',
      timestamp: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
      itemsCount: 2,
      status: 'success',
      message: 'Synchronisation Neon Cloud réussie : 2 nouvelles demandes tirées en local',
    },
    {
      id: 'log-2',
      timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
      itemsCount: 1,
      status: 'success',
      message: 'Synchronisation Neon Cloud réussie : 1 nouvelle demande',
    },
  ],
  setPendingCount: (count) => set({ pendingCount: count }),
  triggerSync: async () => {
    set({ isSyncing: true });
    try {
      // Simulation or call API
      const res = await fetch('/api/sync', { method: 'POST' }).catch(() => null);
      const data = res ? await res.json().catch(() => ({ received: 2 })) : { received: 2 };
      const newLog: SyncLog = {
        id: `log-${Date.now()}`,
        timestamp: new Date().toISOString(),
        itemsCount: data.received ?? 1,
        status: 'success',
        message: `Synchronisation manuelle : ${data.received ?? 1} demande(s) consolidée(s) dans la BDD SQLite locale`,
      };
      set((state) => ({
        isSyncing: false,
        lastSyncAt: new Date().toISOString(),
        pendingCount: Math.max(0, state.pendingCount - (data.received ?? 1)),
        logs: [newLog, ...state.logs.slice(0, 19)],
      }));
      return data;
    } catch {
      set({ isSyncing: false });
      return { received: 0 };
    }
  },
}));
