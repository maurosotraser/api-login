import { config } from 'dotenv'

config()

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'

export const apiConfig = {
  baseURL: API_URL,
  endpoints: {
    login: '/auth/login',
    register: '/auth/register'
  },
  defaultHeaders: {
    'Content-Type': 'application/json'
  },
  // Función de ayuda para hacer peticiones a la API
  async fetchApi(endpoint: string, options: RequestInit = {}) {
    try {
      const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers: {
          ...this.defaultHeaders,
          ...options.headers
        },
        credentials: 'include'
      })

      const data = await response.json()

      if (!response.ok) {
        throw {
          status: response.status,
          ...data
        }
      }

      return data
    } catch (error: any) {
      if (!error.status) {
        throw {
          status: 503,
          code: 'CONNECTION_ERROR',
          message: 'No se pudo conectar con el servidor. Por favor, verifica tu conexión a internet e inténtalo de nuevo.'
        }
      }
      throw error
    }
  }
} 