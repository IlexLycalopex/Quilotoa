import { renderToBuffer } from '@react-pdf/renderer'
import React from 'react'
import { DocumentType, type TenantConfig } from '@msas/shared'
import { COISummaryTemplate } from './templates/COISummaryTemplate.js'
import { ROIBusinessCaseTemplate } from './templates/ROIBusinessCaseTemplate.js'
import { DiscoverySummaryTemplate } from './templates/DiscoverySummaryTemplate.js'

/**
 * Generates a PDF buffer for the given document type, data and tenant config.
 */
export async function generatePdf(
  documentType: DocumentType,
  data: Record<string, unknown>,
  tenantConfig: TenantConfig,
): Promise<Buffer> {
  const branding = {
    primaryColour: tenantConfig.branding?.primaryColour ?? '#1e3a5f',
    companyName: tenantConfig.branding?.companyName ?? 'MSAS',
  }

  let element: React.ReactElement

  switch (documentType) {
    case DocumentType.COI_SUMMARY:
      element = React.createElement(COISummaryTemplate, { data, branding })
      break

    case DocumentType.ROI_BUSINESS_CASE:
      element = React.createElement(ROIBusinessCaseTemplate, { data, branding })
      break

    case DocumentType.DISCOVERY_SUMMARY:
      element = React.createElement(DiscoverySummaryTemplate, { data, branding })
      break

    default:
      throw new Error(`Unsupported document type: ${documentType as string}`)
  }

  const buffer = await renderToBuffer(element)
  return Buffer.from(buffer)
}
