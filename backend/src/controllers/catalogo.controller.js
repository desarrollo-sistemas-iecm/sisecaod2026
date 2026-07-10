const { catalogoService } = require('../services/catalogo.service')
const { sendSuccess, sendError } = require('../utils/response')

const getAll = async (req, res, next) => {
  try {
    const { perfil, idDistrito, clave } = req.user
    const data = await catalogoService.getAll({ perfil, idDistrito, clave })
    return sendSuccess(res, data)
  } catch (err) { next(err) }
}

const getById = async (req, res, next) => {
  try {
    const { perfil, idDistrito, clave } = req.user
    const data = await catalogoService.getById(parseInt(req.params.id), { perfil, idDistrito, clave })
    if (!data) return sendError(res, 'Actividad no encontrada', 404)
    return sendSuccess(res, data)
  } catch (err) { next(err) }
}

const create = async (req, res, next) => {
  try {
    const { id: idUsuario } = req.user
    const data = await catalogoService.create(req.body, idUsuario, req.user)
    return sendSuccess(res, data, 'Actividad creada correctamente', 201)
  } catch (err) { next(err) }
}

const update = async (req, res, next) => {
  try {
    await catalogoService.update(parseInt(req.params.id), req.body, req.user)
    return sendSuccess(res, null, 'Actividad actualizada correctamente')
  } catch (err) { next(err) }
}

const remove = async (req, res, next) => {
  try {
    await catalogoService.remove(parseInt(req.params.id))
    return sendSuccess(res, null, 'Actividad eliminada correctamente')
  } catch (err) { next(err) }
}

const getResponsables = async (req, res, next) => {
  try {
    const data = await catalogoService.getResponsables()
    return sendSuccess(res, data)
  } catch (err) { next(err) }
}

const importar = async (req, res, next) => {
  try {
    if (!req.file) return sendError(res, 'Archivo no recibido', 400)
    const { id: idUsuario } = req.user
    const result = await catalogoService.importarExcel(req.file.path, idUsuario)
    return sendSuccess(res, result, `Se importaron ${result.insertados} actividades correctamente`)
  } catch (err) { next(err) }
}

const importarDesfase = async (req, res, next) => {
  try {
    if (!req.file) return sendError(res, 'Archivo no recibido', 400)
    const { mesReal, anoReal } = req.body
    if (!mesReal || !anoReal) return sendError(res, 'Mes y año reales son requeridos', 400)
    
    const { id: idUsuario } = req.user
    const result = await catalogoService.importarExcelDesfase(req.file.path, idUsuario, mesReal, anoReal)
    return sendSuccess(res, result, `Se importaron ${result.insertados} actividades con desfase correctamente`)
  } catch (err) { next(err) }
}

module.exports = { getAll, getById, create, update, remove, getResponsables, importar, importarDesfase }
