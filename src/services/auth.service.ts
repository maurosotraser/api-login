import bcrypt from 'bcryptjs'
import { generateToken } from '../utils/jwt'

// Simulación de base de datos
const users: any[] = []

export const registerUser = async (email: string, password: string) => {
  const existingUser = users.find(user => user.email === email)
  if (existingUser) throw new Error('El usuario ya existe')

  const hashedPassword = await bcrypt.hash(password, 10)
  const user = { id: String(users.length + 1), email, password: hashedPassword }
  users.push(user)

  return { id: user.id, email: user.email }
}

export const loginUser = async (email: string, password: string) => {
  const user = users.find(user => user.email === email)
  if (!user) throw new Error('Credenciales inválidas')

  const validPassword = await bcrypt.compare(password, user.password)
  if (!validPassword) throw new Error('Credenciales inválidas')

  const token = generateToken(user.id)
  return { token, user: { id: user.id, email: user.email } }
}