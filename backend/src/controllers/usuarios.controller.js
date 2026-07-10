const { usuariosService } = require('../services/usuarios.service')
const { sendSuccess, sendError } = require('../utils/response')

const getAll = async (req, res, next) => {
  try {
    const data = await usuariosService.getAll()
    return sendSuccess(res, data, 'Usuarios obtenidos correctamente')
  } catch (err) {
    next(err)
  }
}

const create = async (req, res, next) => {
  try {
    const data = await usuariosService.create(req.body)
    return sendSuccess(res, data, 'Usuario creado correctamente', 201)
  } catch (err) {
    next(err)
  }
}

const update = async (req, res, next) => {
  try {
    const { id } = req.params
    await usuariosService.update(id, req.body)
    return sendSuccess(res, null, 'Usuario actualizado correctamente')
  } catch (err) {
    next(err)
  }
}

const remove = async (req, res, next) => {
  try {
    const { id } = req.params
    await usuariosService.remove(id)
    return sendSuccess(res, null, 'Usuario eliminado correctamente')
  } catch (err) {
    next(err)
  }
}

module.exports = {
  getAll,
  create,
  update,
  remove
}
