import { Router, type Request, type Response, type NextFunction } from 'express'
import { eq, and, max } from 'drizzle-orm'
import fs from 'node:fs'
import fsp from 'node:fs/promises'
import path from 'node:path'
import { db } from '../../config/db.js'
import {
  proposals,
  opportunities,
  bantRecords,
  meddpiccRecords,
  discoveryDatasets,
  financialModels,
  organisations,
  users,
  tenants,
} from '../../db/schema.js'
import { authenticate } from '../../middleware/auth.js'
import { authorize } from '../../middleware/rbac.js'
import { AppError } from '../../middleware/errorHandler.js'
import { env } from '../../config/env.js'
import { generatePdf } from '../../lib/pdf/index.js'
import {
  DocumentType,
  Action,
  Resource,
  type TenantConfig,
} from '@msas/shared'

const router: Router = Router({ mergeParams: true })

function wrap(fn: (req: Request, res: Response) => Promise<void>) {
  return (req: Request, res: Response, next: NextFunction) => fn(req, res).catch(next)
}

// ─── Helper: verify opportunity belongs to tenant ─────────────────────────────

async function verifyOpportunity(oppId: string, tenantId: string) {
  const [opp] = await db
    .select({ id: opportunities.id, stage: opportunities.stage })
    .from(opportunities)
    .where(and(eq(opportunities.id, oppId), eq(opportunities.tenantId, tenantId)))
    .limit(1)

  if (!opp) {
    throw new AppError(404, 'Opportunity not found')
  }

  return opp
}

// ─── GET / — list proposals for opportunity ───────────────────────────────────

router.get(
  '/',
  authenticate,
  authorize(Action.READ, Resource.PROPOSAL),
  wrap(async (req, res) => {
    const { oppId } = req.params as { oppId: string }
    await verifyOpportunity(oppId, req.tenantId)

    const rows = await db
      .select()
      .from(proposals)
      .where(and(eq(proposals.opportunityId, oppId), eq(proposals.tenantId, req.tenantId)))

    res.json(rows)
  }),
)

// ─── POST / — generate a PDF proposal ────────────────────────────────────────

router.post(
  '/',
  authenticate,
  authorize(Action.CREATE, Resource.PROPOSAL),
  wrap(async (req, res) => {
    const { oppId } = req.params as { oppId: string }
    await verifyOpportunity(oppId, req.tenantId)

    // Validate documentType
    const { documentType } = req.body as { documentType?: unknown }
    if (!documentType || !Object.values(DocumentType).includes(documentType as DocumentType)) {
      throw new AppError(422, `documentType must be one of: ${Object.values(DocumentType).join(', ')}`)
    }

    const docType = documentType as DocumentType

    // Load all related data
    const [opp] = await db
      .select()
      .from(opportunities)
      .where(and(eq(opportunities.id, oppId), eq(opportunities.tenantId, req.tenantId)))
      .limit(1)

    if (!opp) throw new AppError(404, 'Opportunity not found')

    const [bantRecord] = await db
      .select()
      .from(bantRecords)
      .where(and(eq(bantRecords.opportunityId, oppId), eq(bantRecords.tenantId, req.tenantId)))
      .limit(1)

    const [meddpiccRecord] = await db
      .select()
      .from(meddpiccRecords)
      .where(
        and(
          eq(meddpiccRecords.opportunityId, oppId),
          eq(meddpiccRecords.tenantId, req.tenantId),
        ),
      )
      .limit(1)

    const [discoveryDataset] = await db
      .select()
      .from(discoveryDatasets)
      .where(
        and(
          eq(discoveryDatasets.opportunityId, oppId),
          eq(discoveryDatasets.tenantId, req.tenantId),
        ),
      )
      .limit(1)

    const [financialModel] = await db
      .select()
      .from(financialModels)
      .where(
        and(
          eq(financialModels.opportunityId, oppId),
          eq(financialModels.tenantId, req.tenantId),
        ),
      )
      .limit(1)

    const [org] = await db
      .select()
      .from(organisations)
      .where(and(eq(organisations.id, opp.orgId), eq(organisations.tenantId, req.tenantId)))
      .limit(1)

    const [owner] = await db
      .select({ id: users.id, email: users.email, fullName: users.fullName, role: users.role })
      .from(users)
      .where(and(eq(users.id, opp.ownerId), eq(users.tenantId, req.tenantId)))
      .limit(1)

    const [tenant] = await db
      .select()
      .from(tenants)
      .where(eq(tenants.id, req.tenantId))
      .limit(1)

    if (!tenant) throw new AppError(500, 'Tenant not found')

    // Determine next version number
    const [maxVersionRow] = await db
      .select({ maxVersion: max(proposals.version) })
      .from(proposals)
      .where(
        and(
          eq(proposals.opportunityId, oppId),
          eq(proposals.documentType, docType),
        ),
      )

    const version = (maxVersionRow?.maxVersion ?? 0) + 1

    // Build snapshot data
    const snapshotData: Record<string, unknown> = {
      opportunity: opp,
      bantRecord: bantRecord ?? null,
      meddpiccRecord: meddpiccRecord ?? null,
      discoveryDataset: discoveryDataset ?? null,
      financialModel: financialModel ?? null,
      org: org ?? null,
      owner: owner ?? null,
    }

    // Resolve tenant config
    const tenantConfig = (tenant.config as TenantConfig) ?? {}

    // Generate PDF buffer
    const pdfBuffer = await generatePdf(docType, snapshotData, tenantConfig)

    // Save PDF to disk
    const storageBase = env.STORAGE_LOCAL_PATH
    const pdfDir = path.join(storageBase, req.tenantId, oppId)
    await fsp.mkdir(pdfDir, { recursive: true })

    const filename = `${docType}_v${version}.pdf`
    const pdfPath = path.join(pdfDir, filename)
    await fsp.writeFile(pdfPath, pdfBuffer)

    // Insert proposals record
    const [proposal] = await db
      .insert(proposals)
      .values({
        opportunityId: oppId,
        tenantId: req.tenantId,
        documentType: docType,
        version,
        pdfPath,
        snapshotData,
        createdBy: req.user!.id,
        updatedAt: new Date(),
      })
      .returning()

    res.status(201).json(proposal)
  }),
)

// ─── GET /:proposalId/download — stream PDF ────────────────────────────────────

router.get(
  '/:proposalId/download',
  authenticate,
  authorize(Action.READ, Resource.PROPOSAL),
  wrap(async (req, res) => {
    const { oppId, proposalId } = req.params as { oppId: string; proposalId: string }
    await verifyOpportunity(oppId, req.tenantId)

    const [proposal] = await db
      .select()
      .from(proposals)
      .where(
        and(
          eq(proposals.id, proposalId),
          eq(proposals.opportunityId, oppId),
          eq(proposals.tenantId, req.tenantId),
        ),
      )
      .limit(1)

    if (!proposal) {
      throw new AppError(404, 'Proposal not found')
    }

    if (!proposal.pdfPath) {
      throw new AppError(404, 'PDF file not available')
    }

    const pdfPath = proposal.pdfPath

    try {
      await fsp.access(pdfPath, fs.constants.R_OK)
    } catch {
      throw new AppError(404, 'PDF file not found on disk')
    }

    const filename = path.basename(pdfPath)
    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)

    const stream = fs.createReadStream(pdfPath)
    stream.on('error', () => {
      if (!res.headersSent) {
        res.status(500).json({ error: 'Failed to stream PDF' })
      }
    })
    stream.pipe(res)
  }),
)

export { router as proposalsRouter }
