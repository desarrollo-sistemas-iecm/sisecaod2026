const { query, sql } = require('../config/database')
const { buildPeriodoActivo, getNombreMes } = require('../utils/periodo')

const getPeriodoActivo = async () => {
  const now = new Date().toISOString().slice(0, 19).replace('T', ' ')
  const result = await query(
    `SELECT TOP 1 mes, ano, fecha_inicio, fecha_fin
     FROM sisecao_settings
     WHERE @fechaActual BETWEEN fecha_inicio AND fecha_fin AND status = 1`,
    { fechaActual: { type: sql.VarChar(20), value: now } }
  )
  const row = result.recordset[0] ?? null
  return buildPeriodoActivo(row)
}

const getAniosDisponibles = async () => {
  const result = await query(
    `SELECT DISTINCT ano FROM sisecao_catactividad ORDER BY ano DESC`
  )
  return result.recordset.map(r => r.ano)
}

const getAllPeriodos = async (anio) => {
  const result = await query(
    `SELECT mes, ano, fecha_inicio, fecha_fin, status
     FROM sisecao_settings
     WHERE ano = @anio
     ORDER BY mes ASC`,
    { anio: { type: sql.Int, value: parseInt(anio) } }
  )
  return result.recordset
}

const updatePeriodo = async (mes, anio, body, idUsuario) => {
  const { fechaInicio, fechaFin } = body
  const now = new Date().toISOString().slice(0, 19).replace('T', ' ')
  
  // 1. UPDATE sisecao_settings SET status = -1 WHERE mes < @mes (sin ano limit, legacy behavior)
  await query(
    `UPDATE sisecao_settings
     SET status = -1, fecha_modif = @now, id_usuario = @idUsuario
     WHERE mes < @mes`,
    {
      mes:       { type: sql.Int,      value: parseInt(mes) },
      now:       { type: sql.VarChar,  value: now },
      idUsuario: { type: sql.Int,      value: idUsuario }
    }
  )
  
  // 2. UPDATE sisecao_settings SET fecha_inicio, fecha_fin, status = 1 WHERE mes = @mes AND ano = @anio
  await query(
    `UPDATE sisecao_settings
     SET fecha_inicio = @fechaInicio,
         fecha_fin = @fechaFin,
         status = 1,
         fecha_modif = @now,
         id_usuario = @idUsuario
     WHERE mes = @mes AND ano = @anio`,
    {
      mes:         { type: sql.Int,      value: parseInt(mes) },
      anio:        { type: sql.Int,      value: parseInt(anio) },
      fechaInicio: { type: sql.VarChar,  value: fechaInicio ? fechaInicio.replace('T', ' ') : null },
      fechaFin:    { type: sql.VarChar,  value: fechaFin ? fechaFin.replace('T', ' ') : null },
      now:         { type: sql.VarChar,  value: now },
      idUsuario:   { type: sql.Int,      value: idUsuario }
    }
  )
}

const getImportStatus = async () => {
  const result = await query(
    `SELECT CASE
        WHEN EXISTS (
            SELECT 1 FROM sisecao_settings 
            WHERE status = 1 AND CAST(GETDATE() AS DATE) < CAST(fecha_fin AS DATE)
        )
        AND NOT EXISTS (
            SELECT 1
            FROM sisecao_settings S
            INNER JOIN sisecao_catactividad A ON S.mes = A.mes AND S.ano = A.ano
            WHERE S.status = 1 
              AND S.mes = (SELECT MAX(mes) FROM sisecao_settings WHERE status = 1)
        ) THEN 0  -- habilitado
        ELSE 1    -- deshabilitado
    END AS infocat`
  )
  return result.recordset[0]?.infocat ?? 1
}

/**
 * Endpoint público (sin auth): solo devuelve si el sistema está abierto y el nombre del mes activo.
 * Nunca expone fechas, año, id_usuario ni estructura interna de la tabla.
 */
const getStatusPublico = async () => {
  const now = new Date().toISOString().slice(0, 19).replace('T', ' ')
  const result = await query(
    `SELECT TOP 1 mes
     FROM sisecao_settings
     WHERE @fechaActual BETWEEN fecha_inicio AND fecha_fin AND status = 1`,
    { fechaActual: { type: sql.VarChar(20), value: now } }
  )
  const row = result.recordset[0] ?? null
  return {
    abierto: row !== null,
    mes: row ? getNombreMes(row.mes) : ''
  }
}

module.exports = { 
  settingsService: { 
    getPeriodoActivo, 
    getAniosDisponibles, 
    getAllPeriodos, 
    updatePeriodo,
    getImportStatus,
    getStatusPublico
  } 
}
