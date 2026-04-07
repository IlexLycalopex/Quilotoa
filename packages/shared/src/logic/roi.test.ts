import { describe, it, expect } from 'vitest'
import { calculateROI } from './roi.js'

const baseInputs = {
  coiTotalAnnual: 120000,
  implementationInvestment: 80000,
  annualLicenceCost: 18000,
  benefitRealisationMonths: 6,
  discountRatePct: 8,
  sensitivityLowMultiplier: 0.7,
  sensitivityHighMultiplier: 1.3,
}

describe('calculateROI', () => {
  it('returns three scenarios', () => {
    const result = calculateROI(baseInputs)
    expect(result.base.label).toBe('Base')
    expect(result.low.label).toBe('Low')
    expect(result.high.label).toBe('High')
  })

  it('high scenario has higher annual benefit than base', () => {
    const result = calculateROI(baseInputs)
    expect(result.high.annualBenefit).toBeGreaterThan(result.base.annualBenefit)
  })

  it('low scenario has lower annual benefit than base', () => {
    const result = calculateROI(baseInputs)
    expect(result.low.annualBenefit).toBeLessThan(result.base.annualBenefit)
  })

  it('calculates a finite payback period', () => {
    const result = calculateROI(baseInputs)
    expect(result.base.paybackMonths).toBeLessThan(36)
  })

  it('cashFlowByYear has 3 entries', () => {
    const result = calculateROI(baseInputs)
    expect(result.base.cashFlowByYear).toHaveLength(3)
  })
})
