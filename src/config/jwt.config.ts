import { config } from 'dotenv'
import crypto from 'crypto'

config()

// Generar un secreto aleatorio si no está definido en las variables de entorno
const generateSecret = () => {
  return crypto.randomBytes(64).toString('hex')
}

// Convertir el tiempo de expiración a segundos si es una cadena con formato
const parseExpiresIn = (expiresIn: string | undefined): number => {
  if (!expiresIn) return 3600 // 1 hora por defecto
  
  const match = expiresIn.match(/^(\d+)([smhd])$/)
  if (!match) return 3600

  const [, value, unit] = match
  const multipliers: { [key: string]: number } = {
    's': 1,
    'm': 60,
    'h': 3600,
    'd': 86400
  }

  return parseInt(value) * (multipliers[unit] || 3600)
}

export const jwtConfig = {
  secret: process.env.JWT_SECRET || generateSecret(),
  expiresIn: parseExpiresIn(process.env.JWT_EXPIRES_IN),
  algorithm: 'HS256' as const,
  issuer: process.env.JWT_ISSUER || 'auth-api',
  audience: process.env.JWT_AUDIENCE || 'auth-api-client'
} 