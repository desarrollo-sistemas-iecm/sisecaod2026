const { query, sql, getPool } = require('../config/database')
const XLSX = require('xlsx')
const fs = require('fs')

const buildFiltros = ({ perfil, idDistrito, clave }) => {
  const porDistrito = idDistrito <= 33 ? ` AND b.iddistrito = @idDistrito` : ''
  const porArea = perfil === 4 ? ` AND SUBSTRING(a.clave, 4, 2) = @clave` : ''
  return { porDistrito, porArea }
}

const getAll = async ({ perfil, idDistrito, clave }) => {
  const { porArea } = buildFiltros({ perfil, idDistrito, clave })
  const params = { status: { type: sql.Int, value: 1 } }
  if (perfil === 4) params.clave = { type: sql.VarChar(10), value: clave }

  const result = await query(
    `SELECT a.id_actividad, a.clave, a.actividad, a.periodoinicia, a.periodofin,
            a.tipo_actividad, a.soporte, a.responsable, a.numero, a.mes, a.ano
     FROM sisecao_catactividad AS a
     WHERE a.status = @status${porArea}
     ORDER BY a.id_actividad ASC`,
    params
  )
  return result.recordset
}

const getById = async (id, { perfil, idDistrito, clave }) => {
  const { porDistrito, porArea } = buildFiltros({ perfil, idDistrito, clave })
  const params = {
    id: { type: sql.Int, value: id },
    status: { type: sql.Int, value: 1 },
  }
  if (idDistrito <= 33) params.idDistrito = { type: sql.Int, value: idDistrito }
  if (perfil === 4) params.clave = { type: sql.VarChar(10), value: clave }

  const result = await query(
    `SELECT a.id_actividad, a.clave, a.actividad, a.periodoinicia, a.periodofin,
            a.tipo_actividad, a.soporte, a.responsable, a.numero,
            b.clave AS clave_captura, b.iddistrito, b.tipo, b.num_oficio,
            b.descripcion, b.realizo, b.fecha_cumplio, b.fecha_alta,
            b.usr_alta, b.status AS status_trabajo, b.mes, b.ano
     FROM sisecao_catactividad AS a
     LEFT JOIN sisecao_actividades_trabajo AS b
       ON a.id_actividad = b.id_actividad${porDistrito}
     WHERE a.id_actividad = @id AND a.status = @status${porArea}`,
    params
  )
  return result.recordset[0] ?? null
}

const create = async (body, idUsuario, user) => {
  const { perfil, clave: userClave } = user || {}
  const { clave, actividad, tipoActividad, soporte, responsable, numero, mes, periodoinicia, periodofin, especificaciones, medicionActividad } = body

  if (perfil === 4) {
    const partes = (clave || '').split('-')
    if (partes[1] !== userClave) {
      throw Object.assign(new Error('No autorizado: la clave de la actividad no corresponde a su área'), { status: 403, expose: true })
    }
  }

  const partesClave = (clave || '').split('-')
  const claveDtos = parseInt(partesClave[0]) || 0
  const claveArea = parseInt(partesClave[1]) || 0
  const conseClave = partesClave[2] ? partesClave[2].trim() : ''

  const ano = new Date().getFullYear()
  const fechaAlta = new Date().toISOString().slice(0, 10)

  const result = await query(
    `INSERT INTO sisecao_catactividad
       (clave, actividad, tipo_actividad, soporte, responsable, numero, mes,
        periodoinicia, periodofin, fecha_alta, ano, usr_alta, status,
        clave_dtos, clave_area, conse_clave, especificaciones, medicion_actividad)
     OUTPUT INSERTED.id_actividad
     VALUES (@clave, @actividad, @tipoActividad, @soporte, @responsable,
             @numero, @mes, @periodoinicia, @periodofin, @fechaAlta, @ano, @idUsuario, 1,
             @claveDtos, @claveArea, @conseClave, @especificaciones, @medicionActividad)`,
    {
      clave:        { type: sql.VarChar(20),   value: clave },
      actividad:    { type: sql.NVarChar(500),  value: actividad },
      tipoActividad:{ type: sql.VarChar(10),   value: tipoActividad },
      soporte:      { type: sql.VarChar(50),   value: soporte },
      responsable:  { type: sql.NVarChar(200), value: responsable },
      numero:       { type: sql.VarChar(20),   value: String(numero) },
      mes:          { type: sql.Int,           value: parseInt(mes) },
      periodoinicia:{ type: sql.VarChar(50),   value: periodoinicia },
      periodofin:   { type: sql.VarChar(50),   value: periodofin },
      fechaAlta:    { type: sql.Date,          value: fechaAlta },
      ano:          { type: sql.Int,           value: ano },
      idUsuario:    { type: sql.Int,           value: idUsuario },
      claveDtos:    { type: sql.Int,           value: claveDtos },
      claveArea:    { type: sql.Int,           value: claveArea },
      conseClave:   { type: sql.VarChar(10),   value: conseClave },
      especificaciones: { type: sql.NVarChar(500), value: especificaciones || '' },
      medicionActividad: { type: sql.VarChar(200), value: medicionActividad || '' }
    }
  )
  return { id_actividad: result.recordset[0].id_actividad }
}

const update = async (id, body, user) => {
  const { perfil, clave: userClave } = user || {}
  const { clave, actividad, tipoActividad, soporte, responsable, numero, periodoinicia, periodofin, especificaciones, medicionActividad } = body

  if (perfil === 4) {
    const original = await getById(id, { perfil, idDistrito: 99, clave: userClave })
    if (!original) {
      throw Object.assign(new Error('Actividad no encontrada o no autorizada para su área'), { status: 403, expose: true })
    }
    const partes = (clave || '').split('-')
    if (partes[1] !== userClave) {
      throw Object.assign(new Error('No autorizado: la nueva clave de la actividad no corresponde a su área'), { status: 403, expose: true })
    }
  }

  const partesClave = (clave || '').split('-')
  const claveDtos = parseInt(partesClave[0]) || 0
  const claveArea = parseInt(partesClave[1]) || 0
  const conseClave = partesClave[2] ? partesClave[2].trim() : ''

  await query(
    `UPDATE sisecao_catactividad
     SET clave = @clave, actividad = @actividad, tipo_actividad = @tipoActividad,
         soporte = @soporte, responsable = @responsable, numero = @numero,
         periodoinicia = @periodoinicia, periodofin = @periodofin, status = 1,
         clave_dtos = @claveDtos, clave_area = @claveArea, conse_clave = @conseClave,
         especificaciones = @especificaciones, medicion_actividad = @medicionActividad
     WHERE id_actividad = @id`,
    {
      id:           { type: sql.Int,           value: id },
      clave:        { type: sql.VarChar(20),   value: clave },
      actividad:    { type: sql.NVarChar(500),  value: actividad },
      tipoActividad:{ type: sql.VarChar(10),   value: tipoActividad },
      soporte:      { type: sql.VarChar(50),   value: soporte },
      responsable:  { type: sql.NVarChar(200), value: responsable },
      numero:       { type: sql.VarChar(20),   value: String(numero) },
      periodoinicia:{ type: sql.VarChar(50),   value: periodoinicia },
      periodofin:   { type: sql.VarChar(50),   value: periodofin },
      claveDtos:    { type: sql.Int,           value: claveDtos },
      claveArea:    { type: sql.Int,           value: claveArea },
      conseClave:   { type: sql.VarChar(10),   value: conseClave },
      especificaciones: { type: sql.NVarChar(500), value: especificaciones || '' },
      medicionActividad: { type: sql.VarChar(200), value: medicionActividad || '' }
    }
  )
}

const getResponsables = async () => {
  const result = await query(
    `SELECT DISTINCT responsable FROM sisecao_catactividad WHERE status = 1 ORDER BY responsable`
  )
  return result.recordset.map(r => r.responsable)
}

const importarExcel = async (filePath, idUsuario) => {
  // Cargar el archivo con SheetJS (soporta xls, xlsx, csv, etc.)
  const workbook = XLSX.readFile(filePath)
  const sheetName = workbook.SheetNames[0]
  const worksheet = workbook.Sheets[sheetName]
  
  // Convertir a matriz 2D
  const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 })
  const fechaAlta = new Date().toISOString().slice(0, 10)
  let insertados = 0

  const pool = getPool()
  if (!pool) throw new Error('Pool de BD no inicializado. Llama connectDb() primero.')

  // Obtener periodo activo de settings (mes y ano)
  const activePeriodResult = await pool.request().query(
    `SELECT TOP 1 mes, ano FROM sisecao_settings WHERE status = 1 ORDER BY ano DESC, mes DESC`
  )
  if (!activePeriodResult.recordset.length) {
    throw new Error('No existe una configuración de periodos activa en el sistema')
  }
  const { mes, ano } = activePeriodResult.recordset[0]

  const getValueString = (row, idx) => {
    const val = row[idx]
    if (val === null || val === undefined) return ''
    return String(val).trim()
  }

  const getValueInt = (row, idx) => {
    const val = row[idx]
    if (val === null || val === undefined) return 0
    const parsed = parseInt(val)
    return isNaN(parsed) ? 0 : parsed
  }

  const transaction = new sql.Transaction(pool)
  
  try {
    await transaction.begin()

    // 1. Limpieza de datos activos previos (Regla de negocio heredada)
    const cleanRequest = new sql.Request(transaction)
    await cleanRequest.query(`UPDATE sisecao_catactividad SET status = 0 WHERE status = 1`)
    await cleanRequest.query(`UPDATE sisecao_actividades_trabajo SET status = 0 WHERE status = 1`)
    
    // data[0] es la fila 1 (cabeceras). Las filas de datos inician en data[1] (índice 1 en adelante)
    for (let i = 1; i < data.length; i++) {
      const row = data[i]
      if (!row || row.length === 0) continue
      
      const clave = getValueString(row, 0)
      if (!clave) break // Detenerse en fila vacía de clave

      const claveDtos = getValueInt(row, 9)       // Columna J (índice 9)
      const claveArea = getValueInt(row, 10)      // Columna K (índice 10)
      const conseClave = getValueString(row, 11)   // Columna L (índice 11)
      const especificaciones = getValueString(row, 12) // Columna M (índice 12)
      const medicion = getValueString(row, 13)     // Columna N (índice 13)

      const request = new sql.Request(transaction)
      request.input('clave', sql.VarChar(15), clave.slice(0, 15))
      request.input('actividad', sql.NVarChar, getValueString(row, 1))      // Columna B (índice 1)
      request.input('periodoinicia', sql.VarChar(20), getValueString(row, 2).slice(0, 20))  // Columna C (índice 2)
      request.input('periodofin', sql.VarChar(20), getValueString(row, 3).slice(0, 20))     // Columna D (índice 3)
      request.input('responsable', sql.VarChar(200), getValueString(row, 4).slice(0, 200))   // Columna E (índice 4)
      request.input('soporte', sql.VarChar(200), getValueString(row, 5).slice(0, 200))         // Columna F (índice 5)
      request.input('tipoActividad', sql.VarChar(50), getValueString(row, 6).slice(0, 50))  // Columna G (índice 6)
      request.input('mes', sql.Int, mes)
      request.input('ordenamiento', sql.Int, getValueInt(row, 7))                 // Columna H (índice 7)
      request.input('fechaAlta', sql.VarChar(20), fechaAlta)
      request.input('idUsuario', sql.Int, idUsuario)
      request.input('ano', sql.Int, ano)
      request.input('claveDtos', sql.Int, claveDtos)
      request.input('claveArea', sql.Int, claveArea)
      request.input('conseClave', sql.VarChar(3), conseClave.slice(0, 3))
      request.input('especificaciones', sql.NVarChar, especificaciones)
      request.input('medicion', sql.VarChar(200), medicion.slice(0, 200))

      await request.query(
        `INSERT INTO sisecao_catactividad
           (clave, actividad, periodoinicia, periodofin, responsable, soporte,
            tipo_actividad, mes, ordenamiento, fecha_alta, usr_alta, status, ano,
            clave_dtos, clave_area, conse_clave, especificaciones, medicion_actividad)
         VALUES
           (@clave, @actividad, @periodoinicia, @periodofin, @responsable, @soporte,
            @tipoActividad, @mes, @ordenamiento, @fechaAlta, @idUsuario, 1, @ano,
            @claveDtos, @claveArea, @conseClave, @especificaciones, @medicion)`
      )
      insertados++
    }
    
    await transaction.commit()
  } catch (error) {
    console.error('ERROR ORIGINAL EN IMPORTACION:', error)
    try {
      await transaction.rollback()
    } catch (rollbackError) {
      console.error('Error al hacer rollback de la transacción:', rollbackError.message)
    }
    throw error
  } finally {
    // Se comenta fs.unlinkSync para guardar históricamente los archivos de actividades en la carpeta uploads/actividades
    // try { fs.unlinkSync(filePath) } catch {}
  }
  
  return { insertados }
}

const importarExcelDesfase = async (filePath, idUsuario, mesReal, anoReal) => {
  const workbook = XLSX.readFile(filePath)
  const sheetName = workbook.SheetNames[0]
  const worksheet = workbook.Sheets[sheetName]
  
  const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 })
  const fechaAlta = new Date().toISOString().slice(0, 10)
  let insertados = 0

  const pool = getPool()
  if (!pool) throw new Error('Pool de BD no inicializado. Llama connectDb() primero.')

  const mes = parseInt(mesReal)
  const ano = parseInt(anoReal)

  if (isNaN(mes) || isNaN(ano)) {
    throw new Error('Mes o año real inválidos')
  }

  const getValueString = (row, idx) => {
    const val = row[idx]
    if (val === null || val === undefined) return ''
    return String(val).trim()
  }

  const getValueInt = (row, idx) => {
    const val = row[idx]
    if (val === null || val === undefined) return 0
    const parsed = parseInt(val)
    return isNaN(parsed) ? 0 : parsed
  }

  const transaction = new sql.Transaction(pool)
  
  try {
    await transaction.begin()

    const cleanRequest = new sql.Request(transaction)
    await cleanRequest.query(`UPDATE sisecao_catactividad SET status = 0 WHERE status = 1`)
    await cleanRequest.query(`UPDATE sisecao_actividades_trabajo SET status = 0 WHERE status = 1`)
    
    for (let i = 1; i < data.length; i++) {
      const row = data[i]
      if (!row || row.length === 0) continue
      
      const clave = getValueString(row, 0)
      if (!clave) break 

      const request = new sql.Request(transaction)
      request.input('clave', sql.VarChar(15), clave.slice(0, 15))
      request.input('actividad', sql.NVarChar, getValueString(row, 1))
      request.input('periodoinicia', sql.VarChar(20), getValueString(row, 2).slice(0, 20))
      request.input('periodofin', sql.VarChar(20), getValueString(row, 3).slice(0, 20))
      request.input('responsable', sql.VarChar(200), getValueString(row, 4).slice(0, 200))
      request.input('soporte', sql.VarChar(200), getValueString(row, 5).slice(0, 200))
      request.input('tipoActividad', sql.VarChar(50), getValueString(row, 6).slice(0, 50))
      request.input('mes', sql.Int, mes)
      request.input('ordenamiento', sql.Int, getValueInt(row, 7))
      request.input('fechaAlta', sql.VarChar(20), fechaAlta)
      request.input('idUsuario', sql.Int, idUsuario)
      request.input('ano', sql.Int, ano)
      request.input('claveDtos', sql.Int, getValueInt(row, 9))
      request.input('claveArea', sql.Int, getValueInt(row, 10))
      request.input('conseClave', sql.VarChar(3), getValueString(row, 11).slice(0, 3))
      request.input('especificaciones', sql.NVarChar, getValueString(row, 12))
      request.input('medicion', sql.VarChar(200), getValueString(row, 13).slice(0, 200))

      await request.query(
        `INSERT INTO sisecao_catactividad
           (clave, actividad, periodoinicia, periodofin, responsable, soporte,
            tipo_actividad, mes, ordenamiento, fecha_alta, usr_alta, status, ano,
            clave_dtos, clave_area, conse_clave, especificaciones, medicion_actividad)
         VALUES
           (@clave, @actividad, @periodoinicia, @periodofin, @responsable, @soporte,
            @tipoActividad, @mes, @ordenamiento, @fechaAlta, @idUsuario, 1, @ano,
            @claveDtos, @claveArea, @conseClave, @especificaciones, @medicion)`
      )
      insertados++
    }
    
    await transaction.commit()
  } catch (error) {
    console.error('ERROR ORIGINAL EN IMPORTACION DESFASE:', error)
    try { await transaction.rollback() } catch {}
    throw error
  }
  
  return { insertados }
}

const remove = async (id) => {
  await query(
    `UPDATE sisecao_catactividad
     SET status = 0
     WHERE id_actividad = @id`,
    {
      id: { type: sql.Int, value: id }
    }
  )
}

module.exports = { catalogoService: { getAll, getById, create, update, getResponsables, importarExcel, importarExcelDesfase, remove } }
