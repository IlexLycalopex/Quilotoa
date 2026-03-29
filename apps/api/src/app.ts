import express from 'express'
import helmet from 'helmet'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import { rateLimit } from 'express-rate-limit'
import { env } from './config/env.js'
import { tenantContext } from './middleware/tenantContext.js'
import { errorHandler } from './middleware/errorHandler.js'
import { logger } from './config/logger.js'

export function createApp() {
  const app = express()

  // ── Security ──────────────────────────────────────────────────────────────
  app.use(helmet())
  app.use(cors({
    origin: env.CORS_ORIGIN,
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Tenant-Slug'],
  }))
  app.use(rateLimit({
    windowMs: 15 * 60 * 1000, // 15 min
    max: 500,
    standardHeaders: true,
    legacyHeaders: false,
  }))

  // ── Parsing ───────────────────────────────────────────────────────────────
  app.use(express.json({ limit: '1mb' }))
  app.use(express.urlencoded({ extended: false }))
  app.use(cookieParser())

  // ── Health ────────────────────────────────────────────────────────────────
  app.get('/health', (_req, res) => res.json({ status: 'ok', ts: new Date().toISOString() }))

  // ── API routes (all tenant-scoped) ────────────────────────────────────────
  const api = express.Router()
  api.use(tenantContext)

  // Lazy-load routers to allow modules to reference db/env after startup
  api.use('/auth',    (req, res, next) => import('./modules/auth/auth.router.js').then(m => m.authRouter(req, res, next)))
  api.use('/tenants', (req, res, next) => import('./modules/tenants/tenants.router.js').then(m => m.tenantsRouter(req, res, next)))
  api.use('/users',          (req, res, next) => import('./modules/users/users.router.js').then(m => m.usersRouter(req, res, next)))
  api.use('/organisations',  (req, res, next) => import('./modules/organisations/organisations.router.js').then(m => m.organisationsRouter(req, res, next)))
  api.use('/opportunities',  (req, res, next) => import('./modules/opportunities/opportunities.router.js').then(m => m.opportunitiesRouter(req, res, next)))

  // Sub-routes nested under opportunity (use mergeParams via Router({ mergeParams: true }) in each sub-router)
  api.use('/opportunities/:oppId/qualification', (req, res, next) => import('./modules/qualification/qualification.router.js').then(m => m.qualificationRouter(req, res, next)))
  api.use('/opportunities/:oppId/discovery',     (req, res, next) => import('./modules/discovery/discovery.router.js').then(m => m.discoveryRouter(req, res, next)))
  api.use('/opportunities/:oppId/financial-model',(req, res, next) => import('./modules/financial/financial.router.js').then(m => m.financialRouter(req, res, next)))
  api.use('/opportunities/:oppId/proposals',     (req, res, next) => import('./modules/proposals/proposals.router.js').then(m => m.proposalsRouter(req, res, next)))

  app.use('/api/v1', api)

  // ── Error handler (must be last) ─────────────────────────────────────────
  app.use(errorHandler)

  return app
}

// Log startup info
export function logStartup(port: number) {
  logger.info(`MSAS API running on http://localhost:${port}`)
  logger.info(`Environment: ${env.NODE_ENV}`)
}
