import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Plus, TrendingUp, AlertCircle } from 'lucide-react'
import { opportunitiesApi } from '@/api/opportunities'
import { Stage } from '@msas/shared'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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

export function DashboardPage() {
  const { data, isLoading, isError } = useQuery<Opportunity[]>({
    queryKey: ['opportunities'],
    queryFn: () => opportunitiesApi.list().then((r) => r.data),
  })

  const opportunities = data ?? []

  const stats = useMemo(() => {
    const total = opportunities.length
    const byStageCounts = Object.values(Stage).reduce<Record<Stage, number>>(
      (acc, s) => {
        acc[s] = opportunities.filter((o) => o.stage === s).length
        return acc
      },
      {} as Record<Stage, number>,
    )
    const scored = opportunities.filter((o) => o.meddpiccScore != null)
    const avgMeddpicc =
      scored.length > 0
        ? Math.round(scored.reduce((sum, o) => sum + (o.meddpiccScore ?? 0), 0) / scored.length)
        : null
    return { total, byStageCounts, avgMeddpicc }
  }, [opportunities])

  const recent = useMemo(
    () =>
      [...opportunities]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 10),
    [opportunities],
  )

  return (
    <div className="p-6 space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Overview of your pipeline</p>
        </div>
        <Button asChild>
          <Link to="/app/opportunities/new">
            <Plus className="h-4 w-4 mr-2" />
            New Opportunity
          </Link>
        </Button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Opportunities
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{isLoading ? '—' : stats.total}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              In Qualification
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">
              {isLoading ? '—' : stats.byStageCounts[Stage.QUALIFICATION]}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              In Discovery+
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">
              {isLoading
                ? '—'
                : stats.byStageCounts[Stage.DISCOVERY] +
                  stats.byStageCounts[Stage.COI] +
                  stats.byStageCounts[Stage.ROI]}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
              <TrendingUp className="h-4 w-4" />
              Avg MEDDPICC
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-3xl font-bold">—</p>
            ) : stats.avgMeddpicc != null ? (
              <ScoreGauge pct={stats.avgMeddpicc} size="md" />
            ) : (
              <p className="text-sm text-muted-foreground">No scores yet</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent opportunities table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent Opportunities</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 text-center text-muted-foreground">Loading…</div>
          ) : isError ? (
            <div className="p-6 flex items-center gap-2 text-destructive">
              <AlertCircle className="h-4 w-4" />
              Failed to load opportunities.
            </div>
          ) : recent.length === 0 ? (
            <div className="p-6 text-center text-muted-foreground">
              No opportunities yet.{' '}
              <Link to="/app/opportunities/new" className="underline">
                Create your first one.
              </Link>
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
                  </tr>
                </thead>
                <tbody>
                  {recent.map((opp) => (
                    <tr key={opp.id} className="border-b last:border-0 hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-3 font-medium">
                        <Link
                          to={`/app/opportunities/${opp.id}/qualification`}
                          className="hover:underline text-primary"
                        >
                          {opp.name}
                        </Link>
                      </td>
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
                          <span className="text-muted-foreground text-xs">Not scored</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {opp.owner?.fullName ?? '—'}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {new Date(opp.createdAt).toLocaleDateString('en-GB')}
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
