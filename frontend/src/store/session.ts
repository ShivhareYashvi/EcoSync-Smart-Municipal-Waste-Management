import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { User } from '../lib/types';

export const SESSION_STORAGE_KEY = 'ecosync-session';

type SessionState = {
  token: string | null;
  refreshToken: string | null;
  user: User | null;
  setSession: (token: string, user: User, refreshToken?: string) => void;
  setUser: (user: User) => void;
  clearSession: () => void;
};

export const useSessionStore = create<SessionState>()(
  persist(
    (set) => ({
      token: null,
      refreshToken: null,
      user: null,
      setSession: (token, user, refreshToken) =>
        set((state) => ({
          token,
          user,
          refreshToken: refreshToken ?? state.refreshToken,
        })),
      setUser: (user) => set({ user }),
      clearSession: () => set({ token: null, refreshToken: null, user: null }),
    }),
    {
      name: SESSION_STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
    }
  )
);

export function getSessionToken(): string | null {
  return useSessionStore.getState().token;
}

export function getRefreshToken(): string | null {
  return useSessionStore.getState().refreshToken;
}
