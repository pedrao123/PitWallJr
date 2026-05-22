import { create } from 'zustand';

export type BuildStatus = 'idle' | 'running' | 'success' | 'error';

export interface BuildLogEntry {
  type: 'stdout' | 'stderr';
  line: string;
}

interface BuildStore {
  status: BuildStatus;
  logs: BuildLogEntry[];
  durationMs: number | null;
  startedAt: number | null;
  isPanelOpen: boolean;

  start: () => void;
  appendLog: (entry: BuildLogEntry) => void;
  finish: (success: boolean) => void;
  clear: () => void;
  openPanel: () => void;
  closePanel: () => void;
}

export const useBuildStore = create<BuildStore>((set, get) => ({
  status: 'idle',
  logs: [],
  durationMs: null,
  startedAt: null,
  isPanelOpen: false,

  start: () => set({ status: 'running', logs: [], durationMs: null, startedAt: Date.now(), isPanelOpen: true }),

  appendLog: (entry) => set((s) => ({ logs: [...s.logs, entry] })),

  finish: (success) => {
    const { startedAt } = get();
    set({ status: success ? 'success' : 'error', durationMs: startedAt ? Date.now() - startedAt : null });
  },

  clear: () => set({ status: 'idle', logs: [], durationMs: null, startedAt: null }),

  openPanel: () => set({ isPanelOpen: true }),
  closePanel: () => set({ isPanelOpen: false }),
}));
