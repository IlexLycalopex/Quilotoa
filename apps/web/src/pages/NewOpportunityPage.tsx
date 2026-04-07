import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery } from '@tanstack/react-query'
import { z } from 'zod'
import {
  CreateOpportunitySchema,
  CreateOrganisationSchema,
  SizeBand,
  type CreateOrganisationInput,
} from '@msas/shared'
import { opportunitiesApi } from '@/api/opportunities'
import { organisationsApi } from '@/api/organisations'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ChevronLeft, Plus } from 'lucide-react'

// Combined form schema: orgId required unless createNewOrg is true, in which case orgName is required
const FormSchema = z
  .object({
    name: z.string().min(1, 'Opportunity name is required').max(255),
    createNewOrg: z.boolean(),
    orgId: z.string().optional(),
    orgName: z.string().max(255).optional(),
    orgSector: z.string().max(100).optional(),
    orgSizeBand: z.nativeEnum(SizeBand).optional(),
  })
  .superRefine((val, ctx) => {
    if (!val.createNewOrg && (!val.orgId || val.orgId === '')) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Please select an organisation',
        path: ['orgId'],
      })
    }
    if (val.createNewOrg && (!val.orgName || val.orgName.trim().length === 0)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Organisation name is required',
        path: ['orgName'],
      })
    }
  })

type FormValues = z.infer<typeof FormSchema>

interface Organisation {
  id: string
  name: string
  sector?: string
}

export function NewOpportunityPage() {
  const navigate = useNavigate()
  const [serverError, setServerError] = useState<string | null>(null)

  const { data: orgsData, isLoading: orgsLoading } = useQuery<Organisation[]>({
    queryKey: ['organisations'],
    queryFn: () => organisationsApi.list().then((r) => r.data),
  })
  const orgs = orgsData ?? []

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(FormSchema),
    defaultValues: { createNewOrg: false },
  })

  const createNewOrg = watch('createNewOrg')

  const createOrgMutation = useMutation({
    mutationFn: (data: CreateOrganisationInput) =>
      organisationsApi.create(data).then((r) => r.data as { id: string }),
  })

  const createOppMutation = useMutation({
    mutationFn: (data: z.infer<typeof CreateOpportunitySchema>) =>
      opportunitiesApi.create(data).then((r) => r.data as { id: string }),
  })

  const onSubmit = async (values: FormValues) => {
    setServerError(null)
    try {
      let orgId = values.orgId!

      if (values.createNewOrg) {
        const parsedOrg = CreateOrganisationSchema.parse({
          name: values.orgName,
          sector: values.orgSector || undefined,
          sizeBand: values.orgSizeBand || undefined,
        })
        const newOrg = await createOrgMutation.mutateAsync(parsedOrg)
        orgId = newOrg.id
      }

      const opp = await createOppMutation.mutateAsync({ orgId, name: values.name })
      navigate(`/app/opportunities/${opp.id}/qualification`)
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } }
      setServerError(axiosErr?.response?.data?.message ?? 'Something went wrong. Please try again.')
    }
  }

  const isBusy = isSubmitting || createOrgMutation.isPending || createOppMutation.isPending

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div>
        <Link
          to="/app/opportunities"
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to opportunities
        </Link>
        <h1 className="text-2xl font-bold">New Opportunity</h1>
        <p className="text-sm text-muted-foreground">
          Create a new sales opportunity to begin the MSAS workflow.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Opportunity details</CardTitle>
          <CardDescription>
            An opportunity belongs to an organisation and follows the qualification → discovery →
            COI → ROI pipeline.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
            {/* Opportunity name */}
            <div className="space-y-2">
              <Label htmlFor="name">Opportunity name *</Label>
              <Input
                id="name"
                placeholder="e.g. Acme Corp ERP Replacement"
                {...register('name')}
                className={errors.name ? 'border-destructive' : ''}
              />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>

            {/* Organisation */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Organisation *</Label>
                <button
                  type="button"
                  onClick={() => setValue('createNewOrg', !createNewOrg)}
                  className="flex items-center gap-1 text-xs text-primary hover:underline"
                >
                  <Plus className="h-3 w-3" />
                  {createNewOrg ? 'Select existing instead' : 'Create new organisation'}
                </button>
              </div>

              {!createNewOrg ? (
                <div>
                  <select
                    className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring disabled:opacity-50"
                    disabled={orgsLoading}
                    {...register('orgId')}
                  >
                    <option value="">
                      {orgsLoading ? 'Loading organisations…' : '— Select organisation —'}
                    </option>
                    {orgs.map((org) => (
                      <option key={org.id} value={org.id}>
                        {org.name}
                        {org.sector ? ` · ${org.sector}` : ''}
                      </option>
                    ))}
                  </select>
                  {errors.orgId && (
                    <p className="text-xs text-destructive mt-1">{errors.orgId.message}</p>
                  )}
                </div>
              ) : (
                <div className="rounded-md border border-dashed p-4 space-y-4 bg-gray-50">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    New organisation
                  </p>
                  <div className="space-y-2">
                    <Label htmlFor="orgName">Name *</Label>
                    <Input
                      id="orgName"
                      placeholder="Organisation name"
                      {...register('orgName')}
                      className={errors.orgName ? 'border-destructive' : ''}
                    />
                    {errors.orgName && (
                      <p className="text-xs text-destructive">{errors.orgName.message}</p>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="orgSector">Sector</Label>
                      <Input
                        id="orgSector"
                        placeholder="e.g. Manufacturing"
                        {...register('orgSector')}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="orgSizeBand">Size band</Label>
                      <select
                        id="orgSizeBand"
                        className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                        {...register('orgSizeBand')}
                      >
                        <option value="">— Select —</option>
                        {Object.values(SizeBand).map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {serverError && (
              <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3">
                <p className="text-sm text-destructive">{serverError}</p>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" type="button" asChild>
                <Link to="/app/opportunities">Cancel</Link>
              </Button>
              <Button type="submit" disabled={isBusy}>
                {isBusy ? 'Creating…' : 'Create opportunity'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
