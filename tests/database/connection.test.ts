import { describe, it, expect, beforeAll, afterAll } from '@jest/globals'
import { AppDataSource } from '../../src/config/database.config'
import { User } from '../../src/entities/User'
import { DataSource, DataSourceOptions } from 'typeorm'

describe('🗄️ Tests de Conexión a Base de Datos', () => {
    let connection: DataSource

    beforeAll(async () => {
        try {
            connection = await AppDataSource.initialize()
            console.log('Conexión a base de datos establecida para tests')
        } catch (error) {
            console.error('Error al conectar a la base de datos:', error)
            throw error
        }
    })

    afterAll(async () => {
        if (connection && connection.isInitialized) {
            await connection.destroy()
            console.log('Conexión a base de datos cerrada')
        }
    })

    it('✅ Conexión: Debería conectarse exitosamente a la base de datos', async () => {
        expect(connection.isInitialized).toBe(true)
    })

    it('✅ Configuración: Debería tener la configuración correcta', () => {
        const config = AppDataSource.options as any
        expect(config.type).toBe('mssql')
        expect(config.database).toBe('maupruebas')
    })

    it('✅ Entidades: Debería tener las entidades registradas', () => {
        const entities = AppDataSource.entityMetadatas
        const entityNames = entities.map(entity => entity.name)
        expect(entityNames).toContain('User')
    })

    it('✅ Tablas: Debería tener las tablas necesarias', async () => {
        const queryRunner = connection.createQueryRunner()
        try {
            const tables = await queryRunner.getTables(['users'])
            expect(tables.length).toBe(1)
        } finally {
            await queryRunner.release()
        }
    })

    it('✅ Columnas: Debería tener la estructura correcta en la tabla users', async () => {
        const userMetadata = connection.getMetadata(User)
        const columns = userMetadata.columns

        const requiredColumns = ['id', 'email', 'password', 'role', 'createdAt', 'updatedAt']
        const columnNames = columns.map(column => column.propertyName)

        requiredColumns.forEach(columnName => {
            expect(columnNames).toContain(columnName)
        })
    })

    it('✅ Índices: Debería tener los índices correctos', async () => {
        const userMetadata = connection.getMetadata(User)
        const indices = userMetadata.indices

        // Verificar índice único en email
        const emailIndex = indices.find(index => 
            index.columns.some(column => column.propertyName === 'email')
        )
        expect(emailIndex).toBeDefined()
        expect(emailIndex?.isUnique).toBe(true)
    })

    it('✅ Transacciones: Debería manejar transacciones correctamente', async () => {
        const queryRunner = connection.createQueryRunner()
        await queryRunner.startTransaction()

        try {
            // Intentar crear un usuario en la transacción
            const testUser = new User()
            testUser.email = 'transaction@test.com'
            testUser.password = 'hashedPassword123'
            testUser.role = 'user'

            await queryRunner.manager.save(testUser)

            // Verificar que el usuario existe en la transacción
            const savedUser = await queryRunner.manager.findOne(User, {
                where: { email: 'transaction@test.com' }
            })
            expect(savedUser).toBeDefined()

            // Hacer rollback para no afectar la base de datos
            await queryRunner.rollbackTransaction()
        } finally {
            await queryRunner.release()
        }
    })

    it('❌ Conexión: Debería manejar errores de conexión', async () => {
        const invalidConfig: DataSourceOptions = {
            ...AppDataSource.options as any,
            type: 'mssql',
            host: 'invalid-host'
        }
        
        const invalidDataSource = new DataSource(invalidConfig)
        await expect(invalidDataSource.initialize()).rejects.toThrow()
    })

    it('❌ Consultas: Debería manejar errores de consulta', async () => {
        await expect(
            connection.query('SELECT * FROM tabla_inexistente')
        ).rejects.toThrow()
    })

    it('✅ Pool de Conexiones: Debería manejar múltiples conexiones', async () => {
        const promises = Array(5).fill(null).map(() => 
            connection.query('SELECT 1 as result')
        )

        const results = await Promise.all(promises)
        results.forEach(result => {
            expect(result[0].result).toBe(1)
        })
    })

    it('✅ Timeout: Debería respetar el timeout de conexión', async () => {
        const config = AppDataSource.options as any
        expect(config.options?.connectTimeout).toBe(30000)
    })
}) 