import { apiClient } from './client'
import type { DocumentType } from '@msas/shared'

export const proposalsApi = {
  list:     (oppId: string) => apiClient.get(`/opportunities/${oppId}/proposals`),
  generate: (oppId: string, documentType: DocumentType) =>
    apiClient.post(`/opportunities/${oppId}/proposals`, { documentType }),
  download: (oppId: string, proposalId: string) =>
    apiClient.get(`/opportunities/${oppId}/proposals/${proposalId}/download`, { responseType: 'blob' }),
}
