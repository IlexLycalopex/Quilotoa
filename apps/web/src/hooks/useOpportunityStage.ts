import { useQuery } from '@tanstack/react-query'
import { opportunitiesApi } from '@/api/opportunities'
import { Stage, STAGE_ORDER } from '@msas/shared'

export interface StageGate {
  canAccess: (stage: Stage) => boolean
  currentStage: Stage | null
  isLoading: boolean
}

/**
 * Returns access gating info for the opportunity workflow steps.
 * A stage is accessible if the opportunity has reached or passed that stage.
 */
export function useOpportunityStage(oppId: string): StageGate {
  const { data, isLoading } = useQuery({
    queryKey: ['opportunity', oppId],
    queryFn: () => opportunitiesApi.get(oppId).then(r => r.data),
    enabled: !!oppId,
  })

  const currentStage: Stage | null = data?.stage ?? null

  const canAccess = (stage: Stage): boolean => {
    if (!currentStage) return stage === Stage.QUALIFICATION
    const currentIdx = STAGE_ORDER.indexOf(currentStage)
    const targetIdx  = STAGE_ORDER.indexOf(stage)
    return targetIdx <= currentIdx
  }

  return { canAccess, currentStage, isLoading }
}
