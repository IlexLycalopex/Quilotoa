import { describe, it, expect } from 'vitest'
import { evaluateBANT } from './bant.js'
import { BudgetStatus } from '../enums.js'

const base = {
  budgetStatus: BudgetStatus.CONFIRMED,
  authorityIdentified: true,
  needStatement: 'Current system is causing month-end delays',
  timelineDate: futureDate(6),
}

function futureDate(months: number): string {
  const d = new Date()
  d.setMonth(d.getMonth() + months)
  return d.toISOString().split('T')[0]!
}

describe('evaluateBANT', () => {
  it('passes when all criteria met', () => {
    expect(evaluateBANT(base)).toBe(true)
  })

  it('fails when budget is UNKNOWN', () => {
    expect(evaluateBANT({ ...base, budgetStatus: BudgetStatus.UNKNOWN })).toBe(false)
  })

  it('passes with INDICATIVE budget', () => {
    expect(evaluateBANT({ ...base, budgetStatus: BudgetStatus.INDICATIVE })).toBe(true)
  })

  it('fails when authority not identified', () => {
    expect(evaluateBANT({ ...base, authorityIdentified: false })).toBe(false)
  })

  it('fails when need statement is empty', () => {
    expect(evaluateBANT({ ...base, needStatement: '  ' })).toBe(false)
  })

  it('fails when timeline is beyond 18 months', () => {
    expect(evaluateBANT({ ...base, timelineDate: futureDate(20) })).toBe(false)
  })

  it('fails when timeline is in the past', () => {
    expect(evaluateBANT({ ...base, timelineDate: '2020-01-01' })).toBe(false)
  })

  it('fails when timeline is null', () => {
    expect(evaluateBANT({ ...base, timelineDate: null })).toBe(false)
  })
})
