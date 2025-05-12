import { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'

import mercadoEletronico from '../../api/mercado-eletronico'
import { BadRequest } from '../../routes/_errors/bad-request'
import { mainSchemaSupplier } from '../../types/mercado-eletronico/supplier'
import questor from '../../api/questor'
import { ApiMercadoEletronico } from '../../infra/mercado-eletronico'
import { ApiQuestor } from '../../infra/questor'
import { buscarCodigoPorCep } from '../../utils/cep-mapper'

export async function webhookSupplier(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().post(
    '/webhook/me/supplier',
    {
      schema: {
        summary: 'Webhook supplier',
        tags: ['Webhook ME'],
        body: mainSchemaSupplier,
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

        if (topic === 'supplier.created') {
          const search_supplier = await ApiMercadoEletronico.get(
            `/suppliers/${data.supplierId}`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            },
          )

          const code_city = await buscarCodigoPorCep('57350-000')

          if (code_city === null) {
            throw new BadRequest('Codigo da cidade não encontrado!')
          }

          search_supplier.data.documents[0].number = '08399687000191'

          if (search_supplier.data.stateRegistrationNumber === '') {
            throw new BadRequest('Codigo IE não encontrado!')
          }

          const supplier = {
            CodigoCidade: code_city,
            CodigoFilial: 402,
            CodigoUsuario: 18,
            CodigoUsuarioAt: 18,
            DescricaoEntidade: search_supplier.data.companyName,
            DescricaoFantasia: search_supplier.data.tradingName,
            DescricaoEndereco: search_supplier.data.address,
            DescricaoBairro: search_supplier.data.neighborhood,
            NumeroCep: search_supplier.data.postalCode.replace(
              /^(\d{5})(\d{3})$/,
              '$1-$2',
            ),
            NumeroRg: '0000000000',
            NumeroCpfcnpj: search_supplier.data.documents[0].number,
            NumeroIe: search_supplier.data.stateRegistrationNumber,
            BoolCliente: false,
            BoolFornecedor: true,
          }

          const created_entity = await ApiQuestor.post('/Entidade', supplier, {
            headers: {
              Authorization: `Bearer ${token_questor}`,
            },
          })

          const updated_supplier = await ApiMercadoEletronico.put(
            `/suppliers/${data.supplierId}`,
            {
              clientSupplierId: created_entity.data.results.codigo.toString(),
            },
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            },
          )

          console.log(created_entity)
          console.log(updated_supplier)
        }

        if (topic === 'supplier.updated') {
          const search_supplier = await ApiMercadoEletronico.get(
            `/suppliers/${data.supplierId}`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            },
          )

          const find_entity = await ApiQuestor.get(
            `/Entidade/${search_supplier.data.clientSupplierId.toString()}`,
            {
              headers: {
                Authorization: `Bearer ${token_questor}`,
              },
            },
          )

          const code_city = await buscarCodigoPorCep('57350-000')

          const supplier = {
            CodigoCidade: code_city,
            CodigoFilial: 402,
            CodigoUsuario: 18,
            CodigoUsuarioAt: 18,
            DescricaoEntidade: search_supplier.data.companyName,
            DescricaoFantasia: search_supplier.data.tradingName,
            DescricaoEndereco: search_supplier.data.address,
            DescricaoBairro: search_supplier.data.neighborhood,
            NumeroCep: search_supplier.data.postalCode.replace(
              /^(\d{5})(\d{3})$/,
              '$1-$2',
            ),
            NumeroRg: '0000000000',
            NumeroCpfcnpj: search_supplier.data.documents[0].number,
            NumeroIe: search_supplier.data.stateRegistrationNumber,
            BoolCliente: false,
            BoolFornecedor: true,
          }

          const updated_entity = await ApiQuestor.put(
            `/Entidade/${search_supplier.data.clientSupplierId.toString()}`,
            supplier,
            {
              headers: {
                Authorization: `Bearer ${token_questor}`,
              },
            },
          )

          console.log(find_entity)
          console.log(search_supplier)
          console.log(updated_entity)
        }

        reply.status(200).send({
          message: 'webhook processado com sucesso',
        })
      } catch (error) {
        console.log(error)
        throw new BadRequest('Ocorreu um erro ao processar pedido!')
      }
    },
  )
}
