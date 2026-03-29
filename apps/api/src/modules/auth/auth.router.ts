import { Router, type Request, type Response, type NextFunction } from 'express'
import { SignJWT, jwtVerify } from 'jose'
import bcrypt from 'bcrypt'
import { eq, and } from 'drizzle-orm'
import { db } from '../../config/db.js'
import { users } from '../../db/schema.js'
import { env } from '../../config/env.js'
import { LoginSchema } from '@msas/shared'
import { AppError } from '../../middleware/errorHandler.js'
import { logger } from '../../config/logger.js'
import { tenantContext } from '../../middleware/tenantContext.js'

const router = Router()

const secret = new TextEncoder().encode(env.JWT_SECRET)

const COOKIE_NAME = 'msas_refresh'
const COOKIE_OPTS = {
  httpOnly: true,
  sameSite: 'strict' as const,
  secure: env.NODE_ENV === 'production',
  path: '/',
}

function wrap(fn: (req: Request, res: Response) => Promise<void>) {
  return (req: Request, res: Response, next: NextFunction) => fn(req, res).catch(next)
}

// ─── POST /login ─────────────────────────────────────────────────────────────

router.post('/login', tenantContext, wrap(async (req, res) => {
  const { email, password } = LoginSchema.parse(req.body)

  const [user] = await db
    .select()
    .from(users)
    .where(
      and(
        eq(users.email, email),
        eq(users.tenantId, req.tenantId),
        eq(users.isActive, true),
      ),
    )
    .limit(1)

  if (!user) {
    throw new AppError(401, 'Invalid credentials')
  }

  const passwordValid = await bcrypt.compare(password, user.passwordHash)
  if (!passwordValid) {
    logger.warn({ userId: user.id, tenantId: req.tenantId }, 'Failed login attempt')
    throw new AppError(401, 'Invalid credentials')
  }

  const now = Math.floor(Date.now() / 1000)

  const accessToken = await new SignJWT({ role: user.role, tenantId: req.tenantId })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(user.id)
    .setIssuedAt(now)
    .setExpirationTime('15m')
    .sign(secret)

  const refreshToken = await new SignJWT({ role: user.role, tenantId: req.tenantId })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(user.id)
    .setIssuedAt(now)
    .setExpirationTime('7d')
    .sign(secret)

  res.cookie(COOKIE_NAME, refreshToken, {
    ...COOKIE_OPTS,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
  })

  logger.info({ userId: user.id, tenantId: req.tenantId }, 'User logged in')

  res.json({
    accessToken,
    user: {
      id:       user.id,
      email:    user.email,
      fullName: user.fullName,
      role:     user.role,
    },
  })
}))

// ─── POST /refresh ────────────────────────────────────────────────────────────

router.post('/refresh', tenantContext, wrap(async (req, res) => {
  const token: string | undefined = req.cookies?.[COOKIE_NAME]
  if (!token) {
    throw new AppError(401, 'Missing refresh token')
  }

  let payload: { sub?: string; role?: unknown; tenantId?: unknown }
  try {
    const result = await jwtVerify(token, secret)
    payload = result.payload as typeof payload
  } catch {
    throw new AppError(401, 'Invalid or expired refresh token')
  }

  if (!payload.sub) {
    throw new AppError(401, 'Malformed token')
  }

  const [user] = await db
    .select({ id: users.id, email: users.email, fullName: users.fullName, role: users.role, teamId: users.teamId })
    .from(users)
    .where(
      and(
        eq(users.id, payload.sub),
        eq(users.tenantId, req.tenantId),
        eq(users.isActive, true),
      ),
    )
    .limit(1)

  if (!user) {
    throw new AppError(401, 'User not found or inactive')
  }

  const accessToken = await new SignJWT({ role: user.role, tenantId: req.tenantId })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(user.id)
    .setIssuedAt(Math.floor(Date.now() / 1000))
    .setExpirationTime('15m')
    .sign(secret)

  res.json({ accessToken })
}))

// ─── POST /logout ─────────────────────────────────────────────────────────────

router.post('/logout', wrap(async (req, res) => {
  res.clearCookie(COOKIE_NAME, { ...COOKIE_OPTS })
  res.status(204).send()
}))

export { router as authRouter }
