import { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { mainSchemaOrders } from '../../types/mercado-eletronico/orders'
import Questor from '../../api/questor'
import mercadoEletronico from '../../api/mercado-eletronico'
import { BadRequest } from '../../routes/_errors/bad-request'
import { ApiMercadoEletronico } from '../../infra/mercado-eletronico'
import { ApiQuestor } from '../../infra/questor'

export async function webhookOrders(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().post(
    '/webhook/me/orders',
    {
      schema: {
        summary: 'Webhook Orders',
        tags: ['Webhook ME'],
        body: mainSchemaOrders,
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

        if (topic === 'preorder.status') {
          if (data.status === '1') {
            // Pedido Aprovado

            const token_me = await mercadoEletronico.login()
            const token_questor = await Questor.login()

            const pre_order = await ApiMercadoEletronico.get(
              `/pre-orders/${data.preOrderId}`,
              {
                headers: {
                  Authorization: `Bearer ${token_me}`,
                },
              },
            )

            const pre_order_items = await ApiMercadoEletronico.get(
              `/pre-orders/${data.preOrderId}/items`,
              {
                headers: {
                  Authorization: `Bearer ${token_me}`,
                },
              },
            )

            const entity_questor = await ApiQuestor.get(
              `/Entidade/${pre_order.data.clientDeliveryPlaceId}`,
              {
                headers: {
                  Authorization: `Bearer ${token_questor}`,
                },
              },
            )

            const data_entity = entity_questor.data.results

            const new_order = {
              CodigoCarteira: data_entity.codigoCarteira ?? 2,
              CodigoFormaPagamento: data_entity.codigoFormaPagamento ?? 11,
              CodigoFrete: 0,
              CodigoUsuario: data_entity.codigoUsuario,
              CodigoUsuarioAt: data_entity.codigoUsuarioAt,
              CodigoStatus: 1,
              CodigoVendedor: data_entity.codigoVendedor,
              DataEmissao: pre_order.data.creationDate,
              DataEntrega:
                pre_order_items.data.data[0]?.deliveries?.[0]?.deliveryDate,
              CodigoEmpresa: 402,
              CodigoFilial: data_entity.codigoFilial,
              CodigoCliente: pre_order.data.clientDeliveryPlaceId,
              NumeroOrdemCompra: pre_order.data.preOrderId.toString(),
              DescricaoObs: pre_order.data.note,
            }

            const order = await ApiQuestor.post('/Pedido', new_order, {
              headers: {
                Authorization: `Bearer ${token_questor}`,
              },
            })

            console.log(order)
          }
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
