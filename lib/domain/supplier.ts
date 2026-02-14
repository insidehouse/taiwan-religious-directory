import { z } from 'zod'

export const SupplierSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  service_type: z.string().min(1),
  phone: z.string().optional(),
  website: z.string().url().optional(),
  district: z.string().min(1),
})

export type Supplier = z.infer<typeof SupplierSchema>
