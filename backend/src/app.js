const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const rateLimit = require('express-rate-limit')
const path = require('path')
const { env } = require('./config/env')
const routes = require('./routes')
const { errorMiddleware } = require('./middlewares/error.middleware')

const app = express()

app.use(helmet({
  contentSecurityPolicy: false, // Deshabilitar CSP para evitar bloqueos de scripts/estilos de Vue en local/desarrollo
}))
app.use(cors({
  origin: env.nodeEnv === 'production'
    ? 'https://aplicaciones.iecm.mx'
    : ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true,
}))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 200 }))

app.use('/api/v1', routes)

// Carpeta de compilados del frontend
const publicPath = path.join(__dirname, '../public')
app.use(express.static(publicPath))

// Fallback para soportar Vue Router (History Mode)
app.use((req, res, next) => {
  if (req.method === 'GET' && !req.path.startsWith('/api') && req.headers.accept && req.headers.accept.includes('text/html')) {
    return res.sendFile(path.join(publicPath, 'index.html'))
  }
  next()
})

app.use(errorMiddleware)

module.exports = app

