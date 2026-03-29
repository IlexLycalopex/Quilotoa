import { z } from 'zod'
import { Stage, Solution } from '../enums.js'

export const CreateOpportunitySchema = z.object({
  orgId: z.string().uuid(),
  name: z.string().min(1).max(255),
  ownerId: z.string().uuid().optional(), // defaults to requesting user
})

export const UpdateOpportunitySchema = z.object({
  name: z.string().min(1).max(255).optional(),
  ownerId: z.string().uuid().optional(),
  stage: z.nativeEnum(Stage).optional(),
  solution: z.nativeEnum(Solution).nullable().optional(),
  solutionOverrideReason: z.string().max(1000).nullable().optional(),
})

export type CreateOpportunityInput = z.infer<typeof CreateOpportunitySchema>
export type UpdateOpportunityInput = z.infer<typeof UpdateOpportunitySchema>
