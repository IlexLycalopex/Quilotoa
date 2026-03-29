import { apiClient } from './client'
import type { CreateOrganisationInput, UpdateOrganisationInput } from '@msas/shared'

export const organisationsApi = {
  list:   ()           => apiClient.get('/organisations'),
  get:    (id: string) => apiClient.get(`/organisations/${id}`),
  create: (data: CreateOrganisationInput) => apiClient.post('/organisations', data),
  update: (id: string, data: UpdateOrganisationInput) => apiClient.patch(`/organisations/${id}`, data),
}
