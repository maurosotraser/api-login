import { DataSource } from 'typeorm'
import { User } from '../entities/User'
import dotenv from 'dotenv'

dotenv.config()

export const AppDataSource = new DataSource({
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
}) 