import { z } from 'zod'

export const TenantBrandingSchema = z.object({
  primaryColour: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default('#1e3a5f'),
  logoUrl: z.string().url().optional(),
  companyName: z.string().optional(),
})

export const TenantConfigSchema = z.object({
  branding: TenantBrandingSchema.default({}),
  benchmarkOverrides: z.object({
    financeAnnualSalary: z.number().positive().optional(),
    manualReentryHrsPerWeekPerFte: z.number().positive().optional(),
    monthEndDays: z.number().positive().optional(),
    errorReworkPct: z.number().min(0).max(100).optional(),
    auditPrepDays: z.number().positive().optional(),
  }).default({}),
  featureFlags: z.object({
    phase2Enabled: z.boolean().default(false),
  }).default({}),
})

export const CreateTenantSchema = z.object({
  slug: z.string().min(2).max(63).regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with hyphens'),
  name: z.string().min(1).max(255),
  config: TenantConfigSchema.default({}),
})

export const UpdateTenantSchema = CreateTenantSchema.partial().omit({ slug: true })

export type TenantBranding = z.infer<typeof TenantBrandingSchema>
export type TenantConfig = z.infer<typeof TenantConfigSchema>
export type CreateTenantInput = z.infer<typeof CreateTenantSchema>
export type UpdateTenantInput = z.infer<typeof UpdateTenantSchema>
