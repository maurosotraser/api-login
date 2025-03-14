# API de Autenticación

Esta API proporciona servicios de autenticación con endpoints para registro y login de usuarios.

## Índice

- [Instalación](#instalación)
- [Configuración](#configuración)
- [Endpoints](#endpoints)
  - [Registro de Usuario](#registro-de-usuario)
  - [Login de Usuario](#login-de-usuario)

## Instalación

```bash
# Clonar el repositorio
git clone <url-del-repositorio>

# Instalar dependencias
npm install

# Iniciar el servidor
npm start
```

## Configuración

La aplicación utiliza las siguientes tecnologías y dependencias principales:

- Node.js con Express
- TypeScript
- bcryptjs para encriptación de contraseñas
- JWT para autenticación

## Endpoints

### Registro de Usuario

Registra un nuevo usuario en el sistema.

- **URL**: `/auth/register`
- **Método**: `POST`
- **Headers**: 
  - Content-Type: application/json

**Body**:
```json
{
  "email": "usuario@ejemplo.com",
  "password": "contraseña123"
}
```

**Respuesta Exitosa**:
- **Código**: 201 Created
```json
{
  "id": "1",
  "email": "usuario@ejemplo.com"
}
```

**Respuesta de Error**:
- **Código**: 400 Bad Request
```json
{
  "message": "El usuario ya existe"
}
```

### Login de Usuario

Autentica un usuario existente y devuelve un token JWT.

- **URL**: `/auth/login`
- **Método**: `POST`
- **Headers**: 
  - Content-Type: application/json

**Body**:
```json
{
  "email": "usuario@ejemplo.com",
  "password": "contraseña123"
}
```

**Respuesta Exitosa**:
- **Código**: 200 OK
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "1",
    "email": "usuario@ejemplo.com"
  }
}
```

**Respuesta de Error**:
- **Código**: 401 Unauthorized
```json
{
  "message": "Credenciales inválidas"
}
```

## Seguridad

- Las contraseñas se almacenan hasheadas utilizando bcrypt
- La autenticación se realiza mediante tokens JWT
- Se implementan validaciones para evitar duplicación de usuarios

## Notas Técnicas

- La API utiliza una simulación de base de datos en memoria (array)
- Los tokens JWT tienen una duración limitada
- Se implementan manejadores de errores para proporcionar mensajes claros al cliente

## Manejo de Errores

La API devuelve errores con el siguiente formato:

```json
{
  "message": "Descripción del error"
}
```

Códigos de estado HTTP utilizados:
- 200: Operación exitosa
- 201: Recurso creado exitosamente
- 400: Error en la solicitud
- 401: No autorizado 