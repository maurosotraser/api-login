import { Request, Response, NextFunction } from 'express'
import { dbSecurityConfig } from '../config/security.config'
import { AppDataSource } from '../config/database.config'
import { User } from '../entities/User'

// Interfaz para el contador de intentos de login
interface LoginAttempts {
    count: number
    lastAttempt: Date
    locked: boolean
    lockExpiration?: Date
}

// Almacén en memoria para los intentos de login (en producción usar Redis)
const loginAttemptsStore = new Map<string, LoginAttempts>()

// Middleware para validar la fortaleza de la contraseña
export const validatePasswordStrength = (req: Request, res: Response, next: NextFunction) => {
    const { password } = req.body
    const config = dbSecurityConfig.passwordRequirements

    if (!password || typeof password !== 'string') {
        return res.status(400).json({
            code: 'INVALID_PASSWORD',
            message: 'La contraseña es requerida'
        })
    }

    const errors = []

    if (password.length < config.minLength) {
        errors.push(`La contraseña debe tener al menos ${config.minLength} caracteres`)
    }

    if (config.requireUppercase && !/[A-Z]/.test(password)) {
        errors.push('La contraseña debe contener al menos una letra mayúscula')
    }

    if (config.requireLowercase && !/[a-z]/.test(password)) {
        errors.push('La contraseña debe contener al menos una letra minúscula')
    }

    if (config.requireNumbers && !/\d/.test(password)) {
        errors.push('La contraseña debe contener al menos un número')
    }

    if (config.requireSpecialChars && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
        errors.push('La contraseña debe contener al menos un carácter especial')
    }

    if (errors.length > 0) {
        return res.status(400).json({
            code: 'WEAK_PASSWORD',
            message: 'La contraseña no cumple con los requisitos mínimos',
            details: errors
        })
    }

    next()
}

// Middleware para controlar intentos de login
export const loginAttemptControl = async (req: Request, res: Response, next: NextFunction) => {
    const ip = req.ip || 'unknown'
    const email = req.body.email?.toLowerCase()

    if (!email) {
        return res.status(400).json({
            code: 'INVALID_REQUEST',
            message: 'El email es requerido'
        })
    }

    // Verificar si la IP está bloqueada
    if (dbSecurityConfig.blockedIPs.includes(ip)) {
        return res.status(403).json({
            code: 'IP_BLOCKED',
            message: 'Acceso denegado'
        })
    }

    let attempts = loginAttemptsStore.get(email) || {
        count: 0,
        lastAttempt: new Date(),
        locked: false
    }

    // Verificar si la cuenta está bloqueada
    if (attempts.locked) {
        if (attempts.lockExpiration && new Date() < attempts.lockExpiration) {
            const remainingTime = Math.ceil(
                (attempts.lockExpiration.getTime() - new Date().getTime()) / 1000 / 60
            )
            return res.status(429).json({
                code: 'ACCOUNT_LOCKED',
                message: `Cuenta bloqueada. Intente nuevamente en ${remainingTime} minutos`
            })
        } else {
            // Desbloquear la cuenta si ya pasó el tiempo
            attempts = {
                count: 0,
                lastAttempt: new Date(),
                locked: false
            }
        }
    }

    // Actualizar el contador de intentos
    loginAttemptsStore.set(email, attempts)

    // Adjuntar los intentos al request para su uso en el controlador
    ;(req as any).loginAttempts = attempts

    next()
}

// Middleware para registrar intentos fallidos
export const recordFailedLogin = (req: Request, res: Response, next: NextFunction) => {
    const email = req.body.email?.toLowerCase()
    const attempts = (req as any).loginAttempts

    if (attempts) {
        attempts.count += 1
        attempts.lastAttempt = new Date()

        // Bloquear la cuenta si se exceden los intentos
        if (attempts.count >= dbSecurityConfig.maxLoginAttempts) {
            attempts.locked = true
            attempts.lockExpiration = new Date(
                Date.now() + dbSecurityConfig.lockoutTime * 60 * 1000
            )
        }

        loginAttemptsStore.set(email, attempts)
    }

    next()
}

// Middleware para resetear los intentos después de un login exitoso
export const resetLoginAttempts = (req: Request, res: Response, next: NextFunction) => {
    const email = req.body.email?.toLowerCase()
    if (email) {
        loginAttemptsStore.delete(email)
    }
    next()
}

// Middleware para validar la sesión
export const validateSession = async (req: Request, res: Response, next: NextFunction) => {
    const userId = (req as any).user?.id

    if (!userId) {
        return next()
    }

    try {
        const userRepository = AppDataSource.getRepository(User)
        const user = await userRepository.findOne({ where: { id: userId } })

        if (!user) {
            return res.status(401).json({
                code: 'INVALID_SESSION',
                message: 'Sesión inválida'
            })
        }

        // Verificar si la sesión ha expirado
        const lastActivity = (req as any).user.iat * 1000 // Convertir de segundos a milisegundos
        const now = Date.now()
        const sessionAge = (now - lastActivity) / 1000 // Convertir a segundos

        if (sessionAge > dbSecurityConfig.sessionTimeout) {
            return res.status(401).json({
                code: 'SESSION_EXPIRED',
                message: 'La sesión ha expirado'
            })
        }

        next()
    } catch (error) {
        next(error)
    }
}

// Middleware para auditoría
export const auditLog = (action: string) => {
    return (req: Request, res: Response, next: NextFunction) => {
        const userId = (req as any).user?.id
        const timestamp = new Date()
        const ip = req.ip
        const userAgent = req.headers['user-agent']
        
        // Aquí deberías implementar el registro en tu sistema de logs
        // Por ejemplo, usando Winston o un servicio de logs
        console.log({
            timestamp,
            action,
            userId,
            ip,
            userAgent,
            changes: req.body
        })

        next()
    }
} 