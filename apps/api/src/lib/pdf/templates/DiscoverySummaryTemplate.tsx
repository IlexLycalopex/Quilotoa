import React from 'react'
import { Document, Page, View, Text, StyleSheet } from '@react-pdf/renderer'

interface SolutionRecommendation {
  solution: string
  confidence: 'HIGH' | 'MEDIUM' | 'LOW'
  rationale: string[]
  isAmbiguous: boolean
}

interface Props {
  data: Record<string, unknown>
  branding: {
    primaryColour: string
    companyName: string
  }
}

function formatDate(): string {
  return new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
}

function formatSolutionName(solution: string): string {
  const map: Record<string, string> = {
    SAGE_X3: 'Sage X3',
    SAGE_INTACCT: 'Sage Intacct',
    X3CLOUDDOCS: 'Sage X3 + CloudDocs',
    MIXED: 'Mixed Solution (X3 + Intacct)',
  }
  return map[solution] ?? solution
}

function confidenceColour(confidence: string, primaryColour: string): string {
  if (confidence === 'HIGH') return '#276749'
  if (confidence === 'MEDIUM') return '#b7791f'
  if (confidence === 'LOW') return '#c53030'
  return primaryColour
}

function ragColour(score: number): string {
  if (score >= 70) return '#276749'
  if (score >= 40) return '#b7791f'
  return '#c53030'
}

function ragLabel(score: number): string {
  if (score >= 70) return 'Green'
  if (score >= 40) return 'Amber'
  return 'Red'
}

const DISCOVERY_SECTIONS: Array<{ section: string; fields: Array<{ label: string; key: string }> }> = [
  {
    section: 'Organisation Profile',
    fields: [
      { label: 'Current ERP', key: 'currentErp' },
      { label: 'Go-Live Target', key: 'goLiveTarget' },
    ],
  },
  {
    section: 'Financial Operations',
    fields: [
      { label: 'Finance Team Size', key: 'financeTeamSize' },
      { label: 'Month-End Days', key: 'monthEndDaysActual' },
      { label: 'Multi-Entity', key: 'multiEntity' },
      { label: 'Multi-Currency', key: 'multiCurrency' },
      { label: 'Reporting Requirements', key: 'reportingRequirements' },
    ],
  },
  {
    section: 'Manufacturing',
    fields: [
      { label: 'Production Model', key: 'productionModel' },
      { label: 'BOM Complexity', key: 'bomComplexity' },
      { label: 'MRP Used', key: 'mrpUsed' },
      { label: 'Shop Floor Capture', key: 'shopFloorCapture' },
    ],
  },
  {
    section: 'Distribution',
    fields: [
      { label: 'Warehouse Count', key: 'warehouseCount' },
      { label: '3PL Required', key: 'has3pl' },
      { label: 'EDI Required', key: 'ediRequired' },
    ],
  },
  {
    section: 'Professional Services',
    fields: [
      { label: 'Project Types', key: 'projectTypes' },
      { label: 'Billing Models', key: 'billingModels' },
      { label: 'Revenue Recognition', key: 'revenueRecognition' },
    ],
  },
  {
    section: 'SaaS / Subscription',
    fields: [
      { label: 'Subscription Billing', key: 'hasSubscriptionBilling' },
      { label: 'ARR Tracking', key: 'arrTrackingNeeded' },
      { label: 'ASC 606 Required', key: 'asc606Required' },
    ],
  },
  {
    section: 'Non-Profit / Legal',
    fields: [
      { label: 'Fund Accounting', key: 'fundAccounting' },
      { label: 'Grant Tracking', key: 'grantTracking' },
      { label: 'Matter Billing', key: 'matterBilling' },
    ],
  },
  {
    section: 'Integration & Data',
    fields: [
      { label: 'Integration Count', key: 'integrationCount' },
      { label: 'Migration Scope', key: 'migrationScope' },
      { label: 'API / EDI Required', key: 'apiEdiRequired' },
    ],
  },
  {
    section: 'People & Change',
    fields: [
      { label: 'IT Readiness', key: 'itReadiness' },
      { label: 'Change Sponsor Identified', key: 'changeSponsorIdentified' },
    ],
  },
  {
    section: 'Budget & Procurement',
    fields: [
      { label: 'Budget Range', key: 'budgetRange' },
      { label: 'Board Approval Required', key: 'boardApprovalRequired' },
      { label: 'Procurement Process', key: 'procurementProcess' },
    ],
  },
]

function formatFieldValue(value: unknown): string {
  if (value === null || value === undefined) return '—'
  if (typeof value === 'boolean') return value ? 'Yes' : 'No'
  if (typeof value === 'number') return String(value)
  if (typeof value === 'string') return value
  return String(value)
}

function hasAnyValue(fields: Array<{ label: string; key: string }>, dataset: Record<string, unknown>): boolean {
  return fields.some((f) => dataset[f.key] != null)
}

export function DiscoverySummaryTemplate({ data, branding }: Props): React.ReactElement {
  const { primaryColour, companyName } = branding

  const org = (data['org'] ?? null) as Record<string, unknown> | null
  const opportunity = (data['opportunity'] ?? null) as Record<string, unknown> | null
  const discoveryDataset = (data['discoveryDataset'] ?? null) as Record<string, unknown> | null
  const bantRecord = (data['bantRecord'] ?? null) as Record<string, unknown> | null
  const meddpiccRecord = (data['meddpiccRecord'] ?? null) as Record<string, unknown> | null

  const orgName = (org?.['name'] as string | undefined) ?? 'Client'
  const recommendation = (opportunity?.['solution'] != null
    ? null
    : null) as SolutionRecommendation | null

  // Try to derive recommendation from discovery dataset
  const solutionRecommended = discoveryDataset?.['solutionRecommended'] as string | null | undefined
  const solutionConfirmed = discoveryDataset?.['solutionConfirmed'] as boolean | undefined
  const completionPct = discoveryDataset?.['completionPct'] as number | undefined ?? 0

  const bantPass = bantRecord?.['pass'] as boolean | undefined
  const meddpiccScore = meddpiccRecord?.['totalScore'] as number | undefined ?? 0

  const NEXT_STEPS = [
    'Schedule a technical discovery session to validate integration requirements.',
    'Confirm economic buyer engagement and obtain formal sign-off on business case.',
    'Arrange a product demonstration tailored to key pain points identified above.',
    'Initiate procurement process: confirm timeline, approval thresholds, and required documentation.',
    'Progress to Cost of Inaction analysis to quantify financial impact of delaying action.',
  ]

  const styles = StyleSheet.create({
    page: {
      fontFamily: 'Helvetica',
      fontSize: 10,
      color: '#1a1a1a',
      paddingTop: 0,
      paddingBottom: 40,
      paddingHorizontal: 0,
    },
    header: {
      backgroundColor: primaryColour,
      paddingVertical: 28,
      paddingHorizontal: 36,
      marginBottom: 24,
    },
    headerCompany: {
      fontSize: 14,
      color: '#ffffff',
      fontFamily: 'Helvetica-Bold',
      marginBottom: 6,
    },
    headerTitle: {
      fontSize: 20,
      color: '#ffffff',
      fontFamily: 'Helvetica-Bold',
      marginBottom: 4,
    },
    headerDate: {
      fontSize: 10,
      color: '#d0dce8',
    },
    body: {
      paddingHorizontal: 36,
    },
    sectionTitle: {
      fontSize: 13,
      fontFamily: 'Helvetica-Bold',
      color: primaryColour,
      marginBottom: 10,
      marginTop: 20,
      borderBottomWidth: 1,
      borderBottomColor: primaryColour,
      paddingBottom: 4,
    },
    solutionCard: {
      backgroundColor: '#f7fafc',
      borderLeftWidth: 4,
      borderLeftColor: primaryColour,
      padding: 14,
      marginBottom: 8,
    },
    solutionName: {
      fontSize: 16,
      fontFamily: 'Helvetica-Bold',
      color: primaryColour,
      marginBottom: 6,
    },
    solutionMeta: {
      fontSize: 10,
      color: '#4a5568',
      marginBottom: 8,
    },
    rationaleItem: {
      flexDirection: 'row',
      marginBottom: 4,
    },
    rationaleBullet: {
      fontSize: 10,
      color: primaryColour,
      marginRight: 6,
    },
    rationaleText: {
      fontSize: 10,
      color: '#2d3748',
      flex: 1,
    },
    tableHeader: {
      flexDirection: 'row',
      backgroundColor: '#f0f4f8',
      paddingVertical: 6,
      paddingHorizontal: 8,
      borderTopWidth: 1,
      borderTopColor: '#cbd5e0',
      borderBottomWidth: 1,
      borderBottomColor: '#cbd5e0',
    },
    tableRow: {
      flexDirection: 'row',
      paddingVertical: 5,
      paddingHorizontal: 8,
      borderBottomWidth: 1,
      borderBottomColor: '#e8edf2',
    },
    tableRowAlt: {
      flexDirection: 'row',
      paddingVertical: 5,
      paddingHorizontal: 8,
      borderBottomWidth: 1,
      borderBottomColor: '#e8edf2',
      backgroundColor: '#fafbfc',
    },
    colSection: {
      flex: 2,
      fontSize: 10,
    },
    colFindings: {
      flex: 3,
      fontSize: 10,
    },
    colHeaderText: {
      fontFamily: 'Helvetica-Bold',
      fontSize: 10,
    },
    qualCard: {
      flexDirection: 'row',
      gap: 12,
      marginBottom: 8,
    },
    qualItem: {
      flex: 1,
      backgroundColor: '#f7fafc',
      borderRadius: 4,
      padding: 12,
      alignItems: 'center',
    },
    qualLabel: {
      fontSize: 9,
      color: '#718096',
      textAlign: 'center',
      marginBottom: 6,
      textTransform: 'uppercase',
    },
    qualValue: {
      fontSize: 18,
      fontFamily: 'Helvetica-Bold',
      textAlign: 'center',
    },
    qualSubLabel: {
      fontSize: 9,
      textAlign: 'center',
      marginTop: 4,
    },
    nextStepItem: {
      flexDirection: 'row',
      marginBottom: 8,
      alignItems: 'flex-start',
    },
    nextStepNumber: {
      fontSize: 11,
      fontFamily: 'Helvetica-Bold',
      color: primaryColour,
      marginRight: 10,
      width: 18,
    },
    nextStepText: {
      fontSize: 10,
      color: '#2d3748',
      flex: 1,
      lineHeight: 1.5,
    },
    progressBar: {
      height: 8,
      backgroundColor: '#e2e8f0',
      borderRadius: 4,
      marginTop: 6,
    },
    progressFill: {
      height: 8,
      backgroundColor: primaryColour,
      borderRadius: 4,
      width: `${Math.min(100, completionPct)}%`,
    },
    progressLabel: {
      fontSize: 9,
      color: '#718096',
      marginTop: 3,
    },
    footer: {
      position: 'absolute',
      bottom: 20,
      left: 36,
      right: 36,
      borderTopWidth: 1,
      borderTopColor: '#cbd5e0',
      paddingTop: 6,
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    footerText: {
      fontSize: 8,
      color: '#718096',
    },
    noData: {
      fontSize: 10,
      color: '#718096',
      fontStyle: 'italic',
      marginTop: 8,
    },
  })

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerCompany}>{companyName}</Text>
          <Text style={styles.headerTitle}>Discovery Summary</Text>
          <Text style={styles.headerDate}>{formatDate()} · {orgName}</Text>
        </View>

        <View style={styles.body}>
          {/* Section: Recommended Solution */}
          <Text style={styles.sectionTitle}>Recommended Solution</Text>
          {solutionRecommended ? (
            <View style={styles.solutionCard}>
              <Text style={styles.solutionName}>{formatSolutionName(solutionRecommended)}</Text>
              <Text style={styles.solutionMeta}>
                {solutionConfirmed ? 'Solution confirmed by sales team' : 'Recommendation pending confirmation'}
              </Text>
              {/* Discovery completion */}
              <View>
                <Text style={styles.progressLabel}>{`Discovery completion: ${completionPct}%`}</Text>
                <View style={styles.progressBar}>
                  <View style={styles.progressFill} />
                </View>
              </View>
            </View>
          ) : (
            <Text style={styles.noData}>
              Discovery not yet complete. Provide additional discovery answers to generate a solution recommendation.
            </Text>
          )}

          {/* Section: Key Requirements Captured */}
          <Text style={styles.sectionTitle}>Key Requirements Captured</Text>
          {discoveryDataset ? (
            <>
              <View style={styles.tableHeader}>
                <Text style={[styles.colSection, styles.colHeaderText]}>Section</Text>
                <Text style={[styles.colFindings, styles.colHeaderText]}>Key Findings</Text>
              </View>
              {DISCOVERY_SECTIONS.filter((s) => hasAnyValue(s.fields, discoveryDataset)).map(
                (section, sIdx) => {
                  const findings = section.fields
                    .filter((f) => discoveryDataset[f.key] != null)
                    .map((f) => `${f.label}: ${formatFieldValue(discoveryDataset[f.key])}`)
                    .join('\n')

                  return (
                    <View key={section.section} style={sIdx % 2 === 0 ? styles.tableRow : styles.tableRowAlt}>
                      <Text style={[styles.colSection, { fontFamily: 'Helvetica-Bold' }]}>
                        {section.section}
                      </Text>
                      <Text style={styles.colFindings}>{findings}</Text>
                    </View>
                  )
                },
              )}
            </>
          ) : (
            <Text style={styles.noData}>No discovery data captured yet.</Text>
          )}

          {/* Section: Qualification Summary */}
          <Text style={styles.sectionTitle}>Qualification Summary</Text>
          <View style={styles.qualCard}>
            <View style={styles.qualItem}>
              <Text style={styles.qualLabel}>BANT Qualification</Text>
              <Text style={[styles.qualValue, {
                color: bantPass === true ? '#276749' : bantPass === false ? '#c53030' : '#718096',
              }]}>
                {bantPass === true ? 'PASS' : bantPass === false ? 'FAIL' : 'N/A'}
              </Text>
              <Text style={[styles.qualSubLabel, { color: '#718096' }]}>
                Budget · Authority · Need · Timeline
              </Text>
            </View>
            <View style={styles.qualItem}>
              <Text style={styles.qualLabel}>MEDDPICC Score</Text>
              <Text style={[styles.qualValue, { color: ragColour(meddpiccScore) }]}>
                {meddpiccRecord ? `${meddpiccScore}%` : 'N/A'}
              </Text>
              <Text style={[styles.qualSubLabel, { color: ragColour(meddpiccScore) }]}>
                {meddpiccRecord ? ragLabel(meddpiccScore) : 'Not assessed'}
              </Text>
            </View>
          </View>

          {/* Section: Next Steps */}
          <Text style={styles.sectionTitle}>Next Steps</Text>
          {NEXT_STEPS.map((step, i) => (
            <View key={i} style={styles.nextStepItem}>
              <Text style={styles.nextStepNumber}>{`${i + 1}.`}</Text>
              <Text style={styles.nextStepText}>{step}</Text>
            </View>
          ))}

          {/* Opportunity reference */}
          {opportunity && (
            <View style={{ marginTop: 16 }}>
              <Text style={{ fontSize: 9, color: '#718096' }}>
                {`Opportunity: ${(opportunity['name'] as string | undefined) ?? ''} · Stage: ${(opportunity['stage'] as string | undefined) ?? ''}`}
              </Text>
            </View>
          )}
        </View>

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>{`Prepared by ${companyName} | Confidential`}</Text>
          <Text style={styles.footerText} render={({ pageNumber, totalPages }) =>
            `Page ${pageNumber} of ${totalPages}`
          } />
        </View>
      </Page>
    </Document>
  )
}
