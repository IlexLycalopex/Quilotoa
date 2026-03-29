import { Router, type Request, type Response, type NextFunction } from 'express'
import { eq } from 'drizzle-orm'
import { db } from '../../config/db.js'
import { tenants } from '../../db/schema.js'
import { authenticate } from '../../middleware/auth.js'
import { requireRole } from '../../middleware/rbac.js'
import { AppError } from '../../middleware/errorHandler.js'
import { UpdateTenantSchema, Role } from '@msas/shared'

const router = Router()

function wrap(fn: (req: Request, res: Response) => Promise<void>) {
  return (req: Request, res: Response, next: NextFunction) => fn(req, res).catch(next)
}

// GET /current — returns current tenant (accessible to all authenticated users for config reads)
router.get('/current', authenticate, wrap(async (req, res) => {
  const [tenant] = await db.select().from(tenants).where(eq(tenants.id, req.tenantId)).limit(1)
  if (!tenant) throw new AppError(404, 'Tenant not found')
  // Strip sensitive fields if needed — config is safe to return
  res.json(tenant)
}))

// PATCH /:id — ADMIN only
router.patch('/:id', authenticate, requireRole(Role.ADMIN), wrap(async (req, res) => {
  const data = UpdateTenantSchema.parse(req.body)

  const [updated] = await db.update(tenants)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(tenants.id, req.params['id']!))
    .returning()

  if (!updated) throw new AppError(404, 'Tenant not found')
  res.json(updated)
}))

export { router as tenantsRouter }
