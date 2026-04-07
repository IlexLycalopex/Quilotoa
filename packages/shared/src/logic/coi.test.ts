import { describe, it, expect } from 'vitest'
import { calculateCOI } from './coi.js'

const baseInputs = {
  financeTeamSize: 5,
  financeAnnualSalary: 42000,
  manualReentryHrsPerWeekPerFte: 4.5,
  monthEndDaysActual: 6.4,
  errorReworkPct: 2.1,
  auditPrepDays: 8,
  reportingCycleDays: 6,
  itLegacyAnnualCost: 15000,
  annualTransactionVolume: 10000,
}

describe('calculateCOI', () => {
  it('returns a positive total for typical inputs', () => {
    const result = calculateCOI(baseInputs)
    expect(result.totalAnnual).toBeGreaterThan(0)
    expect(result.lines).toHaveLength(6)
  })

  it('returns zero excess month-end cost when at benchmark', () => {
    const result = calculateCOI(baseInputs)
    const monthEndLine = result.lines.find(l => l.label.includes('month-end'))!
    expect(monthEndLine.annual).toBe(0)
  })

  it('increases total when month-end days exceed benchmark', () => {
    const worse = { ...baseInputs, monthEndDaysActual: 12 }
    const better = { ...baseInputs, monthEndDaysActual: 6.4 }
    expect(calculateCOI(worse).totalAnnual).toBeGreaterThan(calculateCOI(better).totalAnnual)
  })

  it('includes legacy IT cost directly', () => {
    const result = calculateCOI(baseInputs)
    const itLine = result.lines.find(l => l.label.includes('Legacy IT'))!
    expect(itLine.annual).toBe(15000)
  })
})
