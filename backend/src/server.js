const os = require('os')
const { connectDb } = require('./config/database')
const { logger } = require('./config/logger')
const { env } = require('./config/env')
const app = require('./app')

const getLocalIp = () => {
  const interfaces = os.networkInterfaces()
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address
      }
    }
  }
  return 'localhost'
}

const startServer = async () => {
  try {
    await connectDb()
    app.listen(env.port, () => {
      const ip = getLocalIp()
      let serverUrl = `http://localhost:${env.port}`

      if (env.nodeEnv === 'production') {
        serverUrl = 'https://aplicaciones.iecm.mx/daod2026'
      } else if (ip === '145.0.40.48') {
        serverUrl = `http://145.0.40.48:${env.port}/daod2026`
      }

      logger.info('╔══════════════════════════════════════╗')
      logger.info('║       SISECAOD 2026 — Backend API    ║')
      logger.info('╚══════════════════════════════════════╝')
      logger.info(`🌐 Ambiente     : ${env.nodeEnv}`)
      logger.info(`🚀 Servidor     : ${serverUrl}`)
      logger.info(`📦 Base de datos: ${env.db.database} @ ${env.db.server}`)
      logger.info('✅ Conexión BD  : Exitosa')
      logger.info('📋 Versión API  : v1')
      logger.info(`⏰ Inicio       : ${new Date().toISOString().replace('T', ' ').slice(0, 19)}`)
      logger.info('══════════════════════════════════════════')
    })
  } catch (error) {
    logger.error('❌ ERROR DE CONEXIÓN A BASE DE DATOS')
    logger.error(`   Servidor : ${env.db.server}:${env.db.port}`)
    logger.error(`   BD       : ${env.db.database}`)
    logger.error(`   Error    : ${error.message}`)
    logger.error('   >> Revisa tus variables de entorno y acceso al servidor SQL.')
    process.exit(1)
  }
}

startServer()
