import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useQuery, useMutation } from '@tanstack/react-query'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, ReferenceLine } from 'recharts'
import { financialApi } from '@/api/financial'
import { useAutoSave } from '@/hooks/useAutoSave'
import { FinancialInputRow } from '@/components/shared/FinancialInputRow'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { calculateROI, RoiInputsSchema, ROI_DEFAULTS, type RoiInputs, type RoiScenario } from '@msas/shared'
import { formatCurrency, formatPct, formatMonths } from '@/lib/utils'

type Scenario = 'low' | 'base' | 'high'

function ScenarioToggle({ active, onChange }: { active: Scenario; onChange: (s: Scenario) => void }) {
  return (
    <div className="flex rounded-md border overflow-hidden">
      {(['low', 'base', 'high'] as Scenario[]).map(s => (
        <button
          key={s}
          onClick={() => onChange(s)}
          className={`px-4 py-1.5 text-sm font-medium transition-colors ${active === s ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}
        >
          {s.charAt(0).toUpperCase() + s.slice(1)}
        </button>
      ))}
    </div>
  )
}

function MetricCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-xs text-muted-foreground uppercase tracking-wide">{label}</p>
        <p className="text-3xl font-bold mt-1">{value}</p>
        {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
      </CardContent>
    </Card>
  )
}

export function RoiPage() {
  const { id: oppId } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [activeScenario, setActiveScenario] = useState<Scenario>('base')

  const { data: model } = useQuery({
    queryKey: ['financial-roi', oppId],
    queryFn: () => financialApi.getRoi(oppId!).then(r => r.data as { roiInputs?: Partial<RoiInputs>; coiTotalAnnual?: number }),
  })

  const coiTotal = model?.coiTotalAnnual ?? 0

  const defaults: RoiInputs = {
    coiTotalAnnual: coiTotal,
    implementationInvestment: 0,
    annualLicenceCost: 0,
    benefitRealisationMonths: ROI_DEFAULTS.benefitRealisationMonths,
    discountRatePct: ROI_DEFAULTS.discountRatePct,
    sensitivityLowMultiplier: ROI_DEFAULTS.sensitivityLowMultiplier,
    sensitivityHighMultiplier: ROI_DEFAULTS.sensitivityHighMultiplier,
  }

  const { register, watch, reset, formState: { errors } } = useForm<RoiInputs>({
    resolver: zodResolver(RoiInputsSchema),
    defaultValues: { ...defaults, ...model?.roiInputs, coiTotalAnnual: coiTotal },
  })

  useEffect(() => {
    if (model) reset({ ...defaults, ...model.roiInputs, coiTotalAnnual: model.coiTotalAnnual ?? 0 })
  }, [model])

  const save = useMutation({
    mutationFn: (data: Partial<RoiInputs>) => financialApi.putRoi(oppId!, data),
  })

  useAutoSave(watch, save)

  const values = watch()
  const hasInputs = values.implementationInvestment > 0 && coiTotal > 0
  const roiResult = hasInputs ? calculateROI({ ...values, coiTotalAnnual: coiTotal }) : null
  const scenario: RoiScenario | null = roiResult ? roiResult[activeScenario] : null

  // Build cashflow chart data
  const chartData = roiResult
    ? [
        { year: 'Year 1', Low: roiResult.low.cashFlowByYear[0], Base: roiResult.base.cashFlowByYear[0], High: roiResult.high.cashFlowByYear[0] },
        { year: 'Year 2', Low: roiResult.low.cashFlowByYear[1], Base: roiResult.base.cashFlowByYear[1], High: roiResult.high.cashFlowByYear[1] },
        { year: 'Year 3', Low: roiResult.low.cashFlowByYear[2], Base: roiResult.base.cashFlowByYear[2], High: roiResult.high.cashFlowByYear[2] },
      ]
    : []

  if (!oppId) return null

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h2 className="text-xl font-semibold">ROI Builder</h2>
        <p className="text-sm text-muted-foreground">Build the financial business case with payback period, 3-year ROI, and NPV</p>
      </div>

      {coiTotal === 0 && (
        <div className="p-4 rounded-md bg-amber-50 border border-amber-200 text-sm text-amber-800">
          Complete the Cost of Inaction step first to auto-populate the annual benefit figure.
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Inputs */}
        <Card>
          <CardHeader><CardTitle className="text-base">Investment Inputs</CardTitle></CardHeader>
          <CardContent>
            <div className="py-3 border-b flex justify-between text-sm">
              <span className="font-medium">Annual benefit (from COI)</span>
              <span className="font-bold text-primary">{formatCurrency(coiTotal)}</span>
            </div>
            <FinancialInputRow id="implementationInvestment" label="Implementation investment" register={register} error={errors.implementationInvestment} prefix="£" benchmarkLabel="Prospect-supplied" />
            <FinancialInputRow id="annualLicenceCost" label="Annual licence cost" register={register} error={errors.annualLicenceCost} prefix="£" benchmarkLabel="Prospect-supplied" />

            <div className="py-3 border-b space-y-2">
              <div className="flex justify-between text-sm">
                <span className="font-medium">Benefit realisation timeline</span>
                <span className="tabular-nums">{values.benefitRealisationMonths} months</span>
              </div>
              <input
                type="range" min={3} max={12} step={3}
                className="w-full accent-primary"
                {...register('benefitRealisationMonths', { valueAsNumber: true })}
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>3 months</span><span>6</span><span>9</span><span>12 months</span>
              </div>
            </div>

            <FinancialInputRow id="discountRatePct" label="Discount rate (NPV)" register={register} error={errors.discountRatePct} suffix="%" benchmarkLabel="Default 8%" />
          </CardContent>
        </Card>

        {/* Results */}
        <div className="space-y-4">
          {scenario && roiResult ? (
            <>
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-muted-foreground">Scenario</p>
                <ScenarioToggle active={activeScenario} onChange={setActiveScenario} />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <MetricCard label="Payback period" value={formatMonths(scenario.paybackMonths)} />
                <MetricCard label="3-Year ROI" value={formatPct(scenario.threeYearRoiPct, 0)} />
                <MetricCard label="NPV (3yr)" value={formatCurrency(scenario.npv)} />
                <MetricCard label="Annual benefit" value={formatCurrency(scenario.annualBenefit)} />
              </div>

              {/* Sensitivity table */}
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-base">Sensitivity Analysis</CardTitle></CardHeader>
                <CardContent>
                  <table className="w-full text-sm">
                    <thead><tr className="border-b">
                      <th className="text-left py-2 font-medium text-muted-foreground">Scenario</th>
                      <th className="text-right py-2 font-medium text-muted-foreground">Payback</th>
                      <th className="text-right py-2 font-medium text-muted-foreground">3yr ROI</th>
                      <th className="text-right py-2 font-medium text-muted-foreground">NPV</th>
                    </tr></thead>
                    <tbody>
                      {(['low', 'base', 'high'] as Scenario[]).map(s => {
                        const sc = roiResult[s]
                        return (
                          <tr key={s} className={`border-b last:border-0 ${activeScenario === s ? 'bg-primary/5 font-medium' : ''}`}>
                            <td className="py-2 capitalize">{s}</td>
                            <td className="py-2 text-right tabular-nums">{formatMonths(sc.paybackMonths)}</td>
                            <td className="py-2 text-right tabular-nums">{formatPct(sc.threeYearRoiPct, 0)}</td>
                            <td className="py-2 text-right tabular-nums">{formatCurrency(sc.npv)}</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </CardContent>
              </Card>

              {/* Cashflow chart */}
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-base">3-Year Cash Flow</CardTitle></CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={180}>
                    <LineChart data={chartData}>
                      <XAxis dataKey="year" fontSize={11} />
                      <YAxis tickFormatter={v => `£${(v / 1000).toFixed(0)}k`} fontSize={11} />
                      <Tooltip formatter={(v: number) => formatCurrency(v)} />
                      <Legend />
                      <ReferenceLine y={0} stroke="#94a3b8" strokeDasharray="3 3" />
                      <Line type="monotone" dataKey="Low" stroke="#f59e0b" strokeWidth={2} dot={false} />
                      <Line type="monotone" dataKey="Base" stroke="#1e3a5f" strokeWidth={2} />
                      <Line type="monotone" dataKey="High" stroke="#22c55e" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                Enter implementation investment to see ROI projections
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <div className="pt-4 border-t flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Auto-saving...</p>
        <Button onClick={() => navigate(`/app/opportunities/${oppId}/proposals`)} disabled={!scenario}>
          Proceed to Proposals
        </Button>
      </div>
    </div>
  )
}
