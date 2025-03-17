import jwt, { Secret, SignOptions } from 'jsonwebtoken'
import { jwtConfig } from '../config/jwt.config'

export const generateToken = (userId: string): string => {
  const payload = {
    id: userId,
    iat: Math.floor(Date.now() / 1000)
  }

  const options: SignOptions = {
    expiresIn: jwtConfig.expiresIn,
    algorithm: jwtConfig.algorithm,
    issuer: jwtConfig.issuer,
    audience: jwtConfig.audience
  }

  return jwt.sign(payload, jwtConfig.secret as Secret, options)
}

export const verifyToken = (token: string) => {
  return jwt.verify(token, jwtConfig.secret as Secret, {
    algorithms: [jwtConfig.algorithm],
    issuer: jwtConfig.issuer,
    audience: jwtConfig.audience
  })
}