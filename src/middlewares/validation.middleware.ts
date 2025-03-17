import { Request, Response, NextFunction } from 'express'
import { z } from 'zod'
import { UserRole } from '../types/auth'

const commonPasswords = [
  '123', 'abc', 'password', '12345678', 'qwerty', 'letmein', 'admin', 'welcome',
  'password123', '123456', 'admin123', '111111', 'abc123', 'monkey', 'dragon'
]

const passwordSchema = z.string()
  .min(8, 'La contraseña debe tener al menos 8 caracteres')
  .regex(/[A-Z]/, 'La contraseña debe contener al menos una mayúscula')
  .regex(/[a-z]/, 'La contraseña debe contener al menos una minúscula')
  .regex(/[0-9]/, 'La contraseña debe contener al menos un número')
  .regex(/[^A-Za-z0-9]/, 'La contraseña debe contener al menos un carácter especial')

const registerSchema = z.object({
  email: z.string().email('Email inválido'),
  password: passwordSchema,
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres').optional(),
  role: z.enum(['admin', 'editor', 'user'] as const).optional()
})

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'La contraseña es requerida')
})

export const validateAuthInput = (req: Request, res: Response, next: NextFunction) => {
  const { email, password } = req.body

  if (!email) {
    return res.status(400).json({ 
      code: 'EMAIL_REQUIRED',
      message: 'El email es requerido' 
    })
  }

  if (!password) {
    return res.status(400).json({ 
      code: 'PASSWORD_REQUIRED',
      message: 'La contraseña es requerida' 
    })
  }

  // Validar caracteres especiales o inyección SQL básica
  const sqlInjectionRegex = /['";]|(--)|(\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|ALTER)\b)/i
  if (sqlInjectionRegex.test(email) || sqlInjectionRegex.test(password)) {
    return res.status(400).json({ 
      code: 'INVALID_CHARACTERS',
      message: 'Caracteres no permitidos en las credenciales' 
    })
  }

  // Validar formato de email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    return res.status(400).json({ 
      code: 'INVALID_EMAIL_FORMAT',
      message: 'El formato del email es inválido' 
    })
  }

  // Validar longitud mínima de contraseña
  if (password.length < 8) {
    return res.status(400).json({ 
      code: 'PASSWORD_TOO_SHORT',
      message: 'La contraseña debe tener al menos 8 caracteres' 
    })
  }

  // Validar complejidad de contraseña
  const hasUpperCase = /[A-Z]/.test(password)
  const hasLowerCase = /[a-z]/.test(password)
  const hasNumbers = /\d/.test(password)
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password)

  if (!(hasUpperCase && hasLowerCase && hasNumbers && hasSpecialChar)) {
    return res.status(400).json({ 
      code: 'PASSWORD_COMPLEXITY',
      message: 'La contraseña debe contener al menos una mayúscula, una minúscula, un número y un carácter especial' 
    })
  }

  // Validar contraseñas comunes
  if (commonPasswords.includes(password.toLowerCase())) {
    return res.status(400).json({ 
      code: 'COMMON_PASSWORD',
      message: 'La contraseña es demasiado común o débil' 
    })
  }

  next()
}

export const validateRegister = (req: Request, res: Response, next: NextFunction) => {
  try {
    registerSchema.parse(req.body)
    next()
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ 
        message: 'Datos de registro inválidos',
        errors: error.errors.map((err: z.ZodIssue) => err.message)
      })
    } else {
      res.status(500).json({ message: 'Error interno del servidor' })
    }
  }
}

export const validateLogin = (req: Request, res: Response, next: NextFunction) => {
  try {
    loginSchema.parse(req.body)
    next()
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ 
        message: 'Datos de inicio de sesión inválidos',
        errors: error.errors.map((err: z.ZodIssue) => err.message)
      })
    } else {
      res.status(500).json({ message: 'Error interno del servidor' })
    }
  }
} 