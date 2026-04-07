import { Router, type Request, type Response, type NextFunction } from 'express'
import { eq, and, or } from 'drizzle-orm'
import bcrypt from 'bcrypt'
import { db } from '../../config/db.js'
import { users } from '../../db/schema.js'
import { authenticate } from '../../middleware/auth.js'
import { authorize } from '../../middleware/rbac.js'
import { AppError } from '../../middleware/errorHandler.js'
import {
  Action,
  Resource,
  ScopeFilter,
  CreateUserSchema,
  UpdateUserSchema,
} from '@msas/shared'

// ─── Custom list query with scope-aware filtering ─────────────────────────────

async function listUsers(
  tenantId: string,
  scopeFilter: ScopeFilter,
  userId: string,
  teamId: string | null,
): Promise<unknown[]> {
  const baseSelect = {
    id:       users.id,
    email:    users.email,
    fullName: users.fullName,
    role:     users.role,
    teamId:   users.teamId,
    isActive: users.isActive,
    createdAt: users.createdAt,
    updatedAt: users.updatedAt,
  }

  if (scopeFilter === ScopeFilter.OWN) {
    return db
      .select(baseSelect)
      .from(users)
      .where(and(eq(users.tenantId, tenantId), eq(users.id, userId)))
  }

  if (scopeFilter === ScopeFilter.TEAM) {
    if (teamId) {
      return db
        .select(baseSelect)
        .from(users)
        .where(
          and(
            eq(users.tenantId, tenantId),
            or(eq(users.teamId, teamId), eq(users.id, userId)),
          ),
        )
    }
    // No team — fall back to own record only
    return db
      .select(baseSelect)
      .from(users)
      .where(and(eq(users.tenantId, tenantId), eq(users.id, userId)))
  }

  // ALL
  return db
    .select(baseSelect)
    .from(users)
    .where(eq(users.tenantId, tenantId))
}

const router: Router = Router()

function wrap(fn: (req: Request, res: Response) => Promise<void>) {
  return (req: Request, res: Response, next: NextFunction) => fn(req, res).catch(next)
}

// GET /me — must be registered before /:id to avoid param capture
router.get('/me', authenticate, wrap(async (req, res) => {
  res.json(req.user)
}))

// PATCH /me — update own fullName only
router.patch('/me', authenticate, wrap(async (req, res) => {
  const { fullName } = req.body as { fullName?: unknown }
  if (typeof fullName !== 'string' || fullName.trim().length === 0) {
    throw new AppError(422, 'fullName must be a non-empty string')
  }

  const [updated] = await db
    .update(users)
    .set({ fullName: fullName.trim(), updatedAt: new Date() })
    .where(and(eq(users.id, req.user!.id), eq(users.tenantId, req.tenantId)))
    .returning({
      id:       users.id,
      email:    users.email,
      fullName: users.fullName,
      role:     users.role,
      teamId:   users.teamId,
      isActive: users.isActive,
      updatedAt: users.updatedAt,
    })

  if (!updated) throw new AppError(404, 'User not found')
  res.json(updated)
}))

// GET / — delegate to crudRouter (uses custom listQuery above)
router.get('/', authenticate, authorize(Action.READ, Resource.USER), wrap(async (req, res) => {
  const scopeFilter = (req as Request & { scopeFilter: ScopeFilter }).scopeFilter
  const rows = await listUsers(req.tenantId, scopeFilter, req.user!.id, req.user!.teamId)
  res.json(rows)
}))

// GET /:id — delegate to crudRouter (no password in select)
router.get('/:id', authenticate, authorize(Action.READ, Resource.USER), wrap(async (req, res) => {
  const [row] = await db
    .select({
      id:       users.id,
      email:    users.email,
      fullName: users.fullName,
      role:     users.role,
      teamId:   users.teamId,
      isActive: users.isActive,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt,
    })
    .from(users)
    .where(and(eq(users.id, req.params['id'] as string), eq(users.tenantId, req.tenantId)))
    .limit(1)

  if (!row) throw new AppError(404, 'User not found')
  res.json(row)
}))

// POST / — hash password before insert, strip password_hash from response
router.post('/', authenticate, authorize(Action.CREATE, Resource.USER), wrap(async (req, res) => {
  const data = CreateUserSchema.parse(req.body)
  const { password, ...rest } = data

  const passwordHash = await bcrypt.hash(password, 12)

  const [created] = await db
    .insert(users)
    .values({ ...rest, passwordHash, tenantId: req.tenantId })
    .returning({
      id:       users.id,
      email:    users.email,
      fullName: users.fullName,
      role:     users.role,
      teamId:   users.teamId,
      isActive: users.isActive,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt,
    })

  res.status(201).json(created)
}))

// PATCH /:id — update, no password in response
router.patch('/:id', authenticate, authorize(Action.UPDATE, Resource.USER), wrap(async (req, res) => {
  const data = UpdateUserSchema.parse(req.body)

  const [updated] = await db
    .update(users)
    .set({ ...data, updatedAt: new Date() })
    .where(and(eq(users.id, req.params['id'] as string), eq(users.tenantId, req.tenantId)))
    .returning({
      id:       users.id,
      email:    users.email,
      fullName: users.fullName,
      role:     users.role,
      teamId:   users.teamId,
      isActive: users.isActive,
      updatedAt: users.updatedAt,
    })

  if (!updated) throw new AppError(404, 'User not found')
  res.json(updated)
}))

// DELETE /:id — delegate to crudRouter behaviour
router.delete('/:id', authenticate, authorize(Action.DELETE, Resource.USER), wrap(async (req, res) => {
  const [deleted] = await db
    .delete(users)
    .where(and(eq(users.id, req.params['id'] as string), eq(users.tenantId, req.tenantId)))
    .returning({ id: users.id })

  if (!deleted) throw new AppError(404, 'User not found')
  res.status(204).send()
}))

export { router as usersRouter }
