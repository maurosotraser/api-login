import { Request, Response, NextFunction } from 'express'
import { QueryFailedError } from 'typeorm'
import sqlstring from 'sqlstring'

// Lista de palabras clave SQL peligrosas
const SQL_KEYWORDS = [
    'DELETE',
    'DROP',
    'TRUNCATE',
    'ALTER',
    'UPDATE',
    'INSERT',
    'UNION',
    '--',
    ';',
    'xp_',
    'sp_',
    'EXEC',
    'EXECUTE',
    'WAITFOR',
    'DELAY'
]

// Función para detectar posibles inyecciones SQL
export const detectSqlInjection = (value: string): boolean => {
    if (!value) return false
    
    // Si es un email válido, permitir
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
    if (emailRegex.test(value)) {
        return false
    }

    // Verificar patrones comunes de inyección SQL
    const sqlInjectionPatterns = [
        /(\b|'|")(;\s*(SELECT|INSERT|UPDATE|DELETE|DROP))/i,
        /(\b|'|")(--\s*$)/,
        /(\b|'|")(\/\*.*\*\/)/,
        /(\b|'|")(xp_\w+)/i,
        /(\b|'|")(sp_\w+)/i,
        /(\b|'|")(WAITFOR\s+DELAY)/i,
        /(\b|'|")(EXEC\s+)/i,
        /(\b|'|")(;\s*DROP\s+)/i,
        /(\b|'|")(;\s*DELETE\s+)/i,
        /(\b|'|")(;\s*ALTER\s+)/i,
        /(\b|'|")(;\s*TRUNCATE\s+)/i
    ]

    // Verificar patrones de inyección
    return sqlInjectionPatterns.some(pattern => pattern.test(value))
}

// Función para sanitizar entradas
const sanitizeInput = (value: string): string => {
    // Remover scripts y caracteres especiales
    let sanitized = value
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/[<>]/g, '')
        .replace(/--/g, '')
        .replace(/;/g, '')
        .replace(/'/g, "''")
        .replace(/\\/g, '\\\\')
    
    return sanitized
}

// Middleware para sanitizar parámetros
export const sanitizeDatabaseInputs = (req: Request, res: Response, next: NextFunction) => {
    const sanitizeValue = (value: any): any => {
        if (typeof value === 'string') {
            return sanitizeInput(value)
        }
        if (Array.isArray(value)) {
            return value.map(sanitizeValue)
        }
        if (value && typeof value === 'object') {
            return Object.keys(value).reduce((acc, key) => ({
                ...acc,
                [key]: sanitizeValue(value[key])
            }), {})
        }
        return value
    }

    // Sanitizar body, query y params
    if (req.body) req.body = sanitizeValue(req.body)
    if (req.query) req.query = sanitizeValue(req.query as any)
    if (req.params) req.params = sanitizeValue(req.params)

    next()
}

// Middleware para prevenir inyección SQL
export const preventSqlInjection = (req: Request, res: Response, next: NextFunction) => {
    const checkValue = (value: any): boolean => {
        if (typeof value === 'string' && detectSqlInjection(value)) {
            return true
        }
        if (Array.isArray(value)) {
            return value.some(checkValue)
        }
        if (value && typeof value === 'object') {
            return Object.values(value).some(checkValue)
        }
        return false
    }

    // Verificar body, query y params
    if (
        checkValue(req.body) ||
        checkValue(req.query) ||
        checkValue(req.params)
    ) {
        return res.status(400).json({
            code: 'SQL_INJECTION_DETECTED',
            message: 'Se detectó un posible ataque de inyección SQL'
        })
    }

    next()
}

// Middleware para manejar errores de base de datos
export const handleDatabaseErrors = (err: Error, req: Request, res: Response, next: NextFunction) => {
    if (err instanceof QueryFailedError) {
        // Log del error para análisis (pero no enviar detalles al cliente)
        console.error('Error de base de datos:', {
            message: err.message,
            query: (err as any).query,
            parameters: (err as any).parameters,
            timestamp: new Date().toISOString()
        })

        // Respuesta genérica para el cliente
        return res.status(500).json({
            code: 'DATABASE_ERROR',
            message: 'Error interno de la base de datos'
        })
    }

    next(err)
}

// Middleware para validar orden en consultas
export const validateOrderBy = (allowedFields: string[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
        const orderBy = req.query.orderBy as string
        
        if (!orderBy) {
            return next()
        }

        // Verificar si hay intentos de inyección en el orderBy
        if (detectSqlInjection(orderBy)) {
            return res.status(400).json({
                code: 'SQL_INJECTION_DETECTED',
                message: 'Se detectó un posible ataque de inyección SQL en el parámetro de ordenamiento'
            })
        }

        // Sanitizar y validar el campo de ordenamiento
        const sanitizedOrderBy = sanitizeInput(orderBy)
        
        if (!allowedFields.includes(sanitizedOrderBy)) {
            return res.status(400).json({
                code: 'INVALID_ORDER_BY',
                message: 'Campo de ordenamiento no válido'
            })
        }

        // Reemplazar el valor original con el sanitizado
        req.query.orderBy = sanitizedOrderBy
        next()
    }
} 