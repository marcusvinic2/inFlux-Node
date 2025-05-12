import axios from 'axios'

export const ApiMercadoEletronico = axios.create({
  baseURL: 'https://stg.api.mercadoe.com/v1',
})
