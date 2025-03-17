import { app } from '../src/index'
import supertest from 'supertest'

declare global {
  namespace NodeJS {
    interface Global {
      request: ReturnType<typeof supertest>
      users: any[]
    }
  }

  var request: ReturnType<typeof supertest>
  var users: any[]
}

beforeAll(() => {
  global.request = supertest(app)
  global.users = []
})

// Limpiar la base de datos simulada después de cada test
afterEach(() => {
  global.users = []
}) 