import { Router, type Request, type Response, type NextFunction } from 'express'
import { eq, and } from 'drizzle-orm'
import { db } from '../../config/db.js'
import { discoveryDatasets, opportunities } from '../../db/schema.js'
import { authenticate } from '../../middleware/auth.js'
import { authorize } from '../../middleware/rbac.js'
import { AppError } from '../../middleware/errorHandler.js'
import {
  DiscoveryDatasetSchema,
  recommendSolution,
  Action,
  Resource,
} from '@msas/shared'

const router: Router = Router({ mergeParams: true })

function wrap(fn: (req: Request, res: Response) => Promise<void>) {
  return (req: Request, res: Response, next: NextFunction) => fn(req, res).catch(next)
}

// ─── Helper: verify opportunity belongs to tenant ─────────────────────────────

async function verifyOpportunity(oppId: string, tenantId: string) {
  const [opp] = await db
    .select({ id: opportunities.id, stage: opportunities.stage, solution: opportunities.solution })
    .from(opportunities)
    .where(and(eq(opportunities.id, oppId), eq(opportunities.tenantId, tenantId)))
    .limit(1)

  if (!opp) {
    throw new AppError(404, 'Opportunity not found')
  }

  return opp
}

// ─── GET / ────────────────────────────────────────────────────────────────────

router.get(
  '/',
  authenticate,
  authorize(Action.UPDATE, Resource.DISCOVERY),
  wrap(async (req, res) => {
    const { oppId } = req.params as { oppId: string }
    await verifyOpportunity(oppId, req.tenantId)

    const [dataset] = await db
      .select()
      .from(discoveryDatasets)
      .where(
        and(
          eq(discoveryDatasets.opportunityId, oppId),
          eq(discoveryDatasets.tenantId, req.tenantId),
        ),
      )
      .limit(1)

    if (!dataset) {
      throw new AppError(404, 'Discovery dataset not found')
    }

    res.json(dataset)
  }),
)

// ─── PUT / ────────────────────────────────────────────────────────────────────

router.put(
  '/',
  authenticate,
  authorize(Action.UPDATE, Resource.DISCOVERY),
  wrap(async (req, res) => {
    const { oppId } = req.params as { oppId: string }
    await verifyOpportunity(oppId, req.tenantId)

    const data = DiscoveryDatasetSchema.parse(req.body)

    const recommendation = recommendSolution(data)
    const solutionRecommended = recommendation?.solution ?? null

    // Compute completionPct: count keys with non-null / non-undefined values
    // out of ~30 expected optional discovery fields
    const EXPECTED_FIELD_COUNT = 30
    const nonNullCount = Object.values(data).filter(
      (v) => v !== null && v !== undefined,
    ).length
    const completionPct = Math.min(100, Math.round((nonNullCount / EXPECTED_FIELD_COUNT) * 100))

    const [dataset] = await db
      .insert(discoveryDatasets)
      .values({
        opportunityId: oppId,
        tenantId: req.tenantId,
        ...data,
        solutionRecommended,
        completionPct,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: discoveryDatasets.opportunityId,
        set: {
          ...data,
          solutionRecommended,
          completionPct,
          updatedAt: new Date(),
        },
      })
      .returning()

    // If solutionConfirmed=true, update opportunities.solution to the stored recommendation
    if (data.solutionConfirmed && solutionRecommended) {
      await db
        .update(opportunities)
        .set({ solution: solutionRecommended, updatedAt: new Date() })
        .where(and(eq(opportunities.id, oppId), eq(opportunities.tenantId, req.tenantId)))
    }

    res.json({
      ...dataset,
      recommendation,
    })
  }),
)

export { router as discoveryRouter }
