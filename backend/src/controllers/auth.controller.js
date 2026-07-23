const { authService } = require('../services/auth.service')
const { sendSuccess, sendError } = require('../utils/response')
const { env } = require('../config/env')
const jwt = require('jsonwebtoken')
const { logSession, logWarn, userTag, getPerfilName } = require('../config/logger')

const login = async (req, res, next) => {
  try {
    const { usuario, contrasena } = req.body
    const ip = req.ip || req.connection?.remoteAddress || '?'
    const result = await authService.login(usuario, contrasena)

    if (!result.success) {
      logWarn(`🔒 Login fallido: usuario="${usuario}" — ${result.message} — IP: ${ip}`)
      return res.status(401).json({ success: false, message: result.message, data: null })
    }

    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: env.nodeEnv === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    })

    const perfilName = getPerfilName(result.user.perfil)
    const distrito = result.user.idDistrito && result.user.idDistrito <= 33
      ? ` | Distrito ${result.user.idDistrito}`
      : ''
    const clave = result.user.clave ? ` | clave=${result.user.clave}` : ''

    logSession(`🟢 LOGIN  ➜  ${result.user.nombre} (${usuario}) — ${perfilName}${distrito}${clave} — IP: ${ip}`)
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
      {
        id: decoded.id,
        perfil: decoded.perfil,
        idDistrito: decoded.idDistrito,
        idUnidad: decoded.idUnidad,
        clave: decoded.clave,
        sesion_id: decoded.sesion_id
      },
      env.jwt.secret,
      { expiresIn: env.jwt.expiresIn }
    )
    return sendSuccess(res, { accessToken }, 'Token renovado')
  } catch {
    return sendError(res, 'Refresh token inválido o expirado', 401)
  }
}

const logout = (req, res) => {
  const user = req.user
  if (user) {
    logSession(`🔴 LOGOUT ➜  ${userTag(user)}`)
  }
  res.clearCookie('refreshToken', { httpOnly: true, secure: env.nodeEnv === 'production', sameSite: 'strict' })
  return sendSuccess(res, null, 'Sesión cerrada')
}

module.exports = { login, refresh, logout }
