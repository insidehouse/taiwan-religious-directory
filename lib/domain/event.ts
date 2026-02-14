import { z } from 'zod'

export const EventSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1),
  start_at: z.string(),
  end_at: z.string().optional(),
  organizer: z.string().optional(),
  event_type: z.string().min(1),
  source_url: z.string().url().optional(),
})

export type Event = z.infer<typeof EventSchema>
