import fastify from 'fastify'
import fastifyCors from '@fastify/cors'
import {
  jsonSchemaTransform,
  serializerCompiler,
  validatorCompiler,
  ZodTypeProvider,
} from 'fastify-type-provider-zod'
import fastifySwagger from '@fastify/swagger'
import fastifySwaggerUI from '@fastify/swagger-ui'

import { errorHandler } from './error-handler'
import { webhookOrders } from './webhooks/mercado-eletronico/orders'
import { webhookProducts } from './webhooks/mercado-eletronico/products'
import { webhookSupplier } from './webhooks/mercado-eletronico/suppliers'
import { integrationQuestor } from './integrations/neogrid-questor'
import { startIntegrationOrdersJob } from './jobs/integration-orders-job'
// import productController from './controller/productController'

export const app = fastify().withTypeProvider<ZodTypeProvider>()

app.register(fastifyCors, {
  origin: '*',
})

app.register(fastifySwagger, {
  swagger: {
    consumes: ['application/json'],
    produces: ['application/json'],
    info: {
      title: 'MZAP API',
      description: 'Documentação API',
      version: '1.0.0',
    },
  },
  transform: jsonSchemaTransform,
})

app.register(fastifySwaggerUI, {
  routePrefix: '/docs',
})

app.setValidatorCompiler(validatorCompiler)
app.setSerializerCompiler(serializerCompiler)

// app.register(productController.create)

// webhooks
app.register(webhookOrders)
app.register(webhookProducts)
app.register(webhookSupplier)
app.register(integrationQuestor)

// Inicia o job agendado
startIntegrationOrdersJob()

app.setErrorHandler(errorHandler)

app.listen({ port: 8000, host: '0.0.0.0' }).then(() => {
  console.log('HTTP server running!')
})
