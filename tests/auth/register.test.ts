import { describe, it, expect } from '@jest/globals'
import { app } from '../../src/index'
import supertest from 'supertest'

const request = supertest(app)

describe('📝 Tests de Registro de Usuario', () => {
  const validPassword = 'TestPass123!'

  it('✅ Registro exitoso: Debería crear un nuevo usuario con email y contraseña válidos', async () => {
    const response = await request
      .post('/auth/register')
      .send({
        email: 'test@example.com',
        password: validPassword
      })

    expect(response.status).toBe(201)
    expect(response.body).toHaveProperty('id')
    expect(response.body).toHaveProperty('email', 'test@example.com')
    expect(response.body).not.toHaveProperty('password')
  })

  it('❌ Email duplicado: Debería rechazar el registro de un email ya existente', async () => {
    // Primer registro
    await request
      .post('/auth/register')
      .send({
        email: 'duplicate@example.com',
        password: validPassword
      })

    // Intento de registro duplicado
    const response = await request
      .post('/auth/register')
      .send({
        email: 'duplicate@example.com',
        password: validPassword
      })

    expect(response.status).toBe(400)
    expect(response.body).toHaveProperty('message', 'El usuario ya existe')
  })

  it('❌ Email inválido: Debería rechazar el registro con un formato de email incorrecto', async () => {
    const response = await request
      .post('/auth/register')
      .send({
        email: 'invalid-email',
        password: validPassword
      })

    expect(response.status).toBe(400)
    expect(response.body).toHaveProperty('code', 'INVALID_EMAIL_FORMAT')
  })

  it('❌ Email faltante: Debería rechazar el registro cuando no se proporciona email', async () => {
    const response = await request
      .post('/auth/register')
      .send({
        password: validPassword
      })

    expect(response.status).toBe(400)
    expect(response.body).toHaveProperty('code', 'EMAIL_REQUIRED')
  })

  it('❌ Contraseña faltante: Debería rechazar el registro cuando no se proporciona contraseña', async () => {
    const response = await request
      .post('/auth/register')
      .send({
        email: 'test@example.com'
      })

    expect(response.status).toBe(400)
    expect(response.body).toHaveProperty('code', 'PASSWORD_REQUIRED')
  })

  it('❌ Contraseña corta: Debería rechazar el registro con una contraseña muy corta', async () => {
    const response = await request
      .post('/auth/register')
      .send({
        email: 'test@example.com',
        password: 'short'
      })

    expect(response.status).toBe(400)
    expect(response.body).toHaveProperty('code', 'PASSWORD_TOO_SHORT')
  })

  it('❌ Contraseña sin complejidad suficiente: Debería rechazar contraseñas simples', async () => {
    const response = await request
      .post('/auth/register')
      .send({
        email: 'test@example.com',
        password: 'password12345'
      })

    expect(response.status).toBe(400)
    expect(response.body).toHaveProperty('code', 'PASSWORD_COMPLEXITY')
  })
}) 