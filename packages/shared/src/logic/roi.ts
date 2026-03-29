import { ROI_DEFAULTS } from '../constants.js'
import type { RoiInputs } from '../schemas/financial.js'

export interface RoiScenario {
  label: 'Low' | 'Base' | 'High'
  annualBenefit: number
  paybackMonths: number
  threeYearRoiPct: number
  npv: number
  cashFlowByYear: [number, number, number] // years 1, 2, 3
}

export interface RoiResult {
  base: RoiScenario
  low: RoiScenario
  high: RoiScenario
}

/**
 * Calculates ROI scenarios (low/base/high).
 * Pure function — used by API (persist) and frontend (live sensitivity toggle).
 */
export function calculateROI(inputs: RoiInputs): RoiResult {
  const {
    coiTotalAnnual,
    implementationInvestment,
    annualLicenceCost,
    benefitRealisationMonths = ROI_DEFAULTS.benefitRealisationMonths,
    discountRatePct = ROI_DEFAULTS.discountRatePct,
    sensitivityLowMultiplier = ROI_DEFAULTS.sensitivityLowMultiplier,
    sensitivityHighMultiplier = ROI_DEFAULTS.sensitivityHighMultiplier,
  } = inputs

  return {
    base: computeScenario('Base', coiTotalAnnual, implementationInvestment, annualLicenceCost, benefitRealisationMonths, discountRatePct),
    low:  computeScenario('Low',  coiTotalAnnual * sensitivityLowMultiplier,  implementationInvestment, annualLicenceCost, benefitRealisationMonths, discountRatePct),
    high: computeScenario('High', coiTotalAnnual * sensitivityHighMultiplier, implementationInvestment, annualLicenceCost, benefitRealisationMonths, discountRatePct),
  }
}

function computeScenario(
  label: RoiScenario['label'],
  annualBenefit: number,
  implementationInvestment: number,
  annualLicenceCost: number,
  benefitRealisationMonths: number,
  discountRatePct: number,
): RoiScenario {
  const discountRate = discountRatePct / 100
  const rampFraction = Math.max(0, 1 - benefitRealisationMonths / 12)
  const totalInvestment = implementationInvestment + annualLicenceCost * ROI_DEFAULTS.analysisYears

  // Year-by-year net benefit (benefit minus annual licence)
  const yearBenefits: [number, number, number] = [
    annualBenefit * rampFraction - annualLicenceCost,
    annualBenefit - annualLicenceCost,
    annualBenefit - annualLicenceCost,
  ]

  // NPV of benefits minus implementation investment
  const npv = yearBenefits.reduce(
    (pv, benefit, i) => pv + benefit / Math.pow(1 + discountRate, i + 1),
    -implementationInvestment,
  )

  // Payback: months until cumulative net cash flow covers total investment
  let cumulative = -implementationInvestment
  let paybackMonths = Infinity
  for (let month = 1; month <= ROI_DEFAULTS.analysisYears * 12; month++) {
    const yearIdx = Math.floor((month - 1) / 12)
    const monthlyBenefit = (yearBenefits[yearIdx as 0 | 1 | 2] ?? 0) / 12
    cumulative += monthlyBenefit
    if (cumulative >= 0 && paybackMonths === Infinity) {
      paybackMonths = month
    }
  }

  const totalBenefit = yearBenefits.reduce((s, b) => s + b, 0)
  const threeYearRoiPct = totalInvestment > 0
    ? round(((totalBenefit - implementationInvestment) / totalInvestment) * 100)
    : 0

  return {
    label,
    annualBenefit: round(annualBenefit),
    paybackMonths: paybackMonths === Infinity ? 999 : paybackMonths,
    threeYearRoiPct,
    npv: round(npv),
    cashFlowByYear: yearBenefits.map(round) as [number, number, number],
  }
}

function round(n: number): number {
  return Math.round(n * 100) / 100
}
