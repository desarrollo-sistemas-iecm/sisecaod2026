const jwt = require('jsonwebtoken')
const { env } = require('../config/env')
const { query, sql } = require('../config/database')

const authMiddleware = async (req, res, next) => {
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Token requerido', data: null })
  }
  const token = authHeader.split(' ')[1]
  try {
    const decoded = jwt.verify(token, env.jwt.secret)
    req.user = decoded

    // Validar sesion_id en BD (Fail-Closed)
    const dbUserResult = await query(
      'SELECT sesion_id FROM sisecao_usuarios WHERE id_usuario = @id AND status = 1',
      { id: { type: sql.Int, value: decoded.id } }
    )

    if (!dbUserResult.recordset.length) {
      return res.status(401).json({ success: false, message: 'Usuario inexistente o inactivo', data: null })
    }

    const dbUser = dbUserResult.recordset[0]
    if (dbUser.sesion_id !== decoded.sesion_id) {
      return res.status(401).json({
        success: false,
        message: 'Tu sesión ha sido cerrada por el administrador o iniciaste sesión en otro dispositivo. Por favor, inicia sesión de nuevo para ingresar.',
        code: 'SESION_INVALIDADA'
      })
    }

    next()
  } catch (err) {
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Token inválido o expirado', data: null })
    }
    // Fail-Closed: si la BD falla o da timeout, se bloquea el paso
    console.error('Error de base de datos en authMiddleware (Fail-Closed):', err.message)
    return res.status(500).json({
      success: false,
      message: 'No se pudo verificar el estado de la sesión, por favor intente de nuevo.',
      data: null
    })
  }
}

module.exports = { authMiddleware }
