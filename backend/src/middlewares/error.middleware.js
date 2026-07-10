const { logger } = require('../config/logger')

const errorMiddleware = (err, req, res, next) => {
  logger.error(`[${req.method}] ${req.originalUrl} — ${err.message}`)
  if (err.stack) logger.debug(err.stack)

  const status = err.status || 500
  const message = err.expose ? err.message : 'Error interno del servidor'

  res.status(status).json({ success: false, message, data: null })
}

module.exports = { errorMiddleware }
