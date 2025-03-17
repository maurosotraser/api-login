import { Request, Response, NextFunction } from 'express'
import { z } from 'zod'

// Esquema de validación para el registro
const registerSchema = z.object({
    email: z.string().email('Email inválido'),
    password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
    name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
    role: z.enum(['admin', 'editor', 'user']).optional().default('user')
})

// Esquema de validación para el login
const loginSchema = z.object({
    email: z.string().email('Email inválido'),
    password: z.string().min(1, 'La contraseña es requerida')
})

// Middleware de validación para el registro
export const validateRegisterRequest = (req: Request, res: Response, next: NextFunction) => {
    try {
        const validatedData = registerSchema.parse(req.body)
        req.body = validatedData // Reemplazar el body con los datos validados
        next()
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({
                code: 'VALIDATION_ERROR',
                message: 'Error de validación',
                details: error.errors.map(err => ({
                    field: err.path.join('.'),
                    message: err.message
                }))
            })
        }
        next(error)
    }
}

// Middleware de validación para el login
export const validateLoginRequest = (req: Request, res: Response, next: NextFunction) => {
    try {
        const validatedData = loginSchema.parse(req.body)
        req.body = validatedData // Reemplazar el body con los datos validados
        next()
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({
                code: 'VALIDATION_ERROR',
                message: 'Error de validación',
                details: error.errors.map(err => ({
                    field: err.path.join('.'),
                    message: err.message
                }))
            })
        }
        next(error)
    }
} 