import bcrypt from 'bcryptjs'
import { generateToken } from '../utils/jwt'
import { RegisterRequest, AuthResponse } from '../types/auth'
import { AppDataSource } from '../config/database.config'
import { User } from '../entities/User'

const userRepository = AppDataSource.getRepository(User)

export const registerUser = async (data: RegisterRequest): Promise<Omit<User, 'password'>> => {
    const existingUser = await userRepository.findOne({ where: { email: data.email } })
    if (existingUser) {
        throw new Error('El usuario ya existe')
    }

    const hashedPassword = await bcrypt.hash(data.password, 10)
    const user = userRepository.create({
        email: data.email,
        password: hashedPassword,
        name: data.name,
        role: data.role || 'user'
    })

    await userRepository.save(user)

    const { password, ...userWithoutPassword } = user
    return userWithoutPassword
}

export const loginUser = async (email: string, password: string): Promise<AuthResponse> => {
    const user = await userRepository.findOne({ where: { email } })
    if (!user) {
        throw new Error('Credenciales inválidas')
    }

    const validPassword = await bcrypt.compare(password, user.password)
    if (!validPassword) {
        throw new Error('Credenciales inválidas')
    }

    const token = generateToken(user.id)
    
    const { password: _, ...userWithoutPassword } = user
    return { 
        token,
        user: userWithoutPassword
    }
}