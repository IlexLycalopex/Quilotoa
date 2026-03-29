import { Router, type Request, type Response, type NextFunction } from 'express'
import { eq, and } from 'drizzle-orm'
import { db } from '../../config/db.js'
import {
  bantRecords,
  meddpiccRecords,
  opportunities,
} from '../../db/schema.js'
import { authenticate } from '../../middleware/auth.js'
import { authorize } from '../../middleware/rbac.js'
import { AppError } from '../../middleware/errorHandler.js'
import {
  BantRecordSchema,
  MeddpiccRecordSchema,
  evaluateBANT,
  scoreMEDDPICC,
  Action,
  Resource,
} from '@msas/shared'

const router = Router({ mergeParams: true })

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

// ─── GET /bant ────────────────────────────────────────────────────────────────

router.get(
  '/bant',
  authenticate,
  authorize(Action.UPDATE, Resource.QUALIFICATION),
  wrap(async (req, res) => {
    const { oppId } = req.params as { oppId: string }
    await verifyOpportunity(oppId, req.tenantId)

    const [record] = await db
      .select()
      .from(bantRecords)
      .where(and(eq(bantRecords.opportunityId, oppId), eq(bantRecords.tenantId, req.tenantId)))
      .limit(1)

    if (!record) {
      throw new AppError(404, 'BANT record not found')
    }

    res.json(record)
  }),
)

// ─── PUT /bant ────────────────────────────────────────────────────────────────

router.put(
  '/bant',
  authenticate,
  authorize(Action.UPDATE, Resource.QUALIFICATION),
  wrap(async (req, res) => {
    const { oppId } = req.params as { oppId: string }
    await verifyOpportunity(oppId, req.tenantId)

    const data = BantRecordSchema.parse(req.body)
    const pass = evaluateBANT(data)

    const [record] = await db
      .insert(bantRecords)
      .values({
        opportunityId: oppId,
        tenantId: req.tenantId,
        ...data,
        pass,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: bantRecords.opportunityId,
        set: {
          ...data,
          pass,
          updatedAt: new Date(),
        },
      })
      .returning()

    // Update opportunities.bantPass
    await db
      .update(opportunities)
      .set({ bantPass: pass, updatedAt: new Date() })
      .where(and(eq(opportunities.id, oppId), eq(opportunities.tenantId, req.tenantId)))

    res.json(record)
  }),
)

// ─── GET /meddpicc ────────────────────────────────────────────────────────────

router.get(
  '/meddpicc',
  authenticate,
  authorize(Action.UPDATE, Resource.QUALIFICATION),
  wrap(async (req, res) => {
    const { oppId } = req.params as { oppId: string }
    await verifyOpportunity(oppId, req.tenantId)

    const [record] = await db
      .select()
      .from(meddpiccRecords)
      .where(
        and(eq(meddpiccRecords.opportunityId, oppId), eq(meddpiccRecords.tenantId, req.tenantId)),
      )
      .limit(1)

    if (!record) {
      throw new AppError(404, 'MEDDPICC record not found')
    }

    res.json(record)
  }),
)

// ─── PUT /meddpicc ────────────────────────────────────────────────────────────

router.put(
  '/meddpicc',
  authenticate,
  authorize(Action.UPDATE, Resource.QUALIFICATION),
  wrap(async (req, res) => {
    const { oppId } = req.params as { oppId: string }
    await verifyOpportunity(oppId, req.tenantId)

    const data = MeddpiccRecordSchema.parse(req.body)
    const scoreResult = scoreMEDDPICC(data)
    // Normalise to 0–100
    const totalScore = scoreResult.totalPct

    const [record] = await db
      .insert(meddpiccRecords)
      .values({
        opportunityId: oppId,
        tenantId: req.tenantId,
        ...data,
        totalScore,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: meddpiccRecords.opportunityId,
        set: {
          ...data,
          totalScore,
          updatedAt: new Date(),
        },
      })
      .returning()

    // Update opportunities.meddpiccScore
    await db
      .update(opportunities)
      .set({ meddpiccScore: totalScore, updatedAt: new Date() })
      .where(and(eq(opportunities.id, oppId), eq(opportunities.tenantId, req.tenantId)))

    res.json({
      ...record,
      scoreResult: {
        totalPct: scoreResult.totalPct,
        isWarning: scoreResult.isWarning,
        elementScores: scoreResult.elementScores,
      },
    })
  }),
)

export { router as qualificationRouter }
