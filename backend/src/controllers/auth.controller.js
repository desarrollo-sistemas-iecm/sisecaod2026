const { authService } = require('../services/auth.service')
const { sendSuccess, sendError } = require('../utils/response')
const { env } = require('../config/env')
const jwt = require('jsonwebtoken')
const { logger } = require('../config/logger')

const login = async (req, res, next) => {
  try {
    const { usuario, contrasena } = req.body
    const result = await authService.login(usuario, contrasena)

    if (!result.success) {
      return res.status(401).json({ success: false, message: result.message, data: null })
    }

    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: env.nodeEnv === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    })

    logger.info(`Login exitoso: usuario=${usuario} perfil=${result.user.perfil}`)
    return sendSuccess(res, { accessToken: result.accessToken, user: result.user }, 'Login exitoso')
  } catch (err) {
    next(err)
  }
}

const refresh = async (req, res, next) => {
  try {
    const token = req.cookies?.refreshToken
    if (!token) return sendError(res, 'Refresh token requerido', 401)

    const decoded = jwt.verify(token, env.jwt.refreshSecret)
    const accessToken = jwt.sign(
      { id: decoded.id, perfil: decoded.perfil, idDistrito: decoded.idDistrito, clave: decoded.clave },
      env.jwt.secret,
      { expiresIn: env.jwt.expiresIn }
    )
    return sendSuccess(res, { accessToken }, 'Token renovado')
  } catch {
    return sendError(res, 'Refresh token inválido o expirado', 401)
  }
}

const logout = (req, res) => {
  res.clearCookie('refreshToken', { httpOnly: true, secure: env.nodeEnv === 'production', sameSite: 'strict' })
  return sendSuccess(res, null, 'Sesión cerrada')
}

module.exports = { login, refresh, logout }
