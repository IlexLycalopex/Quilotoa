import { apiClient } from './client'
import type { CoiInputs, RoiInputs } from '@msas/shared'

export const financialApi = {
  getCoi: (oppId: string) => apiClient.get(`/opportunities/${oppId}/financial-model/coi`),
  putCoi: (oppId: string, data: Partial<CoiInputs>) => apiClient.put(`/opportunities/${oppId}/financial-model/coi`, data),
  getRoi: (oppId: string) => apiClient.get(`/opportunities/${oppId}/financial-model/roi`),
  putRoi: (oppId: string, data: Partial<RoiInputs>) => apiClient.put(`/opportunities/${oppId}/financial-model/roi`, data),
}
