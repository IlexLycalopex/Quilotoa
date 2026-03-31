import { Router, type Request, type Response, type NextFunction } from 'express'
import { eq, and } from 'drizzle-orm'
import { db } from '../../config/db.js'
import { organisations } from '../../db/schema.js'
import { createCrudRouter } from '../../lib/crud.js'
import { authenticate } from '../../middleware/auth.js'
import { authorize } from '../../middleware/rbac.js'
import { AppError } from '../../middleware/errorHandler.js'
import {
  Action,
  Resource,
  ScopeFilter,
  CreateOrganisationSchema,
  UpdateOrganisationSchema,
} from '@msas/shared'

// ─── Scope-aware list query ───────────────────────────────────────────────────

async function listOrganisations(
  tenantId: string,
  scopeFilter: ScopeFilter,
  userId: string,
  _teamId: string | null,
): Promise<unknown[]> {
  if (scopeFilter === ScopeFilter.OWN) {
    return db
      .select()
      .from(organisations)
      .where(and(eq(organisations.tenantId, tenantId), eq(organisations.createdBy, userId)))
  }

  // TEAM and ALL: return all in tenant
  return db
    .select()
    .from(organisations)
    .where(eq(organisations.tenantId, tenantId))
}

function wrap(fn: (req: Request, res: Response) => Promise<void>) {
  return (req: Request, res: Response, next: NextFunction) => fn(req, res).catch(next)
}

// ─── Router ───────────────────────────────────────────────────────────────────

const router: Router = Router()

// GET / — scoped list
router.get('/', authenticate, authorize(Action.READ, Resource.ORGANISATION), wrap(async (req, res) => {
  const scopeFilter = (req as Request & { scopeFilter: ScopeFilter }).scopeFilter
  const rows = await listOrganisations(req.tenantId, scopeFilter, req.user!.id, req.user!.teamId)
  res.json(rows)
}))

// GET /:id
router.get('/:id', authenticate, authorize(Action.READ, Resource.ORGANISATION), wrap(async (req, res) => {
  const [row] = await db
    .select()
    .from(organisations)
    .where(and(eq(organisations.id, req.params['id'] as string), eq(organisations.tenantId, req.tenantId)))
    .limit(1)

  if (!row) throw new AppError(404, 'Organisation not found')
  res.json(row)
}))

// POST / — inject createdBy from req.user
router.post('/', authenticate, authorize(Action.CREATE, Resource.ORGANISATION), wrap(async (req, res) => {
  const data = CreateOrganisationSchema.parse(req.body)

  const [created] = await db
    .insert(organisations)
    .values({ ...data, tenantId: req.tenantId, createdBy: req.user!.id })
    .returning()

  res.status(201).json(created)
}))

// PATCH /:id
router.patch('/:id', authenticate, authorize(Action.UPDATE, Resource.ORGANISATION), wrap(async (req, res) => {
  const data = UpdateOrganisationSchema.parse(req.body)

  const [updated] = await db
    .update(organisations)
    .set({ ...data, updatedAt: new Date() })
    .where(and(eq(organisations.id, req.params['id'] as string), eq(organisations.tenantId, req.tenantId)))
    .returning()

  if (!updated) throw new AppError(404, 'Organisation not found')
  res.json(updated)
}))

// DELETE /:id
router.delete('/:id', authenticate, authorize(Action.DELETE, Resource.ORGANISATION), wrap(async (req, res) => {
  const [deleted] = await db
    .delete(organisations)
    .where(and(eq(organisations.id, req.params['id'] as string), eq(organisations.tenantId, req.tenantId)))
    .returning({ id: organisations.id })

  if (!deleted) throw new AppError(404, 'Organisation not found')
  res.status(204).send()
}))

export { router as organisationsRouter }
