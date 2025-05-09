import { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { mainSchemaProducts } from '../../types/mercado-eletronico/products'
import { ApiMercadoEletronico } from '../../infra/mercado-eletronico'
import mercadoEletronico from '../../api/mercado-eletronico'
import questor from '../../api/questor'
import { BadRequest } from '../../routes/_errors/bad-request'
import { ApiQuestor } from '../../infra/questor'
import { converterUnidadeQuestor } from '../../tables/unidades'

export async function webhookProducts(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().post(
    '/webhook/me/products',
    {
      schema: {
        summary: 'Webhook products',
        tags: ['Webhook ME'],
        body: mainSchemaProducts,
        response: {
          200: z.object({
            message: z.string(),
          }),
        },
      },
    },
    async (request, reply) => {
      try {
        const { topic, data } = request.body

        const token = await mercadoEletronico.login()
        const token_questor = await questor.login()

        if (topic === 'product.created' || topic === 'product.updated') {
          const search_product = await ApiMercadoEletronico.get(
            `/products/${data.productId}`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            },
          )

          const product = search_product.data

          const new_product = {
            CodigoUnidade: converterUnidadeQuestor(product.measurementUnit),
            CodigoSubgrupo: product.materialCategory,
            CodigoTipoItem: product.applicationType,
            CodigoUsuario: 18,
            CodigoUsuarioAt: 18,
            CodigoGenero: product.productIdentificationCode.value.slice(0, 2),
            CodigoNcm: product.productIdentificationCode.value,
            DescricaoMaterial: product.description,
            DescricaoMaterialNf: product.description,
            NumeroSittributariaEcf: 'I',
          }

          console.log(search_product.data)

          const send_product = await ApiQuestor.post('/Material', new_product, {
            headers: {
              Authorization: `Bearer ${token_questor}`,
            },
          })

          console.log(send_product)
        }

        reply.status(200).send({
          message: 'webhook processado com sucesso',
        })
      } catch (error) {
        console.log(error)
        throw new BadRequest('Ocorreu um erro ao processar webhook!')
      }
    },
  )
}
