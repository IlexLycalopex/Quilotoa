// Enums
export * from './enums.js'

// Constants & RBAC
export { COI_BENCHMARKS, ROI_DEFAULTS, MEDDPICC_MAX_SCORE_PER_ELEMENT, MEDDPICC_ELEMENT_COUNT, MEDDPICC_MAX_TOTAL, MEDDPICC_WARNING_THRESHOLD_PCT, BANT_MAX_TIMELINE_MONTHS, STAGE_ORDER, DEFAULT_FINANCE_FTE_ANNUAL_SALARY, can, RBAC_POLICY } from './constants.js'

// Schemas (Zod) + inferred types
export * from './schemas/tenant.js'
export * from './schemas/user.js'
export * from './schemas/organisation.js'
export * from './schemas/opportunity.js'
export * from './schemas/qualification.js'
export * from './schemas/discovery.js'
export * from './schemas/financial.js'

// Pure logic functions
export { evaluateBANT } from './logic/bant.js'
export { scoreMEDDPICC } from './logic/meddpicc.js'
export type { MeddpiccScoreResult } from './logic/meddpicc.js'
export { recommendSolution } from './logic/solution.js'
export type { SolutionRecommendation } from './logic/solution.js'
export { calculateCOI } from './logic/coi.js'
export type { CoiResult, CoiLineItem } from './logic/coi.js'
export { calculateROI } from './logic/roi.js'
export type { RoiResult, RoiScenario } from './logic/roi.js'
