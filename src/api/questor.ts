import { ApiQuestor } from '../infra/questor'
import { BadRequest } from '../routes/_errors/bad-request'

class Questor {
  async login() {
    try {
      const { data } = await ApiQuestor.get('/Login')

      return data.results.token
    } catch (error) {
      throw new BadRequest('Ocorreu um erro ao logar na api Questor!')
    }
  }
}

export default new Questor()
