import axios from 'axios'
import { KeyQuestor } from '../../config/auth'

export const ApiQuestor = axios.create({
  baseURL: 'https://oak-api.questor.com.br',
  headers: {
    Login: KeyQuestor.Login,
    Password: KeyQuestor.Password,
  },
})
