import { Link, NavLink, Outlet, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ChevronLeft, CheckCircle2, Circle, Lock } from 'lucide-react'
import { opportunitiesApi } from '@/api/opportunities'
import { useOpportunityStage } from '@/hooks/useOpportunityStage'
import { Stage, STAGE_ORDER } from '@msas/shared'
import { cn } from '@/lib/utils'

const STEP_CONFIG: { stage: Stage; label: string; path: string }[] = [
  { stage: Stage.QUALIFICATION, label: 'Qualification', path: 'qualification' },
  { stage: Stage.DISCOVERY,     label: 'Discovery',     path: 'discovery' },
  { stage: Stage.COI,           label: 'Cost of Inaction', path: 'coi' },
  { stage: Stage.ROI,           label: 'ROI Builder',   path: 'roi' },
  { stage: Stage.COMPLETE,      label: 'Proposals',     path: 'proposals' },
]

export function OpportunityLayout() {
  const { id } = useParams<{ id: string }>()
  const { canAccess, currentStage } = useOpportunityStage(id!)

  const { data: opp } = useQuery({
    queryKey: ['opportunity', id],
    queryFn:  () => opportunitiesApi.get(id!).then(r => r.data),
    enabled:  !!id,
  })

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4">
        <Link to="/app/opportunities" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-2">
          <ChevronLeft className="h-4 w-4" /> Back to opportunities
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold">{opp?.name ?? 'Loading...'}</h1>
            <p className="text-sm text-muted-foreground">{opp?.organisation?.name}</p>
          </div>
          {opp?.meddpiccScore != null && (
            <div className="text-right">
              <p className="text-xs text-muted-foreground">MEDDPICC</p>
              <p className="text-2xl font-bold">{opp.meddpiccScore}%</p>
            </div>
          )}
        </div>
      </div>

      {/* Step navigation */}
      <div className="bg-white border-b px-6">
        <nav className="flex gap-0">
          {STEP_CONFIG.map((step, idx) => {
            const accessible = canAccess(step.stage)
            const isCurrent = currentStage === step.stage
            const isDone = currentStage != null && STAGE_ORDER.indexOf(currentStage) > STAGE_ORDER.indexOf(step.stage)

            return (
              <NavLink
                key={step.stage}
                to={accessible ? step.path : '#'}
                onClick={e => !accessible && e.preventDefault()}
                className={({ isActive }) =>
                  cn('flex items-center gap-2 px-4 py-4 text-sm border-b-2 transition-colors',
                    isActive && accessible ? 'border-primary text-primary font-medium'
                    : isCurrent ? 'border-primary/50 text-primary/70'
                    : isDone ? 'border-transparent text-muted-foreground hover:text-foreground'
                    : 'border-transparent text-muted-foreground/50 cursor-not-allowed')
                }
              >
                {isDone ? (
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                ) : !accessible ? (
                  <Lock className="h-3 w-3" />
                ) : (
                  <Circle className="h-4 w-4" />
                )}
                <span className="hidden sm:inline">{idx + 1}. {step.label}</span>
                <span className="sm:hidden">{idx + 1}</span>
              </NavLink>
            )
          })}
        </nav>
      </div>

      {/* Step content */}
      <div className="flex-1 overflow-auto p-6">
        <Outlet />
      </div>
    </div>
  )
}
