require('dotenv').config({
  path: `.env.${process.env.NODE_ENV || 'development'}`
})
const os = require('os')

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

const ip = getLocalIp()
const resolvedPort = (ip === '145.0.40.48' && process.env.PORT === '3000') ? 3005 : (parseInt(process.env.PORT, 10) || 3000)

const required = [
  'PORT', 'DB_SERVER', 'DB_DATABASE', 'DB_USER', 'DB_PASSWORD',
  'JWT_SECRET', 'JWT_REFRESH_SECRET'
]

for (const key of required) {
  if (!process.env[key]) {
    console.error(`❌ Variable de entorno faltante: ${key}`)
    process.exit(1)
  }
}

const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: resolvedPort,
  db: {
    server: process.env.DB_SERVER,
    port: parseInt(process.env.DB_PORT, 10) || 1433,
    database: process.env.DB_DATABASE,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    encrypt: process.env.DB_ENCRYPT === 'true',
    trustServerCertificate: process.env.DB_TRUST_SERVER_CERTIFICATE === 'true',
  },
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || '8h',
    refreshSecret: process.env.JWT_REFRESH_SECRET,
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },
}

module.exports = { env }
