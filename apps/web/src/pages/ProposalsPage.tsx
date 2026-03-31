import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { proposalsApi } from '@/api/proposals'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { DocumentType } from '@msas/shared'
import { FileText, Download, RefreshCw, Loader2 } from 'lucide-react'

const DOCUMENT_CONFIG: Record<DocumentType, { label: string; description: string }> = {
  [DocumentType.COI_SUMMARY]: {
    label: 'Cost of Inaction Summary',
    description: 'Current-state cost breakdown by category, annualised total, and benchmark comparisons. Formatted for CFO presentation.',
  },
  [DocumentType.ROI_BUSINESS_CASE]: {
    label: 'ROI Business Case',
    description: 'Investment summary, payback period, 3-year ROI, NPV, and sensitivity scenarios. Full financial business case.',
  },
  [DocumentType.DISCOVERY_SUMMARY]: {
    label: 'Discovery & Solution Summary',
    description: 'Confirmed solution recommendation, key requirements captured, solution fit rationale, and proposed next steps.',
  },
}

interface Proposal {
  id: string
  documentType: DocumentType
  version: number
  status: string
  createdAt: string
}

function DocumentCard({ oppId, docType, proposals }: { oppId: string; docType: DocumentType; proposals: Proposal[] }) {
  const qc = useQueryClient()
  const latest = proposals
    .filter(p => p.documentType === docType)
    .sort((a, b) => b.version - a.version)[0]

  const generate = useMutation({
    mutationFn: () => proposalsApi.generate(oppId, docType),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['proposals', oppId] }),
  })

  const [downloading, setDownloading] = useState(false)
  const handleDownload = async () => {
    if (!latest) return
    setDownloading(true)
    try {
      const res = await proposalsApi.download(oppId, latest.id)
      const url = URL.createObjectURL(res.data as Blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${DOCUMENT_CONFIG[docType].label} v${latest.version}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } finally {
      setDownloading(false)
    }
  }

  const { label, description } = DOCUMENT_CONFIG[docType]

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-md bg-primary/10">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-base">{label}</CardTitle>
              {latest && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  v{latest.version} · {new Date(latest.createdAt).toLocaleDateString('en-GB')}
                  {' '}
                  <Badge variant={latest.status === 'FINAL' ? 'success' : 'secondary'} className="text-xs py-0">
                    {latest.status}
                  </Badge>
                </p>
              )}
            </div>
          </div>
          <div className="flex gap-2 shrink-0">
            {latest && (
              <Button
                size="sm" variant="outline"
                onClick={handleDownload} disabled={downloading}
              >
                {downloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                <span className="ml-1 hidden sm:inline">Download</span>
              </Button>
            )}
            <Button
              size="sm"
              onClick={() => generate.mutate()} disabled={generate.isPending}
              variant={latest ? 'outline' : 'default'}
            >
              {generate.isPending
                ? <><Loader2 className="h-4 w-4 animate-spin mr-1" /> Generating…</>
                : <><RefreshCw className="h-4 w-4 mr-1" /> {latest ? 'Regenerate' : 'Generate'}</>
              }
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <CardDescription className="text-sm">{description}</CardDescription>
        {generate.error && (
          <p className="text-xs text-destructive mt-2">Generation failed. Ensure COI and ROI data are complete.</p>
        )}
      </CardContent>
    </Card>
  )
}

export function ProposalsPage() {
  const { id: oppId } = useParams<{ id: string }>()

  const { data: proposals = [], isLoading } = useQuery<Proposal[]>({
    queryKey: ['proposals', oppId],
    queryFn: () => proposalsApi.list(oppId!).then(r => r.data),
    enabled: !!oppId,
  })

  if (!oppId) return null

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Proposals</h2>
        <p className="text-sm text-muted-foreground">
          Generate and download CFO-ready documents from your completed analysis
        </p>
      </div>

      {isLoading ? (
        <div className="flex items-center gap-2 text-muted-foreground py-8">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading proposals…
        </div>
      ) : (
        <div className="space-y-4">
          {Object.values(DocumentType).map(docType => (
            <DocumentCard key={docType} oppId={oppId} docType={docType} proposals={proposals} />
          ))}
        </div>
      )}

      <div className="p-4 rounded-md bg-muted text-sm text-muted-foreground">
        <strong>Note:</strong> Documents are generated as point-in-time snapshots. Regenerate after updating COI or ROI inputs to reflect the latest figures.
      </div>
    </div>
  )
}
