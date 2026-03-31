import { Router, type Request, type Response, type NextFunction } from 'express'
import { eq, and } from 'drizzle-orm'
import type { PgTableWithColumns, TableConfig } from 'drizzle-orm/pg-core'
import type { ZodSchema } from 'zod'
import { db } from '../config/db.js'
import { authenticate } from '../middleware/auth.js'
import { authorize } from '../middleware/rbac.js'
import { AppError } from '../middleware/errorHandler.js'
import { Action, Resource, ScopeFilter } from '@msas/shared'

type Table = PgTableWithColumns<TableConfig>
interface WithTenantId { tenantId: unknown }
interface WithId { id: unknown }
interface WithOwnerId { ownerId?: unknown }
interface WithTeamId { teamId?: unknown }

interface CrudOptions<T extends Table> {
  table: T
  resource: Resource
  createSchema: ZodSchema
  updateSchema: ZodSchema
  /** Override to add extra filters or joins on list queries */
  listQuery?: (tenantId: string, scopeFilter: ScopeFilter, userId: string, teamId: string | null) => Promise<unknown[]>
}

function wrap(fn: (req: Request, res: Response) => Promise<void>) {
  return (req: Request, res: Response, next: NextFunction) => fn(req, res).catch(next)
}

/**
 * Generic tenant-scoped CRUD router.
 * Reduces each simple resource to ~5 lines of registration code.
 */
export function createCrudRouter<T extends Table & WithTenantId & WithId & Partial<WithOwnerId & WithTeamId>>(
  opts: CrudOptions<T>,
): Router {
  const router = Router()
  const { table, resource, createSchema, updateSchema } = opts

  // GET /
  router.get('/', authenticate, authorize(Action.READ, resource), wrap(async (req, res) => {
    const scopeFilter = (req as Request & { scopeFilter: ScopeFilter }).scopeFilter
    let rows: unknown[]

    if (opts.listQuery) {
      rows = await opts.listQuery(req.tenantId, scopeFilter, req.user!.id, req.user!.teamId)
    } else {
      // Default: tenant-scoped only (TEAM/ALL handled identically without team joins)
      rows = await db.select().from(table).where(eq(table.tenantId as never, req.tenantId))
    }

    res.json(rows)
  }))

  // GET /:id
  router.get('/:id', authenticate, authorize(Action.READ, resource), wrap(async (req, res) => {
    const [row] = await db.select().from(table)
      .where(and(eq(table.id as never, req.params['id']), eq(table.tenantId as never, req.tenantId)))
      .limit(1)

    if (!row) throw new AppError(404, 'Not found')
    res.json(row)
  }))

  // POST /
  router.post('/', authenticate, authorize(Action.CREATE, resource), wrap(async (req, res) => {
    const data = createSchema.parse(req.body)
    const [created] = await db.insert(table).values({ ...data, tenantId: req.tenantId } as never).returning()
    res.status(201).json(created)
  }))

  // PATCH /:id
  router.patch('/:id', authenticate, authorize(Action.UPDATE, resource), wrap(async (req, res) => {
    const data = updateSchema.parse(req.body)
    const [updated] = await db.update(table)
      .set({ ...data, updatedAt: new Date() } as never)
      .where(and(eq(table.id as never, req.params['id']), eq(table.tenantId as never, req.tenantId)))
      .returning()

    if (!updated) throw new AppError(404, 'Not found')
    res.json(updated)
  }))

  // DELETE /:id
  router.delete('/:id', authenticate, authorize(Action.DELETE, resource), wrap(async (req, res) => {
    const [deleted] = await db.delete(table)
      .where(and(eq(table.id as never, req.params['id']), eq(table.tenantId as never, req.tenantId)))
      .returning()

    if (!deleted) throw new AppError(404, 'Not found')
    res.status(204).send()
  }))

  return router
}
