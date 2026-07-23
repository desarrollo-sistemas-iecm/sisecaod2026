const { Server } = require('socket.io')
const jwt = require('jsonwebtoken')
const { env } = require('./config/env')
const { logSystem } = require('./config/logger')

let io = null
const usuariosConectados = new Map() // id_usuario -> { socketId, perfil, idDistrito, idUnidad, sesion_id }

const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: (origin, callback) => {
        if (env.nodeEnv === 'production') {
          const allowed = ['https://aplicaciones.iecm.mx']
          if (!origin || allowed.includes(origin)) {
            callback(null, true)
          } else {
            callback(new Error('CORS not allowed by policy'))
          }
        } else {
          callback(null, true)
        }
      },
      credentials: true
    }
  })

  io.use((socket, next) => {
    const token = socket.handshake.auth?.token
    if (!token) {
      return next(new Error('Token de conexión no provisto'))
    }
    try {
      const decoded = jwt.verify(token, env.jwt.secret)
      socket.usuario = decoded // contiene id (id_usuario), perfil, idDistrito, idUnidad, clave, sesion_id
      next()
    } catch (err) {
      return next(new Error('Token de conexión inválido o expirado'))
    }
  })

  io.on('connection', (socket) => {
    const { id, perfil, idDistrito, idUnidad, sesion_id } = socket.usuario
    
    // Registrar el usuario y su id de socket
    usuariosConectados.set(id, {
      socketId: socket.id,
      perfil,
      idDistrito,
      idUnidad,
      sesion_id
    })

    // Transmitir a todos que este usuario se conectó
    io.emit('usuarios:estado', { id_usuario: id, conectado: true })

    socket.on('disconnect', () => {
      const active = usuariosConectados.get(id)
      if (active && active.socketId === socket.id) {
        usuariosConectados.delete(id)
        // Transmitir a todos que este usuario se desconectó
        io.emit('usuarios:estado', { id_usuario: id, conectado: false })
      }
    })
  })

  logSystem('🔌 Servidor Socket.io inicializado correctamente')
  return io
}

const getIo = () => {
  if (!io) throw new Error('Socket.io no ha sido inicializado. Llama initSocket primero.')
  return io
}

module.exports = {
  initSocket,
  getIo,
  usuariosConectados
}
