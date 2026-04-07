import { Router, type Request, type Response, type NextFunction } from 'express'
import { eq, and } from 'drizzle-orm'
import { db } from '../../config/db.js'
import { financialModels, opportunities } from '../../db/schema.js'
import { authenticate } from '../../middleware/auth.js'
import { authorize } from '../../middleware/rbac.js'
import { AppError } from '../../middleware/errorHandler.js'
import {
  CoiInputsSchema,
  RoiInputsSchema,
  calculateCOI,
  calculateROI,
  ROI_DEFAULTS,
  Action,
  Resource,
  Stage,
  type CoiResult,
  type RoiResult,
  type CoiInputs,
  type RoiInputs,
} from '@msas/shared'

const router: Router = Router({ mergeParams: true })

function wrap(fn: (req: Request, res: Response) => Promise<void>) {
  return (req: Request, res: Response, next: NextFunction) => fn(req, res).catch(next)
}

// ─── Helper: verify opportunity belongs to tenant ─────────────────────────────

async function verifyOpportunity(oppId: string, tenantId: string) {
  const [opp] = await db
    .select({ id: opportunities.id, stage: opportunities.stage })
    .from(opportunities)
    .where(and(eq(opportunities.id, oppId), eq(opportunities.tenantId, tenantId)))
    .limit(1)

  if (!opp) {
    throw new AppError(404, 'Opportunity not found')
  }

  return opp
}

// ─── Helper: get or stub financial model ─────────────────────────────────────

async function getFinancialModel(oppId: string, tenantId: string) {
  const [model] = await db
    .select()
    .from(financialModels)
    .where(and(eq(financialModels.opportunityId, oppId), eq(financialModels.tenantId, tenantId)))
    .limit(1)

  return model ?? null
}

// ─── Helper: extract COI inputs from model row ────────────────────────────────

function extractCoiInputs(model: Record<string, unknown>): CoiInputs | null {
  const required: Array<keyof CoiInputs> = [
    'financeTeamSize',
    'financeAnnualSalary',
    'manualReentryHrsPerWeekPerFte',
    'monthEndDaysActual',
    'errorReworkPct',
    'auditPrepDays',
    'reportingCycleDays',
    'itLegacyAnnualCost',
    'annualTransactionVolume',
  ]

  for (const key of required) {
    if (model[key] == null) return null
  }

  return {
    financeTeamSize: Number(model['financeTeamSize']),
    financeAnnualSalary: Number(model['financeAnnualSalary']),
    manualReentryHrsPerWeekPerFte: Number(model['manualReentryHrsPerWeekPerFte']),
    monthEndDaysActual: Number(model['monthEndDaysActual']),
    errorReworkPct: Number(model['errorReworkPct']),
    auditPrepDays: Number(model['auditPrepDays']),
    reportingCycleDays: Number(model['reportingCycleDays']),
    itLegacyAnnualCost: Number(model['itLegacyAnnualCost']),
    annualTransactionVolume: Number(model['annualTransactionVolume']),
  }
}

// ─── Helper: extract ROI inputs from model row ────────────────────────────────

function extractRoiInputs(model: Record<string, unknown>): RoiInputs | null {
  const required: Array<keyof RoiInputs> = [
    'implementationInvestment',
    'annualLicenceCost',
  ]

  for (const key of required) {
    if (model[key] == null) return null
  }

  // coiTotalAnnual may be stored on the model or derived
  const coiTotalAnnual = model['coiTotalAnnual'] != null ? Number(model['coiTotalAnnual']) : null
  if (coiTotalAnnual == null) return null

  return {
    coiTotalAnnual,
    implementationInvestment: Number(model['implementationInvestment']),
    annualLicenceCost: Number(model['annualLicenceCost']),
    benefitRealisationMonths: model['benefitRealisationMonths'] != null
      ? Number(model['benefitRealisationMonths'])
      : ROI_DEFAULTS.benefitRealisationMonths,
    discountRatePct: model['discountRatePct'] != null
      ? Number(model['discountRatePct'])
      : ROI_DEFAULTS.discountRatePct,
    sensitivityLowMultiplier: model['sensitivityLowMultiplier'] != null
      ? Number(model['sensitivityLowMultiplier'])
      : ROI_DEFAULTS.sensitivityLowMultiplier,
    sensitivityHighMultiplier: model['sensitivityHighMultiplier'] != null
      ? Number(model['sensitivityHighMultiplier'])
      : ROI_DEFAULTS.sensitivityHighMultiplier,
  }
}

// ─── GET /coi ─────────────────────────────────────────────────────────────────

router.get(
  '/coi',
  authenticate,
  authorize(Action.UPDATE, Resource.FINANCIAL_MODEL),
  wrap(async (req, res) => {
    const { oppId } = req.params as { oppId: string }
    await verifyOpportunity(oppId, req.tenantId)

    const model = await getFinancialModel(oppId, req.tenantId)

    if (!model) {
      throw new AppError(404, 'Financial model not found')
    }

    let coiResult: CoiResult | null = null
    const coiInputs = extractCoiInputs(model as unknown as Record<string, unknown>)
    if (coiInputs) {
      coiResult = calculateCOI(coiInputs)
    }

    res.json({ ...model, coiResult })
  }),
)

// ─── PUT /coi ─────────────────────────────────────────────────────────────────

router.put(
  '/coi',
  authenticate,
  authorize(Action.UPDATE, Resource.FINANCIAL_MODEL),
  wrap(async (req, res) => {
    const { oppId } = req.params as { oppId: string }
    const opp = await verifyOpportunity(oppId, req.tenantId)

    const incoming = CoiInputsSchema.partial().parse(req.body)

    // Load existing model so we can merge
    const existing = await getFinancialModel(oppId, req.tenantId)
    const existingData = existing ?? {}

    // Merge incoming over existing
    const merged = { ...existingData, ...incoming } as Record<string, unknown>

    // Compute COI outputs if all inputs are present
    const coiInputs = extractCoiInputs({ ...merged, ...incoming })
    let coiOutputs: Partial<{
      coiManualReentry: number
      coiMonthEnd: number
      coiRework: number
      coiAudit: number
      coiReporting: number
      coiItLegacy: number
      coiTotalAnnual: number
    }> = {}
    let coiResult: CoiResult | null = null

    if (coiInputs) {
      coiResult = calculateCOI(coiInputs)
      const lineMap: Record<string, number> = {}
      for (const line of coiResult.lines) {
        lineMap[line.label] = line.annual
      }
      coiOutputs = {
        coiManualReentry: lineMap['Manual data re-entry'],
        coiMonthEnd:      lineMap['Excess month-end close time'],
        coiRework:        lineMap['Error rework cost'],
        coiAudit:         lineMap['Audit preparation overhead'],
        coiReporting:     lineMap['Delayed reporting cycle'],
        coiItLegacy:      lineMap['Legacy IT support cost'],
        coiTotalAnnual:   coiResult.totalAnnual,
      }
    }

    const upsertValues = {
      opportunityId: oppId,
      tenantId: req.tenantId,
      ...incoming,
      ...coiOutputs,
      updatedAt: new Date(),
    }

    const [model] = await db
      .insert(financialModels)
      .values(upsertValues)
      .onConflictDoUpdate({
        target: financialModels.opportunityId,
        set: { ...incoming, ...coiOutputs, updatedAt: new Date() },
      })
      .returning()

    // Advance stage to COI if currently at DISCOVERY
    if (coiResult && opp.stage === Stage.DISCOVERY) {
      await db
        .update(opportunities)
        .set({ stage: Stage.COI, updatedAt: new Date() })
        .where(and(eq(opportunities.id, oppId), eq(opportunities.tenantId, req.tenantId)))
    }

    res.json({ ...model, coiResult })
  }),
)

// ─── GET /roi ─────────────────────────────────────────────────────────────────

router.get(
  '/roi',
  authenticate,
  authorize(Action.UPDATE, Resource.FINANCIAL_MODEL),
  wrap(async (req, res) => {
    const { oppId } = req.params as { oppId: string }
    await verifyOpportunity(oppId, req.tenantId)

    const model = await getFinancialModel(oppId, req.tenantId)

    if (!model) {
      throw new AppError(404, 'Financial model not found')
    }

    let roiResult: RoiResult | null = null
    const roiInputs = extractRoiInputs(model as unknown as Record<string, unknown>)
    if (roiInputs) {
      roiResult = calculateROI(roiInputs)
    }

    res.json({ ...model, roiResult })
  }),
)

// ─── PUT /roi ─────────────────────────────────────────────────────────────────

router.put(
  '/roi',
  authenticate,
  authorize(Action.UPDATE, Resource.FINANCIAL_MODEL),
  wrap(async (req, res) => {
    const { oppId } = req.params as { oppId: string }
    const opp = await verifyOpportunity(oppId, req.tenantId)

    const incoming = RoiInputsSchema.partial().parse(req.body)

    // Load existing model so we can merge
    const existing = await getFinancialModel(oppId, req.tenantId)
    const existingData = existing ?? {}

    // Merge incoming over existing
    const merged = { ...existingData, ...incoming } as Record<string, unknown>

    const roiInputs = extractRoiInputs(merged)
    let roiOutputs: Partial<{
      roiPaybackMonths: number
      roi3yrPct: number
      roiNpv: number
      roiAnnualBenefit: number
    }> = {}
    let roiResult: RoiResult | null = null

    if (roiInputs) {
      roiResult = calculateROI(roiInputs)
      roiOutputs = {
        roiPaybackMonths: roiResult.base.paybackMonths,
        roi3yrPct:        roiResult.base.threeYearRoiPct,
        roiNpv:           roiResult.base.npv,
        roiAnnualBenefit: roiResult.base.annualBenefit,
      }
    }

    const upsertValues = {
      opportunityId: oppId,
      tenantId: req.tenantId,
      ...incoming,
      ...roiOutputs,
      updatedAt: new Date(),
    }

    const [model] = await db
      .insert(financialModels)
      .values(upsertValues)
      .onConflictDoUpdate({
        target: financialModels.opportunityId,
        set: { ...incoming, ...roiOutputs, updatedAt: new Date() },
      })
      .returning()

    // Advance stage to ROI if currently at COI
    if (roiResult && opp.stage === Stage.COI) {
      await db
        .update(opportunities)
        .set({ stage: Stage.ROI, updatedAt: new Date() })
        .where(and(eq(opportunities.id, oppId), eq(opportunities.tenantId, req.tenantId)))
    }

    res.json({ ...model, roiResult })
  }),
)

export { router as financialRouter }
