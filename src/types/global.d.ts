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

export {} 