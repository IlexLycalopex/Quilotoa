import { Solution } from '../enums.js'
import type { DiscoveryDatasetInput } from '../schemas/discovery.js'

export interface SolutionRecommendation {
  solution: Solution
  confidence: 'HIGH' | 'MEDIUM' | 'LOW'
  rationale: string[]
  isAmbiguous: boolean
}

/**
 * Determines the recommended solution from discovery answers.
 * Mirrors the decision tree in the spec exactly.
 * Runs identically on client (live preview) and server (authoritative save).
 */
export function recommendSolution(
  discovery: Partial<DiscoveryDatasetInput>,
): SolutionRecommendation | null {
  if (!discovery) return null

  const rationale: string[] = []
  let x3Score = 0
  let intacctScore = 0
  let cloudDocsScore = 0

  // X3 signals
  if (discovery.productionModel != null) {
    x3Score += 3
    rationale.push('Production planning / manufacturing requirements (Sage X3)')
  }
  if (discovery.bomComplexity != null) {
    x3Score += 2
    rationale.push('Bill of materials complexity (Sage X3)')
  }
  if (discovery.mrpUsed) {
    x3Score += 2
    rationale.push('MRP usage (Sage X3)')
  }
  if ((discovery.warehouseCount ?? 0) > 0) {
    x3Score += 2
    rationale.push('Multi-warehouse / distribution (Sage X3)')
  }
  if (discovery.has3pl || discovery.ediRequired) {
    x3Score += 1
    rationale.push('3PL / EDI requirements (Sage X3)')
  }

  // Intacct signals
  if (discovery.projectTypes) {
    intacctScore += 3
    rationale.push('Project / professional services accounting (Sage Intacct)')
  }
  if (discovery.billingModels) {
    intacctScore += 2
    rationale.push('Complex billing models (Sage Intacct)')
  }
  if (discovery.hasSubscriptionBilling || discovery.arrTrackingNeeded || discovery.asc606Required) {
    intacctScore += 3
    rationale.push('SaaS / subscription billing or ASC 606 compliance (Sage Intacct)')
  }
  if (discovery.fundAccounting || discovery.grantTracking) {
    intacctScore += 3
    rationale.push('Fund accounting / grant management (Sage Intacct)')
  }
  if (discovery.matterBilling) {
    intacctScore += 2
    rationale.push('Matter billing for legal / financial services (Sage Intacct)')
  }
  if (discovery.multiEntity) {
    intacctScore += 1
    rationale.push('Multi-entity consolidation (Sage Intacct strength)')
  }
  if (discovery.revenueRecognition) {
    intacctScore += 1
    rationale.push('Revenue recognition requirements (Sage Intacct)')
  }

  // X3CloudDocs signals
  if (discovery.integrationCount != null && discovery.integrationCount > 0 && x3Score > 0) {
    cloudDocsScore += 1
    rationale.push('Document management / purchase invoice automation (X3CloudDocs add-on)')
  }

  const totalSignals = x3Score + intacctScore + cloudDocsScore
  if (totalSignals === 0) return null

  const isAmbiguous = x3Score > 0 && intacctScore > 0 && Math.abs(x3Score - intacctScore) <= 2
  const isMixed = x3Score >= 3 && intacctScore >= 3 && discovery.multiEntity

  if (isMixed) {
    return { solution: Solution.MIXED, confidence: 'MEDIUM', rationale, isAmbiguous: false }
  }

  if (x3Score > intacctScore) {
    const confidence = x3Score >= 5 ? 'HIGH' : x3Score >= 3 ? 'MEDIUM' : 'LOW'
    return {
      solution: cloudDocsScore > 0 ? Solution.X3CLOUDDOCS : Solution.SAGE_X3,
      confidence,
      rationale,
      isAmbiguous,
    }
  }

  if (intacctScore > x3Score) {
    const confidence = intacctScore >= 5 ? 'HIGH' : intacctScore >= 3 ? 'MEDIUM' : 'LOW'
    return { solution: Solution.SAGE_INTACCT, confidence, rationale, isAmbiguous }
  }

  return { solution: Solution.MIXED, confidence: 'LOW', rationale, isAmbiguous: true }
}
