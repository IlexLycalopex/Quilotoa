import { apiClient } from './client'
import type { CreateOpportunityInput, UpdateOpportunityInput } from '@msas/shared'

export const opportunitiesApi = {
  list:   ()            => apiClient.get('/opportunities'),
  get:    (id: string)  => apiClient.get(`/opportunities/${id}`),
  create: (data: CreateOpportunityInput) => apiClient.post('/opportunities', data),
  update: (id: string, data: UpdateOpportunityInput) => apiClient.patch(`/opportunities/${id}`, data),
  delete: (id: string)  => apiClient.delete(`/opportunities/${id}`),
}
