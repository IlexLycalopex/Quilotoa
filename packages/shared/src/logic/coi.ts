import { COI_BENCHMARKS } from '../constants.js'
import type { CoiInputs } from '../schemas/financial.js'

export interface CoiLineItem {
  label: string
  annual: number
  benchmarkAnnual: number
  isAboveBenchmark: boolean
}

export interface CoiResult {
  lines: CoiLineItem[]
  totalAnnual: number
  benchmarkTotalAnnual: number
}

/**
 * Calculates the annual Cost of Inaction.
 * All inputs are prospect-supplied values; benchmark comparisons use spec-defined defaults.
 * Pure function — same result on client (live preview) and server (persist).
 */
export function calculateCOI(inputs: CoiInputs): CoiResult {
  const hourlyCost = inputs.financeAnnualSalary / (COI_BENCHMARKS.workingDaysPerYear * COI_BENCHMARKS.workingHoursPerDay)

  // 1. Manual data re-entry
  const manualReentryAnnual =
    inputs.manualReentryHrsPerWeekPerFte *
    COI_BENCHMARKS.weeksPerYear *
    inputs.financeTeamSize *
    hourlyCost
  const manualReentryBenchmark =
    COI_BENCHMARKS.manualReentryHrsPerWeekPerFte *
    COI_BENCHMARKS.weeksPerYear *
    inputs.financeTeamSize *
    hourlyCost

  // 2. Month-end close (cost of excess days vs benchmark)
  const excessMonthEndDays = Math.max(0, inputs.monthEndDaysActual - COI_BENCHMARKS.monthEndDays)
  const monthEndAnnual = excessMonthEndDays * 12 * inputs.financeTeamSize * inputs.financeAnnualSalary / COI_BENCHMARKS.workingDaysPerYear
  const monthEndBenchmark = 0 // benchmark is the target; cost above it is the waste

  // 3. Error rework
  const reworkAnnual =
    (inputs.errorReworkPct / 100) *
    inputs.annualTransactionVolume *
    (inputs.financeAnnualSalary / COI_BENCHMARKS.workingDaysPerYear / 8) *
    0.5 // assume 30 mins per rework item on average
  const reworkBenchmark =
    (COI_BENCHMARKS.errorReworkPct / 100) *
    inputs.annualTransactionVolume *
    (inputs.financeAnnualSalary / COI_BENCHMARKS.workingDaysPerYear / 8) *
    0.5

  // 4. Audit preparation
  const auditAnnual =
    inputs.auditPrepDays *
    inputs.financeTeamSize *
    (inputs.financeAnnualSalary / COI_BENCHMARKS.workingDaysPerYear)
  const auditBenchmark =
    COI_BENCHMARKS.auditPrepDays *
    inputs.financeTeamSize *
    (inputs.financeAnnualSalary / COI_BENCHMARKS.workingDaysPerYear)

  // 5. Reporting cycle lag
  const excessReportingDays = Math.max(0, inputs.reportingCycleDays - COI_BENCHMARKS.reportingCycleDays)
  const reportingAnnual = excessReportingDays * 12 * inputs.financeTeamSize * inputs.financeAnnualSalary / COI_BENCHMARKS.workingDaysPerYear
  const reportingBenchmark = 0

  // 6. Legacy IT cost (prospect-supplied; no benchmark comparison)
  const itLegacyAnnual = inputs.itLegacyAnnualCost
  const itLegacyBenchmark = 0

  const lines: CoiLineItem[] = [
    { label: 'Manual data re-entry', annual: round(manualReentryAnnual), benchmarkAnnual: round(manualReentryBenchmark), isAboveBenchmark: manualReentryAnnual > manualReentryBenchmark },
    { label: 'Excess month-end close time', annual: round(monthEndAnnual), benchmarkAnnual: round(monthEndBenchmark), isAboveBenchmark: monthEndAnnual > monthEndBenchmark },
    { label: 'Error rework cost', annual: round(reworkAnnual), benchmarkAnnual: round(reworkBenchmark), isAboveBenchmark: reworkAnnual > reworkBenchmark },
    { label: 'Audit preparation overhead', annual: round(auditAnnual), benchmarkAnnual: round(auditBenchmark), isAboveBenchmark: auditAnnual > auditBenchmark },
    { label: 'Delayed reporting cycle', annual: round(reportingAnnual), benchmarkAnnual: round(reportingBenchmark), isAboveBenchmark: reportingAnnual > reportingBenchmark },
    { label: 'Legacy IT support cost', annual: round(itLegacyAnnual), benchmarkAnnual: round(itLegacyBenchmark), isAboveBenchmark: itLegacyAnnual > 0 },
  ]

  const totalAnnual = lines.reduce((sum, l) => sum + l.annual, 0)
  const benchmarkTotalAnnual = lines.reduce((sum, l) => sum + l.benchmarkAnnual, 0)

  return { lines, totalAnnual: round(totalAnnual), benchmarkTotalAnnual: round(benchmarkTotalAnnual) }
}

function round(n: number): number {
  return Math.round(n * 100) / 100
}
