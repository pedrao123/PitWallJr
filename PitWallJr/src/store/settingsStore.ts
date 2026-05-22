import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SettingsStore {
  stm32ProjectPath: string;
  setStm32ProjectPath: (path: string) => void;
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      stm32ProjectPath: '',
      setStm32ProjectPath: (path) => set({ stm32ProjectPath: path }),
    }),
    { name: 'pitwalljr-settings' },
  ),
);
