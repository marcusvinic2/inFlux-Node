import { z } from 'zod'

export const mainSchemaOrders = z.object({
  topic: z.string(),
  data: z.object({
    preOrderId: z.string(),
    status: z.string(),
    previousStatus: z.string(),
  }),
})
