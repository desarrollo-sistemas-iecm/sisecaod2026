const router = require('express').Router()
const { body } = require('express-validator')
const rateLimit = require('express-rate-limit')
const { login, refresh, logout } = require('../controllers/auth.controller')
const { validateMiddleware } = require('../middlewares/validate.middleware')
const { env } = require('../config/env')

const loginLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: env.nodeEnv === 'development' ? 100 : 15,
  message: { success: false, message: 'Demasiados intentos. Intenta en 1 minuto.', data: null }
})

const loginValidators = [
  body('usuario').trim().notEmpty().withMessage('El usuario es requerido'),
  body('contrasena').notEmpty().withMessage('La contraseña es requerida'),
]

router.post('/login',   loginLimiter, loginValidators, validateMiddleware, login)
router.post('/refresh', refresh)
router.post('/logout',  logout)

module.exports = router
