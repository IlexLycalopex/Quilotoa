import { z } from 'zod'
import { BudgetStatus } from '../enums.js'

// ─── BANT ────────────────────────────────────────────────────────────────────

export const BantRecordSchema = z.object({
  budgetStatus: z.nativeEnum(BudgetStatus),
  authorityIdentified: z.boolean(),
  authorityRole: z.string().max(255).optional(),
  needStatement: z.string().min(1, 'Pain statement is required'),
  needCategory: z.string().max(100).optional(),
  timelineDate: z.string().date().nullable().optional(), // ISO date string
})

export type BantRecordInput = z.infer<typeof BantRecordSchema>

// ─── MEDDPICC ────────────────────────────────────────────────────────────────

const scoreField = z.number().int().min(0).max(10)

export const MeddpiccRecordSchema = z.object({
  metricsScore: scoreField,
  metricsNotes: z.string().max(2000).optional(),
  economicBuyerScore: scoreField,
  economicBuyerName: z.string().max(255).optional(),
  economicBuyerRole: z.string().max(255).optional(),
  economicBuyerEngagement: z.string().max(100).optional(),
  decisionCriteriaScore: scoreField,
  decisionCriteriaNotes: z.string().max(2000).optional(),
  decisionProcessScore: scoreField,
  decisionProcessNotes: z.string().max(2000).optional(),
  paperProcessScore: scoreField,
  paperProcessNotes: z.string().max(2000).optional(),
  painScore: scoreField,
  painNotes: z.string().max(2000).optional(),
  championScore: scoreField,
  championName: z.string().max(255).optional(),
  championRole: z.string().max(255).optional(),
  competitionScore: scoreField,
  competitionNotes: z.string().max(2000).optional(),
})

export type MeddpiccRecordInput = z.infer<typeof MeddpiccRecordSchema>
