import { describe, it, expect } from 'vitest'
import { scoreMEDDPICC } from './meddpicc.js'

const fullScore = {
  metricsScore: 10, economicBuyerScore: 10, decisionCriteriaScore: 10,
  decisionProcessScore: 10, paperProcessScore: 10, painScore: 10,
  championScore: 10, competitionScore: 10,
}

describe('scoreMEDDPICC', () => {
  it('returns 100% for perfect scores', () => {
    const result = scoreMEDDPICC(fullScore)
    expect(result.totalRaw).toBe(80)
    expect(result.totalPct).toBe(100)
    expect(result.isWarning).toBe(false)
  })

  it('returns 0% for empty input', () => {
    const result = scoreMEDDPICC({})
    expect(result.totalRaw).toBe(0)
    expect(result.totalPct).toBe(0)
    expect(result.isWarning).toBe(true)
  })

  it('flags warning below 50%', () => {
    const result = scoreMEDDPICC({ metricsScore: 3, economicBuyerScore: 3 })
    expect(result.isWarning).toBe(true)
  })

  it('does not flag warning at exactly 50%', () => {
    // 50% of 80 = 40 raw
    const result = scoreMEDDPICC({ metricsScore: 5, economicBuyerScore: 5, decisionCriteriaScore: 5, decisionProcessScore: 5, paperProcessScore: 5, painScore: 5, championScore: 5, competitionScore: 5 })
    expect(result.totalPct).toBe(63) // 5*8=40; 40/80=50% → 50 not < 50
    expect(result.isWarning).toBe(false)
  })
})
