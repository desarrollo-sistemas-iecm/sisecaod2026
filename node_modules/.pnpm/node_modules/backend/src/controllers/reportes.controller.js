const { reportesService } = require('../services/reportes.service')
const { sendError } = require('../utils/response')
const { logQuery, logAction, userTag } = require('../config/logger')

const setExcelHeaders = (res, filename) => {
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
}

const getCentral = async (req, res, next) => {
  try {
    const mes  = req.query.mes  ? parseInt(req.query.mes)  : null
    const anio = req.query.anio ? parseInt(req.query.anio) : new Date().getFullYear()
    const { clave, perfil } = req.user
    logAction(`📊 DESCARGAR reporte central año=${anio} — ${userTag(req.user)}`)
    const buffer = await reportesService.generarCentral({ mes, anio, clave, perfil })
    setExcelHeaders(res, `reporte_central_${anio}.xlsx`)
    res.end(buffer)
  } catch (err) { next(err) }
}

const getDistrito = async (req, res, next) => {
  try {
    const mes       = req.query.mes  ? parseInt(req.query.mes)  : null
    const anio      = req.query.anio ? parseInt(req.query.anio) : new Date().getFullYear()
    const { idDistrito } = req.user
    logAction(`📊 DESCARGAR reporte distrito=${idDistrito} año=${anio} — ${userTag(req.user)}`)
    const buffer = await reportesService.generarDistrito({ mes, anio, idDistrito })
    setExcelHeaders(res, `reporte_distrito_${idDistrito}_${anio}.xlsx`)
    res.end(buffer)
  } catch (err) { next(err) }
}

const getPendientes = async (req, res, next) => {
  try {
    const mes       = req.query.mes  ? parseInt(req.query.mes)  : null
    const anio      = req.query.anio ? parseInt(req.query.anio) : new Date().getFullYear()
    const { idDistrito } = req.user
    logAction(`📊 DESCARGAR pendientes año=${anio} — ${userTag(req.user)}`)
    const buffer = await reportesService.generarPendientes({ mes, anio, idDistrito })
    setExcelHeaders(res, `reporte_pendientes_${idDistrito}_${anio}.xlsx`)
    res.end(buffer)
  } catch (err) { next(err) }
}

const getAvance = async (req, res, next) => {
  try {
    const mes       = req.query.mes  ? parseInt(req.query.mes)  : null
    const anio      = req.query.anio ? parseInt(req.query.anio) : new Date().getFullYear()
    const { idDistrito } = req.user
    const data = await reportesService.getAvance({ mes, anio, idDistrito })
    res.json({ success: true, data })
  } catch (err) { next(err) }
}

const getHistorico = async (req, res, next) => {
  try {
    const mesInicio = req.query.mes_inicio ? parseInt(req.query.mes_inicio) : 1
    const mesFin    = req.query.mes_fin    ? parseInt(req.query.mes_fin)    : 12
    const anio      = req.query.anio       ? parseInt(req.query.anio)       : new Date().getFullYear()
    const { idDistrito } = req.user
    logAction(`📊 DESCARGAR histórico año=${anio} meses=${mesInicio}-${mesFin} — ${userTag(req.user)}`)
    const buffer = await reportesService.generarHistorico({ mesInicio, mesFin, anio, idDistrito })
    setExcelHeaders(res, `reporte_historico_${idDistrito}_${anio}.xlsx`)
    res.end(buffer)
  } catch (err) { next(err) }
}

const getAvanceDistritos = async (req, res, next) => {
  try {
    const data = await reportesService.getAvanceDistritos()
    res.json({ success: true, data })
  } catch (err) { next(err) }
}

const getAvanceActividades = async (req, res, next) => {
  try {
    const data = await reportesService.getAvanceActividades()
    res.json({ success: true, data })
  } catch (err) { next(err) }
}

const getAvanceGrafica = async (req, res, next) => {
  try {
    const anio = req.query.anio ? parseInt(req.query.anio) : new Date().getFullYear()
    const distrito = req.query.distrito || 'todos'
    const { perfil, clave } = req.user
    const data = await reportesService.getAvanceGrafica({ anio, distrito, perfil, clave })
    res.json({ success: true, data })
  } catch (err) { next(err) }
}

const getAvanceDistritosExcel = async (req, res, next) => {
  try {
    const mes = req.query.mes ? parseInt(req.query.mes) : null
    const anio = req.query.anio ? parseInt(req.query.anio) : new Date().getFullYear()
    const { perfil, clave } = req.user
    logAction(`📊 DESCARGAR avance distritos Excel año=${anio} — ${userTag(req.user)}`)
    const buffer = await reportesService.generarAvanceDistritosExcel({ mes, anio, perfil, clave })
    setExcelHeaders(res, `actividades_realizadas_distrito_${anio}.xlsx`)
    res.end(buffer)
  } catch (err) { next(err) }
}

const getAvanceActividadesExcel = async (req, res, next) => {
  try {
    const mes = req.query.mes ? parseInt(req.query.mes) : null
    const anio = req.query.anio ? parseInt(req.query.anio) : new Date().getFullYear()
    const { perfil, clave } = req.user
    logAction(`📊 DESCARGAR avance actividades Excel año=${anio} — ${userTag(req.user)}`)
    const buffer = await reportesService.generarAvanceActividadesExcel({ mes, anio, perfil, clave })
    setExcelHeaders(res, `actividades_realizadas_${anio}.xlsx`)
    res.end(buffer)
  } catch (err) { next(err) }
}

const getACapturar = async (req, res, next) => {
  try {
    const mes = req.query.mes ? parseInt(req.query.mes) : null
    const anio = req.query.anio ? parseInt(req.query.anio) : new Date().getFullYear()
    const { idDistrito } = req.user
    logAction(`📊 DESCARGAR a-capturar año=${anio} — ${userTag(req.user)}`)
    const buffer = await reportesService.generarACapturar({ mes, anio, idDistrito })
    setExcelHeaders(res, `reporte_a_capturar_${idDistrito}_${anio}.xlsx`)
    res.end(buffer)
  } catch (err) { next(err) }
}

const getResumenCaptura = async (req, res, next) => {
  try {
    const { perfil, clave } = req.user
    logQuery(`📊 Consulta resumen SI/NO — ${userTag(req.user)}`)
    const data = await reportesService.getResumenCaptura({ perfil, clave })
    res.json({ success: true, data })
  } catch (err) { next(err) }
}

const path = require('path')
const fs = require('fs')

const descargarHistorico = async (req, res, next) => {
  try {
    const anio = parseInt(req.params.anio)
    if (![2019, 2020, 2021, 2022, 2023].includes(anio)) {
      return res.status(400).json({ success: false, message: 'Año histórico no válido' })
    }
    const filePath = path.join(__dirname, '..', '..', 'uploads', 'formatos', `actividades_${anio}.xlsx`)
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, message: 'Archivo de reporte no encontrado' })
    }
    logAction(`📁 DESCARGAR histórico archivo año=${anio} — ${userTag(req.user)}`)
    res.download(filePath, `actividades_${anio}.xlsx`)
  } catch (err) { next(err) }
}

module.exports = { 
  getCentral, 
  getDistrito, 
  getPendientes, 
  getAvance, 
  getHistorico,
  getAvanceDistritos,
  getAvanceActividades,
  getAvanceGrafica,
  getAvanceDistritosExcel,
  getAvanceActividadesExcel,
  getACapturar,
  descargarHistorico,
  getResumenCaptura
}
