import { Router } from 'express'
import { login, register } from '../controllers/auth.controller'
import { validatePasswordStrength, loginAttemptControl, recordFailedLogin, resetLoginAttempts, validateSession, auditLog } from '../middleware/security.middleware'
import { validateLoginRequest, validateRegisterRequest } from '../middleware/validation.middleware'

const router = Router()

// Ruta de registro con validación de contraseña y auditoría
router.post('/register',
    validateRegisterRequest,
    validatePasswordStrength,
    auditLog('register'),
    register
)

// Ruta de login con control de intentos y auditoría
router.post('/login',
    validateLoginRequest,
    loginAttemptControl,
    login,
    resetLoginAttempts, // Solo se ejecuta si el login es exitoso
    auditLog('login')
)

// Middleware global para validar sesiones en rutas protegidas
router.use(validateSession)

export default router