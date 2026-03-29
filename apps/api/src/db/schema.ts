import {
  pgTable, uuid, varchar, boolean, integer, numeric, text,
  timestamp, jsonb, index, uniqueIndex, pgEnum,
} from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { Role, Stage, Solution, DocumentType, BudgetStatus, SizeBand, ProductionModel, MigrationScope, ItReadiness, ProposalStatus } from '@msas/shared'

// ─── Enums ────────────────────────────────────────────────────────────────────

export const roleEnum        = pgEnum('role',          Object.values(Role) as [string, ...string[]])
export const stageEnum       = pgEnum('stage',         Object.values(Stage) as [string, ...string[]])
export const solutionEnum    = pgEnum('solution',      Object.values(Solution) as [string, ...string[]])
export const docTypeEnum     = pgEnum('document_type', Object.values(DocumentType) as [string, ...string[]])
export const budgetStatusEnum = pgEnum('budget_status', Object.values(BudgetStatus) as [string, ...string[]])
export const sizeBandEnum    = pgEnum('size_band',     Object.values(SizeBand) as [string, ...string[]])
export const prodModelEnum   = pgEnum('production_model', Object.values(ProductionModel) as [string, ...string[]])
export const migrationEnum   = pgEnum('migration_scope', Object.values(MigrationScope) as [string, ...string[]])
export const itReadinessEnum = pgEnum('it_readiness',  Object.values(ItReadiness) as [string, ...string[]])
export const proposalStatusEnum = pgEnum('proposal_status', Object.values(ProposalStatus) as [string, ...string[]])

// ─── Shared columns ────────────────────────────────────────────────────────

const timestamps = {
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}

// ─── Tenants ──────────────────────────────────────────────────────────────────

export const tenants = pgTable('tenants', {
  id:        uuid('id').primaryKey().defaultRandom(),
  slug:      varchar('slug', { length: 63 }).notNull().unique(),
  name:      varchar('name', { length: 255 }).notNull(),
  config:    jsonb('config').notNull().default({}),
  ...timestamps,
})

// ─── Teams ───────────────────────────────────────────────────────────────────

export const teams = pgTable('teams', {
  id:       uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  name:     varchar('name', { length: 255 }).notNull(),
  ...timestamps,
})

// ─── Users ───────────────────────────────────────────────────────────────────

export const users = pgTable('users', {
  id:           uuid('id').primaryKey().defaultRandom(),
  tenantId:     uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  email:        varchar('email', { length: 255 }).notNull(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  fullName:     varchar('full_name', { length: 255 }).notNull(),
  role:         roleEnum('role').notNull(),
  teamId:       uuid('team_id').references(() => teams.id, { onDelete: 'set null' }),
  isActive:     boolean('is_active').notNull().default(true),
  ...timestamps,
}, (t) => ({
  emailTenantIdx: uniqueIndex('users_email_tenant_idx').on(t.tenantId, t.email),
  tenantIdx: index('users_tenant_idx').on(t.tenantId),
}))

// ─── Organisations ────────────────────────────────────────────────────────────

export const organisations = pgTable('organisations', {
  id:        uuid('id').primaryKey().defaultRandom(),
  tenantId:  uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  name:      varchar('name', { length: 255 }).notNull(),
  sector:    varchar('sector', { length: 100 }),
  sizeBand:  sizeBandEnum('size_band'),
  country:   varchar('country', { length: 100 }),
  createdBy: uuid('created_by').references(() => users.id, { onDelete: 'set null' }),
  ...timestamps,
}, (t) => ({
  tenantIdx: index('orgs_tenant_idx').on(t.tenantId),
}))

// ─── Opportunities ────────────────────────────────────────────────────────────

export const opportunities = pgTable('opportunities', {
  id:                   uuid('id').primaryKey().defaultRandom(),
  tenantId:             uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  orgId:                uuid('org_id').notNull().references(() => organisations.id, { onDelete: 'cascade' }),
  name:                 varchar('name', { length: 255 }).notNull(),
  ownerId:              uuid('owner_id').notNull().references(() => users.id, { onDelete: 'restrict' }),
  stage:                stageEnum('stage').notNull().default(Stage.QUALIFICATION),
  solution:             solutionEnum('solution'),
  solutionOverrideReason: text('solution_override_reason'),
  meddpiccScore:        integer('meddpicc_score'),
  bantPass:             boolean('bant_pass'),
  ...timestamps,
}, (t) => ({
  tenantOwnerIdx: index('opps_tenant_owner_idx').on(t.tenantId, t.ownerId),
  tenantStageIdx: index('opps_tenant_stage_idx').on(t.tenantId, t.stage),
}))

// ─── BANT Records ─────────────────────────────────────────────────────────────

export const bantRecords = pgTable('bant_records', {
  id:                  uuid('id').primaryKey().defaultRandom(),
  opportunityId:       uuid('opportunity_id').notNull().unique().references(() => opportunities.id, { onDelete: 'cascade' }),
  tenantId:            uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  budgetStatus:        budgetStatusEnum('budget_status').notNull(),
  authorityIdentified: boolean('authority_identified').notNull(),
  authorityRole:       varchar('authority_role', { length: 255 }),
  needStatement:       text('need_statement').notNull(),
  needCategory:        varchar('need_category', { length: 100 }),
  timelineDate:        varchar('timeline_date', { length: 10 }), // ISO date string
  pass:                boolean('pass').notNull().default(false),
  ...timestamps,
})

// ─── MEDDPICC Records ─────────────────────────────────────────────────────────

export const meddpiccRecords = pgTable('meddpicc_records', {
  id:                      uuid('id').primaryKey().defaultRandom(),
  opportunityId:           uuid('opportunity_id').notNull().unique().references(() => opportunities.id, { onDelete: 'cascade' }),
  tenantId:                uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  metricsScore:            integer('metrics_score').notNull().default(0),
  metricsNotes:            text('metrics_notes'),
  economicBuyerScore:      integer('economic_buyer_score').notNull().default(0),
  economicBuyerName:       varchar('economic_buyer_name', { length: 255 }),
  economicBuyerRole:       varchar('economic_buyer_role', { length: 255 }),
  economicBuyerEngagement: varchar('economic_buyer_engagement', { length: 100 }),
  decisionCriteriaScore:   integer('decision_criteria_score').notNull().default(0),
  decisionCriteriaNotes:   text('decision_criteria_notes'),
  decisionProcessScore:    integer('decision_process_score').notNull().default(0),
  decisionProcessNotes:    text('decision_process_notes'),
  paperProcessScore:       integer('paper_process_score').notNull().default(0),
  paperProcessNotes:       text('paper_process_notes'),
  painScore:               integer('pain_score').notNull().default(0),
  painNotes:               text('pain_notes'),
  championScore:           integer('champion_score').notNull().default(0),
  championName:            varchar('champion_name', { length: 255 }),
  championRole:            varchar('champion_role', { length: 255 }),
  competitionScore:        integer('competition_score').notNull().default(0),
  competitionNotes:        text('competition_notes'),
  totalScore:              integer('total_score').notNull().default(0),
  ...timestamps,
})

// ─── Discovery Datasets ───────────────────────────────────────────────────────

export const discoveryDatasets = pgTable('discovery_datasets', {
  id:            uuid('id').primaryKey().defaultRandom(),
  opportunityId: uuid('opportunity_id').notNull().unique().references(() => opportunities.id, { onDelete: 'cascade' }),
  tenantId:      uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  // 1. Org profile
  currentErp:    varchar('current_erp', { length: 255 }),
  goLiveTarget:  varchar('go_live_target', { length: 10 }),
  // 2. Financial ops
  financeTeamSize:     integer('finance_team_size'),
  monthEndDaysActual:  numeric('month_end_days_actual', { precision: 4, scale: 1 }),
  multiEntity:         boolean('multi_entity'),
  multiCurrency:       boolean('multi_currency'),
  reportingRequirements: text('reporting_requirements'),
  // 3. Manufacturing
  productionModel:   prodModelEnum('production_model'),
  bomComplexity:     varchar('bom_complexity', { length: 50 }),
  mrpUsed:           boolean('mrp_used'),
  shopFloorCapture:  boolean('shop_floor_capture'),
  // 4. Distribution
  warehouseCount:    integer('warehouse_count'),
  has3pl:            boolean('has_3pl'),
  ediRequired:       boolean('edi_required'),
  // 5. Professional services
  projectTypes:      text('project_types'),
  billingModels:     text('billing_models'),
  revenueRecognition: varchar('revenue_recognition', { length: 100 }),
  // 6. SaaS/subscription
  hasSubscriptionBilling: boolean('has_subscription_billing'),
  arrTrackingNeeded:      boolean('arr_tracking_needed'),
  asc606Required:         boolean('asc606_required'),
  // 7. Non-profit / legal
  fundAccounting:    boolean('fund_accounting'),
  grantTracking:     boolean('grant_tracking'),
  matterBilling:     boolean('matter_billing'),
  // 8. Integration & data
  integrationCount:  integer('integration_count'),
  migrationScope:    migrationEnum('migration_scope'),
  apiEdiRequired:    boolean('api_edi_required'),
  // 9. People & change
  itReadiness:              itReadinessEnum('it_readiness'),
  changeSponsorIdentified:  boolean('change_sponsor_identified'),
  // 10. Budget & procurement
  budgetRange:          varchar('budget_range', { length: 100 }),
  boardApprovalRequired: boolean('board_approval_required'),
  procurementProcess:    text('procurement_process'),
  // Solution
  solutionRecommended:    solutionEnum('solution_recommended'),
  solutionConfirmed:      boolean('solution_confirmed').notNull().default(false),
  solutionOverrideReason: text('solution_override_reason'),
  completionPct:          integer('completion_pct').notNull().default(0),
  ...timestamps,
})

// ─── Financial Models ─────────────────────────────────────────────────────────

export const financialModels = pgTable('financial_models', {
  id:            uuid('id').primaryKey().defaultRandom(),
  opportunityId: uuid('opportunity_id').notNull().unique().references(() => opportunities.id, { onDelete: 'cascade' }),
  tenantId:      uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  // COI inputs
  financeTeamSize:              integer('finance_team_size'),
  financeAnnualSalary:          numeric('finance_annual_salary', { precision: 12, scale: 2 }),
  manualReentryHrsPerWeekPerFte: numeric('manual_reentry_hrs_per_week_per_fte', { precision: 6, scale: 2 }),
  monthEndDaysActual:           numeric('month_end_days_actual', { precision: 4, scale: 1 }),
  errorReworkPct:               numeric('error_rework_pct', { precision: 5, scale: 2 }),
  auditPrepDays:                numeric('audit_prep_days', { precision: 5, scale: 1 }),
  reportingCycleDays:           numeric('reporting_cycle_days', { precision: 4, scale: 1 }),
  itLegacyAnnualCost:           numeric('it_legacy_annual_cost', { precision: 12, scale: 2 }),
  annualTransactionVolume:      integer('annual_transaction_volume'),
  // COI outputs (snapshot)
  coiManualReentry:    numeric('coi_manual_reentry', { precision: 12, scale: 2 }),
  coiMonthEnd:         numeric('coi_month_end', { precision: 12, scale: 2 }),
  coiRework:           numeric('coi_rework', { precision: 12, scale: 2 }),
  coiAudit:            numeric('coi_audit', { precision: 12, scale: 2 }),
  coiReporting:        numeric('coi_reporting', { precision: 12, scale: 2 }),
  coiItLegacy:         numeric('coi_it_legacy', { precision: 12, scale: 2 }),
  coiTotalAnnual:      numeric('coi_total_annual', { precision: 12, scale: 2 }),
  // ROI inputs
  implementationInvestment:  numeric('implementation_investment', { precision: 12, scale: 2 }),
  annualLicenceCost:         numeric('annual_licence_cost', { precision: 12, scale: 2 }),
  benefitRealisationMonths:  integer('benefit_realisation_months').default(6),
  discountRatePct:           numeric('discount_rate_pct', { precision: 5, scale: 2 }).default('8.00'),
  sensitivityLowMultiplier:  numeric('sensitivity_low_multiplier', { precision: 4, scale: 2 }).default('0.70'),
  sensitivityHighMultiplier: numeric('sensitivity_high_multiplier', { precision: 4, scale: 2 }).default('1.30'),
  // ROI outputs (snapshot)
  roiPaybackMonths: numeric('roi_payback_months', { precision: 6, scale: 1 }),
  roi3yrPct:        numeric('roi_3yr_pct', { precision: 8, scale: 2 }),
  roiNpv:           numeric('roi_npv', { precision: 12, scale: 2 }),
  roiAnnualBenefit: numeric('roi_annual_benefit', { precision: 12, scale: 2 }),
  ...timestamps,
})

// ─── Proposals ────────────────────────────────────────────────────────────────

export const proposals = pgTable('proposals', {
  id:             uuid('id').primaryKey().defaultRandom(),
  opportunityId:  uuid('opportunity_id').notNull().references(() => opportunities.id, { onDelete: 'cascade' }),
  tenantId:       uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  documentType:   docTypeEnum('document_type').notNull(),
  version:        integer('version').notNull().default(1),
  status:         proposalStatusEnum('status').notNull().default(ProposalStatus.DRAFT),
  createdBy:      uuid('created_by').references(() => users.id, { onDelete: 'set null' }),
  pdfPath:        varchar('pdf_path', { length: 500 }),
  snapshotData:   jsonb('snapshot_data').notNull().default({}),
  ...timestamps,
}, (t) => ({
  oppTypeIdx: index('proposals_opp_type_idx').on(t.opportunityId, t.documentType),
}))

// ─── Relations ────────────────────────────────────────────────────────────────

export const tenantsRelations = relations(tenants, ({ many }) => ({
  users: many(users),
  teams: many(teams),
  organisations: many(organisations),
  opportunities: many(opportunities),
}))

export const usersRelations = relations(users, ({ one, many }) => ({
  tenant: one(tenants, { fields: [users.tenantId], references: [tenants.id] }),
  team: one(teams, { fields: [users.teamId], references: [teams.id] }),
  opportunities: many(opportunities),
}))

export const organisationsRelations = relations(organisations, ({ one, many }) => ({
  tenant: one(tenants, { fields: [organisations.tenantId], references: [tenants.id] }),
  opportunities: many(opportunities),
}))

export const opportunitiesRelations = relations(opportunities, ({ one }) => ({
  tenant: one(tenants, { fields: [opportunities.tenantId], references: [tenants.id] }),
  organisation: one(organisations, { fields: [opportunities.orgId], references: [organisations.id] }),
  owner: one(users, { fields: [opportunities.ownerId], references: [users.id] }),
  bantRecord: one(bantRecords, { fields: [opportunities.id], references: [bantRecords.opportunityId] }),
  meddpiccRecord: one(meddpiccRecords, { fields: [opportunities.id], references: [meddpiccRecords.opportunityId] }),
  discoveryDataset: one(discoveryDatasets, { fields: [opportunities.id], references: [discoveryDatasets.opportunityId] }),
  financialModel: one(financialModels, { fields: [opportunities.id], references: [financialModels.opportunityId] }),
}))
