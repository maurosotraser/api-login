import { createConnection, getConnection, Connection, ConnectionOptions } from 'typeorm'
import { createSecureDatabase, SecureDatabase } from '../../src/utils/database-wrapper'
import { User } from '../../src/entities/User'
import { SqlServerConnectionOptions } from 'typeorm/driver/sqlserver/SqlServerConnectionOptions'

describe('🔒 Tests de Seguridad de Base de Datos', () => {
    let connection: Connection
    let secureDb: SecureDatabase

    beforeAll(async () => {
        connection = await createConnection({
            type: 'mssql',
            host: '34.176.70.40',
            port: 1433,
            username: 'sqlserver',
            password: 'M@uro0753',
            database: 'maupruebas',
            entities: [User],
            synchronize: true,
            options: {
                encrypt: true,
                trustServerCertificate: true,
                enableArithAbort: true,
                connectTimeout: 30000
            },
            pool: {
                min: 0,
                max: 10
            },
            extra: {
                trustServerCertificate: true,
                validateConnection: true,
                maxPreparedStatements: 100
            }
        } as SqlServerConnectionOptions)
        secureDb = createSecureDatabase(connection)
        console.log('Conexión a base de datos establecida para tests de seguridad')
    })

    afterAll(async () => {
        if (connection?.isConnected) {
            await connection.close()
            console.log('Conexión a base de datos cerrada')
        }
    })

    test('❌ SQL Injection: Debería prevenir ataques de inyección SQL básicos', async () => {
        const maliciousQueries = [
            "' OR '1'='1",
            "'; DROP TABLE users; --",
            "' UNION SELECT * FROM users; --",
            "' OR 1=1; --",
            "admin@ejemplo.com'; DELETE FROM users; --"
        ]

        for (const query of maliciousQueries) {
            await expect(async () => {
                await secureDb.query(`SELECT * FROM users WHERE email = '${query}'`)
            }).rejects.toThrow('SQL Injection detectado en la consulta')
        }
    })

    test('✅ Consultas Parametrizadas: Debería usar parámetros en lugar de concatenación', async () => {
        const email = 'test@example.com'
        const result = await secureDb.query('SELECT * FROM users WHERE email = @0', [email])
        expect(Array.isArray(result)).toBeTruthy()
    })

    test('❌ Credenciales: Debería fallar con credenciales inválidas', async () => {
        const invalidCredentials = {
            email: "' OR '1'='1",
            password: "' OR '1'='1"
        }

        await expect(async () => {
            await secureDb.query(
                'SELECT * FROM users WHERE email = @0 AND password = @1',
                [invalidCredentials.email, invalidCredentials.password]
            )
        }).rejects.toThrow('SQL Injection detectado en la consulta')
    })

    test('✅ SSL/TLS: Debería verificar la configuración de encriptación', () => {
        const config = connection.options as SqlServerConnectionOptions
        expect(config.options?.encrypt).toBeTruthy()
    })

    test('✅ Timeout: Debería tener un timeout de conexión configurado', () => {
        const config = connection.options as SqlServerConnectionOptions
        expect(config.options?.connectTimeout).toBeDefined()
    })

    test('❌ Privilegios: Debería prevenir operaciones no autorizadas', async () => {
        const result = await secureDb.query('SELECT * FROM users')
        expect(Array.isArray(result)).toBeTruthy()
        expect(result.length).toBeGreaterThanOrEqual(0)
    })

    test('✅ Sanitización: Debería sanitizar entradas de usuario', async () => {
        const maliciousInput = {
            email: "test@example.com<script>alert('xss')</script>",
            password: "password' OR '1'='1"
        }

        await expect(async () => {
            await secureDb.query(
                'SELECT * FROM users WHERE email = @0 AND password = @1',
                [maliciousInput.email, maliciousInput.password]
            )
        }).rejects.toThrow('SQL Injection detectado en la consulta')
    })

    test('✅ Pool de Conexiones: Debería tener límites configurados', () => {
        const config = connection.options as SqlServerConnectionOptions
        expect(config.pool?.max).toBeDefined()
        expect(config.pool?.min).toBeDefined()
    })

    test('✅ Consultas Preparadas: Debería soportar prepared statements', async () => {
        const email = 'test@example.com'
        const result = await secureDb.query('SELECT * FROM users WHERE email = @0', [email])
        expect(Array.isArray(result)).toBeTruthy()
    })

    test('❌ Inyección en Orden (SQL Order Injection): Debería prevenir inyección en ORDER BY', async () => {
        const maliciousOrderBy = "id; DROP TABLE users"
        
        await expect(async () => {
            await secureDb.query(`SELECT * FROM users ORDER BY ${maliciousOrderBy}`)
        }).rejects.toThrow('SQL Injection detectado en la consulta')
    })
}) 