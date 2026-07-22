const { seguimientoService } = require('../services/seguimiento.service')
const { sendSuccess, sendError } = require('../utils/response')
const { logAction, logQuery, userTag } = require('../config/logger')

const getAll = async (req, res, next) => {
  try {
    const { perfil, idDistrito, clave } = req.user
    logQuery(`📋 Consulta seguimiento — ${userTag(req.user)}`)
    const data = await seguimientoService.getAll({ perfil, idDistrito, clave })
    return sendSuccess(res, data)
  } catch (err) { next(err) }
}

const getById = async (req, res, next) => {
  try {
    const { perfil, idDistrito, clave } = req.user
    const idActividad = parseInt(req.params.idActividad)
    logQuery(`🔍 Consulta actividad id=${idActividad} — ${userTag(req.user)}`)
    const data = await seguimientoService.getById(idActividad, { perfil, idDistrito, clave })
    if (!data) return sendError(res, 'Actividad no encontrada', 404)
    return sendSuccess(res, data)
  } catch (err) { next(err) }
}

const save = async (req, res, next) => {
  try {
    const { id: idUsuario, idDistrito, perfil } = req.user
    const { idActividad, realizo } = req.body
    const result = await seguimientoService.save(req.body, idUsuario, idDistrito, perfil)

    logAction(`📝 CAPTURA ➜  act=${idActividad} realizo=${realizo} — ${userTag(req.user)}`)
    return sendSuccess(res, null, result.mensaje)
  } catch (err) { next(err) }
}

module.exports = { getAll, getById, save }
