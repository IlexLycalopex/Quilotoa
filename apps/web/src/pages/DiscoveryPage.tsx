import { useState, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useParams } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import {
  DiscoveryDatasetSchema,
  type DiscoveryDatasetInput,
  Solution,
  ProductionModel,
  MigrationScope,
  ItReadiness,
  recommendSolution,
  type SolutionRecommendation,
} from '@msas/shared'
import { discoveryApi } from '@/api/discovery'
import { opportunitiesApi } from '@/api/opportunities'
import { useAutoSave } from '@/hooks/useAutoSave'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { ChevronDown, ChevronRight, CheckCircle2, AlertCircle } from 'lucide-react'

// ─── Section types ────────────────────────────────────────────────────────────

interface SectionProps {
  register: ReturnType<typeof useForm<DiscoveryDatasetInput>>['register']
  watch: ReturnType<typeof useForm<DiscoveryDatasetInput>>['watch']
  setValue: ReturnType<typeof useForm<DiscoveryDatasetInput>>['setValue']
}

interface DiscoverySectionDef {
  key: string
  label: string
  component: React.FC<SectionProps>
  visibleWhen?: (solution: Solution | null, values: Partial<DiscoveryDatasetInput>) => boolean
}

// ─── Section implementations ───────────────────────────────────────────────

function OrgProfileSection({ register }: SectionProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label htmlFor="currentErp">Current ERP / system</Label>
        <Input id="currentErp" placeholder="e.g. Sage 200, SAP Business One" {...register('currentErp')} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="goLiveTarget">Target go-live date</Label>
        <Input id="goLiveTarget" type="date" {...register('goLiveTarget')} />
      </div>
    </div>
  )
}

function FinancialOpsSection({ register, watch, setValue }: SectionProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label htmlFor="financeTeamSize">Finance team size (FTEs)</Label>
        <Input id="financeTeamSize" type="number" min={1} {...register('financeTeamSize', { valueAsNumber: true })} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="monthEndDaysActual">Month-end close days (actual)</Label>
        <Input id="monthEndDaysActual" type="number" step="0.1" min={0} {...register('monthEndDaysActual', { valueAsNumber: true })} />
      </div>
      <div className="flex items-center gap-3 md:col-span-2">
        <input id="multiEntity" type="checkbox" className="h-4 w-4 rounded"
          checked={watch('multiEntity') ?? false}
          onChange={(e) => setValue('multiEntity', e.target.checked)} />
        <Label htmlFor="multiEntity">Multi-entity / multi-company required</Label>
      </div>
      <div className="flex items-center gap-3 md:col-span-2">
        <input id="multiCurrency" type="checkbox" className="h-4 w-4 rounded"
          checked={watch('multiCurrency') ?? false}
          onChange={(e) => setValue('multiCurrency', e.target.checked)} />
        <Label htmlFor="multiCurrency">Multi-currency transactions</Label>
      </div>
      <div className="space-y-2 md:col-span-2">
        <Label htmlFor="reportingRequirements">Reporting requirements</Label>
        <textarea id="reportingRequirements" rows={2}
          className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          placeholder="Describe management reporting, board packs, regulatory requirements…"
          {...register('reportingRequirements')} />
      </div>
    </div>
  )
}

function ManufacturingSection({ register, watch, setValue }: SectionProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label htmlFor="productionModel">Production model</Label>
        <select id="productionModel" className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm"
          {...register('productionModel')}>
          <option value="">— Select —</option>
          {Object.values(ProductionModel).map((m) => (
            <option key={m} value={m}>{m === 'MTO' ? 'Make to Order' : m === 'MTS' ? 'Make to Stock' : 'Engineer to Order'}</option>
          ))}
        </select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="bomComplexity">BOM complexity</Label>
        <Input id="bomComplexity" placeholder="e.g. Single level, Multi-level" {...register('bomComplexity')} />
      </div>
      <div className="flex items-center gap-3">
        <input id="mrpUsed" type="checkbox" className="h-4 w-4 rounded"
          checked={watch('mrpUsed') ?? false}
          onChange={(e) => setValue('mrpUsed', e.target.checked)} />
        <Label htmlFor="mrpUsed">MRP / material requirements planning used</Label>
      </div>
      <div className="flex items-center gap-3">
        <input id="shopFloorCapture" type="checkbox" className="h-4 w-4 rounded"
          checked={watch('shopFloorCapture') ?? false}
          onChange={(e) => setValue('shopFloorCapture', e.target.checked)} />
        <Label htmlFor="shopFloorCapture">Shop floor data capture required</Label>
      </div>
    </div>
  )
}

function DistributionSection({ register, watch, setValue }: SectionProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label htmlFor="warehouseCount">Number of warehouses / locations</Label>
        <Input id="warehouseCount" type="number" min={0} {...register('warehouseCount', { valueAsNumber: true })} />
      </div>
      <div className="flex items-center gap-3">
        <input id="has3pl" type="checkbox" className="h-4 w-4 rounded"
          checked={watch('has3pl') ?? false}
          onChange={(e) => setValue('has3pl', e.target.checked)} />
        <Label htmlFor="has3pl">Third-party logistics (3PL) in use</Label>
      </div>
      <div className="flex items-center gap-3">
        <input id="ediRequired" type="checkbox" className="h-4 w-4 rounded"
          checked={watch('ediRequired') ?? false}
          onChange={(e) => setValue('ediRequired', e.target.checked)} />
        <Label htmlFor="ediRequired">EDI (electronic data interchange) required</Label>
      </div>
    </div>
  )
}

function ProfessionalServicesSection({ register }: SectionProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label htmlFor="projectTypes">Project types</Label>
        <Input id="projectTypes" placeholder="e.g. Fixed fee, T&M, Retainer" {...register('projectTypes')} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="billingModels">Billing models</Label>
        <Input id="billingModels" placeholder="e.g. Milestone, Time-based, Subscription" {...register('billingModels')} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="revenueRecognition">Revenue recognition method</Label>
        <Input id="revenueRecognition" placeholder="e.g. IFRS 15, ASC 606, PoC" {...register('revenueRecognition')} />
      </div>
    </div>
  )
}

function SaasSubscriptionSection({ watch, setValue }: SectionProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="flex items-center gap-3">
        <input id="hasSubscriptionBilling" type="checkbox" className="h-4 w-4 rounded"
          checked={watch('hasSubscriptionBilling') ?? false}
          onChange={(e) => setValue('hasSubscriptionBilling', e.target.checked)} />
        <Label htmlFor="hasSubscriptionBilling">Subscription / recurring billing</Label>
      </div>
      <div className="flex items-center gap-3">
        <input id="arrTrackingNeeded" type="checkbox" className="h-4 w-4 rounded"
          checked={watch('arrTrackingNeeded') ?? false}
          onChange={(e) => setValue('arrTrackingNeeded', e.target.checked)} />
        <Label htmlFor="arrTrackingNeeded">ARR / MRR tracking required</Label>
      </div>
      <div className="flex items-center gap-3">
        <input id="asc606Required" type="checkbox" className="h-4 w-4 rounded"
          checked={watch('asc606Required') ?? false}
          onChange={(e) => setValue('asc606Required', e.target.checked)} />
        <Label htmlFor="asc606Required">ASC 606 / IFRS 15 compliance required</Label>
      </div>
    </div>
  )
}

function NonProfitLegalSection({ watch, setValue }: SectionProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="flex items-center gap-3">
        <input id="fundAccounting" type="checkbox" className="h-4 w-4 rounded"
          checked={watch('fundAccounting') ?? false}
          onChange={(e) => setValue('fundAccounting', e.target.checked)} />
        <Label htmlFor="fundAccounting">Fund accounting required</Label>
      </div>
      <div className="flex items-center gap-3">
        <input id="grantTracking" type="checkbox" className="h-4 w-4 rounded"
          checked={watch('grantTracking') ?? false}
          onChange={(e) => setValue('grantTracking', e.target.checked)} />
        <Label htmlFor="grantTracking">Grant tracking / reporting</Label>
      </div>
      <div className="flex items-center gap-3">
        <input id="matterBilling" type="checkbox" className="h-4 w-4 rounded"
          checked={watch('matterBilling') ?? false}
          onChange={(e) => setValue('matterBilling', e.target.checked)} />
        <Label htmlFor="matterBilling">Matter billing (legal / financial services)</Label>
      </div>
    </div>
  )
}

function IntegrationDataSection({ register, watch, setValue }: SectionProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label htmlFor="integrationCount">Number of required integrations</Label>
        <Input id="integrationCount" type="number" min={0} {...register('integrationCount', { valueAsNumber: true })} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="migrationScope">Data migration scope</Label>
        <select id="migrationScope" className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm"
          {...register('migrationScope')}>
          <option value="">— Select —</option>
          {Object.values(MigrationScope).map((m) => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>
      </div>
      <div className="flex items-center gap-3">
        <input id="apiEdiRequired" type="checkbox" className="h-4 w-4 rounded"
          checked={watch('apiEdiRequired') ?? false}
          onChange={(e) => setValue('apiEdiRequired', e.target.checked)} />
        <Label htmlFor="apiEdiRequired">API / EDI integration required</Label>
      </div>
    </div>
  )
}

function PeopleChangeSection({ register, watch, setValue }: SectionProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label htmlFor="itReadiness">IT readiness</Label>
        <select id="itReadiness" className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm"
          {...register('itReadiness')}>
          <option value="">— Select —</option>
          {Object.values(ItReadiness).map((r) => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>
      </div>
      <div className="flex items-center gap-3">
        <input id="changeSponsorIdentified" type="checkbox" className="h-4 w-4 rounded"
          checked={watch('changeSponsorIdentified') ?? false}
          onChange={(e) => setValue('changeSponsorIdentified', e.target.checked)} />
        <Label htmlFor="changeSponsorIdentified">Change management sponsor identified</Label>
      </div>
    </div>
  )
}

function BudgetProcurementSection({ register, watch, setValue }: SectionProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label htmlFor="budgetRange">Budget range</Label>
        <Input id="budgetRange" placeholder="e.g. £50k–£100k" {...register('budgetRange')} />
      </div>
      <div className="flex items-center gap-3">
        <input id="boardApprovalRequired" type="checkbox" className="h-4 w-4 rounded"
          checked={watch('boardApprovalRequired') ?? false}
          onChange={(e) => setValue('boardApprovalRequired', e.target.checked)} />
        <Label htmlFor="boardApprovalRequired">Board / committee approval required</Label>
      </div>
      <div className="space-y-2 md:col-span-2">
        <Label htmlFor="procurementProcess">Procurement process notes</Label>
        <textarea id="procurementProcess" rows={2}
          className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          placeholder="Describe tender requirements, vendor vetting, contracts process…"
          {...register('procurementProcess')} />
      </div>
    </div>
  )
}

// ─── Section registry ─────────────────────────────────────────────────────────

const SECTION_REGISTRY: DiscoverySectionDef[] = [
  { key: 'orgProfile', label: 'Organisation Profile', component: OrgProfileSection },
  { key: 'financialOps', label: 'Financial Operations', component: FinancialOpsSection },
  {
    key: 'manufacturing',
    label: 'Manufacturing',
    component: ManufacturingSection,
    visibleWhen: (sol) => sol === Solution.SAGE_X3 || sol === Solution.X3CLOUDDOCS || sol === Solution.MIXED || sol === null,
  },
  {
    key: 'distribution',
    label: 'Distribution',
    component: DistributionSection,
    visibleWhen: (sol) => sol === Solution.SAGE_X3 || sol === Solution.X3CLOUDDOCS || sol === Solution.MIXED || sol === null,
  },
  {
    key: 'professionalServices',
    label: 'Professional Services',
    component: ProfessionalServicesSection,
    visibleWhen: (sol) => sol === Solution.SAGE_INTACCT || sol === Solution.MIXED || sol === null,
  },
  {
    key: 'saasSubscription',
    label: 'SaaS / Subscription',
    component: SaasSubscriptionSection,
    visibleWhen: (sol) => sol === Solution.SAGE_INTACCT || sol === Solution.MIXED || sol === null,
  },
  {
    key: 'nonProfitLegal',
    label: 'Non-Profit / Legal',
    component: NonProfitLegalSection,
    visibleWhen: (sol) => sol === Solution.SAGE_INTACCT || sol === Solution.MIXED || sol === null,
  },
  { key: 'integrationData', label: 'Integration & Data', component: IntegrationDataSection },
  { key: 'peopleChange', label: 'People & Change', component: PeopleChangeSection },
  { key: 'budgetProcurement', label: 'Budget & Procurement', component: BudgetProcurementSection },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

const SOLUTION_LABEL: Record<Solution, string> = {
  [Solution.SAGE_X3]: 'Sage X3',
  [Solution.SAGE_INTACCT]: 'Sage Intacct',
  [Solution.X3CLOUDDOCS]: 'Sage X3 + CloudDocs',
  [Solution.MIXED]: 'Mixed (X3 + Intacct)',
}

const CONFIDENCE_VARIANT: Record<string, 'default' | 'secondary' | 'warning' | 'success'> = {
  HIGH: 'success',
  MEDIUM: 'warning',
  LOW: 'secondary',
}

function countNonNullFields(values: Partial<DiscoveryDatasetInput>): number {
  return Object.values(values).filter((v) => v != null && v !== '' && v !== false).length
}

const TOTAL_FIELDS = Object.keys(DiscoveryDatasetSchema.shape).length

// ─── Collapsible section card ─────────────────────────────────────────────────

function SectionCard({
  section,
  isVisible,
  isManuallyExpanded,
  onToggleManual,
  register,
  watch,
  setValue,
}: {
  section: DiscoverySectionDef
  isVisible: boolean
  isManuallyExpanded: boolean
  onToggleManual: () => void
  register: SectionProps['register']
  watch: SectionProps['watch']
  setValue: SectionProps['setValue']
}) {
  const [open, setOpen] = useState(isVisible)

  const Component = section.component

  return (
    <div
      className={cn(
        'border rounded-lg overflow-hidden transition-opacity',
        !isVisible && !isManuallyExpanded ? 'opacity-50' : '',
      )}
    >
      <button
        type="button"
        className="w-full flex items-center justify-between px-5 py-4 text-left bg-white hover:bg-gray-50 transition-colors"
        onClick={() => setOpen(!open)}
      >
        <div className="flex items-center gap-3">
          <span className="font-medium text-sm">{section.label}</span>
          {!isVisible && (
            <Badge variant="secondary" className="text-xs">
              Not applicable
            </Badge>
          )}
        </div>
        {open ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
      </button>

      {open && (
        <div className="px-5 pb-5 pt-2 border-t bg-white">
          {!isVisible && !isManuallyExpanded ? (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Not applicable for the recommended solution, but you can still fill it in.
              </p>
              <Button type="button" variant="outline" size="sm" onClick={onToggleManual}>
                Fill in anyway
              </Button>
            </div>
          ) : (
            <Component register={register} watch={watch} setValue={setValue} />
          )}
        </div>
      )}
    </div>
  )
}

// ─── DiscoveryPage ────────────────────────────────────────────────────────────

export function DiscoveryPage() {
  const { id } = useParams<{ id: string }>()
  const oppId = id!
  const [manuallyExpanded, setManuallyExpanded] = useState<Set<string>>(new Set())
  const [solutionConfirmed, setSolutionConfirmed] = useState(false)
  const [showOverrideForm, setShowOverrideForm] = useState(false)

  const { data: savedDiscovery, isLoading } = useQuery<Partial<DiscoveryDatasetInput>>({
    queryKey: ['discovery', oppId],
    queryFn: () => discoveryApi.get(oppId).then((r) => r.data),
  })

  const { data: opp } = useQuery<{ solution: Solution | null }>({
    queryKey: ['opportunity', oppId],
    queryFn: () => opportunitiesApi.get(oppId).then((r) => r.data),
  })

  const { register, watch, setValue } = useForm<DiscoveryDatasetInput>({
    resolver: zodResolver(DiscoveryDatasetSchema),
    values: savedDiscovery as DiscoveryDatasetInput | undefined,
  })

  const saveMutation = useMutation({
    mutationFn: (data: Partial<DiscoveryDatasetInput>) => discoveryApi.put(oppId, data),
  })

  const confirmSolutionMutation = useMutation({
    mutationFn: (data: { solution: Solution; solutionOverrideReason?: string }) =>
      opportunitiesApi.update(oppId, data).then((r) => r.data),
    onSuccess: () => setSolutionConfirmed(true),
  })

  useAutoSave(watch, saveMutation)

  const values = watch()
  const recommendation: SolutionRecommendation | null = useMemo(
    () => recommendSolution(values),
    [values],
  )

  const confirmedSolution: Solution | null = opp?.solution ?? null
  const activeSolution = confirmedSolution ?? recommendation?.solution ?? null

  const completionPct = Math.round((countNonNullFields(values) / TOTAL_FIELDS) * 100)

  const toggleManualExpand = (key: string) => {
    setManuallyExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  if (isLoading) return <div className="p-4 text-muted-foreground">Loading discovery data…</div>

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-xl font-semibold">Discovery</h2>
          <p className="text-sm text-muted-foreground">
            Capture detailed requirements to generate the solution recommendation.
          </p>
        </div>
        {/* Completion bar */}
        <div className="text-right min-w-36">
          <p className="text-xs text-muted-foreground mb-1">Completion</p>
          <div className="h-2 w-36 rounded-full bg-gray-200 overflow-hidden">
            <div
              className="h-full rounded-full bg-primary transition-all duration-300"
              style={{ width: `${completionPct}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-1">{completionPct}% complete</p>
        </div>
      </div>

      {/* Solution recommendation card */}
      {recommendation && (
        <Card className="border-primary/30 bg-primary/5">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Solution Recommendation</CardTitle>
              {solutionConfirmed || confirmedSolution ? (
                <div className="flex items-center gap-2 text-green-700">
                  <CheckCircle2 className="h-4 w-4" />
                  <span className="text-sm font-medium">Confirmed</span>
                </div>
              ) : null}
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3">
              <span className="text-lg font-bold">{SOLUTION_LABEL[recommendation.solution]}</span>
              <Badge variant={CONFIDENCE_VARIANT[recommendation.confidence]}>
                {recommendation.confidence} confidence
              </Badge>
              {recommendation.isAmbiguous && (
                <Badge variant="warning">Ambiguous — review rationale</Badge>
              )}
            </div>
            <ul className="space-y-1">
              {recommendation.rationale.map((r, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <span className="text-primary mt-0.5">•</span>
                  {r}
                </li>
              ))}
            </ul>
            {!solutionConfirmed && !confirmedSolution && (
              <div className="flex gap-3 pt-1">
                <Button
                  size="sm"
                  onClick={() => confirmSolutionMutation.mutate({ solution: recommendation.solution })}
                  disabled={confirmSolutionMutation.isPending}
                >
                  {confirmSolutionMutation.isPending ? 'Confirming…' : 'Confirm Solution'}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowOverrideForm(!showOverrideForm)}
                >
                  Override
                </Button>
              </div>
            )}
            {(solutionConfirmed || confirmedSolution) && !showOverrideForm && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowOverrideForm(true)}
              >
                Override confirmed solution
              </Button>
            )}
            {showOverrideForm && (
              <OverrideForm
                currentSolution={confirmedSolution ?? recommendation.solution}
                onConfirm={(solution, reason) => {
                  confirmSolutionMutation.mutate({ solution, solutionOverrideReason: reason })
                  setShowOverrideForm(false)
                }}
                onCancel={() => setShowOverrideForm(false)}
              />
            )}
          </CardContent>
        </Card>
      )}

      {/* Sections */}
      <div className="space-y-3">
        {SECTION_REGISTRY.map((section) => {
          const isVisible = section.visibleWhen
            ? section.visibleWhen(activeSolution, values)
            : true
          const isManuallyExp = manuallyExpanded.has(section.key)

          return (
            <SectionCard
              key={section.key}
              section={section}
              isVisible={isVisible}
              isManuallyExpanded={isManuallyExp}
              onToggleManual={() => toggleManualExpand(section.key)}
              register={register}
              watch={watch}
              setValue={setValue}
            />
          )
        })}
      </div>

      {saveMutation.isPending && (
        <p className="text-xs text-muted-foreground">Saving…</p>
      )}
    </div>
  )
}

// ─── Override form ────────────────────────────────────────────────────────────

function OverrideForm({
  currentSolution,
  onConfirm,
  onCancel,
}: {
  currentSolution: Solution
  onConfirm: (solution: Solution, reason: string) => void
  onCancel: () => void
}) {
  const [solution, setSolution] = useState<Solution>(currentSolution)
  const [reason, setReason] = useState('')

  return (
    <div className="rounded-md border p-4 space-y-3 bg-white">
      <div className="flex items-center gap-2 text-sm font-medium">
        <AlertCircle className="h-4 w-4 text-amber-500" />
        Override solution recommendation
      </div>
      <div className="space-y-2">
        <Label className="text-xs">Select solution</Label>
        <select
          className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm"
          value={solution}
          onChange={(e) => setSolution(e.target.value as Solution)}
        >
          {Object.values(Solution).map((s) => (
            <option key={s} value={s}>{SOLUTION_LABEL[s]}</option>
          ))}
        </select>
      </div>
      <div className="space-y-2">
        <Label className="text-xs">Override reason *</Label>
        <textarea
          rows={2}
          className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          placeholder="Explain why you are overriding the recommendation…"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
      </div>
      <div className="flex gap-2">
        <Button size="sm" onClick={() => reason.trim() && onConfirm(solution, reason)} disabled={!reason.trim()}>
          Confirm override
        </Button>
        <Button size="sm" variant="outline" onClick={onCancel}>Cancel</Button>
      </div>
    </div>
  )
}
