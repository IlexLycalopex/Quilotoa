import { Role, Action, Resource, ScopeFilter, Stage } from './enums.js'

// ─── COI Benchmark Defaults ───────────────────────────────────────────────────

export const COI_BENCHMARKS = {
  manualReentryHrsPerWeekPerFte: 4.5,      // APQC average
  monthEndDays: 6.4,                         // BlackLine average
  errorReworkPct: 2.1,                       // APQC average (% transactions requiring rework)
  auditPrepDays: 8,                          // PwC SME benchmark
  reportingCycleDaysMin: 5,                  // Gartner average
  reportingCycleDaysMax: 7,                  // Gartner average
  reportingCycleDays: 6,                     // Midpoint default
  weeksPerYear: 52,
  workingDaysPerYear: 260,
  workingHoursPerDay: 8,
} as const

// Default UK finance FTE salary (ONS/CIPD). Configurable per tenant in tenants.config.
export const DEFAULT_FINANCE_FTE_ANNUAL_SALARY = 42000

// ─── ROI Defaults ────────────────────────────────────────────────────────────

export const ROI_DEFAULTS = {
  discountRatePct: 8,
  benefitRealisationMonths: 6,
  sensitivityLowMultiplier: 0.7,
  sensitivityHighMultiplier: 1.3,
  analysisYears: 3,
} as const

// ─── MEDDPICC Thresholds ─────────────────────────────────────────────────────

export const MEDDPICC_MAX_SCORE_PER_ELEMENT = 10
export const MEDDPICC_ELEMENT_COUNT = 8
export const MEDDPICC_MAX_TOTAL = MEDDPICC_MAX_SCORE_PER_ELEMENT * MEDDPICC_ELEMENT_COUNT // 80
export const MEDDPICC_WARNING_THRESHOLD_PCT = 50 // warn + gate if below this %

// ─── BANT Thresholds ─────────────────────────────────────────────────────────

export const BANT_MAX_TIMELINE_MONTHS = 18

// ─── Stage Gate Order ────────────────────────────────────────────────────────

export const STAGE_ORDER: Stage[] = [
  Stage.QUALIFICATION,
  Stage.DISCOVERY,
  Stage.COI,
  Stage.ROI,
  Stage.COMPLETE,
]

// ─── RBAC Policy ─────────────────────────────────────────────────────────────
// Maps [Role][Resource][Action] → ScopeFilter | false

type Policy = Record<Role, Partial<Record<Resource, Partial<Record<Action, ScopeFilter | false>>>>>

export const RBAC_POLICY: Policy = {
  [Role.BDE]: {
    [Resource.OPPORTUNITY]:     { [Action.CREATE]: ScopeFilter.OWN,  [Action.READ]: ScopeFilter.OWN,  [Action.UPDATE]: ScopeFilter.OWN,  [Action.DELETE]: false },
    [Resource.ORGANISATION]:    { [Action.CREATE]: ScopeFilter.OWN,  [Action.READ]: ScopeFilter.ALL,  [Action.UPDATE]: ScopeFilter.OWN,  [Action.DELETE]: false },
    [Resource.QUALIFICATION]:   { [Action.CREATE]: ScopeFilter.OWN,  [Action.READ]: ScopeFilter.OWN,  [Action.UPDATE]: ScopeFilter.OWN,  [Action.DELETE]: false },
    [Resource.DISCOVERY]:       { [Action.CREATE]: ScopeFilter.OWN,  [Action.READ]: ScopeFilter.OWN,  [Action.UPDATE]: ScopeFilter.OWN,  [Action.DELETE]: false },
    [Resource.FINANCIAL_MODEL]: { [Action.CREATE]: ScopeFilter.OWN,  [Action.READ]: ScopeFilter.OWN,  [Action.UPDATE]: ScopeFilter.OWN,  [Action.DELETE]: false },
    [Resource.PROPOSAL]:        { [Action.CREATE]: ScopeFilter.OWN,  [Action.READ]: ScopeFilter.OWN,  [Action.UPDATE]: false,            [Action.DELETE]: false },
    [Resource.USER]:            { [Action.READ]: ScopeFilter.OWN },
    [Resource.TENANT]:          {},
  },
  [Role.PRE_SALES]: {
    [Resource.OPPORTUNITY]:     { [Action.CREATE]: false,            [Action.READ]: ScopeFilter.TEAM, [Action.UPDATE]: ScopeFilter.TEAM, [Action.DELETE]: false },
    [Resource.ORGANISATION]:    { [Action.CREATE]: false,            [Action.READ]: ScopeFilter.ALL,  [Action.UPDATE]: false,            [Action.DELETE]: false },
    [Resource.QUALIFICATION]:   { [Action.CREATE]: false,            [Action.READ]: ScopeFilter.TEAM, [Action.UPDATE]: ScopeFilter.TEAM, [Action.DELETE]: false },
    [Resource.DISCOVERY]:       { [Action.CREATE]: false,            [Action.READ]: ScopeFilter.TEAM, [Action.UPDATE]: ScopeFilter.TEAM, [Action.DELETE]: false },
    [Resource.FINANCIAL_MODEL]: { [Action.CREATE]: false,            [Action.READ]: ScopeFilter.TEAM, [Action.UPDATE]: ScopeFilter.TEAM, [Action.DELETE]: false },
    [Resource.PROPOSAL]:        { [Action.CREATE]: ScopeFilter.TEAM, [Action.READ]: ScopeFilter.TEAM, [Action.UPDATE]: false,            [Action.DELETE]: false },
    [Resource.USER]:            { [Action.READ]: ScopeFilter.TEAM },
    [Resource.TENANT]:          {},
  },
  [Role.TEAM_LEAD]: {
    [Resource.OPPORTUNITY]:     { [Action.CREATE]: ScopeFilter.TEAM, [Action.READ]: ScopeFilter.TEAM, [Action.UPDATE]: ScopeFilter.TEAM, [Action.DELETE]: false },
    [Resource.ORGANISATION]:    { [Action.CREATE]: ScopeFilter.TEAM, [Action.READ]: ScopeFilter.ALL,  [Action.UPDATE]: ScopeFilter.TEAM, [Action.DELETE]: false },
    [Resource.QUALIFICATION]:   { [Action.CREATE]: ScopeFilter.TEAM, [Action.READ]: ScopeFilter.TEAM, [Action.UPDATE]: ScopeFilter.TEAM, [Action.DELETE]: false },
    [Resource.DISCOVERY]:       { [Action.CREATE]: ScopeFilter.TEAM, [Action.READ]: ScopeFilter.TEAM, [Action.UPDATE]: ScopeFilter.TEAM, [Action.DELETE]: false },
    [Resource.FINANCIAL_MODEL]: { [Action.CREATE]: ScopeFilter.TEAM, [Action.READ]: ScopeFilter.TEAM, [Action.UPDATE]: ScopeFilter.TEAM, [Action.DELETE]: false },
    [Resource.PROPOSAL]:        { [Action.CREATE]: ScopeFilter.TEAM, [Action.READ]: ScopeFilter.TEAM, [Action.UPDATE]: false,            [Action.DELETE]: false },
    [Resource.USER]:            { [Action.CREATE]: false,            [Action.READ]: ScopeFilter.TEAM, [Action.UPDATE]: false,            [Action.DELETE]: false },
    [Resource.TENANT]:          {},
  },
  [Role.DIRECTOR]: {
    [Resource.OPPORTUNITY]:     { [Action.CREATE]: ScopeFilter.ALL,  [Action.READ]: ScopeFilter.ALL,  [Action.UPDATE]: ScopeFilter.ALL,  [Action.DELETE]: ScopeFilter.ALL },
    [Resource.ORGANISATION]:    { [Action.CREATE]: ScopeFilter.ALL,  [Action.READ]: ScopeFilter.ALL,  [Action.UPDATE]: ScopeFilter.ALL,  [Action.DELETE]: ScopeFilter.ALL },
    [Resource.QUALIFICATION]:   { [Action.CREATE]: ScopeFilter.ALL,  [Action.READ]: ScopeFilter.ALL,  [Action.UPDATE]: ScopeFilter.ALL,  [Action.DELETE]: false },
    [Resource.DISCOVERY]:       { [Action.CREATE]: ScopeFilter.ALL,  [Action.READ]: ScopeFilter.ALL,  [Action.UPDATE]: ScopeFilter.ALL,  [Action.DELETE]: false },
    [Resource.FINANCIAL_MODEL]: { [Action.CREATE]: ScopeFilter.ALL,  [Action.READ]: ScopeFilter.ALL,  [Action.UPDATE]: ScopeFilter.ALL,  [Action.DELETE]: false },
    [Resource.PROPOSAL]:        { [Action.CREATE]: ScopeFilter.ALL,  [Action.READ]: ScopeFilter.ALL,  [Action.UPDATE]: false,            [Action.DELETE]: false },
    [Resource.USER]:            { [Action.CREATE]: false,            [Action.READ]: ScopeFilter.ALL,  [Action.UPDATE]: false,            [Action.DELETE]: false },
    [Resource.TENANT]:          { [Action.READ]: ScopeFilter.OWN },
  },
  [Role.ADMIN]: {
    [Resource.OPPORTUNITY]:     { [Action.CREATE]: ScopeFilter.ALL,  [Action.READ]: ScopeFilter.ALL,  [Action.UPDATE]: ScopeFilter.ALL,  [Action.DELETE]: ScopeFilter.ALL },
    [Resource.ORGANISATION]:    { [Action.CREATE]: ScopeFilter.ALL,  [Action.READ]: ScopeFilter.ALL,  [Action.UPDATE]: ScopeFilter.ALL,  [Action.DELETE]: ScopeFilter.ALL },
    [Resource.QUALIFICATION]:   { [Action.CREATE]: ScopeFilter.ALL,  [Action.READ]: ScopeFilter.ALL,  [Action.UPDATE]: ScopeFilter.ALL,  [Action.DELETE]: ScopeFilter.ALL },
    [Resource.DISCOVERY]:       { [Action.CREATE]: ScopeFilter.ALL,  [Action.READ]: ScopeFilter.ALL,  [Action.UPDATE]: ScopeFilter.ALL,  [Action.DELETE]: ScopeFilter.ALL },
    [Resource.FINANCIAL_MODEL]: { [Action.CREATE]: ScopeFilter.ALL,  [Action.READ]: ScopeFilter.ALL,  [Action.UPDATE]: ScopeFilter.ALL,  [Action.DELETE]: ScopeFilter.ALL },
    [Resource.PROPOSAL]:        { [Action.CREATE]: ScopeFilter.ALL,  [Action.READ]: ScopeFilter.ALL,  [Action.UPDATE]: ScopeFilter.ALL,  [Action.DELETE]: ScopeFilter.ALL },
    [Resource.USER]:            { [Action.CREATE]: ScopeFilter.ALL,  [Action.READ]: ScopeFilter.ALL,  [Action.UPDATE]: ScopeFilter.ALL,  [Action.DELETE]: ScopeFilter.ALL },
    [Resource.TENANT]:          { [Action.CREATE]: ScopeFilter.ALL,  [Action.READ]: ScopeFilter.ALL,  [Action.UPDATE]: ScopeFilter.ALL,  [Action.DELETE]: ScopeFilter.ALL },
  },
}

export function can(
  role: Role,
  action: Action,
  resource: Resource,
): ScopeFilter | false {
  return RBAC_POLICY[role]?.[resource]?.[action] ?? false
}
