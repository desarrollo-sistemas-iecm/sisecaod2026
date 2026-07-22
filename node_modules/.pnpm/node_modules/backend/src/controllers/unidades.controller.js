const { unidadesService } = require('../services/unidades.service')
const { sendSuccess, sendError } = require('../utils/response')
const { logAction, userTag } = require('../config/logger')

const getAll = async (req, res, next) => {
  try {
    const data = await unidadesService.getAll()
    return sendSuccess(res, data, 'Unidades obtenidas correctamente')
  } catch (err) { next(err) }
}

const getActivas = async (req, res, next) => {
  try {
    const data = await unidadesService.getActivas()
    return sendSuccess(res, data, 'Unidades activas obtenidas correctamente')
  } catch (err) { next(err) }
}

const create = async (req, res, next) => {
  try {
    const data = await unidadesService.create(req.body)
    logAction(`🏢 CREAR unidad "${req.body.nombre}" clave=${req.body.clave} — ${userTag(req.user)}`)
    return sendSuccess(res, data, 'Unidad creada correctamente', 201)
  } catch (err) { next(err) }
}

const update = async (req, res, next) => {
  try {
    const { id } = req.params
    await unidadesService.update(id, req.body)
    logAction(`🏢 EDITAR unidad id=${id} "${req.body.nombre}" — ${userTag(req.user)}`)
    return sendSuccess(res, null, 'Unidad actualizada correctamente')
  } catch (err) { next(err) }
}

module.exports = { getAll, getActivas, create, update }
