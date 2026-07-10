const jwt = require('jsonwebtoken')
const { env } = require('../config/env')

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Token requerido', data: null })
  }
  const token = authHeader.split(' ')[1]
  try {
    req.user = jwt.verify(token, env.jwt.secret)
    next()
  } catch {
    return res.status(401).json({ success: false, message: 'Token inválido o expirado', data: null })
  }
}

module.exports = { authMiddleware }
