import { z } from 'zod'
import { ROI_DEFAULTS } from '../constants.js'

// z.coerce.number() handles HTML inputs that may deliver strings
export const CoiInputsSchema = z.object({
  financeTeamSize: z.coerce.number().int().positive(),
  financeAnnualSalary: z.coerce.number().positive(),
  manualReentryHrsPerWeekPerFte: z.coerce.number().min(0),
  monthEndDaysActual: z.coerce.number().min(0),
  errorReworkPct: z.coerce.number().min(0).max(100),
  auditPrepDays: z.coerce.number().min(0),
  reportingCycleDays: z.coerce.number().min(0),
  itLegacyAnnualCost: z.coerce.number().min(0),
  annualTransactionVolume: z.coerce.number().int().min(0),
})

export const RoiInputsSchema = z.object({
  coiTotalAnnual: z.coerce.number().min(0),
  implementationInvestment: z.coerce.number().min(0),
  annualLicenceCost: z.coerce.number().min(0),
  benefitRealisationMonths: z.coerce.number().int().min(1).max(24).default(ROI_DEFAULTS.benefitRealisationMonths),
  discountRatePct: z.coerce.number().min(0).max(50).default(ROI_DEFAULTS.discountRatePct),
  sensitivityLowMultiplier: z.coerce.number().min(0.1).max(1).default(ROI_DEFAULTS.sensitivityLowMultiplier),
  sensitivityHighMultiplier: z.coerce.number().min(1).max(3).default(ROI_DEFAULTS.sensitivityHighMultiplier),
})

export const FinancialModelUpdateSchema = z.object({
  coiInputs: CoiInputsSchema.partial().optional(),
  roiInputs: RoiInputsSchema.partial().optional(),
})

export type CoiInputs = z.infer<typeof CoiInputsSchema>
export type RoiInputs = z.infer<typeof RoiInputsSchema>
export type FinancialModelUpdateInput = z.infer<typeof FinancialModelUpdateSchema>
