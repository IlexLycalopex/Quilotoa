import { apiClient } from './client'
import type { BantRecordInput, MeddpiccRecordInput } from '@msas/shared'

export const qualificationApi = {
  getBant:    (oppId: string) => apiClient.get(`/opportunities/${oppId}/qualification/bant`),
  putBant:    (oppId: string, data: BantRecordInput) => apiClient.put(`/opportunities/${oppId}/qualification/bant`, data),
  getMeddpicc:(oppId: string) => apiClient.get(`/opportunities/${oppId}/qualification/meddpicc`),
  putMeddpicc:(oppId: string, data: Partial<MeddpiccRecordInput>) => apiClient.put(`/opportunities/${oppId}/qualification/meddpicc`, data),
}
