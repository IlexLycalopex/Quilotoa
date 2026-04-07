import { apiClient } from './client'
import type { CreateUserInput, UpdateUserInput } from '@msas/shared'

export const usersApi = {
  list:   ()            => apiClient.get('/users'),
  me:     ()            => apiClient.get('/users/me'),
  create: (data: CreateUserInput) => apiClient.post('/users', data),
  update: (id: string, data: UpdateUserInput) => apiClient.patch(`/users/${id}`, data),
  deactivate: (id: string) => apiClient.patch(`/users/${id}`, { isActive: false }),
}
