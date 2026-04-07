import { BudgetStatus } from '../enums.js'
import { BANT_MAX_TIMELINE_MONTHS } from '../constants.js'
import type { BantRecordInput } from '../schemas/qualification.js'

/**
 * Evaluates BANT pass/fail.
 * All four criteria must pass:
 *  - Budget: CONFIRMED or INDICATIVE
 *  - Authority: economic buyer identified
 *  - Need: pain statement provided
 *  - Timeline: go-live within 18 months
 */
export function evaluateBANT(record: BantRecordInput): boolean {
  const budgetPass = record.budgetStatus !== BudgetStatus.UNKNOWN
  const authorityPass = record.authorityIdentified
  const needPass = record.needStatement.trim().length > 0

  let timelinePass = false
  if (record.timelineDate) {
    const monthsDiff = monthsBetween(new Date(), new Date(record.timelineDate))
    timelinePass = monthsDiff >= 0 && monthsDiff <= BANT_MAX_TIMELINE_MONTHS
  }

  return budgetPass && authorityPass && needPass && timelinePass
}

function monthsBetween(from: Date, to: Date): number {
  return (to.getFullYear() - from.getFullYear()) * 12 + (to.getMonth() - from.getMonth())
}
