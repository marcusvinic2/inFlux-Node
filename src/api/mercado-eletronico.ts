import { KeyMercadoEletronico } from '../config/auth'
import { ApiMercadoEletronico } from '../infra/mercado-eletronico'
import { BadRequest } from '../routes/_errors/bad-request'

class MercadoEletronico {
  async login() {
    try {
      const { data } = await ApiMercadoEletronico.post('/auth/tokens', {
        clientId: KeyMercadoEletronico.clientId,
        clientSecret: KeyMercadoEletronico.clientSecret,
      })

      return data.accessToken
    } catch (error) {
      throw new BadRequest('Ocorreu um erro ao logar na api MercadoEletronico!')
    }
  }
}

export default new MercadoEletronico()
