import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Plus, Search, AlertCircle } from 'lucide-react'
import { opportunitiesApi } from '@/api/opportunities'
import { Stage } from '@msas/shared'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { ScoreGauge } from '@/components/shared/ScoreGauge'

type BadgeVariant = 'default' | 'secondary' | 'warning' | 'success'

const STAGE_BADGE: Record<Stage, BadgeVariant> = {
  [Stage.QUALIFICATION]: 'default',
  [Stage.DISCOVERY]: 'secondary',
  [Stage.COI]: 'warning',
  [Stage.ROI]: 'warning',
  [Stage.COMPLETE]: 'success',
}

const STAGE_LABEL: Record<Stage, string> = {
  [Stage.QUALIFICATION]: 'Qualification',
  [Stage.DISCOVERY]: 'Discovery',
  [Stage.COI]: 'Cost of Inaction',
  [Stage.ROI]: 'ROI Builder',
  [Stage.COMPLETE]: 'Complete',
}

interface Opportunity {
  id: string
  name: string
  stage: Stage
  meddpiccScore: number | null
  createdAt: string
  organisation?: { name: string }
  owner?: { fullName: string }
}

const ALL_STAGES = 'ALL'

export function OpportunitiesPage() {
  const [search, setSearch] = useState('')
  const [stageFilter, setStageFilter] = useState<Stage | typeof ALL_STAGES>(ALL_STAGES)

  const { data, isLoading, isError } = useQuery<Opportunity[]>({
    queryKey: ['opportunities'],
    queryFn: () => opportunitiesApi.list().then((r) => r.data),
  })

  const opportunities = data ?? []

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return opportunities.filter((opp) => {
      const matchesSearch =
        !q ||
        opp.name.toLowerCase().includes(q) ||
        (opp.organisation?.name ?? '').toLowerCase().includes(q)
      const matchesStage = stageFilter === ALL_STAGES || opp.stage === stageFilter
      return matchesSearch && matchesStage
    })
  }, [opportunities, search, stageFilter])

  return (
    <div className="p-6 space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Opportunities</h1>
          <p className="text-sm text-muted-foreground">
            {isLoading ? 'Loading…' : `${opportunities.length} total`}
          </p>
        </div>
        <Button asChild>
          <Link to="/app/opportunities/new">
            <Plus className="h-4 w-4 mr-2" />
            New Opportunity
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Search by name or organisation…"
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
          value={stageFilter}
          onChange={(e) => setStageFilter(e.target.value as Stage | typeof ALL_STAGES)}
        >
          <option value={ALL_STAGES}>All stages</option>
          {Object.values(Stage).map((s) => (
            <option key={s} value={s}>
              {STAGE_LABEL[s]}
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 text-center text-muted-foreground">Loading…</div>
          ) : isError ? (
            <div className="p-6 flex items-center gap-2 text-destructive">
              <AlertCircle className="h-4 w-4" />
              Failed to load opportunities.
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-6 text-center text-muted-foreground">
              {search || stageFilter !== ALL_STAGES
                ? 'No opportunities match your filters.'
                : 'No opportunities yet. Create your first one.'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-left px-6 py-3 font-medium text-muted-foreground">Name</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Organisation</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Stage</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">MEDDPICC</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Owner</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Created</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((opp) => (
                    <tr
                      key={opp.id}
                      className="border-b last:border-0 hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-3 font-medium">{opp.name}</td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {opp.organisation?.name ?? '—'}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={STAGE_BADGE[opp.stage]}>
                          {STAGE_LABEL[opp.stage]}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        {opp.meddpiccScore != null ? (
                          <ScoreGauge pct={opp.meddpiccScore} size="sm" />
                        ) : (
                          <span className="text-muted-foreground text-xs">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {opp.owner?.fullName ?? '—'}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {new Date(opp.createdAt).toLocaleDateString('en-GB')}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button variant="outline" size="sm" asChild>
                          <Link to={`/app/opportunities/${opp.id}/qualification`}>Open</Link>
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
