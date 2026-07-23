const { usuariosService } = require('../services/usuarios.service')
const { sendSuccess, sendError } = require('../utils/response')
const { logAction, userTag } = require('../config/logger')
const { getIo, usuariosConectados } = require('../socket')

const getAll = async (req, res, next) => {
  try {
    const data = await usuariosService.getAll()
    const enrichedData = data.map(u => ({
      ...u,
      conectado: usuariosConectados.has(u.id_usuario)
    }))
    return sendSuccess(res, enrichedData, 'Usuarios obtenidos correctamente')
  } catch (err) {
    next(err)
  }
}

const desconectar = async (req, res, next) => {
  try {
    const { id } = req.params
    const idUsuario = parseInt(id, 10)

    // 1. Invalidar en base de datos: poner sesion_id = NULL
    const { query, sql } = require('../config/database')
    await query(
      'UPDATE sisecao_usuarios SET sesion_id = NULL WHERE id_usuario = @id',
      { id: { type: sql.Int, value: idUsuario } }
    )

    // 2. Si está conectado en Socket.io, enviarle alerta y desconectarlo
    const conectado = usuariosConectados.get(idUsuario)
    if (conectado) {
      try {
        const io = getIo()
        io.to(conectado.socketId).emit('sesion:invalidada', {
          mensaje: 'Tu cuenta ha sido cerrada por el administrador. Espera a que se te habilite nuevamente.'
        })
        const socket = io.sockets.sockets.get(conectado.socketId)
        if (socket) {
          socket.disconnect(true)
        }
      } catch (err) {
        console.error('Error al emitir sesion:invalidada al socket:', err.message)
      }
      usuariosConectados.delete(idUsuario)
    }

    logAction(`🔌 Usuario desconectado forzosamente — ID: ${idUsuario} — ${userTag(req.user)}`)
    return sendSuccess(res, null, 'Usuario desconectado correctamente')
  } catch (err) {
    next(err)
  }
}

const create = async (req, res, next) => {
  try {
    const data = await usuariosService.create(req.body)
    logAction(`👤 CREAR usuario "${req.body.nombre}" (${req.body.usuario}) perfil=${req.body.perfil} — ${userTag(req.user)}`)
    return sendSuccess(res, data, 'Usuario creado correctamente', 201)
  } catch (err) {
    next(err)
  }
}

const update = async (req, res, next) => {
  try {
    const { id } = req.params
    await usuariosService.update(id, req.body)
    logAction(`👤 EDITAR usuario id=${id} "${req.body.nombre}" — ${userTag(req.user)}`)
    return sendSuccess(res, null, 'Usuario actualizado correctamente')
  } catch (err) {
    next(err)
  }
}

const remove = async (req, res, next) => {
  try {
    const { id } = req.params
    await usuariosService.remove(id)
    logAction(`👤 ELIMINAR usuario id=${id} — ${userTag(req.user)}`)
    return sendSuccess(res, null, 'Usuario eliminado correctamente')
  } catch (err) {
    next(err)
  }
}

module.exports = {
  getAll,
  create,
  update,
  remove,
  desconectar
}
