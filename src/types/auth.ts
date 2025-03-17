export type UserRole = 'admin' | 'editor' | 'user'

export interface User {
  id: string
  email: string
  role: UserRole
  name?: string
  password: string // Solo para uso interno, nunca se devuelve al cliente
}

export interface AuthResponse {
  token: string
  user: Omit<User, 'password'> // Excluimos el password de la respuesta
}

export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest extends LoginRequest {
  name?: string
  role?: UserRole // Opcional, por defecto será 'user'
} 