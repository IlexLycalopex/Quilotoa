import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { z } from 'zod'
import { apiClient } from '@/api/client'
import { useAuthStore } from '@/store/authStore'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { COI_BENCHMARKS, DEFAULT_FINANCE_FTE_ANNUAL_SALARY } from '@msas/shared'
import { Loader2, Save } from 'lucide-react'

const ConfigSchema = z.object({
  branding: z.object({
    companyName: z.string().max(255).optional(),
    primaryColour: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Must be a valid hex colour').optional(),
  }),
  benchmarkOverrides: z.object({
    financeAnnualSalary:              z.number().positive().optional(),
    manualReentryHrsPerWeekPerFte:    z.number().positive().optional(),
    monthEndDays:                     z.number().positive().optional(),
    errorReworkPct:                   z.number().min(0).max(100).optional(),
    auditPrepDays:                    z.number().positive().optional(),
  }),
})

type ConfigValues = z.infer<typeof ConfigSchema>

interface TenantData { id: string; name: string; config: ConfigValues }

export function AdminConfigPage() {
  const tenantSlug = useAuthStore(s => s.tenantSlug)
  const qc = useQueryClient()

  const { data: tenant, isLoading } = useQuery<TenantData>({
    queryKey: ['tenant-config'],
    queryFn: () => apiClient.get('/tenants/current').then(r => r.data),
  })

  const { register, handleSubmit, reset, formState: { errors, isDirty } } = useForm<ConfigValues>({
    resolver: zodResolver(ConfigSchema),
    defaultValues: tenant?.config,
  })

  useEffect(() => { if (tenant?.config) reset(tenant.config) }, [tenant, reset])

  const save = useMutation({
    mutationFn: (data: ConfigValues) => apiClient.patch(`/tenants/${tenant?.id}`, { config: data }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tenant-config'] }),
  })

  if (isLoading) {
    return (
      <div className="p-6 flex items-center gap-2 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading configuration…
      </div>
    )
  }

  return (
    <div className="p-6 max-w-2xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Configuration</h1>
        <p className="text-sm text-muted-foreground">Tenant: <strong>{tenantSlug}</strong></p>
      </div>

      <form onSubmit={handleSubmit(d => save.mutate(d))} className="space-y-6">

        {/* Branding */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Branding</CardTitle>
            <CardDescription>Applied to all generated PDF documents</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <Label>Company name</Label>
              <Input {...register('branding.companyName')} placeholder="Mysoft" />
            </div>
            <div className="space-y-1">
              <Label>Primary colour</Label>
              <div className="flex gap-2 items-center">
                <input type="color" {...register('branding.primaryColour')} className="h-10 w-16 rounded-md border cursor-pointer" />
                <Input {...register('branding.primaryColour')} className="font-mono" placeholder="#1e3a5f" />
              </div>
              {errors.branding?.primaryColour && <p className="text-xs text-destructive">{errors.branding.primaryColour.message}</p>}
            </div>
          </CardContent>
        </Card>

        {/* Benchmark overrides */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">COI Benchmark Overrides</CardTitle>
            <CardDescription>Override global industry benchmarks with values specific to your market. Leave blank to use defaults.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { id: 'benchmarkOverrides.financeAnnualSalary', label: 'Finance FTE annual salary (£)', placeholder: `Default: £${DEFAULT_FINANCE_FTE_ANNUAL_SALARY.toLocaleString()}` },
              { id: 'benchmarkOverrides.manualReentryHrsPerWeekPerFte', label: 'Manual re-entry (hrs/wk/FTE)', placeholder: `Default: ${COI_BENCHMARKS.manualReentryHrsPerWeekPerFte}` },
              { id: 'benchmarkOverrides.monthEndDays', label: 'Month-end close benchmark (days)', placeholder: `Default: ${COI_BENCHMARKS.monthEndDays}` },
              { id: 'benchmarkOverrides.errorReworkPct', label: 'Error rework rate benchmark (%)', placeholder: `Default: ${COI_BENCHMARKS.errorReworkPct}` },
              { id: 'benchmarkOverrides.auditPrepDays', label: 'Audit preparation benchmark (days/yr)', placeholder: `Default: ${COI_BENCHMARKS.auditPrepDays}` },
            ].map(({ id, label, placeholder }) => (
              <div key={id} className="space-y-1">
                <Label>{label}</Label>
                <Input type="number" step="any" placeholder={placeholder}
                  {...register(id as keyof ConfigValues, { valueAsNumber: true })} />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Feature flags (Phase 2 preview) */}
        <Card className="opacity-60">
          <CardHeader>
            <CardTitle className="text-base">Feature Flags</CardTitle>
            <CardDescription>Phase 2 features — available in a future release</CardDescription>
          </CardHeader>
          <CardContent>
            <label className="flex items-center gap-3 cursor-not-allowed">
              <input type="checkbox" disabled className="h-4 w-4" />
              <span className="text-sm">Enable Phase 2 modules (Scope Builder, SoW Generator, Proposal Generator)</span>
            </label>
          </CardContent>
        </Card>

        {save.error && <p className="text-sm text-destructive">Failed to save configuration.</p>}
        {save.isSuccess && <p className="text-sm text-green-600">Configuration saved.</p>}

        <div className="flex justify-end">
          <Button type="submit" disabled={!isDirty || save.isPending}>
            {save.isPending ? <><Loader2 className="h-4 w-4 animate-spin mr-1" /> Saving…</> : <><Save className="h-4 w-4 mr-1" /> Save Changes</>}
          </Button>
        </div>
      </form>
    </div>
  )
}
