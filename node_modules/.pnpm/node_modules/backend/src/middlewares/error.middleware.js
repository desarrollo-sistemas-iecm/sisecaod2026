const { logError, logWarn, userTag } = require('../config/logger')

const errorMiddleware = (err, req, res, next) => {
  const status = err.status || 500
  const message = err.expose ? err.message : 'Error interno del servidor'
  const user = req.user ? ` — ${userTag(req.user)}` : ''

  if (status >= 500) {
    logError(`❌ [${req.method}] ${req.originalUrl} — ${err.message}${user}`)
    if (err.stack) {
      // Solo las primeras 3 líneas del stack para no saturar
      const shortStack = err.stack.split('\n').slice(0, 4).join('\n    ')
      logError(`   ${shortStack}`)
    }
  } else if (status >= 400) {
    logWarn(`⚠️  [${req.method}] ${req.originalUrl} — ${status} ${err.message}${user}`)
  }

  res.status(status).json({ success: false, message, data: null })
}

module.exports = { errorMiddleware }
