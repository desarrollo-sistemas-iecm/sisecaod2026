const { createLogger, format, transports } = require('winston')
const { combine, timestamp, printf } = format

// ─── ANSI Color Codes ────────────────────────────────────────────
const C = {
  reset:   '\x1b[0m',
  bold:    '\x1b[1m',
  dim:     '\x1b[2m',
  // Foreground
  green:   '\x1b[32m',
  blue:    '\x1b[34m',
  cyan:    '\x1b[36m',
  yellow:  '\x1b[33m',
  red:     '\x1b[31m',
  magenta: '\x1b[35m',
  white:   '\x1b[37m',
  gray:    '\x1b[90m',
  // Bright
  greenBright:  '\x1b[92m',
  blueBright:   '\x1b[94m',
  cyanBright:   '\x1b[96m',
  yellowBright: '\x1b[93m',
  redBright:    '\x1b[91m',
  // Background
  bgGreen:  '\x1b[42m',
  bgBlue:   '\x1b[44m',
  bgYellow: '\x1b[43m',
  bgRed:    '\x1b[41m',
  bgCyan:   '\x1b[46m',
  bgMagenta:'\x1b[45m',
}

// ─── Perfiles humanos ────────────────────────────────────────────
const PERFILES = {
  1: 'Admin',
  2: 'Lectura',
  3: 'Capturista',
  4: 'Central',
  5: 'Config',
}

const getPerfilName = (perfil) => PERFILES[perfil] || `Perfil ${perfil}`

// ─── Formato para consola (con colores) ──────────────────────────
const consoleFormat = printf(({ level, message, timestamp, category }) => {
  const ts = `${C.gray}${timestamp}${C.reset}`

  switch (category) {
    case 'session':
      return `${ts} ${C.bgGreen}${C.bold} SESIÓN ${C.reset} ${C.greenBright}${message}${C.reset}`
    case 'action':
      return `${ts} ${C.bgBlue}${C.bold} ACCIÓN ${C.reset} ${C.blueBright}${message}${C.reset}`
    case 'query':
      return `${ts} ${C.bgCyan}${C.bold} CONSULT ${C.reset} ${C.cyanBright}${message}${C.reset}`
    case 'warn':
      return `${ts} ${C.bgYellow}${C.bold} AVISO  ${C.reset} ${C.yellowBright}${message}${C.reset}`
    case 'error':
      return `${ts} ${C.bgRed}${C.bold} ERROR  ${C.reset} ${C.redBright}${message}${C.reset}`
    case 'system':
      return `${ts} ${C.bgMagenta}${C.bold} SYSTEM ${C.reset} ${C.magenta}${message}${C.reset}`
    default:
      return `${ts} [${level}]: ${message}`
  }
})

// ─── Formato para archivos (sin colores) ─────────────────────────
const fileFormat = printf(({ level, message, timestamp, category }) => {
  const cat = category ? `[${category.toUpperCase()}]` : `[${level.toUpperCase()}]`
  return `${timestamp} ${cat} ${message}`
})

// ─── Logger principal ────────────────────────────────────────────
const logger = createLogger({
  level: 'debug',
  format: combine(
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    fileFormat
  ),
  transports: [
    // Consola con colores
    new transports.Console({
      format: combine(
        timestamp({ format: 'HH:mm:ss' }),
        consoleFormat
      )
    }),
    // Archivo de errores
    new transports.File({
      filename: 'logs/error.log',
      level: 'error',
      format: combine(timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), fileFormat)
    }),
    // Archivo combinado (todo)
    new transports.File({
      filename: 'logs/combined.log',
      format: combine(timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), fileFormat)
    }),
    // Archivo de actividad de usuarios
    new transports.File({
      filename: 'logs/activity.log',
      format: combine(timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), fileFormat)
    }),
  ]
})

// ─── Métodos especializados ──────────────────────────────────────

/** 🟢 Login / Logout / Sesión */
const logSession = (message) => {
  logger.info(message, { category: 'session' })
}

/** 🔵 Captura / Guardado / Modificación de datos */
const logAction = (message) => {
  logger.info(message, { category: 'action' })
}

/** 🔵 Consulta de datos (lectura) */
const logQuery = (message) => {
  logger.info(message, { category: 'query' })
}

/** 🟡 Advertencia */
const logWarn = (message) => {
  logger.warn(message, { category: 'warn' })
}

/** 🔴 Error */
const logError = (message) => {
  logger.error(message, { category: 'error' })
}

/** 🟣 Sistema (arranque, etc.) */
const logSystem = (message) => {
  logger.info(message, { category: 'system' })
}

// Helper para identificar al usuario en logs
const userTag = (user) => {
  if (!user) return '[anónimo]'
  const parts = [`id=${user.id}`]
  if (user.perfil !== undefined) parts.push(getPerfilName(user.perfil))
  if (user.idDistrito && user.idDistrito <= 33) parts.push(`D${user.idDistrito}`)
  if (user.clave) parts.push(`clave=${user.clave}`)
  return `[${parts.join(' | ')}]`
}

module.exports = {
  logger,
  logSession,
  logAction,
  logQuery,
  logWarn,
  logError,
  logSystem,
  userTag,
  getPerfilName,
  PERFILES,
}
