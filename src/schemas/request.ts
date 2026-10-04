import { z } from 'zod'
import { MaterialSchema } from './part'

export const RequestStatusSchema = z.enum([
  'new',
  'searching',
  'candidate_found',
  'reverse_engineering',
  'validated',
  'machining',
  'completed',
  'archived',
  'rejected',
])
export type RequestStatus = z.infer<typeof RequestStatusSchema>

export const RequestUrgencySchema = z.enum(['low', 'normal', 'high', 'critical'])
export type RequestUrgency = z.infer<typeof RequestUrgencySchema>

export const RequestSchema = z.object({
  id: z.string().uuid(),
  cloudId: z.number().int().optional(),
  client: z.object({
    name: z.string().min(2, 'Le nom doit contenir au moins 2 caractères'),
    email: z.string().email('Format email invalide'),
    company: z.string().optional(),
    phone: z.string().optional(),
  }),
  machineRef: z.string().optional(),
  partDescription: z.string().min(10, 'La description doit contenir au moins 10 caractères'),
  partFunction: z.string().optional(),
  suspectedMaterial: MaterialSchema.optional(),
  quantity: z.number().int().positive('La quantité doit être supérieure à 0').default(1),
  urgency: RequestUrgencySchema.default('normal'),
  photos: z.array(z.string()).default([]),
  status: RequestStatusSchema.default('new'),
  searchResults: z.array(z.unknown()).optional(),
  partId: z.string().uuid().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
})
export type Request = z.infer<typeof RequestSchema>

// Checks whether an object is a browser File or uploaded file data
const isFile = (val: unknown): boolean => {
  if (typeof File !== 'undefined' && val instanceof File) return true
  if (typeof val === 'object' && val !== null && 'name' in val && 'size' in val) return true
  if (typeof val === 'string' && val.length > 0) return true
  return false
}

export const CreateRequestSchema = RequestSchema.pick({
  client: true,
  machineRef: true,
  partDescription: true,
  partFunction: true,
  suspectedMaterial: true,
  quantity: true,
  urgency: true,
}).extend({
  photos: z
    .array(z.custom<any>((val) => isFile(val), { message: 'Fichier invalide' }))
    .min(1, 'Au moins une photo est requise')
    .max(10, 'Maximum 10 photos autorisées'),
})
export type CreateRequest = z.infer<typeof CreateRequestSchema>

export const RequestFiltersSchema = z.object({
  query: z.string().optional(),
  status: RequestStatusSchema.optional(),
  urgency: RequestUrgencySchema.optional(),
})
export type RequestFilters = z.infer<typeof RequestFiltersSchema>
