import axios from 'axios'
import { KeyQuestor } from '../../config/auth'

export const ApiQuestor = axios.create({
  baseURL: 'http://18.191.21.59:8080',
  headers: {
    Login: KeyQuestor.Login,
    Password: KeyQuestor.Password,
  },
})
