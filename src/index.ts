import 'reflect-metadata'
import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import rateLimit from 'express-rate-limit'
import helmet from 'helmet'
import authRoutes from './routes/auth.routes'
import { AppDataSource } from './config/database.config'
import { User } from './entities/User'
import bcrypt from 'bcryptjs'
import hpp from 'hpp'
import mongoSanitize from 'express-mongo-sanitize'
import { 
    sanitizeDatabaseInputs, 
    preventSqlInjection, 
    handleDatabaseErrors 
} from './middleware/database-security.middleware'

dotenv.config()

export const app = express()
const PORT = process.env.PORT || 3000

// Configuración de seguridad básica con helmet (incluye protección XSS)
app.use(helmet({
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
}))

// Límite de tamaño de payload
app.use(express.json({ limit: '10kb' }))
app.use(express.urlencoded({ extended: true, limit: '10kb' }))

// Sanitización de datos
app.use(mongoSanitize())

// Prevención de HTTP Parameter Pollution
app.use(hpp())

// Configuración de CORS más restrictiva
const corsOptions = {
    origin: process.env.NODE_ENV === 'production' 
        ? ['https://tudominio.com'] // En producción, solo permitir dominios específicos
        : true, // En desarrollo, permitir todos
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    exposedHeaders: ['Content-Range', 'X-Content-Range'],
    credentials: true,
    maxAge: 600 // 10 minutos
}

app.use(cors(corsOptions))

// Rate limiting más restrictivo
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 100, // límite de 100 solicitudes por ventana por IP
    message: { 
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Demasiadas solicitudes, por favor intente más tarde' 
    },
    standardHeaders: true,
    legacyHeaders: false
})

// Aplicar rate limiting a todas las rutas de autenticación
app.use('/auth', limiter)

// Middleware para validar el tipo de contenido
app.use((req, res, next) => {
    if (req.method === 'POST' && !req.is('application/json')) {
        return res.status(415).json({
            code: 'UNSUPPORTED_MEDIA_TYPE',
            message: 'El contenido debe ser application/json'
        })
    }
    next()
})

// Aplicar middlewares de seguridad de base de datos
app.use(sanitizeDatabaseInputs)
app.use(preventSqlInjection)

// Rutas
app.use('/auth', authRoutes)

// Manejador de errores de base de datos (debe ir antes del manejador general)
app.use(handleDatabaseErrors)

// Manejador de errores mejorado
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error(`[${new Date().toISOString()}] Error:`, {
        message: err.message,
        stack: process.env.NODE_ENV === 'production' ? undefined : err.stack,
        path: req.path,
        method: req.method,
        ip: req.ip
    })

    // No exponer detalles del error en producción
    const message = process.env.NODE_ENV === 'production' 
        ? 'Error interno del servidor'
        : err.message

    res.status(err.status || 500).json({ 
        code: err.code || 'INTERNAL_SERVER_ERROR',
        message
    })
})

const initializeDefaultUsers = async () => {
    const userRepository = AppDataSource.getRepository(User)

    const defaultUsers = [
        {
            email: 'admin@ejemplo.com',
            password: 'Admin123!',
            name: 'Administrador',
            role: 'admin'
        },
        {
            email: 'editor@ejemplo.com',
            password: 'Editor123!',
            name: 'Editor',
            role: 'editor'
        },
        {
            email: 'usuario@ejemplo.com',
            password: 'Usuario123!',
            name: 'Usuario',
            role: 'user'
        }
    ]

    for (const userData of defaultUsers) {
        // Verificar si el usuario ya existe
        const existingUser = await userRepository.findOne({ 
            where: { email: userData.email } 
        })

        if (!existingUser) {
            // Crear nuevo usuario si no existe
            const user = userRepository.create({
                email: userData.email,
                password: await bcrypt.hash(userData.password, 10),
                name: userData.name,
                role: userData.role as 'admin' | 'editor' | 'user'
            })
            await userRepository.save(user)
            console.log(`Usuario ${userData.role} creado: ${userData.email}`)
        } else {
            console.log(`Usuario ${userData.role} ya existe: ${userData.email}`)
        }
    }
}

const startServer = async () => {
    try {
        // Inicializamos la conexión con TypeORM
        await AppDataSource.initialize()
        console.log('Base de datos conectada exitosamente')

        // Inicializamos los usuarios predeterminados
        await initializeDefaultUsers()
        console.log('Usuarios predeterminados verificados/creados')

        // Solo iniciar el servidor si no estamos en modo test
        if (process.env.NODE_ENV !== 'test') {
            app.listen(PORT, () => {
                console.log(`Servidor corriendo en el puerto ${PORT}`)
            })
        }
    } catch (error) {
        console.error('Error al iniciar el servidor:', error)
        process.exit(1)
    }
}

// Solo iniciar el servidor si no estamos en modo test
if (process.env.NODE_ENV !== 'test') {
    startServer()
}

export { startServer }