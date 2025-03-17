# API de Autenticación con TypeScript y SQL Server

Esta API proporciona un sistema de autenticación seguro con roles de usuario, implementado con TypeScript, Express, TypeORM y SQL Server. El sistema incluye características avanzadas de seguridad, validación de datos y manejo de errores.

## Características Principales

- ✅ Autenticación basada en JWT con configuración avanzada
- 🔐 Sistema de roles (admin, editor, user) con permisos granulares
- 🛡️ Seguridad robusta contra ataques comunes
- 📝 Validación de datos con Zod
- ⚡ Rate limiting y control de intentos de login
- 🔒 Conexión segura a SQL Server con wrapper personalizado
- 📊 Sistema de auditoría de eventos
- 🧪 Tests exhaustivos de seguridad y funcionalidad

## Requisitos del Sistema

- Node.js >= 14
- SQL Server 2022
- TypeScript 5.3+
- NPM o Yarn

## Tecnologías Principales

- **Backend**: Express.js, TypeORM
- **Base de Datos**: SQL Server
- **Autenticación**: JWT
- **Validación**: Zod
- **Testing**: Jest, Supertest
- **Seguridad**: Helmet, Express-rate-limit, HPP, XSS-Clean

## Instalación y Configuración

### 1. Clonar el Repositorio

```bash
git clone <repository-url>
cd auth-api
```

### 2. Instalar Dependencias

```bash
npm install
```

### 3. Configurar Variables de Entorno

Crear archivo `.env`:

```env
PORT=3000
JWT_SECRET=your_jwt_secret
NODE_ENV=development
JWT_EXPIRES_IN=1h
JWT_ISSUER=auth-api
JWT_AUDIENCE=auth-api-client
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173
```

### 4. Configuración de Base de Datos

La conexión a SQL Server está configurada en `src/config/database.config.ts`:

```typescript
{
    type: 'mssql',
    host: '34.176.70.40',
    port: 1433,
    username: 'sqlserver',
    password: '********',
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
}
```

## Scripts Disponibles

```bash
# Desarrollo con hot-reload
npm run dev

# Compilar TypeScript
npm run build

# Iniciar en producción
npm start

# Ejecutar tests
npm test

# Tests con watch mode
npm run test:watch

# Cobertura de tests
npm run test:coverage
```

## Estructura del Proyecto

```
src/
├── config/         # Configuraciones (DB, JWT, API, Security)
├── controllers/    # Controladores de rutas
├── entities/       # Entidades TypeORM
├── middleware/     # Middlewares de seguridad y autenticación
├── routes/         # Definición de rutas
├── services/       # Lógica de negocio
├── types/          # Tipos y declaraciones TypeScript
├── utils/          # Utilidades y helpers
└── index.ts        # Punto de entrada

tests/
├── auth/          # Tests de autenticación
├── database/      # Tests de base de datos
├── security/      # Tests de seguridad
└── setup.ts       # Configuración de tests
```

## Características de Seguridad

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

### 3. Protección contra Ataques
- ✅ XSS Protection
- ✅ CSRF Protection
- ✅ SQL Injection Protection
- ✅ Rate Limiting
- ✅ Sanitización de datos
- ✅ Headers de seguridad

### 4. Validación y Sanitización
- ✅ Validación de entrada con Zod
- ✅ Sanitización de parámetros
- ✅ Escape de caracteres especiales
- ✅ Validación de tipos
- ✅ Filtrado de datos sensibles

## API Endpoints

### Autenticación

#### Registro de Usuario
```http
POST /auth/register
Content-Type: application/json

{
    "email": "usuario@ejemplo.com",
    "password": "Contraseña123!",
    "name": "Nombre Usuario",
    "role": "user"
}
```

#### Login
```http
POST /auth/login
Content-Type: application/json

{
    "email": "usuario@ejemplo.com",
    "password": "Contraseña123!"
}
```

## Usuarios Predeterminados

1. **Administrador**
   - Email: admin@ejemplo.com
   - Password: Admin123!
   - Role: admin

2. **Editor**
   - Email: editor@ejemplo.com
   - Password: Editor123!
   - Role: editor

3. **Usuario**
   - Email: usuario@ejemplo.com
   - Password: Usuario123!
   - Role: user

## Sistema de Tests

### Cobertura de Tests

Los tests cubren las siguientes áreas:

1. **Tests de Base de Datos** ✅
   - Conexión y configuración
   - Operaciones CRUD
   - Manejo de transacciones
   - Pool de conexiones
   - Consultas y sanitización

2. **Tests de Seguridad** ✅
   - SQL Injection
   - XSS Protection
   - Validación de entrada
   - Autenticación
   - Autorización

3. **Tests de API** ✅
   - Endpoints de autenticación
   - Validación de datos
   - Manejo de errores
   - Rate limiting
   - Headers de seguridad

### Ejecución de Tests

```bash
# Tests completos
npm test

# Tests específicos
npm test tests/database/security.test.ts
npm test tests/auth/login.test.ts
npm test tests/security/password.test.ts

# Cobertura
npm run test:coverage
```

## Manejo de Errores

### Códigos de Error

- `INVALID_CREDENTIALS`: Credenciales inválidas
- `ACCOUNT_LOCKED`: Cuenta bloqueada
- `VALIDATION_ERROR`: Error de validación
- `RATE_LIMIT_EXCEEDED`: Límite de solicitudes excedido
- `SQL_INJECTION_DETECTED`: Intento de SQL Injection
- `DATABASE_ERROR`: Error de base de datos
- `UNAUTHORIZED`: No autorizado
- `FORBIDDEN`: Acceso prohibido

### Formato de Respuesta de Error

```json
{
    "code": "ERROR_CODE",
    "message": "Descripción del error",
    "details": ["Detalles adicionales si existen"]
}
```

## Contribución

1. Fork el repositorio
2. Crea una rama (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.
