import { useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useQuery, useMutation } from '@tanstack/react-query'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { financialApi } from '@/api/financial'
import { useAutoSave } from '@/hooks/useAutoSave'
import { FinancialInputRow } from '@/components/shared/FinancialInputRow'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { calculateCOI, CoiInputsSchema, COI_BENCHMARKS, DEFAULT_FINANCE_FTE_ANNUAL_SALARY, type CoiInputs } from '@msas/shared'
import { formatCurrency } from '@/lib/utils'

const BAR_COLOURS = ['#1e3a5f', '#2d5a8e', '#3d7ab8', '#5a9fd4', '#8abde8', '#b8d4f0']

export function CoiPage() {
  const { id: oppId } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const { data: model } = useQuery({
    queryKey: ['financial-coi', oppId],
    queryFn: () => financialApi.getCoi(oppId!).then(r => r.data as { coiInputs?: Partial<CoiInputs> }),
  })

  const defaults: CoiInputs = {
    financeTeamSize: 5,
    financeAnnualSalary: DEFAULT_FINANCE_FTE_ANNUAL_SALARY,
    manualReentryHrsPerWeekPerFte: COI_BENCHMARKS.manualReentryHrsPerWeekPerFte,
    monthEndDaysActual: COI_BENCHMARKS.monthEndDays,
    errorReworkPct: COI_BENCHMARKS.errorReworkPct,
    auditPrepDays: COI_BENCHMARKS.auditPrepDays,
    reportingCycleDays: COI_BENCHMARKS.reportingCycleDays,
    itLegacyAnnualCost: 0,
    annualTransactionVolume: 5000,
  }

  const { register, watch, reset, formState: { errors } } = useForm<CoiInputs>({
    resolver: zodResolver(CoiInputsSchema),
    defaultValues: { ...defaults, ...model?.coiInputs },
  })

  useEffect(() => {
    if (model?.coiInputs) reset({ ...defaults, ...model.coiInputs })
  }, [model])

  const save = useMutation({
    mutationFn: (data: Partial<CoiInputs>) => financialApi.putCoi(oppId!, data),
  })

  useAutoSave(watch, save)

  const values = watch()
  const hasRequiredInputs = values.financeTeamSize > 0 && values.financeAnnualSalary > 0
  const coiResult = hasRequiredInputs ? calculateCOI(values) : null

  const chartData = coiResult?.lines.map(l => ({ name: l.label.replace('cost', '').trim(), value: l.annual })) ?? []

  if (!oppId) return null

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Cost of Inaction</h2>
        <p className="text-sm text-muted-foreground">Quantify the annual cost of remaining on the current system</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Inputs */}
        <Card>
          <CardHeader><CardTitle className="text-base">Inputs</CardTitle></CardHeader>
          <CardContent>
            <FinancialInputRow id="financeTeamSize" label="Finance team size (FTE)" register={register} error={errors.financeTeamSize} benchmarkLabel="Prospect-supplied" />
            <FinancialInputRow id="financeAnnualSalary" label="Average annual salary" register={register} error={errors.financeAnnualSalary} prefix="£" benchmark={DEFAULT_FINANCE_FTE_ANNUAL_SALARY} benchmarkLabel={`£${DEFAULT_FINANCE_FTE_ANNUAL_SALARY.toLocaleString()} (ONS avg)`} />
            <FinancialInputRow id="manualReentryHrsPerWeekPerFte" label="Manual re-entry (hrs/wk/FTE)" register={register} error={errors.manualReentryHrsPerWeekPerFte} benchmark={COI_BENCHMARKS.manualReentryHrsPerWeekPerFte} benchmarkLabel={`${COI_BENCHMARKS.manualReentryHrsPerWeekPerFte} hrs (APQC)`} />
            <FinancialInputRow id="monthEndDaysActual" label="Month-end close (days)" register={register} error={errors.monthEndDaysActual} benchmark={COI_BENCHMARKS.monthEndDays} benchmarkLabel={`${COI_BENCHMARKS.monthEndDays} days (BlackLine)`} />
            <FinancialInputRow id="errorReworkPct" label="Error rework rate (%)" register={register} error={errors.errorReworkPct} suffix="%" benchmark={COI_BENCHMARKS.errorReworkPct} benchmarkLabel={`${COI_BENCHMARKS.errorReworkPct}% (APQC)`} />
            <FinancialInputRow id="auditPrepDays" label="Audit preparation (days/yr)" register={register} error={errors.auditPrepDays} benchmark={COI_BENCHMARKS.auditPrepDays} benchmarkLabel={`${COI_BENCHMARKS.auditPrepDays} days (PwC)`} />
            <FinancialInputRow id="reportingCycleDays" label="Reporting cycle (days)" register={register} error={errors.reportingCycleDays} benchmark={COI_BENCHMARKS.reportingCycleDays} benchmarkLabel={`${COI_BENCHMARKS.reportingCycleDays} days (Gartner)`} />
            <FinancialInputRow id="itLegacyAnnualCost" label="Legacy IT support cost" register={register} error={errors.itLegacyAnnualCost} prefix="£" benchmarkLabel="Prospect-supplied" />
            <FinancialInputRow id="annualTransactionVolume" label="Annual transaction volume" register={register} error={errors.annualTransactionVolume} benchmarkLabel="Prospect-supplied" />
          </CardContent>
        </Card>

        {/* Results */}
        <div className="space-y-4">
          {coiResult ? (
            <>
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-base">Annual Cost of Inaction</CardTitle></CardHeader>
                <CardContent>
                  <p className="text-4xl font-bold text-primary">{formatCurrency(coiResult.totalAnnual)}</p>
                  <p className="text-sm text-muted-foreground mt-1">per year</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-base">Breakdown</CardTitle></CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={chartData} layout="vertical" margin={{ left: 0, right: 20 }}>
                      <XAxis type="number" tickFormatter={v => `£${(v / 1000).toFixed(0)}k`} fontSize={11} />
                      <YAxis type="category" dataKey="name" width={130} fontSize={10} tick={{ textAnchor: 'end' }} />
                      <Tooltip formatter={(v: number) => formatCurrency(v)} />
                      <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                        {chartData.map((_, idx) => <Cell key={idx} fill={BAR_COLOURS[idx % BAR_COLOURS.length]} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>

                  <div className="divide-y mt-3">
                    {coiResult.lines.map(line => (
                      <div key={line.label} className="flex justify-between py-2 text-sm">
                        <span className="text-muted-foreground">{line.label}</span>
                        <span className={`font-medium ${line.isAboveBenchmark ? 'text-red-600' : 'text-green-600'}`}>
                          {formatCurrency(line.annual)}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                Enter finance team size and salary to see your Cost of Inaction
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <div className="pt-4 border-t flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Auto-saving...</p>
        <Button onClick={() => navigate(`/app/opportunities/${oppId}/roi`)} disabled={!coiResult}>
          Proceed to ROI Builder
        </Button>
      </div>
    </div>
  )
}
