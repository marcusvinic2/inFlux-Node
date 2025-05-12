import { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { mainSchemaOrders } from '../../types/mercado-eletronico/orders'
import Questor from '../../api/questor'
import mercadoEletronico from '../../api/mercado-eletronico'
import { BadRequest } from '../../routes/_errors/bad-request'
import { ApiMercadoEletronico } from '../../infra/mercado-eletronico'
import { ApiQuestor } from '../../infra/questor'
import console from 'console'

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

        const token_me = await mercadoEletronico.login()
        const token_questor = await Questor.login()

        if (topic === 'preorder.status') {
          if (data.status === '124') {
            // Pedido Aprovado

            const pre_order = await ApiMercadoEletronico.get(
              `/pre-orders/${data.preOrderId}`,
              {
                headers: {
                  Authorization: `Bearer ${token_me}`,
                },
              },
            )

            const pre_order_attributes = await ApiMercadoEletronico.get(
              `/pre-orders/${data.preOrderId}/attributes`,
              {
                headers: {
                  Authorization: `Bearer ${token_me}`,
                },
              },
            )

            if (pre_order.data.clientOrderId) {
              // verificando se o pedido já foi criado
            }

            const pre_order_items = await ApiMercadoEletronico.get(
              `/pre-orders/${data.preOrderId}/items`,
              {
                headers: {
                  Authorization: `Bearer ${token_me}`,
                },
              },
            )

            const entity_questor = await ApiQuestor.get(
              `/Entidade/${pre_order.data.clientSupplierId}`,
              {
                headers: {
                  Authorization: `Bearer ${token_questor}`,
                },
              },
            )

            const data_entity = entity_questor.data.results
            const portfolio = pre_order_attributes.data.data[0].value
            const first_char_portfolio = portfolio.trim()[0]

            const new_order_v2 = {
              CodigoFilial: data_entity.codigoFilial,
              CodigoEmpresa: 402,
              CodigoEntidade: data_entity.codigo,
              CodigoStatus: 1,
              CodigoFrete: 0,
              CodigoUsuario: data_entity.codigoUsuario,
              CodigoUsuarioAt: data_entity.codigoUsuarioAt,
              DescricaoComprador: data.preOrderId,
              CodigoFormaPagamento: data_entity.codigoFormaPagamento ?? 11,
              CodigoCarteira: parseInt(first_char_portfolio, 10) ?? 2,
              CodigoPrazoEntrega: 1,
              DataEmissao: pre_order.data.creationDate,
              DescricaoImpostos: 'teste',
            }

            const order = await ApiQuestor.post('/OrdemCompra', new_order_v2, {
              headers: {
                Authorization: `Bearer ${token_questor}`,
              },
            })

            for (const item of pre_order_items.data.data) {
              const item_order = {
                CodigoOrdemCompra: order.data.results.codigo,
                CodigoMaterial: parseInt(item.clientProductId, 10),
                CodigoUsuario: data_entity.codigoUsuario,
                CodigoUsuarioAt: data_entity.codigoUsuarioAt,
                DescricaoMaterial: item.description,
                DescricaoUnidade: item.measurementUnit,
                CodigoItem: item.itemNumber,
              }

              const order_items = await ApiQuestor.post(
                '/OrdemCompraItem',
                item_order,
                {
                  headers: {
                    Authorization: `Bearer ${token_questor}`,
                  },
                },
              )

              console.log(order)
              console.log(item)
              console.log(item_order)
              console.log(order_items)
            }

            await ApiMercadoEletronico.put(
              `/pre-orders/${data.preOrderId}/status`,
              {
                clientOrderId: order.data.results.codigo.toString(),
                status: 1,
                clientSupplierId: pre_order.data.clientSupplierId,
              },
              {
                headers: {
                  Authorization: `Bearer ${token_me}`,
                },
              },
            )
          }

          if (data.status === '3') {
            //
            const pre_order_updates = await ApiMercadoEletronico.get(
              `/pre-orders/${data.preOrderId}`,
              {
                headers: {
                  Authorization: `Bearer ${token_me}`,
                },
              },
            )

            const order_status = await ApiQuestor.patch(
              `/Pedido/${pre_order_updates.data.clientOrderId}`,
              [
                {
                  NomePropriedade: 'CodigoStatus',
                  ValorPropriedade: '4',
                },
              ],
              {
                headers: {
                  Authorization: `Bearer ${token_questor}`,
                },
              },
            )

            console.log(pre_order_updates)
            console.log(order_status)
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
