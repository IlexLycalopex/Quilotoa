import { MEDDPICC_MAX_TOTAL, MEDDPICC_WARNING_THRESHOLD_PCT } from '../constants.js'
import type { MeddpiccRecordInput } from '../schemas/qualification.js'

export interface MeddpiccScoreResult {
  totalRaw: number       // 0–80
  totalPct: number       // 0–100
  isWarning: boolean     // true if below threshold
  elementScores: Record<keyof typeof ELEMENT_KEYS, number>
}

const ELEMENT_KEYS = {
  metrics: 'metricsScore',
  economicBuyer: 'economicBuyerScore',
  decisionCriteria: 'decisionCriteriaScore',
  decisionProcess: 'decisionProcessScore',
  paperProcess: 'paperProcessScore',
  pain: 'painScore',
  champion: 'championScore',
  competition: 'competitionScore',
} as const satisfies Record<string, keyof MeddpiccRecordInput>

/**
 * Computes MEDDPICC score. Returns raw total (0–80), percentage (0–100),
 * a warning flag, and per-element scores.
 */
export function scoreMEDDPICC(record: Partial<MeddpiccRecordInput>): MeddpiccScoreResult {
  const elementScores = Object.fromEntries(
    Object.entries(ELEMENT_KEYS).map(([key, field]) => [key, record[field] ?? 0]),
  ) as Record<keyof typeof ELEMENT_KEYS, number>

  const totalRaw = Object.values(elementScores).reduce((sum, s) => sum + s, 0)
  const totalPct = Math.round((totalRaw / MEDDPICC_MAX_TOTAL) * 100)

  return {
    totalRaw,
    totalPct,
    isWarning: totalPct < MEDDPICC_WARNING_THRESHOLD_PCT,
    elementScores,
  }
}
