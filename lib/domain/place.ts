import { z } from 'zod'

export const ReligionTypeSchema = z.enum([
  'taoism',
  'buddhism',
  'christianity',
  'catholicism',
  'islam',
  'folk',
  'other',
])

export const PublishStatusSchema = z.enum(['draft', 'published'])

export const PlacePublishSchema = z.object({
  id: z.string().uuid(),
  slug: z.string().min(1),
  name: z.string().min(1),
  religion_type: ReligionTypeSchema,
  district: z.string().min(1),
  address: z.string().min(1),
  latitude: z.number(),
  longitude: z.number(),
  source_primary: z.string().min(1),
  source_confidence: z.number().min(0).max(1),
  updated_at: z.string(),
  publish_status: PublishStatusSchema,
  deity_name: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
})

export type PlacePublish = z.infer<typeof PlacePublishSchema>
