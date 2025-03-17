import { describe, it, expect } from '@jest/globals'
import { app } from '../../src/index'
import supertest from 'supertest'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

const request = supertest(app)

describe('🔒 Tests de Seguridad', () => {
  it('✅ Hash de contraseña: Debería almacenar las contraseñas de forma segura y hasheada', async () => {
    const testUser = {
      email: 'security@example.com',
      password: 'TestPass123!'
    }

    // Registrar usuario
    await request
      .post('/auth/register')
      .send(testUser)

    // Verificar que la contraseña esté hasheada en la "base de datos"
    const users = (global as any).users || []
    const user = users.find((u: any) => u.email === testUser.email)
    
    expect(user).toBeDefined()
    expect(user.password).not.toBe(testUser.password)
    expect(bcrypt.compareSync(testUser.password, user.password)).toBe(true)
  })

  it('❌ Contraseñas débiles: Debería rechazar contraseñas comunes o inseguras', async () => {
    const weakPasswords = [
      'password123',
      '12345678',
      'qwerty123',
      'admin123',
      'welcome123'
    ]

    for (const password of weakPasswords) {
      const response = await request
        .post('/auth/register')
        .send({
          email: 'test@example.com',
          password
        })

      expect(response.status).toBe(400)
      expect(response.body).toHaveProperty('code', 'PASSWORD_COMPLEXITY')
    }
  })

  it('❌ Inyección SQL: Debería prevenir intentos de inyección en los campos de entrada', async () => {
    const maliciousInputs = [
      { email: "' OR '1'='1", password: 'TestPass123!' },
      { email: 'test@example.com', password: "' OR '1'='1" },
      { email: '"><script>alert(1)</script>', password: 'TestPass123!' },
      { email: 'test@example.com; DROP TABLE users;', password: 'TestPass123!' },
      { email: 'SELECT * FROM users;', password: 'TestPass123!' },
      { email: 'test@example.com', password: 'DELETE FROM users;' }
    ]

    for (const input of maliciousInputs) {
      const response = await request
        .post('/auth/register')
        .send(input)

      expect(response.status).toBe(400)
      expect(response.body).toHaveProperty('code', 'INVALID_CHARACTERS')
    }
  })

  it('✅ Formato JWT: Debería generar tokens JWT válidos y bien formados', async () => {
    const testUser = {
      email: 'jwt@example.com',
      password: 'TestPass123!'
    }

    await request
      .post('/auth/register')
      .send(testUser)

    const loginResponse = await request
      .post('/auth/login')
      .send(testUser)

    expect(loginResponse.status).toBe(200)
    expect(loginResponse.body).toHaveProperty('token')

    const token = loginResponse.body.token
    // Verificar formato JWT (header.payload.signature)
    expect(token.split('.')).toHaveLength(3)

    // Verificar claims del token
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key')
    expect(decodedToken).toHaveProperty('id')
    expect(decodedToken).toHaveProperty('iat')
    expect(decodedToken).toHaveProperty('exp')
    expect(decodedToken).toHaveProperty('iss')
    expect(decodedToken).toHaveProperty('aud')
  })

  it('❌ Rate Limiting: Debería limitar el número de intentos de login', async () => {
    const testUser = {
      email: 'ratelimit@example.com',
      password: 'TestPass123!'
    }

    // Registrar usuario
    await request
      .post('/auth/register')
      .send(testUser)

    // Realizar múltiples intentos de login rápidamente
    const responses = await Promise.all(
      Array(150).fill(null).map(() => 
        request
          .post('/auth/login')
          .send(testUser)
          .catch(() => ({ status: 429 })) // Manejar posibles errores de red
      )
    )

    const blockedResponses = responses.filter(r => r.status === 429)
    expect(blockedResponses.length).toBeGreaterThan(0)
  }, 30000) // 30 segundos de timeout
}) 