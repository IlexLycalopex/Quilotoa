import type { Request, Response, NextFunction } from 'express'
import { jwtVerify } from 'jose'
import { eq, and } from 'drizzle-orm'
import { db } from '../config/db.js'
import { users } from '../db/schema.js'
import { env } from '../config/env.js'
import type { Role } from '@msas/shared'

export interface AuthUser {
  id: string
  email: string
  fullName: string
  role: Role
  teamId: string | null
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser
    }
  }
}

const secret = new TextEncoder().encode(env.JWT_SECRET)

export async function authenticate(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing or invalid Authorization header' })
    return
  }

  try {
    const token = header.slice(7)
    const { payload } = await jwtVerify(token, secret)

    // Validate user still exists and is active in this tenant
    const [user] = await db
      .select({ id: users.id, email: users.email, fullName: users.fullName, role: users.role, teamId: users.teamId })
      .from(users)
      .where(and(eq(users.id, payload.sub as string), eq(users.tenantId, req.tenantId), eq(users.isActive, true)))
      .limit(1)

    if (!user) {
      res.status(401).json({ error: 'User not found or inactive' })
      return
    }

    req.user = user as AuthUser
    next()
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' })
  }
}
