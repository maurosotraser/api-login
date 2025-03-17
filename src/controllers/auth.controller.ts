import { Request, Response } from 'express'
import { registerUser, loginUser } from '../services/auth.service'
import { RegisterRequest } from '../types/auth'

export const register = async (req: Request, res: Response) => {
  try {
    const { email, password, name, role } = req.body as RegisterRequest
    const user = await registerUser({ email, password, name, role })
    res.status(201).json(user)
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({ message: error.message })
    } else {
      res.status(500).json({ message: 'Error interno del servidor' })
    }
  }
}

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body
    const authResponse = await loginUser(email, password)
    res.json(authResponse)
  } catch (error) {
    if (error instanceof Error) {
      res.status(401).json({ message: error.message })
    } else {
      res.status(500).json({ message: 'Error interno del servidor' })
    }
  }
}