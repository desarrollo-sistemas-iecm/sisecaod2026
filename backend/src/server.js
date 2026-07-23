const os = require('os')
const { connectDb } = require('./config/database')
const { logSystem, logError } = require('./config/logger')
const { env } = require('./config/env')
const http = require('http')
const app = require('./app')
const { initSocket } = require('./socket')

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
    const server = http.createServer(app)
    initSocket(server)

    server.listen(env.port, () => {
      const ip = getLocalIp()
      let serverUrl = `http://localhost:${env.port}`

      if (env.nodeEnv === 'production') {
        serverUrl = 'https://aplicaciones.iecm.mx/daod2026'
      } else if (ip === '145.0.40.48') {
        serverUrl = `http://145.0.40.48:${env.port}/daod2026`
      }

      logSystem('╔══════════════════════════════════════╗')
      logSystem('║       SISECAOD 2026 — Backend API    ║')
      logSystem('╚══════════════════════════════════════╝')
      logSystem(`🌐 Ambiente     : ${env.nodeEnv}`)
      logSystem(`🚀 Servidor     : ${serverUrl}`)
      logSystem(`📦 Base de datos: ${env.db.database} @ ${env.db.server}`)
      logSystem('✅ Conexión BD  : Exitosa')
      logSystem('📋 Versión API  : v1')
      logSystem(`⏰ Inicio       : ${new Date().toISOString().replace('T', ' ').slice(0, 19)}`)
      logSystem('══════════════════════════════════════════')
    })
  } catch (error) {
    logError('❌ ERROR DE CONEXIÓN A BASE DE DATOS')
    logError(`   Servidor : ${env.db.server}:${env.db.port}`)
    logError(`   BD       : ${env.db.database}`)
    logError(`   Error    : ${error.message}`)
    logError('   >> Revisa tus variables de entorno y acceso al servidor SQL.')
    process.exit(1)
  }
}

startServer()
