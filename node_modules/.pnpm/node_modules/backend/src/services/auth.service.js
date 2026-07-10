const { query, sql } = require('../config/database')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const { env } = require('../config/env')

const generateTokens = (payload) => {
  const accessToken  = jwt.sign(payload, env.jwt.secret,        { expiresIn: env.jwt.expiresIn })
  const refreshToken = jwt.sign(payload, env.jwt.refreshSecret, { expiresIn: env.jwt.refreshExpiresIn })
  return { accessToken, refreshToken }
}

const login = async (usuario, contrasena) => {
  // id_unidad agregado — NULL es válido en JWT para perfiles 1,2,3,5
  const userResult = await query(
    `SELECT id_usuario, nombre, usuario, contrasena, clave, perfil, iddistrito, id_unidad
     FROM sisecao_usuarios
     WHERE usuario = @usuario`,
    { usuario: { type: sql.VarChar(100), value: usuario } }
  )

  if (!userResult.recordset.length) {
    return { success: false, message: 'Usuario o contraseña incorrectos' }
  }

  const user = userResult.recordset[0]

  let passwordValid = false
  const isBcrypt = user.contrasena.startsWith('$2')
  if (isBcrypt) {
    passwordValid = await bcrypt.compare(contrasena, user.contrasena)
  } else {
    passwordValid = user.contrasena === contrasena
  }

  if (!passwordValid) {
    return { success: false, message: 'Usuario o contraseña incorrectos' }
  }

  // Verificar periodo activo para perfil 3
  if (user.perfil === 3) {
    const now = new Date().toISOString().slice(0, 19).replace('T', ' ')
    const settingsResult = await query(
      `SELECT COUNT(*) AS activo FROM sisecao_settings
       WHERE @fechaActual BETWEEN fecha_inicio AND fecha_fin`,
      { fechaActual: { type: sql.VarChar(20), value: now } }
    )
    if (!settingsResult.recordset[0]?.activo) {
      return { success: false, message: 'Sistema cerrado. El periodo de captura no está activo.' }
    }
  }

  const payload = {
    id:         user.id_usuario,
    perfil:     user.perfil,
    idDistrito: user.iddistrito,   // NULL para perfiles 1,2,4,5
    idUnidad:   user.id_unidad,    // NULL para perfiles 1,2,3,5
    clave:      user.clave,
  }

  const { accessToken, refreshToken } = generateTokens(payload)

  return {
    success: true,
    accessToken,
    refreshToken,
    user: {
      id:         user.id_usuario,
      nombre:     user.nombre,
      perfil:     user.perfil,
      idDistrito: user.iddistrito,
      idUnidad:   user.id_unidad,
      area:       user.nombre,
      clave:      user.clave,
    },
  }
}

module.exports = { authService: { login } }
