const { seguimientoService } = require('../services/seguimiento.service')
const { sendSuccess, sendError } = require('../utils/response')

const getAll = async (req, res, next) => {
  try {
    const { perfil, idDistrito, clave } = req.user
    const data = await seguimientoService.getAll({ perfil, idDistrito, clave })
    return sendSuccess(res, data)
  } catch (err) { next(err) }
}

const getById = async (req, res, next) => {
  try {
    const { perfil, idDistrito, clave } = req.user
    const data = await seguimientoService.getById(parseInt(req.params.idActividad), { perfil, idDistrito, clave })
    if (!data) return sendError(res, 'Actividad no encontrada', 404)
    return sendSuccess(res, data)
  } catch (err) { next(err) }
}

const save = async (req, res, next) => {
  try {
    const { id: idUsuario, idDistrito, perfil } = req.user
    const result = await seguimientoService.save(req.body, idUsuario, idDistrito, perfil)
    return sendSuccess(res, null, result.mensaje)
  } catch (err) { next(err) }
}

module.exports = { getAll, getById, save }
