import { describe, it, expect, beforeEach } from '@jest/globals'
import { app } from '../../src/index'
import supertest from 'supertest'
import jwt from 'jsonwebtoken'

const request = supertest(app)

describe('🔐 Tests de Login de Usuario', () => {
  const testUser = {
    email: 'test@example.com',
    password: 'TestPass123!'
  }

  beforeEach(async () => {
    // Registrar un usuario de prueba antes de cada test
    await request
      .post('/auth/register')
      .send(testUser)
  })

  it('✅ Login exitoso: Debería autenticar al usuario y devolver token JWT', async () => {
    const response = await request
      .post('/auth/login')
      .send(testUser)

    expect(response.status).toBe(200)
    expect(response.body).toHaveProperty('token')
    expect(response.body).toHaveProperty('user')
    expect(response.body.user).toHaveProperty('email', testUser.email)
    expect(response.body.user).not.toHaveProperty('password')

    // Verificar que el token sea válido
    const decodedToken = jwt.verify(response.body.token, process.env.JWT_SECRET || 'your-secret-key')
    expect(decodedToken).toHaveProperty('id')
    expect(decodedToken).toHaveProperty('iat')
    expect(decodedToken).toHaveProperty('exp')
    expect(decodedToken).toHaveProperty('iss')
    expect(decodedToken).toHaveProperty('aud')
  })

  it('❌ Email inexistente: Debería rechazar el login con un email no registrado', async () => {
    const response = await request
      .post('/auth/login')
      .send({
        email: 'nonexistent@example.com',
        password: testUser.password
      })

    expect(response.status).toBe(401)
    expect(response.body).toHaveProperty('message', 'Credenciales inválidas')
  })

  it('❌ Contraseña incorrecta: Debería rechazar el login con contraseña errónea', async () => {
    const response = await request
      .post('/auth/login')
      .send({
        email: testUser.email,
        password: 'WrongPass123!'
      })

    expect(response.status).toBe(401)
    expect(response.body).toHaveProperty('message', 'Credenciales inválidas')
  })

  it('❌ Email faltante: Debería rechazar el login cuando no se proporciona email', async () => {
    const response = await request
      .post('/auth/login')
      .send({
        password: testUser.password
      })

    expect(response.status).toBe(400)
    expect(response.body).toHaveProperty('code', 'EMAIL_REQUIRED')
  })

  it('❌ Contraseña faltante: Debería rechazar el login cuando no se proporciona contraseña', async () => {
    const response = await request
      .post('/auth/login')
      .send({
        email: testUser.email
      })

    expect(response.status).toBe(400)
    expect(response.body).toHaveProperty('code', 'PASSWORD_REQUIRED')
  })
}) 