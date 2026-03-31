import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import {
  BantRecordSchema,
  MeddpiccRecordSchema,
  BudgetStatus,
  Stage,
  evaluateBANT,
  scoreMEDDPICC,
  type BantRecordInput,
  type MeddpiccRecordInput,
  MEDDPICC_MAX_SCORE_PER_ELEMENT,
} from '@msas/shared'
import { qualificationApi } from '@/api/qualification'
import { opportunitiesApi } from '@/api/opportunities'
import { useAutoSave } from '@/hooks/useAutoSave'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScoreGauge } from '@/components/shared/ScoreGauge'
import { AlertTriangle, CheckCircle2, XCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

// ─── BANT Tab ────────────────────────────────────────────────────────────────

function BantTab({ oppId }: { oppId: string }) {
  const { data: savedBant, isLoading } = useQuery<BantRecordInput>({
    queryKey: ['bant', oppId],
    queryFn: () => qualificationApi.getBant(oppId).then((r) => r.data),
  })

  const {
    register,
    watch,
    formState: { errors },
  } = useForm<BantRecordInput>({
    resolver: zodResolver(BantRecordSchema),
    values: savedBant ?? undefined,
    defaultValues: {
      budgetStatus: BudgetStatus.UNKNOWN,
      authorityIdentified: false,
      needStatement: '',
    },
  })

  const saveMutation = useMutation({
    mutationFn: (data: BantRecordInput) => qualificationApi.putBant(oppId, data),
  })

  useAutoSave(watch, saveMutation)

  const values = watch()
  const bantPass = (() => {
    try {
      const parsed = BantRecordSchema.safeParse(values)
      return parsed.success ? evaluateBANT(parsed.data) : false
    } catch {
      return false
    }
  })()
  const authorityIdentified = watch('authorityIdentified')

  if (isLoading) return <div className="p-4 text-muted-foreground">Loading BANT data…</div>

  return (
    <div className="space-y-6">
      {/* Pass/fail badge */}
      <div className="flex items-center gap-3">
        {bantPass ? (
          <>
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            <Badge variant="success" className="text-sm px-3 py-1">BANT Pass</Badge>
            <span className="text-sm text-muted-foreground">All four criteria met</span>
          </>
        ) : (
          <>
            <XCircle className="h-5 w-5 text-red-500" />
            <Badge variant="danger" className="text-sm px-3 py-1">BANT Fail</Badge>
            <span className="text-sm text-muted-foreground">Complete all fields to qualify</span>
          </>
        )}
      </div>

      <form className="space-y-5">
        {/* Budget Status */}
        <div className="space-y-2">
          <Label>Budget status *</Label>
          <div className="flex gap-3">
            {Object.values(BudgetStatus).map((s) => (
              <label
                key={s}
                className={cn(
                  'flex items-center gap-2 border rounded-md px-4 py-2 cursor-pointer text-sm transition-colors',
                  watch('budgetStatus') === s
                    ? 'border-primary bg-primary/5 font-medium'
                    : 'border-input hover:bg-gray-50',
                )}
              >
                <input type="radio" value={s} {...register('budgetStatus')} className="sr-only" />
                {s === BudgetStatus.CONFIRMED
                  ? 'Confirmed'
                  : s === BudgetStatus.INDICATIVE
                  ? 'Indicative'
                  : 'Unknown'}
              </label>
            ))}
          </div>
          {errors.budgetStatus && (
            <p className="text-xs text-destructive">{errors.budgetStatus.message}</p>
          )}
        </div>

        {/* Authority */}
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <input
              id="authorityIdentified"
              type="checkbox"
              className="h-4 w-4 rounded border-gray-300"
              {...register('authorityIdentified')}
            />
            <Label htmlFor="authorityIdentified">Economic buyer / authority identified</Label>
          </div>
          {authorityIdentified && (
            <div className="ml-7 space-y-2">
              <Label htmlFor="authorityRole">Authority role / title</Label>
              <Input
                id="authorityRole"
                placeholder="e.g. CFO, Finance Director"
                {...register('authorityRole')}
              />
            </div>
          )}
        </div>

        {/* Need */}
        <div className="space-y-2">
          <Label htmlFor="needStatement">Pain / need statement *</Label>
          <textarea
            id="needStatement"
            rows={3}
            placeholder="Describe the business pain or problem that needs solving…"
            className={cn(
              'flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
              errors.needStatement && 'border-destructive',
            )}
            {...register('needStatement')}
          />
          {errors.needStatement && (
            <p className="text-xs text-destructive">{errors.needStatement.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="needCategory">Need category</Label>
          <Input
            id="needCategory"
            placeholder="e.g. ERP replacement, financial consolidation"
            {...register('needCategory')}
          />
        </div>

        {/* Timeline */}
        <div className="space-y-2">
          <Label htmlFor="timelineDate">
            Target go-live date{' '}
            <span className="text-muted-foreground font-normal text-xs">(must be within 18 months)</span>
          </Label>
          <Input id="timelineDate" type="date" {...register('timelineDate')} />
        </div>

        {saveMutation.isPending && (
          <p className="text-xs text-muted-foreground">Saving…</p>
        )}
      </form>
    </div>
  )
}

// ─── MEDDPICC Element Row ─────────────────────────────────────────────────────

interface MeddpiccElementProps {
  label: string
  scoreKey: keyof MeddpiccRecordInput
  notesKey?: keyof MeddpiccRecordInput
  extraFields?: Array<{ key: keyof MeddpiccRecordInput; label: string; placeholder?: string }>
  currentScore: number
  register: ReturnType<typeof useForm<MeddpiccRecordInput>>['register']
  watch: ReturnType<typeof useForm<MeddpiccRecordInput>>['watch']
}

function MeddpiccElement({
  label,
  scoreKey,
  notesKey,
  extraFields,
  currentScore,
  register,
}: MeddpiccElementProps) {
  const pct = Math.round((currentScore / MEDDPICC_MAX_SCORE_PER_ELEMENT) * 100)

  return (
    <div className="border rounded-lg p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-sm">{label}</h3>
        <ScoreGauge pct={pct} size="sm" />
      </div>

      {/* Slider */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>0</span>
          <span className="font-medium text-foreground">Score: {currentScore} / 10</span>
          <span>10</span>
        </div>
        <input
          type="range"
          min={0}
          max={10}
          step={1}
          className="w-full accent-primary"
          {...register(scoreKey, { valueAsNumber: true })}
        />
      </div>

      {/* Extra named fields */}
      {extraFields?.map((f) => (
        <div key={String(f.key)} className="space-y-1">
          <Label className="text-xs">{f.label}</Label>
          <Input
            placeholder={f.placeholder}
            className="h-8 text-sm"
            {...register(f.key)}
          />
        </div>
      ))}

      {/* Notes */}
      {notesKey && (
        <div className="space-y-1">
          <Label className="text-xs">Notes</Label>
          <textarea
            rows={2}
            className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            placeholder="Supporting evidence, context…"
            {...register(notesKey)}
          />
        </div>
      )}
    </div>
  )
}

// ─── MEDDPICC Tab ─────────────────────────────────────────────────────────────

function MeddpiccTab({ oppId, bantPass }: { oppId: string; bantPass: boolean }) {
  const navigate = useNavigate()
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)

  const { data: savedMeddpicc, isLoading } = useQuery<Partial<MeddpiccRecordInput>>({
    queryKey: ['meddpicc', oppId],
    queryFn: () => qualificationApi.getMeddpicc(oppId).then((r) => r.data),
  })

  const { register, watch } = useForm<MeddpiccRecordInput>({
    resolver: zodResolver(MeddpiccRecordSchema),
    values: savedMeddpicc as MeddpiccRecordInput | undefined,
    defaultValues: {
      metricsScore: 0,
      economicBuyerScore: 0,
      decisionCriteriaScore: 0,
      decisionProcessScore: 0,
      paperProcessScore: 0,
      painScore: 0,
      championScore: 0,
      competitionScore: 0,
    },
  })

  const saveMutation = useMutation({
    mutationFn: (data: Partial<MeddpiccRecordInput>) => qualificationApi.putMeddpicc(oppId, data),
  })

  const advanceMutation = useMutation({
    mutationFn: () =>
      opportunitiesApi.update(oppId, { stage: Stage.DISCOVERY }).then((r) => r.data),
    onSuccess: () => navigate(`/app/opportunities/${oppId}/discovery`),
  })

  useAutoSave(watch, saveMutation)

  const values = watch()
  const scoreResult = scoreMEDDPICC(values)

  const handleProceed = () => {
    if (scoreResult.isWarning) {
      setShowConfirmDialog(true)
    } else {
      advanceMutation.mutate()
    }
  }

  if (isLoading) return <div className="p-4 text-muted-foreground">Loading MEDDPICC data…</div>

  const elements: MeddpiccElementProps[] = [
    {
      label: 'M — Metrics',
      scoreKey: 'metricsScore',
      notesKey: 'metricsNotes',
      currentScore: scoreResult.elementScores.metrics,
      register,
      watch,
    },
    {
      label: 'E — Economic Buyer',
      scoreKey: 'economicBuyerScore',
      notesKey: undefined,
      extraFields: [
        { key: 'economicBuyerName', label: 'Name', placeholder: 'e.g. Jane Smith' },
        { key: 'economicBuyerRole', label: 'Role / title', placeholder: 'e.g. CFO' },
        { key: 'economicBuyerEngagement', label: 'Engagement level', placeholder: 'e.g. Champion, Aware, Unengaged' },
      ],
      currentScore: scoreResult.elementScores.economicBuyer,
      register,
      watch,
    },
    {
      label: 'D — Decision Criteria',
      scoreKey: 'decisionCriteriaScore',
      notesKey: 'decisionCriteriaNotes',
      currentScore: scoreResult.elementScores.decisionCriteria,
      register,
      watch,
    },
    {
      label: 'D — Decision Process',
      scoreKey: 'decisionProcessScore',
      notesKey: 'decisionProcessNotes',
      currentScore: scoreResult.elementScores.decisionProcess,
      register,
      watch,
    },
    {
      label: 'P — Paper Process',
      scoreKey: 'paperProcessScore',
      notesKey: 'paperProcessNotes',
      currentScore: scoreResult.elementScores.paperProcess,
      register,
      watch,
    },
    {
      label: 'I — (Identified) Pain',
      scoreKey: 'painScore',
      notesKey: 'painNotes',
      currentScore: scoreResult.elementScores.pain,
      register,
      watch,
    },
    {
      label: 'C — Champion',
      scoreKey: 'championScore',
      notesKey: undefined,
      extraFields: [
        { key: 'championName', label: 'Champion name', placeholder: 'e.g. John Doe' },
        { key: 'championRole', label: 'Champion role', placeholder: 'e.g. IT Director' },
      ],
      currentScore: scoreResult.elementScores.champion,
      register,
      watch,
    },
    {
      label: 'C — Competition',
      scoreKey: 'competitionScore',
      notesKey: 'competitionNotes',
      currentScore: scoreResult.elementScores.competition,
      register,
      watch,
    },
  ]

  return (
    <div className="space-y-6">
      {/* Overall score */}
      <div className="flex items-center gap-6 p-4 border rounded-lg bg-gray-50">
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Overall MEDDPICC</p>
          <ScoreGauge pct={scoreResult.totalPct} size="lg" />
        </div>
        <div className="text-sm text-muted-foreground">
          {scoreResult.totalRaw} / 80 raw score
        </div>
      </div>

      {/* Warning banner */}
      {scoreResult.isWarning && (
        <div className="flex items-start gap-3 rounded-md bg-amber-50 border border-amber-200 p-4">
          <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-amber-800">Low MEDDPICC score</p>
            <p className="text-sm text-amber-700">
              Consider strengthening qualification before proceeding to Discovery.
            </p>
          </div>
        </div>
      )}

      {/* Elements grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {elements.map((el) => (
          <MeddpiccElement key={String(el.scoreKey)} {...el} />
        ))}
      </div>

      {saveMutation.isPending && (
        <p className="text-xs text-muted-foreground">Saving…</p>
      )}

      {/* Proceed button */}
      <div className="flex justify-end pt-2">
        <Button
          onClick={handleProceed}
          disabled={!bantPass || advanceMutation.isPending}
          title={!bantPass ? 'BANT pre-screen must pass before proceeding' : undefined}
        >
          {advanceMutation.isPending ? 'Advancing…' : 'Proceed to Discovery'}
        </Button>
      </div>
      {!bantPass && (
        <p className="text-xs text-muted-foreground text-right">
          Complete the BANT pre-screen to unlock this button.
        </p>
      )}

      {/* Confirmation dialog for low MEDDPICC */}
      {showConfirmDialog && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-6 w-6 text-amber-500 shrink-0" />
              <div>
                <h2 className="font-semibold text-lg">Low MEDDPICC score</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Your MEDDPICC score is {scoreResult.totalPct}%, which is below the 50% threshold.
                  Are you sure you want to proceed to Discovery?
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={() => setShowConfirmDialog(false)}>
                Go back
              </Button>
              <Button
                onClick={() => {
                  setShowConfirmDialog(false)
                  advanceMutation.mutate()
                }}
                disabled={advanceMutation.isPending}
              >
                Proceed anyway
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── QualificationPage ────────────────────────────────────────────────────────

export function QualificationPage() {
  const { id } = useParams<{ id: string }>()
  const oppId = id!
  const [activeTab, setActiveTab] = useState<'bant' | 'meddpicc'>('bant')

  // We need bantPass to gate the MEDDPICC proceed button
  const { data: savedBant } = useQuery<BantRecordInput>({
    queryKey: ['bant', oppId],
    queryFn: () => qualificationApi.getBant(oppId).then((r) => r.data),
  })

  const bantPass = (() => {
    if (!savedBant) return false
    try {
      const parsed = BantRecordSchema.safeParse(savedBant)
      return parsed.success ? evaluateBANT(parsed.data) : false
    } catch {
      return false
    }
  })()

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Qualification</h2>
        <p className="text-sm text-muted-foreground">
          Complete BANT pre-screening then score MEDDPICC to unlock Discovery.
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b">
        <nav className="flex gap-0 -mb-px">
          {(['bant', 'meddpicc'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                'px-5 py-3 text-sm font-medium border-b-2 transition-colors',
                activeTab === tab
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground',
              )}
            >
              {tab === 'bant' ? 'BANT Pre-Screen' : 'MEDDPICC Scoring'}
              {tab === 'bant' && (
                <span className="ml-2">
                  {bantPass ? (
                    <Badge variant="success" className="text-xs">Pass</Badge>
                  ) : (
                    <Badge variant="danger" className="text-xs">Fail</Badge>
                  )}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab content */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {activeTab === 'bant' ? 'BANT Pre-Screen' : 'MEDDPICC Scoring'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {activeTab === 'bant' ? (
            <BantTab oppId={oppId} />
          ) : (
            <MeddpiccTab oppId={oppId} bantPass={bantPass} />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
