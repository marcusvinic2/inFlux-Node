import { FastifyRequest, FastifyReply } from 'fastify'
import jwt, { JwtPayload } from 'jsonwebtoken'
import authConfig from '../config/auth'

declare module 'fastify' {
  interface FastifyRequest {
    user?: JwtPayload | string
  }
}

declare module 'fastify' {
  interface FastifyInstance {
    jwt: {
      verify: (token: string) => JwtPayload | string
    }
  }
}

const authenticate = async (req: FastifyRequest, reply: FastifyReply) => {
  const authHeader = req.headers.authorization
  if (!authHeader) {
    return reply.status(401).send({ message: 'Token não encontrado.' })
  }

  const token = authHeader

  if (!token) {
    return reply.status(401).send({ message: 'Token inválido..' })
  }

  try {
    jwt.verify(token, authConfig.secret)
  } catch (err) {
    return reply.status(401).send({ message: 'Token inválido ou expirado.' })
  }
}

export default authenticate
