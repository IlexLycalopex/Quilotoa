import { Router, type Request, type Response, type NextFunction } from 'express'
import { eq, and } from 'drizzle-orm'
import { db } from '../../config/db.js'
import {
  opportunities,
  organisations,
  users,
  bantRecords,
  meddpiccRecords,
  discoveryDatasets,
  financialModels,
} from '../../db/schema.js'
import { authenticate } from '../../middleware/auth.js'
import { authorize } from '../../middleware/rbac.js'
import { AppError } from '../../middleware/errorHandler.js'
import { logger } from '../../config/logger.js'
import {
  Action,
  Resource,
  ScopeFilter,
  Stage,
  Role,
  STAGE_ORDER,
  CreateOpportunitySchema,
  UpdateOpportunitySchema,
} from '@msas/shared'

const router: Router = Router()

function wrap(fn: (req: Request, res: Response) => Promise<void>) {
  return (req: Request, res: Response, next: NextFunction) => fn(req, res).catch(next)
}

// ─── GET / — List opportunities ───────────────────────────────────────────────

router.get(
  '/',
  authenticate,
  authorize(Action.READ, Resource.OPPORTUNITY),
  wrap(async (req, res) => {
    const scopeFilter = (req as Request & { scopeFilter: ScopeFilter }).scopeFilter
    const { id: userId, teamId } = req.user!
    const tenantId = req.tenantId

    // Alias columns for the join
    const ownerUsers = db
      .select({
        id:       users.id,
        fullName: users.fullName,
        teamId:   users.teamId,
      })
      .from(users)
      .as('owner')

    // Build the base query with joins
    const baseQuery = db
      .select({
        id:            opportunities.id,
        name:          opportunities.name,
        stage:         opportunities.stage,
        solution:      opportunities.solution,
        meddpiccScore: opportunities.meddpiccScore,
        bantPass:      opportunities.bantPass,
        createdAt:     opportunities.createdAt,
        orgId:         organisations.id,
        orgName:       organisations.name,
        ownerId:       users.id,
        ownerFullName: users.fullName,
      })
      .from(opportunities)
      .innerJoin(organisations, eq(opportunities.orgId, organisations.id))
      .innerJoin(users, eq(opportunities.ownerId, users.id))

    let rows: {
      id: string
      name: string
      stage: string | null
      solution: string | null
      meddpiccScore: number | null
      bantPass: boolean | null
      createdAt: Date
      orgId: string
      orgName: string
      ownerId: string
      ownerFullName: string
    }[]

    if (scopeFilter === ScopeFilter.OWN) {
      rows = await baseQuery.where(
        and(
          eq(opportunities.tenantId, tenantId),
          eq(opportunities.ownerId, userId),
        ),
      )
    } else if (scopeFilter === ScopeFilter.TEAM) {
      // Filter where the opportunity owner is in the same team as the requester
      rows = await db
        .select({
          id:            opportunities.id,
          name:          opportunities.name,
          stage:         opportunities.stage,
          solution:      opportunities.solution,
          meddpiccScore: opportunities.meddpiccScore,
          bantPass:      opportunities.bantPass,
          createdAt:     opportunities.createdAt,
          orgId:         organisations.id,
          orgName:       organisations.name,
          ownerId:       users.id,
          ownerFullName: users.fullName,
        })
        .from(opportunities)
        .innerJoin(organisations, eq(opportunities.orgId, organisations.id))
        .innerJoin(users, eq(opportunities.ownerId, users.id))
        .where(
          and(
            eq(opportunities.tenantId, tenantId),
            teamId ? eq(users.teamId, teamId) : eq(opportunities.ownerId, userId),
          ),
        )
    } else {
      // ALL
      rows = await baseQuery.where(eq(opportunities.tenantId, tenantId))
    }

    const result = rows.map((r) => ({
      id:            r.id,
      name:          r.name,
      stage:         r.stage,
      solution:      r.solution,
      meddpiccScore: r.meddpiccScore,
      bantPass:      r.bantPass,
      createdAt:     r.createdAt,
      org:   { id: r.orgId,   name: r.orgName },
      owner: { id: r.ownerId, fullName: r.ownerFullName },
    }))

    res.json(result)
  }),
)

// ─── GET /:id — Full opportunity with related records ─────────────────────────

router.get(
  '/:id',
  authenticate,
  authorize(Action.READ, Resource.OPPORTUNITY),
  wrap(async (req, res) => {
    const tenantId = req.tenantId
    const { id: oppId } = req.params as { id: string }

    // Fetch the opportunity with org and owner
    const [opp] = await db
      .select({
        id:                     opportunities.id,
        name:                   opportunities.name,
        stage:                  opportunities.stage,
        solution:               opportunities.solution,
        solutionOverrideReason: opportunities.solutionOverrideReason,
        meddpiccScore:          opportunities.meddpiccScore,
        bantPass:               opportunities.bantPass,
        createdAt:              opportunities.createdAt,
        updatedAt:              opportunities.updatedAt,
        orgId:                  organisations.id,
        orgName:                organisations.name,
        orgSector:              organisations.sector,
        orgSizeBand:            organisations.sizeBand,
        ownerId:                users.id,
        ownerFullName:          users.fullName,
      })
      .from(opportunities)
      .innerJoin(organisations, eq(opportunities.orgId, organisations.id))
      .innerJoin(users, eq(opportunities.ownerId, users.id))
      .where(and(eq(opportunities.id, oppId), eq(opportunities.tenantId, tenantId)))
      .limit(1)

    if (!opp) throw new AppError(404, 'Opportunity not found')

    // Fetch related records in parallel
    const [bantRecord, meddpiccRecord, discoveryDataset, financialModel] = await Promise.all([
      db
        .select()
        .from(bantRecords)
        .where(eq(bantRecords.opportunityId, oppId))
        .limit(1)
        .then((r) => r[0] ?? null),
      db
        .select()
        .from(meddpiccRecords)
        .where(eq(meddpiccRecords.opportunityId, oppId))
        .limit(1)
        .then((r) => r[0] ?? null),
      db
        .select({
          id:              discoveryDatasets.id,
          opportunityId:   discoveryDatasets.opportunityId,
          completionPct:   discoveryDatasets.completionPct,
          solutionRecommended: discoveryDatasets.solutionRecommended,
          solutionConfirmed:   discoveryDatasets.solutionConfirmed,
          updatedAt:       discoveryDatasets.updatedAt,
        })
        .from(discoveryDatasets)
        .where(eq(discoveryDatasets.opportunityId, oppId))
        .limit(1)
        .then((r) => r[0] ?? null),
      db
        .select({
          id:              financialModels.id,
          opportunityId:   financialModels.opportunityId,
          coiTotalAnnual:  financialModels.coiTotalAnnual,
          roiPaybackMonths: financialModels.roiPaybackMonths,
          roi3yrPct:       financialModels.roi3yrPct,
          roiNpv:          financialModels.roiNpv,
          updatedAt:       financialModels.updatedAt,
        })
        .from(financialModels)
        .where(eq(financialModels.opportunityId, oppId))
        .limit(1)
        .then((r) => r[0] ?? null),
    ])

    res.json({
      id:                     opp.id,
      name:                   opp.name,
      stage:                  opp.stage,
      solution:               opp.solution,
      solutionOverrideReason: opp.solutionOverrideReason,
      meddpiccScore:          opp.meddpiccScore,
      bantPass:               opp.bantPass,
      createdAt:              opp.createdAt,
      updatedAt:              opp.updatedAt,
      org: {
        id:       opp.orgId,
        name:     opp.orgName,
        sector:   opp.orgSector,
        sizeBand: opp.orgSizeBand,
      },
      owner: {
        id:       opp.ownerId,
        fullName: opp.ownerFullName,
      },
      bantRecord,
      meddpiccRecord,
      discoveryDataset,
      financialModel,
    })
  }),
)

// ─── POST / — Create opportunity + companion records ──────────────────────────

router.post(
  '/',
  authenticate,
  authorize(Action.CREATE, Resource.OPPORTUNITY),
  wrap(async (req, res) => {
    const data = CreateOpportunitySchema.parse(req.body)
    const tenantId = req.tenantId
    const requestingUser = req.user!

    // Determine owner: DIRECTOR/ADMIN may override ownerId; others always own it
    const isElevated =
      requestingUser.role === Role.DIRECTOR || requestingUser.role === Role.ADMIN
    const ownerId = isElevated && data.ownerId ? data.ownerId : requestingUser.id

    // Verify org exists in tenant
    const [org] = await db
      .select({ id: organisations.id })
      .from(organisations)
      .where(and(eq(organisations.id, data.orgId), eq(organisations.tenantId, tenantId)))
      .limit(1)

    if (!org) throw new AppError(404, 'Organisation not found')

    // Create everything in a transaction
    const result = await db.transaction(async (tx) => {
      const [opp] = await tx
        .insert(opportunities)
        .values({
          tenantId,
          orgId:   data.orgId,
          name:    data.name,
          ownerId,
          stage:   Stage.QUALIFICATION,
        })
        .returning()

      if (!opp) throw new AppError(500, 'Failed to create opportunity')

      const oppId = opp.id

      // Create empty companion records
      await Promise.all([
        tx.insert(bantRecords).values({
          opportunityId:       oppId,
          tenantId,
          budgetStatus:        'UNKNOWN' as const,
          authorityIdentified: false,
          needStatement:       '',
          pass:                false,
        }),
        tx.insert(meddpiccRecords).values({
          opportunityId:           oppId,
          tenantId,
          metricsScore:            0,
          economicBuyerScore:      0,
          decisionCriteriaScore:   0,
          decisionProcessScore:    0,
          paperProcessScore:       0,
          painScore:               0,
          championScore:           0,
          competitionScore:        0,
          totalScore:              0,
        }),
        tx.insert(discoveryDatasets).values({
          opportunityId:  oppId,
          tenantId,
          completionPct:  0,
          solutionConfirmed: false,
        }),
        tx.insert(financialModels).values({
          opportunityId: oppId,
          tenantId,
        }),
      ])

      return opp
    })

    logger.info({ opportunityId: result.id, ownerId, tenantId }, 'Opportunity created')
    res.status(201).json(result)
  }),
)

// ─── PATCH /:id — Update opportunity ─────────────────────────────────────────

router.patch(
  '/:id',
  authenticate,
  authorize(Action.UPDATE, Resource.OPPORTUNITY),
  wrap(async (req, res) => {
    const scopeFilter = (req as Request & { scopeFilter: ScopeFilter }).scopeFilter
    const tenantId = req.tenantId
    const { id: oppId } = req.params as { id: string }
    const requestingUser = req.user!

    const data = UpdateOpportunitySchema.parse(req.body)

    // Fetch the existing opportunity
    const [existing] = await db
      .select()
      .from(opportunities)
      .where(and(eq(opportunities.id, oppId), eq(opportunities.tenantId, tenantId)))
      .limit(1)

    if (!existing) throw new AppError(404, 'Opportunity not found')

    // Enforce scope-based ownership check
    if (scopeFilter === ScopeFilter.OWN && existing.ownerId !== requestingUser.id) {
      throw new AppError(403, 'You do not own this opportunity')
    }

    if (scopeFilter === ScopeFilter.TEAM) {
      const [owner] = await db
        .select({ teamId: users.teamId })
        .from(users)
        .where(eq(users.id, existing.ownerId))
        .limit(1)

      const ownerTeamId = owner?.teamId ?? null
      const isInTeam =
        ownerTeamId !== null &&
        requestingUser.teamId !== null &&
        ownerTeamId === requestingUser.teamId
      const isSelf = existing.ownerId === requestingUser.id

      if (!isInTeam && !isSelf) {
        throw new AppError(403, 'Opportunity is outside your team scope')
      }
    }

    // Stage advancement validation — prevent regression unless ADMIN
    if (data.stage && data.stage !== existing.stage) {
      const isAdmin = requestingUser.role === Role.ADMIN
      const currentIdx = STAGE_ORDER.indexOf(existing.stage as Stage)
      const newIdx = STAGE_ORDER.indexOf(data.stage as Stage)

      if (newIdx < currentIdx && !isAdmin) {
        throw new AppError(
          400,
          `Stage regression from ${existing.stage} to ${data.stage} is not permitted`,
        )
      }
    }

    const [updated] = await db
      .update(opportunities)
      .set({ ...data, updatedAt: new Date() })
      .where(and(eq(opportunities.id, oppId), eq(opportunities.tenantId, tenantId)))
      .returning()

    if (!updated) throw new AppError(404, 'Opportunity not found')
    res.json(updated)
  }),
)

// ─── DELETE /:id — DIRECTOR/ADMIN only ───────────────────────────────────────

router.delete(
  '/:id',
  authenticate,
  authorize(Action.DELETE, Resource.OPPORTUNITY),
  wrap(async (req, res) => {
    const tenantId = req.tenantId
    const { id: oppId } = req.params as { id: string }

    const [deleted] = await db
      .delete(opportunities)
      .where(and(eq(opportunities.id, oppId), eq(opportunities.tenantId, tenantId)))
      .returning({ id: opportunities.id })

    if (!deleted) throw new AppError(404, 'Opportunity not found')

    logger.info({ opportunityId: oppId, tenantId, deletedBy: req.user!.id }, 'Opportunity deleted')
    res.status(204).send()
  }),
)

export { router as opportunitiesRouter }
