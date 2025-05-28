import { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { BadRequest } from '../../routes/_errors/bad-request'
import questor from '../../api/questor'
import { ApiQuestor } from '../../infra/questor'
import axios from 'axios'
import { parseCustomDate } from '../../utils/date'
import { findCodigoCliente } from '../../tables/cnpj'

export async function integrationQuestor(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().get(
    '/integration/questor/orders',
    {
      schema: {
        summary: 'Integration orders',
        tags: ['Integration Questor'],
        response: {
          200: z.object({
            message: z.string(),
          }),
        },
      },
    },
    async (request, reply) => {
      let hasError = 0

      try {
        const token_questor = await questor.login()

        const getOrderNeogrid = await axios.get(
          'https://ingestionlayer.neogrid.com/rest/sidecar-rest/api/v1/proxy/documents/metadata?docType=5&docQty=50',
          {
            headers: {
              Authorization: `Basic MDAwMDAwMTc0NjUzMjUxNTIzNTA6QVBJZmxvciMyMDI1`,
            },
          },
        )

        if (getOrderNeogrid.data.length === 0) {
          return reply.status(200).send({
            message: 'Nenhum pedido encontrado',
          })
        }

        hasError = getOrderNeogrid.data[0].documentId

        const getOrderDocumentNeogrid = await axios.get(
          getOrderNeogrid.data[0].downloadLink,
          {
            headers: {
              Authorization: `Basic MDAwMDAwMTc0NjUzMjUxNTIzNTA6QVBJZmxvciMyMDI1`,
            },
          },
        )

        const entityId =
          getOrderDocumentNeogrid.data.order.cabecalho.cnpjLocalEntrega

        const getEntityQuestor = await ApiQuestor.get(`/Entidade/${entityId}`, {
          headers: {
            Authorization: `Bearer ${token_questor}`,
          },
        })

        console.log(getOrderNeogrid.data[0].downloadLink)
        console.log(getOrderDocumentNeogrid.data.order)
        console.log(getEntityQuestor.data)

        const entityData = getEntityQuestor.data.results
        const order = getOrderDocumentNeogrid.data.order
        const order_items = getOrderDocumentNeogrid.data.order.itens

        const new_order = {
          CodigoCarteira: entityData.codigoCarteira ?? 2,
          CodigoFormaPagamento: entityData.codigoFormaPagamento ?? 11,
          CodigoFrete: 0,
          CodigoUsuario: 1,
          CodigoUsuarioAt: 1,
          CodigoStatus: 1,
          CodigoVendedor: 24,
          DataEmissao: parseCustomDate(order.cabecalho.dataHoraEmissao),
          DataEntrega: parseCustomDate(order.cabecalho.dataHoraInicialEntrega),
          CodigoEmpresa: 402,
          CodigoFilial: findCodigoCliente(order.cabecalho.cnpjFornecedor),
          CodigoCliente: order.cabecalho.cnpjLocalEntrega,
          NumeroOrdemCompra: order.cabecalho.numeroPedidoComprador,
          DescricaoObs: order.cabecalho.numeroPedidoComprador,
        }

        const create_order = await ApiQuestor.post(`/Pedido`, new_order, {
          headers: {
            Authorization: `Bearer ${token_questor}`,
          },
        })

        for (const item of order_items.item) {
          const item_order = {
            CodigoLancamento: create_order.data.results.codigo,
            CodigoItem: item.numeroSequencialItem,
            CodigoMaterial: item.codigoProduto,
            CodigoUsuario: 18,
            CodigoUsuarioAt: 18,
            CodigoVendedor: 24,
            DescricaoMaterial: item.descricaoProduto,
            DescricaoPedidoCompra: order.cabecalho.numeroPedidoComprador,
            DescricaoUnidade: 'CX',
            NumeroQuantidade: item.quantidadePedida,
            ValorTotal: item.precoLiquidoUnitario * item.quantidadePedida,
            ValorUnitario: item.precoLiquidoUnitario,
          }

          const order_items = await ApiQuestor.post('/PedidoItem', item_order, {
            headers: {
              Authorization: `Bearer ${token_questor}`,
            },
          })

          console.log(order_items)
        }

        console.log(create_order.data)

        const updated_order_queque = await axios.patch(
          'https://ingestionlayer.neogrid.com/rest/sidecar-rest/api/v1/proxy/documents',
          {
            documents: [
              {
                documentId: getOrderNeogrid.data[0].documentId,
                status: 'PROCESSED',
                message:
                  'Document successfully received and processed by the customer',
              },
            ],
          },
          {
            headers: {
              Authorization: `Basic MDAwMDAwMTc0NjUzMjUxNTIzNTA6QVBJZmxvciMyMDI1`,
            },
          },
        )

        console.log(updated_order_queque.data)

        reply.status(200).send({
          message: 'webhook processado com sucesso',
        })
      } catch (error) {
        console.log(error)
        await axios.patch(
          'https://ingestionlayer.neogrid.com/rest/sidecar-rest/api/v1/proxy/documents',
          {
            documents: [
              {
                documentId: hasError,
                status: 'TRANSMISSION_ERROR',
                message: 'TRANSMISSION ERROR',
              },
            ],
          },
          {
            headers: {
              Authorization: `Basic MDAwMDAwMTc0NjUzMjUxNTIzNTA6QVBJZmxvciMyMDI1`,
            },
          },
        )
        throw new BadRequest('Ocorreu um erro ao processar pedido!')
      }
    },
  )
}
