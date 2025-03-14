import { Request, Response } from 'express'
import { loginUser, registerUser } from '../services/auth.service'

export const register = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body
    const user = await registerUser(email, password)
    res.status(201).json(user)
  } catch (error: any) {
    res.status(400).json({ message: error.message })
  }
}

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body
    const { token, user } = await loginUser(email, password)
    res.json({ token, user })
  } catch (error: any) {
    res.status(401).json({ message: error.message })
  }
}