import { apiClient } from './client'
import type { LoginInput, AuthUser } from '@msas/shared'

export const authApi = {
  login: (data: LoginInput) =>
    apiClient.post<{ accessToken: string; user: AuthUser }>('/auth/login', data),
  logout: () => apiClient.post('/auth/logout'),
}
