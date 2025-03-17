# API de Autenticación - Documentación Técnica

## Índice
- [Introducción](#introducción)
- [Arquitectura](#arquitectura)
- [Tecnologías](#tecnologías)
- [Configuración](#configuración)
- [Base de Datos](#base-de-datos)
- [Seguridad](#seguridad)
- [API Endpoints](#api-endpoints)
- [Tests](#tests)
- [Manejo de Errores](#manejo-de-errores)
- [Monitoreo y Logs](#monitoreo-y-logs)
- [Despliegue](#despliegue)

## Introducción

Sistema de autenticación y autorización implementado con TypeScript, Express y SQL Server, diseñado con un enfoque en seguridad, escalabilidad y mantenibilidad.

### Características Principales

- ✅ Autenticación JWT con configuración avanzada
- 🔐 Sistema de roles (admin, editor, user)
- 🛡️ Protección contra ataques comunes
- 📝 Validación de datos con Zod
- ⚡ Rate limiting y control de acceso
- 🔒 Wrapper seguro para SQL Server
- 📊 Auditoría de eventos
- 🧪 Tests exhaustivos

## Arquitectura

### Estructura del Proyecto
```
src/
├── config/         # Configuraciones (DB, JWT, API, Security)
├── controllers/    # Controladores de rutas
├── entities/       # Entidades TypeORM
├── middleware/     # Middlewares de seguridad
├── routes/         # Definición de rutas
├── services/       # Lógica de negocio
├── types/          # Tipos TypeScript
├── utils/          # Utilidades
└── index.ts        # Punto de entrada

tests/
├── auth/          # Tests de autenticación
├── database/      # Tests de base de datos
├── security/      # Tests de seguridad
└── setup.ts       # Configuración de tests
```

## Tecnologías

### Core
- Node.js >= 14
- TypeScript 5.3+
- Express.js 4.18
- SQL Server 2022
- TypeORM

### Seguridad
- JWT (jsonwebtoken)
- Bcrypt
- Helmet
- Express-rate-limit
- HPP
- XSS-Clean

### Testing
- Jest
- Supertest
- ts-jest

## Configuración

### Variables de Entorno
```env
# Server
PORT=3000
NODE_ENV=development

# JWT
JWT_SECRET=your-super-secret-key
JWT_EXPIRES_IN=1h
JWT_ISSUER=auth-api
JWT_AUDIENCE=auth-api-client

# Security
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100

# Database
DB_HOST=34.176.70.40
DB_PORT=1433
DB_USER=sqlserver
DB_PASSWORD=********
DB_NAME=maupruebas
```

### Dependencias Principales
```json
{
  "dependencies": {
    "express": "^4.18.3",
    "typeorm": "^0.3.21",
    "mssql": "^11.0.1",
    "jsonwebtoken": "^9.0.2",
    "bcryptjs": "^2.4.3",
    "helmet": "^7.2.0",
    "express-rate-limit": "^7.5.0",
    "zod": "^3.24.2"
  }
}
```

## Base de Datos

### Configuración TypeORM
```typescript
{
    type: 'mssql',
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT),
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
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
}
```

### Entidades

#### User
```typescript
@Entity('users')
export class User {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ unique: true })
    email: string;

    @Column()
    password: string;

    @Column()
    name: string;

    @Column()
    role: 'admin' | 'editor' | 'user';
}
```

## Seguridad

### 1. Protección de Base de Datos
- ✅ Wrapper seguro para operaciones DB
- ✅ Prevención de SQL Injection
- ✅ Sanitización de entradas
- ✅ Consultas parametrizadas
- ✅ Pool de conexiones configurado
- ✅ Timeouts y límites establecidos

### 2. Autenticación y Autorización
- ✅ JWT con configuración avanzada
- ✅ Sistema de roles granular
- ✅ Bloqueo por intentos fallidos
- ✅ Validación de sesiones
- ✅ Expiración de tokens

### 3. Headers de Seguridad (Helmet)
```typescript
{
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", "data:", "https:"],
        }
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
```

### 4. Rate Limiting
```typescript
{
    windowMs: 15 * 60 * 1000,  // 15 minutos
    max: 100,                  // límite por IP
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Demasiadas solicitudes'
    }
}
```

## API Endpoints

### Autenticación

#### 1. Registro de Usuario
`POST /auth/register`

##### Request
```json
{
    "email": "usuario@ejemplo.com",
    "password": "Contraseña123!",
    "name": "Nombre Usuario",
    "role": "user"
}
```

##### Validaciones
- Email: formato válido, único
- Password: mínimo 8 caracteres, mayúsculas, minúsculas, números, caracteres especiales
- Role: enum ['admin', 'editor', 'user']

##### Response (201 Created)
```json
{
    "id": 1,
    "email": "usuario@ejemplo.com",
    "name": "Nombre Usuario",
    "role": "user"
}
```

#### 2. Login
`POST /auth/login`

##### Request
```json
{
    "email": "usuario@ejemplo.com",
    "password": "Contraseña123!"
}
```

##### Response (200 OK)
```json
{
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
        "id": 1,
        "email": "usuario@ejemplo.com",
        "name": "Nombre Usuario",
        "role": "user"
    }
}
```

## Tests

### 1. Tests de Base de Datos
```bash
npm test tests/database/security.test.ts
```
- ✅ Conexión y configuración
- ✅ Prevención de SQL Injection
- ✅ Pool de conexiones
- ✅ Transacciones
- ✅ Sanitización

### 2. Tests de Seguridad
```bash
npm test tests/security/
```
- ✅ Hashing de contraseñas
- ✅ Validación de tokens JWT
- ✅ Rate limiting
- ✅ Headers de seguridad
- ✅ Sanitización de entrada

### 3. Tests de API
```bash
npm test tests/auth/
```
- ✅ Registro de usuarios
- ✅ Login
- ✅ Validación de datos
- ✅ Manejo de errores
- ✅ Rate limiting

## Manejo de Errores

### Códigos de Error
| Código | HTTP Status | Descripción |
|--------|-------------|-------------|
| INVALID_CREDENTIALS | 401 | Credenciales inválidas |
| ACCOUNT_LOCKED | 423 | Cuenta bloqueada |
| VALIDATION_ERROR | 400 | Error de validación |
| RATE_LIMIT_EXCEEDED | 429 | Límite excedido |
| SQL_INJECTION_DETECTED | 400 | SQL Injection detectado |
| DATABASE_ERROR | 500 | Error de base de datos |
| UNAUTHORIZED | 401 | No autorizado |
| FORBIDDEN | 403 | Acceso prohibido |

### Formato de Error
```json
{
    "code": "ERROR_CODE",
    "message": "Descripción del error",
    "details": ["Detalles adicionales"]
}
```

## Monitoreo y Logs

### Logs de Error
```typescript
console.error(`[${new Date().toISOString()}] Error:`, {
    message: err.message,
    stack: process.env.NODE_ENV === 'production' ? undefined : err.stack,
    path: req.path,
    method: req.method,
    ip: req.ip
});
```

### Auditoría de Eventos
- Login/Logout
- Registro
- Cambios de contraseña
- Modificaciones de rol
- Intentos fallidos de login
- Detección de ataques

## Despliegue

### Preparación
```bash
# Compilar TypeScript
npm run build

# Verificar tests
npm test

# Generar documentación
npm run docs
```

### Variables de Producción
```env
NODE_ENV=production
PORT=3000
JWT_SECRET=<secret-seguro>
ALLOWED_ORIGINS=https://tudominio.com
```

### Comandos de Inicio
```bash
# Producción
npm start

# Desarrollo
npm run dev
``` 