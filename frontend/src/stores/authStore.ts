import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { getRuntimeConfig } from '@/lib/runtimeConfig';

interface AuthState {
  isUnlocked: boolean;
  storedPassword: string;
  unlock: (password: string) => boolean;
  lock: () => void;
  validate: () => void;
}

export const requiresUnlock = !!getRuntimeConfig().password;

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      isUnlocked: !requiresUnlock,
      storedPassword: '',
      unlock: (password) => {
        const config = getRuntimeConfig();
        if (config.password && password === config.password) {
          set({ isUnlocked: true, storedPassword: password });
          return true;
        }
        return false;
      },
      lock: () => set({ isUnlocked: false, storedPassword: '' }),
      validate: () => {
        const config = getRuntimeConfig();
        if (!config.password) {
          set({ isUnlocked: true, storedPassword: '' });
          return;
        }
        if (get().storedPassword !== config.password) {
          set({ isUnlocked: false, storedPassword: '' });
        }
      },
    }),
    {
      name: 'songlist-auth',
      storage: createJSONStorage(() => sessionStorage),
      onRehydrateStorage: () => (state) => state?.validate(),
    }
  )
);

export const useCanEdit = () => useAuthStore((s) => !requiresUnlock || s.isUnlocked);
