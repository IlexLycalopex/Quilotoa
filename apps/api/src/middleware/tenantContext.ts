import type { Request, Response, NextFunction } from 'express'
import { eq } from 'drizzle-orm'
import { db } from '../config/db.js'
import { tenants } from '../db/schema.js'
import type { TenantConfig } from '@msas/shared'

export interface TenantContext {
  id: string
  slug: string
  name: string
  config: TenantConfig
}

declare global {
  namespace Express {
    interface Request {
      tenant: TenantContext
      tenantId: string
    }
  }
}

export async function tenantContext(req: Request, res: Response, next: NextFunction) {
  const slug = (req.headers['x-tenant-slug'] as string | undefined)?.toLowerCase()
  if (!slug) {
    res.status(400).json({ error: 'X-Tenant-Slug header is required' })
    return
  }

  const [tenant] = await db.select().from(tenants).where(eq(tenants.slug, slug)).limit(1)
  if (!tenant) {
    res.status(404).json({ error: 'Tenant not found' })
    return
  }

  req.tenant = tenant as TenantContext
  req.tenantId = tenant.id
  next()
}
