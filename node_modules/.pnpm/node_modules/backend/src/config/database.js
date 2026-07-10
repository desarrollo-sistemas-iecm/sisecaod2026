const sql = require('mssql')
const { env } = require('./env')
const { logger } = require('./logger')

const config = {
  server: env.db.server,
  port: env.db.port,
  database: env.db.database,
  user: env.db.user,
  password: env.db.password,
  options: {
    encrypt: env.db.encrypt,
    trustServerCertificate: env.db.trustServerCertificate,
  },
  pool: { max: 10, min: 0, idleTimeoutMillis: 30000 },
}

let pool

const connectDb = async () => {
  try {
    pool = await sql.connect(config)
    logger.debug(`Pool de conexión creado: ${env.db.database} @ ${env.db.server}`)
    
    // Asegurar que la columna de contraseña tenga longitud suficiente para hashes bcrypt
    try {
      await pool.request().query(`
        ALTER TABLE sisecao_usuarios 
        ALTER COLUMN contrasena VARCHAR(100) NOT NULL
      `)
      logger.info('🔧 Estructura de BD verificada: columna contrasena ajustada a VARCHAR(100)')
    } catch (alterErr) {
      // Ignorar si el usuario no tiene permisos suficientes para ALTER o si ya está correcto, pero registrar advertencia
      logger.warn(`Advertencia al verificar estructura de BD: ${alterErr.message}`)
    }

    return pool
  } catch (error) {
    logger.error(`Error al conectar a la BD: ${error.message}`)
    throw error
  }
}

const query = async (queryString, params = {}) => {
  if (!pool) throw new Error('Pool de BD no inicializado. Llama connectDb() primero.')
  const request = pool.request()
  for (const [key, { type, value }] of Object.entries(params)) {
    request.input(key, type, value)
  }
  return request.query(queryString)
}

const getPool = () => pool

module.exports = { connectDb, query, sql, getPool }

