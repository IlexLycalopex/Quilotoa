import { z } from 'zod'
import { ProductionModel, MigrationScope, ItReadiness } from '../enums.js'

export const DiscoveryDatasetSchema = z.object({
  // 1. Organisation Profile
  currentErp: z.string().max(255).optional(),
  goLiveTarget: z.string().date().nullable().optional(),

  // 2. Financial Operations
  financeTeamSize: z.number().int().positive().optional(),
  monthEndDaysActual: z.number().min(0).max(60).optional(),
  multiEntity: z.boolean().optional(),
  multiCurrency: z.boolean().optional(),
  reportingRequirements: z.string().max(2000).optional(),

  // 3. Manufacturing (X3)
  productionModel: z.nativeEnum(ProductionModel).nullable().optional(),
  bomComplexity: z.string().max(50).nullable().optional(),
  mrpUsed: z.boolean().nullable().optional(),
  shopFloorCapture: z.boolean().nullable().optional(),

  // 4. Distribution (X3)
  warehouseCount: z.number().int().min(0).nullable().optional(),
  has3pl: z.boolean().nullable().optional(),
  ediRequired: z.boolean().nullable().optional(),

  // 5. Professional Services (Intacct)
  projectTypes: z.string().max(500).nullable().optional(),
  billingModels: z.string().max(500).nullable().optional(),
  revenueRecognition: z.string().max(100).nullable().optional(),

  // 6. SaaS / Subscription (Intacct)
  hasSubscriptionBilling: z.boolean().nullable().optional(),
  arrTrackingNeeded: z.boolean().nullable().optional(),
  asc606Required: z.boolean().nullable().optional(),

  // 7. Non-Profit / Legal (Intacct)
  fundAccounting: z.boolean().nullable().optional(),
  grantTracking: z.boolean().nullable().optional(),
  matterBilling: z.boolean().nullable().optional(),

  // 8. Integration & Data
  integrationCount: z.number().int().min(0).optional(),
  migrationScope: z.nativeEnum(MigrationScope).optional(),
  apiEdiRequired: z.boolean().optional(),

  // 9. People & Change
  itReadiness: z.nativeEnum(ItReadiness).optional(),
  changeSponsorIdentified: z.boolean().optional(),

  // 10. Budget & Procurement
  budgetRange: z.string().max(100).optional(),
  boardApprovalRequired: z.boolean().optional(),
  procurementProcess: z.string().max(500).optional(),

  // Solution
  solutionOverrideReason: z.string().max(1000).nullable().optional(),
  solutionConfirmed: z.boolean().optional(),
})

export type DiscoveryDatasetInput = z.infer<typeof DiscoveryDatasetSchema>
