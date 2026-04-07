import { z } from 'zod'
import { BudgetStatus } from '../enums.js'

// ─── BANT ────────────────────────────────────────────────────────────────────

export const BantRecordSchema = z.object({
  budgetStatus: z.nativeEnum(BudgetStatus),
  authorityIdentified: z.coerce.boolean(),
  authorityRole: z.string().max(255).nullish(),
  needStatement: z.string().min(1, 'Pain statement is required'),
  needCategory: z.string().max(100).nullish(),
  // Empty string from an unfilled date input must be normalised to undefined
  timelineDate: z.preprocess(
    (v) => (v === '' ? undefined : v),
    z.string().date().nullable().optional(),
  ),
})

export type BantRecordInput = z.infer<typeof BantRecordSchema>

// ─── MEDDPICC ────────────────────────────────────────────────────────────────

// coerce handles HTML range inputs returning strings; nullish handles DB nulls
const scoreField = z.coerce.number().int().min(0).max(10)
const optStr = (max: number) => z.string().max(max).nullish()

export const MeddpiccRecordSchema = z.object({
  metricsScore: scoreField,
  metricsNotes: optStr(2000),
  economicBuyerScore: scoreField,
  economicBuyerName: optStr(255),
  economicBuyerRole: optStr(255),
  economicBuyerEngagement: optStr(100),
  decisionCriteriaScore: scoreField,
  decisionCriteriaNotes: optStr(2000),
  decisionProcessScore: scoreField,
  decisionProcessNotes: optStr(2000),
  paperProcessScore: scoreField,
  paperProcessNotes: optStr(2000),
  painScore: scoreField,
  painNotes: optStr(2000),
  championScore: scoreField,
  championName: optStr(255),
  championRole: optStr(255),
  competitionScore: scoreField,
  competitionNotes: optStr(2000),
})

export type MeddpiccRecordInput = z.infer<typeof MeddpiccRecordSchema>
