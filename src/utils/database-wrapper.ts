import { Connection, QueryRunner } from 'typeorm'
import sqlstring from 'sqlstring'
import { detectSqlInjection } from '../middleware/database-security.middleware'

export class SecureDatabase {
    private connection: Connection

    constructor(connection: Connection) {
        this.connection = connection
    }

    private sanitizeInput(value: string): string {
        // Remover scripts y caracteres especiales
        let sanitized = value
            .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
            .replace(/[<>]/g, '')
            .replace(/--/g, '')
            .replace(/;/g, '')
            .replace(/'/g, "''")
            .replace(/\\/g, '\\\\')
            .replace(/\x00/g, '')
            .replace(/\x1a/g, '')
        
        return sanitized
    }

    private validateAndSanitizeQuery(query: string, parameters?: any[]): { query: string, parameters?: any[] } {
        // Primero validar los parámetros
        let sanitizedParams = parameters?.map(param => {
            if (typeof param === 'string') {
                // Verificar si es un intento de inyección
                if (detectSqlInjection(param)) {
                    throw new Error('SQL Injection detectado en los parámetros')
                }
                return this.sanitizeInput(param)
            }
            return param
        })

        // Verificar si hay intentos de inyección en la consulta
        const normalizedQuery = query.trim().toUpperCase()
        
        // Detectar patrones de inyección SQL en la consulta completa
        const dangerousPatterns = [
            /;\s*(SELECT|INSERT|UPDATE|DELETE|DROP|ALTER|TRUNCATE)/i,
            /UNION\s+ALL\s+SELECT/i,
            /--\s*$/m,
            /\/\*.*?\*\//,
            /xp_cmdshell/i,
            /WAITFOR\s+DELAY/i,
            /EXEC\s*\(/i,
            /EXEC\s+sp_/i,
            /EXEC\s+xp_/i
        ]

        if (dangerousPatterns.some(pattern => pattern.test(query))) {
            throw new Error('SQL Injection detectado en la consulta')
        }

        // Para consultas SELECT, verificar la estructura básica
        if (normalizedQuery.startsWith('SELECT')) {
            // Verificar si hay múltiples declaraciones o comandos peligrosos
            if (
                query.includes(';') ||
                /(\bOR\b|\bAND\b)\s*['"]?\s*[^=]+=\s*['"]?/i.test(query) ||
                /'\s*OR\s*'1'\s*=\s*'1'/i.test(query) ||
                /'.*'\s*;\s*--/i.test(query)
            ) {
                throw new Error('SQL Injection detectado en la consulta')
            }
        }

        return { query, parameters: sanitizedParams }
    }

    async query(query: string, parameters?: any[]): Promise<any> {
        const { query: sanitizedQuery, parameters: sanitizedParams } = this.validateAndSanitizeQuery(query, parameters)
        
        // Usar QueryRunner para mayor control sobre la transacción
        const queryRunner: QueryRunner = this.connection.createQueryRunner()
        
        try {
            await queryRunner.connect()
            await queryRunner.startTransaction()
            
            const result = await queryRunner.query(sanitizedQuery, sanitizedParams)
            
            await queryRunner.commitTransaction()
            return result
        } catch (error) {
            await queryRunner.rollbackTransaction()
            throw error
        } finally {
            await queryRunner.release()
        }
    }

    async execute(query: string, parameters?: any[]): Promise<any> {
        const { query: sanitizedQuery, parameters: sanitizedParams } = this.validateAndSanitizeQuery(query, parameters)
        return this.connection.query(sanitizedQuery, sanitizedParams)
    }
}

export const createSecureDatabase = (connection: Connection): SecureDatabase => {
    return new SecureDatabase(connection)
} 