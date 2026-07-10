const { settingsService } = require('../services/settings.service')
const { sendSuccess, sendError } = require('../utils/response')

const getPeriodoActivo = async (req, res, next) => {
  try {
    const periodo = await settingsService.getPeriodoActivo()
    return sendSuccess(res, periodo, 'Periodo activo obtenido')
  } catch (err) {
    next(err)
  }
}

const getStatusPublico = async (req, res, next) => {
  try {
    const status = await settingsService.getStatusPublico()
    return sendSuccess(res, status, 'Estado del sistema obtenido')
  } catch (err) {
    next(err)
  }
}

const getAnios = async (req, res, next) => {
  try {
    const anios = await settingsService.getAniosDisponibles()
    return sendSuccess(res, anios, 'Años disponibles obtenidos')
  } catch (err) {
    next(err)
  }
}

const getPeriodos = async (req, res, next) => {
  try {
    const anio = req.query.anio ? parseInt(req.query.anio) : new Date().getFullYear()
    const periodos = await settingsService.getAllPeriodos(anio)
    return sendSuccess(res, periodos, 'Periodos obtenidos correctamente')
  } catch (err) {
    next(err)
  }
}

const updatePeriodo = async (req, res, next) => {
  try {
     const { mes, anio } = req.body
     await settingsService.updatePeriodo(mes, anio, req.body, req.user.id)
     return sendSuccess(res, null, 'Periodo actualizado correctamente')
  } catch (err) {
    next(err)
  }
}

const getImportStatus = async (req, res, next) => {
  try {
    const infocat = await settingsService.getImportStatus()
    return sendSuccess(res, { infocat }, 'Estado de importación obtenido')
  } catch (err) {
    next(err)
  }
}

module.exports = { getPeriodoActivo, getStatusPublico, getAnios, getPeriodos, updatePeriodo, getImportStatus }
