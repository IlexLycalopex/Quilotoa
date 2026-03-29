import React from 'react'
import { Document, Page, View, Text, StyleSheet } from '@react-pdf/renderer'

interface CoiLineItem {
  label: string
  annual: number
  benchmarkAnnual: number
  isAboveBenchmark: boolean
}

interface CoiResult {
  lines: CoiLineItem[]
  totalAnnual: number
  benchmarkTotalAnnual: number
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

function formatDate(): string {
  return new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
}

export function COISummaryTemplate({ data, branding }: Props): React.ReactElement {
  const { primaryColour, companyName } = branding
  const coiResult = (data['coiResult'] ?? null) as CoiResult | null

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
    colLabel: {
      flex: 3,
      fontSize: 10,
    },
    colValue: {
      flex: 2,
      fontSize: 10,
      textAlign: 'right',
    },
    colStatus: {
      flex: 1,
      fontSize: 9,
      textAlign: 'center',
    },
    colHeaderText: {
      fontFamily: 'Helvetica-Bold',
      fontSize: 10,
    },
    totalRow: {
      flexDirection: 'row',
      paddingVertical: 10,
      paddingHorizontal: 8,
      backgroundColor: primaryColour,
      marginTop: 4,
    },
    totalLabel: {
      flex: 3,
      fontSize: 12,
      fontFamily: 'Helvetica-Bold',
      color: '#ffffff',
    },
    totalValue: {
      flex: 2,
      fontSize: 14,
      fontFamily: 'Helvetica-Bold',
      color: '#ffffff',
      textAlign: 'right',
    },
    totalStatusPlaceholder: {
      flex: 1,
    },
    narrativeBox: {
      backgroundColor: '#f7fafc',
      borderLeftWidth: 3,
      borderLeftColor: primaryColour,
      padding: 12,
      marginTop: 8,
    },
    narrativeText: {
      fontSize: 10,
      lineHeight: 1.6,
      color: '#2d3748',
    },
    statusAbove: {
      color: '#c53030',
      fontFamily: 'Helvetica-Bold',
    },
    statusAt: {
      color: '#276749',
      fontFamily: 'Helvetica-Bold',
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

  const opportunity = data['opportunity'] as Record<string, unknown> | undefined
  const org = data['org'] as Record<string, unknown> | undefined

  const orgName = (org?.['name'] as string | undefined) ?? 'Client'
  const totalAnnual = coiResult?.totalAnnual ?? 0

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerCompany}>{companyName}</Text>
          <Text style={styles.headerTitle}>Cost of Inaction Summary</Text>
          <Text style={styles.headerDate}>{formatDate()} · {orgName}</Text>
        </View>

        <View style={styles.body}>
          {/* Section: Current State Cost Analysis */}
          <Text style={styles.sectionTitle}>Current State Cost Analysis</Text>

          {coiResult ? (
            <>
              {/* Table header */}
              <View style={styles.tableHeader}>
                <Text style={[styles.colLabel, styles.colHeaderText]}>Cost Driver</Text>
                <Text style={[styles.colValue, styles.colHeaderText]}>Annual Cost</Text>
                <Text style={[styles.colValue, styles.colHeaderText]}>Benchmark</Text>
                <Text style={[styles.colStatus, styles.colHeaderText]}>Status</Text>
              </View>

              {/* Table rows */}
              {coiResult.lines.map((line, i) => (
                <View key={line.label} style={i % 2 === 0 ? styles.tableRow : styles.tableRowAlt}>
                  <Text style={styles.colLabel}>{line.label}</Text>
                  <Text style={styles.colValue}>{formatCurrency(line.annual)}</Text>
                  <Text style={styles.colValue}>
                    {line.benchmarkAnnual > 0 ? formatCurrency(line.benchmarkAnnual) : '—'}
                  </Text>
                  <Text style={[styles.colStatus, line.isAboveBenchmark ? styles.statusAbove : styles.statusAt]}>
                    {line.isAboveBenchmark ? 'Above' : 'At/Below'}
                  </Text>
                </View>
              ))}

              {/* Total row */}
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Total Annual Cost of Inaction</Text>
                <Text style={styles.totalValue}>{formatCurrency(totalAnnual)}</Text>
                <View style={styles.totalStatusPlaceholder} />
              </View>
            </>
          ) : (
            <Text style={styles.noData}>
              COI inputs not yet complete. Please provide all required inputs to generate cost analysis.
            </Text>
          )}

          {/* Section: Benchmark Comparison */}
          <Text style={styles.sectionTitle}>Benchmark Comparison</Text>
          <View style={styles.narrativeBox}>
            <Text style={styles.narrativeText}>
              {`Your finance team is currently incurring an estimated ${formatCurrency(totalAnnual)} in annual costs attributable to the current system — comprising inefficiencies in data re-entry, month-end close overhead, error rework, audit preparation, delayed reporting, and legacy IT support.`}
              {coiResult && coiResult.benchmarkTotalAnnual > 0
                ? `\n\nBest-practice organisations of comparable size typically incur ${formatCurrency(coiResult.benchmarkTotalAnnual)} in equivalent costs. Addressing these inefficiencies represents a material opportunity to reduce operational expenditure and redeploy finance resource toward higher-value activities.`
                : ''}
            </Text>
          </View>

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
