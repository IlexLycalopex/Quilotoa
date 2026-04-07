import { apiClient } from './client'
import type { DiscoveryDatasetInput } from '@msas/shared'

export const discoveryApi = {
  get: (oppId: string) => apiClient.get(`/opportunities/${oppId}/discovery`),
  put: (oppId: string, data: Partial<DiscoveryDatasetInput>) => apiClient.put(`/opportunities/${oppId}/discovery`, data),
}
