import { z } from 'zod'
import { ROI_DEFAULTS } from '../constants.js'

export const CoiInputsSchema = z.object({
  financeTeamSize: z.number().int().positive(),
  financeAnnualSalary: z.number().positive(),
  manualReentryHrsPerWeekPerFte: z.number().min(0),
  monthEndDaysActual: z.number().min(0),
  errorReworkPct: z.number().min(0).max(100),
  auditPrepDays: z.number().min(0),
  reportingCycleDays: z.number().min(0),
  itLegacyAnnualCost: z.number().min(0),
  annualTransactionVolume: z.number().int().min(0),
})

export const RoiInputsSchema = z.object({
  coiTotalAnnual: z.number().min(0),
  implementationInvestment: z.number().min(0),
  annualLicenceCost: z.number().min(0),
  benefitRealisationMonths: z.number().int().min(1).max(24).default(ROI_DEFAULTS.benefitRealisationMonths),
  discountRatePct: z.number().min(0).max(50).default(ROI_DEFAULTS.discountRatePct),
  sensitivityLowMultiplier: z.number().min(0.1).max(1).default(ROI_DEFAULTS.sensitivityLowMultiplier),
  sensitivityHighMultiplier: z.number().min(1).max(3).default(ROI_DEFAULTS.sensitivityHighMultiplier),
})

export const FinancialModelUpdateSchema = z.object({
  coiInputs: CoiInputsSchema.partial().optional(),
  roiInputs: RoiInputsSchema.partial().optional(),
})

export type CoiInputs = z.infer<typeof CoiInputsSchema>
export type RoiInputs = z.infer<typeof RoiInputsSchema>
export type FinancialModelUpdateInput = z.infer<typeof FinancialModelUpdateSchema>
