import { z } from 'zod'
import { Role } from '../enums.js'

export const CreateUserSchema = z.object({
  email: z.string().email().toLowerCase(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  fullName: z.string().min(1).max(255),
  role: z.nativeEnum(Role),
  teamId: z.string().uuid().optional(),
})

export const UpdateUserSchema = z.object({
  email: z.string().email().toLowerCase().optional(),
  fullName: z.string().min(1).max(255).optional(),
  role: z.nativeEnum(Role).optional(),
  teamId: z.string().uuid().nullable().optional(),
  isActive: z.boolean().optional(),
})

export const ChangePasswordSchema = z.object({
  currentPassword: z.string(),
  newPassword: z.string().min(8),
})

export const LoginSchema = z.object({
  email: z.string().email().toLowerCase(),
  password: z.string().min(1),
  tenantSlug: z.string().min(1),
})

export type CreateUserInput = z.infer<typeof CreateUserSchema>
export type UpdateUserInput = z.infer<typeof UpdateUserSchema>
export type ChangePasswordInput = z.infer<typeof ChangePasswordSchema>
export type LoginInput = z.infer<typeof LoginSchema>
