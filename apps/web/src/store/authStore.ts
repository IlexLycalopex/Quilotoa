import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Role } from '@msas/shared'

export interface AuthUser {
  id: string
  email: string
  fullName: string
  role: Role
}

interface AuthState {
  user: AuthUser | null
  accessToken: string | null
  tenantSlug: string | null
  setAuth: (user: AuthUser, accessToken: string, tenantSlug: string) => void
  setAccessToken: (token: string) => void
  clearAuth: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      tenantSlug: null,
      setAuth: (user, accessToken, tenantSlug) => set({ user, accessToken, tenantSlug }),
      setAccessToken: (accessToken) => set({ accessToken }),
      clearAuth: () => set({ user: null, accessToken: null, tenantSlug: null }),
    }),
    {
      name: 'msas-auth',
      partialize: (state) => ({ user: state.user, tenantSlug: state.tenantSlug }),
      // Don't persist accessToken — re-acquired via refresh on startup
    },
  ),
)
