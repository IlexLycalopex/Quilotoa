import React from 'react'
import { Document, Page, View, Text, StyleSheet } from '@react-pdf/renderer'

interface RoiScenario {
  label: 'Low' | 'Base' | 'High'
  annualBenefit: number
  paybackMonths: number
  threeYearRoiPct: number
  npv: number
  cashFlowByYear: [number, number, number]
}

interface RoiResult {
  base: RoiScenario
  low: RoiScenario
  high: RoiScenario
}

interface Props {
  data: Record<string, unknown>
  branding: {
    primaryColour: string
    companyName: string
  }
}

function formatCurrency(value: number): string {
  return `£${value.toLocaleString('en-GB', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
}

function formatPct(value: number): string {
  return `${value.toFixed(1)}%`
}

function formatMonths(value: number): string {
  if (value >= 999) return 'N/A'
  if (value < 12) return `${value} months`
  const years = Math.floor(value / 12)
  const months = value % 12
  return months > 0 ? `${years}y ${months}m` : `${years} years`
}

function formatDate(): string {
  return new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
}

export function ROIBusinessCaseTemplate({ data, branding }: Props): React.ReactElement {
  const { primaryColour, companyName } = branding
  const roiResult = (data['roiResult'] ?? null) as RoiResult | null
  const financialModel = (data['financialModel'] ?? null) as Record<string, unknown> | null
  const org = (data['org'] ?? null) as Record<string, unknown> | null
  const opportunity = (data['opportunity'] ?? null) as Record<string, unknown> | null

  const orgName = (org?.['name'] as string | undefined) ?? 'Client'

  const implementationInvestment = financialModel?.['implementationInvestment']
    ? Number(financialModel['implementationInvestment'])
    : null
  const annualLicenceCost = financialModel?.['annualLicenceCost']
    ? Number(financialModel['annualLicenceCost'])
    : null
  const threeYearInvestment = implementationInvestment != null && annualLicenceCost != null
    ? implementationInvestment + annualLicenceCost * 3
    : null

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
    metricRow: {
      flexDirection: 'row',
      marginBottom: 8,
      gap: 12,
    },
    metricCard: {
      flex: 1,
      backgroundColor: '#f7fafc',
      borderRadius: 4,
      padding: 12,
      borderTopWidth: 3,
      borderTopColor: primaryColour,
    },
    metricLabel: {
      fontSize: 9,
      color: '#718096',
      marginBottom: 4,
      textTransform: 'uppercase',
    },
    metricValue: {
      fontSize: 16,
      fontFamily: 'Helvetica-Bold',
      color: primaryColour,
    },
    highlightCard: {
      backgroundColor: primaryColour,
      padding: 16,
      marginBottom: 8,
      flexDirection: 'row',
      gap: 16,
    },
    highlightItem: {
      flex: 1,
      alignItems: 'center',
    },
    highlightLabel: {
      fontSize: 9,
      color: '#d0dce8',
      textAlign: 'center',
      marginBottom: 4,
    },
    highlightValue: {
      fontSize: 18,
      fontFamily: 'Helvetica-Bold',
      color: '#ffffff',
      textAlign: 'center',
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
      paddingVertical: 6,
      paddingHorizontal: 8,
      borderBottomWidth: 1,
      borderBottomColor: '#e8edf2',
    },
    tableRowAlt: {
      flexDirection: 'row',
      paddingVertical: 6,
      paddingHorizontal: 8,
      borderBottomWidth: 1,
      borderBottomColor: '#e8edf2',
      backgroundColor: '#fafbfc',
    },
    tableRowHighlight: {
      flexDirection: 'row',
      paddingVertical: 8,
      paddingHorizontal: 8,
      borderBottomWidth: 1,
      borderBottomColor: '#e8edf2',
      backgroundColor: '#ebf4ff',
    },
    colScenario: {
      flex: 1,
      fontSize: 10,
    },
    colData: {
      flex: 2,
      fontSize: 10,
      textAlign: 'right',
    },
    colHeaderText: {
      fontFamily: 'Helvetica-Bold',
      fontSize: 10,
    },
    colBold: {
      fontFamily: 'Helvetica-Bold',
    },
    cashFlowRow: {
      flexDirection: 'row',
      paddingVertical: 6,
      paddingHorizontal: 8,
      borderBottomWidth: 1,
      borderBottomColor: '#e8edf2',
    },
    cashFlowLabel: {
      flex: 2,
      fontSize: 10,
    },
    cashFlowValue: {
      flex: 1,
      fontSize: 10,
      textAlign: 'right',
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
          <Text style={styles.headerTitle}>ROI Business Case</Text>
          <Text style={styles.headerDate}>{formatDate()} · {orgName}</Text>
        </View>

        <View style={styles.body}>
          {/* Section: Investment Summary */}
          <Text style={styles.sectionTitle}>Investment Summary</Text>
          <View style={styles.metricRow}>
            <View style={styles.metricCard}>
              <Text style={styles.metricLabel}>Implementation Investment</Text>
              <Text style={styles.metricValue}>
                {implementationInvestment != null ? formatCurrency(implementationInvestment) : '—'}
              </Text>
            </View>
            <View style={styles.metricCard}>
              <Text style={styles.metricLabel}>Annual Licence Cost</Text>
              <Text style={styles.metricValue}>
                {annualLicenceCost != null ? formatCurrency(annualLicenceCost) : '—'}
              </Text>
            </View>
            <View style={styles.metricCard}>
              <Text style={styles.metricLabel}>Total 3-Year Investment</Text>
              <Text style={styles.metricValue}>
                {threeYearInvestment != null ? formatCurrency(threeYearInvestment) : '—'}
              </Text>
            </View>
          </View>

          {/* Section: Financial Returns */}
          <Text style={styles.sectionTitle}>Financial Returns — Base Scenario</Text>
          {roiResult ? (
            <View style={styles.highlightCard}>
              <View style={styles.highlightItem}>
                <Text style={styles.highlightLabel}>Payback Period</Text>
                <Text style={styles.highlightValue}>{formatMonths(roiResult.base.paybackMonths)}</Text>
              </View>
              <View style={styles.highlightItem}>
                <Text style={styles.highlightLabel}>3-Year ROI</Text>
                <Text style={styles.highlightValue}>{formatPct(roiResult.base.threeYearRoiPct)}</Text>
              </View>
              <View style={styles.highlightItem}>
                <Text style={styles.highlightLabel}>Net Present Value</Text>
                <Text style={styles.highlightValue}>{formatCurrency(roiResult.base.npv)}</Text>
              </View>
              <View style={styles.highlightItem}>
                <Text style={styles.highlightLabel}>Annual Benefit</Text>
                <Text style={styles.highlightValue}>{formatCurrency(roiResult.base.annualBenefit)}</Text>
              </View>
            </View>
          ) : (
            <Text style={styles.noData}>
              ROI inputs not yet complete. Please provide all required inputs to generate ROI analysis.
            </Text>
          )}

          {/* Section: Sensitivity Analysis */}
          {roiResult && (
            <>
              <Text style={styles.sectionTitle}>Sensitivity Analysis</Text>
              <View style={styles.tableHeader}>
                <Text style={[styles.colScenario, styles.colHeaderText]}>Scenario</Text>
                <Text style={[styles.colData, styles.colHeaderText]}>Annual Benefit</Text>
                <Text style={[styles.colData, styles.colHeaderText]}>Payback</Text>
                <Text style={[styles.colData, styles.colHeaderText]}>3yr ROI</Text>
                <Text style={[styles.colData, styles.colHeaderText]}>NPV</Text>
              </View>
              {(['low', 'base', 'high'] as const).map((scenarioKey, i) => {
                const s = roiResult[scenarioKey]
                const isBase = scenarioKey === 'base'
                const rowStyle = isBase
                  ? styles.tableRowHighlight
                  : i % 2 === 0 ? styles.tableRow : styles.tableRowAlt
                return (
                  <View key={s.label} style={rowStyle}>
                    <Text style={[styles.colScenario, isBase ? styles.colBold : {}]}>{s.label}</Text>
                    <Text style={[styles.colData, isBase ? styles.colBold : {}]}>{formatCurrency(s.annualBenefit)}</Text>
                    <Text style={[styles.colData, isBase ? styles.colBold : {}]}>{formatMonths(s.paybackMonths)}</Text>
                    <Text style={[styles.colData, isBase ? styles.colBold : {}]}>{formatPct(s.threeYearRoiPct)}</Text>
                    <Text style={[styles.colData, isBase ? styles.colBold : {}]}>{formatCurrency(s.npv)}</Text>
                  </View>
                )
              })}
            </>
          )}

          {/* Section: Annual Benefit Breakdown */}
          {roiResult && (
            <>
              <Text style={styles.sectionTitle}>Annual Benefit Breakdown — Base Scenario</Text>
              <View style={styles.tableHeader}>
                <Text style={[styles.cashFlowLabel, styles.colHeaderText]}>Period</Text>
                <Text style={[styles.cashFlowValue, styles.colHeaderText]}>Net Cash Flow</Text>
              </View>
              {roiResult.base.cashFlowByYear.map((cf, i) => (
                <View key={i} style={i % 2 === 0 ? styles.cashFlowRow : { ...styles.cashFlowRow, backgroundColor: '#fafbfc' }}>
                  <Text style={styles.cashFlowLabel}>{`Year ${i + 1}`}</Text>
                  <Text style={[styles.cashFlowValue, { color: cf >= 0 ? '#276749' : '#c53030', fontFamily: 'Helvetica-Bold' }]}>
                    {formatCurrency(cf)}
                  </Text>
                </View>
              ))}
            </>
          )}

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
