const { query, sql } = require('../config/database')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const { env } = require('../config/env')
const crypto = require('crypto')
const { getIo, usuariosConectados } = require('../socket')

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

  const nuevoSesionId = crypto.randomUUID()

  // Si el usuario ya tenía una sesión activa conectada, avísale y desconéctalo
  const sesionPrevia = usuariosConectados.get(user.id_usuario)
  if (sesionPrevia) {
    try {
      const io = getIo()
      io.to(sesionPrevia.socketId).emit('sesion:invalidada', {
        mensaje: 'Tu cuenta ha sido cerrada porque se inició sesión en otro dispositivo.'
      })
      const prevSocket = io.sockets.sockets.get(sesionPrevia.socketId)
      if (prevSocket) prevSocket.disconnect(true)
    } catch (err) {
      console.error('Error al desconectar sesión previa en WebSocket:', err.message)
    }
  }

  // Actualizar sesion_id en la base de datos
  await query(
    `UPDATE sisecao_usuarios SET sesion_id = @sesionId WHERE id_usuario = @id`,
    {
      sesionId: { type: sql.VarChar(50), value: nuevoSesionId },
      id: { type: sql.Int, value: user.id_usuario }
    }
  )

  const payload = {
    id:         user.id_usuario,
    perfil:     user.perfil,
    idDistrito: user.iddistrito,   // NULL para perfiles 1,2,4,5
    idUnidad:   user.id_unidad,    // NULL para perfiles 1,2,3,5
    clave:      user.clave,
    sesion_id:  nuevoSesionId,
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
