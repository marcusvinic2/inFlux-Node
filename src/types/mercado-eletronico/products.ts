import { z } from 'zod'

export const mainSchemaProducts = z.object({
  topic: z.string(),
  data: z.object({
    productId: z.string(),
  }),
})
