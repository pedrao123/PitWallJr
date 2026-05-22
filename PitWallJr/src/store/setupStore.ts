import { create } from 'zustand';
import { DeviceSetupSchema } from '../schemas/setupSchema';
import type { DeviceSetup } from '../types/setup';
import type { ZodIssue } from 'zod';

interface SetupStore {
  setups: DeviceSetup[];
  activeId: string | null;
  validationErrors: ZodIssue[];

  setActive: (id: string | null) => void;
  addSetup: (setup: DeviceSetup) => void;
  updateSetup: (id: string, patch: Partial<DeviceSetup>) => void;
  removeSetup: (id: string) => void;
  validateActive: () => boolean;
}

export const useSetupStore = create<SetupStore>((set, get) => ({
  setups: [],
  activeId: null,
  validationErrors: [],

  setActive: (id) => {
    set({ activeId: id, validationErrors: [] });
  },

  addSetup: (setup) => {
    set((s) => ({ setups: [...s.setups, setup] }));
  },

  updateSetup: (id, patch) => {
    set((s) => ({
      setups: s.setups.map((setup) =>
        setup.id === id
          ? { ...setup, ...patch, updatedAt: new Date().toISOString() }
          : setup
      ),
    }));
    get().validateActive();
  },

  removeSetup: (id) => {
    set((s) => ({
      setups: s.setups.filter((setup) => setup.id !== id),
      activeId: s.activeId === id ? null : s.activeId,
    }));
  },

  validateActive: () => {
    const { setups, activeId } = get();
    const active = setups.find((s) => s.id === activeId);
    if (!active) {
      set({ validationErrors: [] });
      return true;
    }
    const result = DeviceSetupSchema.safeParse(active);
    if (result.success) {
      set({ validationErrors: [] });
      return true;
    }
    set({ validationErrors: result.error.issues });
    return false;
  },
}));

export const useActiveSetup = () => {
  const { setups, activeId } = useSetupStore();
  return setups.find((s) => s.id === activeId) ?? null;
};
