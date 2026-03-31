import { z } from 'zod'
import { SizeBand } from '../enums.js'

export const CreateOrganisationSchema = z.object({
  name: z.string().min(1).max(255),
  sector: z.string().max(100).optional(),
  sizeBand: z.nativeEnum(SizeBand).optional(),
  country: z.string().max(100).optional(),
})

export const UpdateOrganisationSchema = CreateOrganisationSchema.partial()

export type CreateOrganisationInput = z.infer<typeof CreateOrganisationSchema>
export type UpdateOrganisationInput = z.infer<typeof UpdateOrganisationSchema>
