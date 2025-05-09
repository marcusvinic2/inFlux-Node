import { z } from 'zod'

export const mainSchemaSupplier = z.object({
  topic: z.string(),
  data: z.object({
    supplierId: z.string(),
  }),
})
