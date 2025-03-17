import { HelmetOptions } from 'helmet'
import { CorsOptions } from 'cors'
import { Options as RateLimitOptions } from 'express-rate-limit'
import dotenv from 'dotenv'

dotenv.config()

// Configuración de Helmet
export const helmetConfig: HelmetOptions = {
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", "data:", "https:"],
        },
    },
    crossOriginEmbedderPolicy: true,
    crossOriginOpenerPolicy: true,
    crossOriginResourcePolicy: { policy: "same-site" },
    dnsPrefetchControl: true,
    frameguard: { action: "deny" },
    hidePoweredBy: true,
    hsts: true,
    ieNoOpen: true,
    noSniff: true,
    referrerPolicy: { policy: "same-origin" },
    xssFilter: true
}

// Configuración de CORS
export const corsConfig: CorsOptions = {
    origin: process.env.NODE_ENV === 'production'
        ? ['https://tudominio.com']
        : true,
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    exposedHeaders: ['Content-Range', 'X-Content-Range'],
    credentials: true,
    maxAge: 600
}

// Configuración de Rate Limiting
export const rateLimitConfig = {
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Demasiadas solicitudes, por favor intente más tarde'
    },
    standardHeaders: true,
    legacyHeaders: false
} as const

// Configuración de seguridad de la base de datos
export const dbSecurityConfig = {
    // Tiempo máximo de vida de una sesión (en segundos)
    sessionTimeout: 3600,
    
    // Número máximo de intentos de login fallidos antes de bloquear
    maxLoginAttempts: 5,
    
    // Tiempo de bloqueo después de exceder los intentos (en minutos)
    lockoutTime: 15,
    
    // Requisitos de contraseña
    passwordRequirements: {
        minLength: 8,
        requireUppercase: true,
        requireLowercase: true,
        requireNumbers: true,
        requireSpecialChars: true,
        preventCommonPasswords: true
    },
    
    // Configuración de tokens
    tokens: {
        accessTokenExpiry: '1h',
        refreshTokenExpiry: '7d',
        algorithm: 'HS256'
    },
    
    // Lista de IPs bloqueadas
    blockedIPs: process.env.BLOCKED_IPS ? process.env.BLOCKED_IPS.split(',') : []
}

// Configuración de auditoría
export const auditConfig = {
    // Eventos que serán registrados
    logEvents: [
        'login',
        'logout',
        'register',
        'passwordChange',
        'passwordReset',
        'roleChange',
        'userUpdate',
        'userDelete'
    ],
    
    // Detalles a registrar por cada evento
    logDetails: {
        timestamp: true,
        userId: true,
        action: true,
        ip: true,
        userAgent: true,
        changes: true
    }
} 