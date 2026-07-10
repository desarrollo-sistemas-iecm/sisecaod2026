const { query, sql } = require('../config/database')
const ExcelJS = require('exceljs')

const MESES_ES = ['', 'ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO',
  'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE']

const TIPOS_ACTIVIDAD = { AD: 'Adicional', PE: 'Proceso Electoral', ORD: 'Ordinaria', PC: 'Participación Ciudadana' }

const getMesActivo = async () => {
  const now = new Date().toISOString().slice(0, 19).replace('T', ' ')
  const r = await query(
    `SELECT TOP 1 mes FROM sisecao_settings WHERE @n BETWEEN fecha_inicio AND fecha_fin`,
    { n: { type: sql.VarChar(20), value: now } }
  )
  return r.recordset[0]?.mes ?? new Date().getMonth() + 1
}

const estiloEncabezado = (ws, fila) => {
  fila.eachCell(cell => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF7B4FBF' } }
    cell.font = { color: { argb: 'FFFFFFFF' }, bold: true, size: 10 }
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true }
    cell.border = { top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } }
  })
}

const agregarEncabezadoInstitucional = (ws, titulo, mesNombre, extra = '', colCount = 16) => {
  ws.mergeCells(1, 1, 1, colCount)
  const cellA1 = ws.getCell('A1')
  cellA1.value = 'SECRETARÍA EJECUTIVA — Dirección de Apoyo a Órganos Desconcentrados'
  cellA1.font = { bold: true, size: 12 }
  cellA1.alignment = { horizontal: 'center', vertical: 'middle' }
  ws.getRow(1).height = 25

  ws.mergeCells(2, 1, 2, colCount)
  const cellA2 = ws.getCell('A2')
  cellA2.value = titulo
  cellA2.font = { bold: true, size: 11 }
  cellA2.alignment = { horizontal: 'center', vertical: 'middle' }
  ws.getRow(2).height = 22

  ws.mergeCells(3, 1, 3, colCount)
  const cellA3 = ws.getCell('A3')
  cellA3.value = `MES: ${mesNombre}${extra}`
  cellA3.font = { bold: true, size: 10 }
  cellA3.alignment = { horizontal: 'center', vertical: 'middle' }
  ws.getRow(3).height = 20

  ws.addRow([])
}

const generarCentral = async ({ mes, anio, clave, perfil }) => {
  const mesActivo = mes ?? await getMesActivo()
  const mesNombre = MESES_ES[mesActivo] ?? ''
  const porArea   = perfil === 4 ? ` AND SUBSTRING(A.clave, 4, 2) = @clave` : ''
  const params    = {
    mes:  { type: sql.Int, value: mesActivo },
    anio: { type: sql.Int, value: anio },
  }
  if (perfil === 4) params.clave = { type: sql.VarChar(10), value: clave }

  const result = await query(
    `SELECT T.iddistrito AS distrito, T.clave, A.actividad, A.periodoinicia, A.periodofin,
            A.responsable, A.soporte, A.tipo_actividad, T.realizo, T.tipo,
            T.num_oficio AS oficio, T.descripcion AS detalle
     FROM sisecao_catactividad A
     INNER JOIN sisecao_actividades_trabajo T
       ON A.clave = T.clave AND A.mes = T.mes AND A.ano = T.ano
     WHERE A.mes = @mes AND A.ano = @anio${porArea}
     ORDER BY T.clave, T.iddistrito`,
    params
  )

  const wb = new ExcelJS.Workbook()
  const ws = wb.addWorksheet('Reporte Central')
  agregarEncabezadoInstitucional(ws, 'REPORTE CENTRAL DE ACTIVIDADES DESARROLLADAS POR LOS ÓRGANOS DESCONCENTRADOS', mesNombre, '', 14)

  const headers = ['DISTRITO', 'ÁREA', 'CONSECUTIVO', 'CLAVE COMPLETA', 'ACTIVIDAD',
    'PERIODO INICIO', 'PERIODO TÉRMINO', 'RESPONSABLE', 'SOPORTE', 'TIPO ACTIVIDAD',
    'CUMPLIÓ', 'TIPO DOC / NÚMERO', 'RESUMEN', 'CAUSA NO CUMPLIMIENTO']
  const hRow = ws.addRow(headers)
  estiloEncabezado(ws, hRow)

  for (const row of result.recordset) {
    const partes = (row.clave ?? '').split('-')
    ws.addRow([
      row.distrito, partes[1] ?? '', partes[2] ?? '', row.clave,
      row.actividad, row.periodoinicia, row.periodofin,
      row.responsable, row.soporte,
      TIPOS_ACTIVIDAD[row.tipo_actividad] ?? row.tipo_actividad,
      row.realizo,
      `${row.tipo ?? ''} ${row.oficio ?? ''}`.trim(),
      row.realizo === 'SI' ? row.detalle : '-',
      row.realizo !== 'SI' ? row.detalle : '-',
    ])
  }

  ws.columns.forEach(col => { col.width = 18 })
  return wb.xlsx.writeBuffer()
}

const generarDistrito = async ({ mes, anio, idDistrito }) => {
  const mesActivo = mes ?? await getMesActivo()
  const mesNombre = MESES_ES[mesActivo] ?? ''

  const result = await query(
    `SELECT T.iddistrito AS distrito, T.clave, A.actividad, A.periodoinicia, A.periodofin,
            A.responsable, A.soporte, A.tipo_actividad, T.realizo, T.tipo,
            T.num_oficio AS oficio, T.descripcion AS detalle, A.especificaciones
     FROM sisecao_actividades_trabajo AS T
     INNER JOIN sisecao_catactividad AS A
       ON T.clave = A.clave AND T.ano = A.ano
     WHERE T.iddistrito = @idDistrito AND T.status = 1 AND A.status = 1
       AND T.mes = @mes AND T.ano = @anio
     ORDER BY T.clave`,
    {
      idDistrito: { type: sql.Int, value: idDistrito },
      mes:        { type: sql.Int, value: mesActivo },
      anio:       { type: sql.Int, value: anio },
    }
  )

  const wb = new ExcelJS.Workbook()
  const ws = wb.addWorksheet(`Distrito ${idDistrito}`)
  agregarEncabezadoInstitucional(ws, 'REPORTE MENSUAL DE ACTIVIDADES DESARROLLADAS', mesNombre, ` — DISTRITO ${idDistrito}`, 15)

  const headers = ['DISTRITO', 'ÁREA', 'CONSECUTIVO', 'CLAVE COMPLETA', 'ACTIVIDAD',
    'PERIODO INICIO', 'PERIODO TÉRMINO', 'RESPONSABLE', 'SOPORTE', 'TIPO ACTIVIDAD',
    'CUMPLIÓ', 'TIPO DOC / NÚMERO', 'RESUMEN', 'CAUSA NO CUMPLIMIENTO', 'ESPECIFICACIONES']
  const hRow = ws.addRow(headers)
  estiloEncabezado(ws, hRow)

  for (const row of result.recordset) {
    const partes = (row.clave ?? '').split('-')
    ws.addRow([
      row.distrito, partes[1] ?? '', partes[2] ?? '', row.clave,
      row.actividad, row.periodoinicia, row.periodofin,
      row.responsable, row.soporte, row.tipo_actividad,
      row.realizo,
      `${row.tipo ?? ''} ${row.oficio ?? ''}`.trim(),
      row.realizo === 'SI' ? row.detalle : '-',
      row.realizo !== 'SI' ? row.detalle : '-',
      row.especificaciones ?? '',
    ])
  }

  ws.columns.forEach(col => { col.width = 18 })
  return wb.xlsx.writeBuffer()
}

const generarPendientes = async ({ mes, anio, idDistrito }) => {
  const mesActivo = mes ?? await getMesActivo()
  const mesNombre = MESES_ES[mesActivo] ?? ''
  const params = {
    mes:  { type: sql.Int, value: mesActivo },
    anio: { type: sql.Int, value: anio },
  }
  if (idDistrito <= 33) params.idDistrito = { type: sql.Int, value: idDistrito }

  const result = await query(
    `SELECT DISTINCT 
            U.iddistrito AS distrito_falta,
            A.clave_dtos, A.clave_area, A.conse_clave, A.clave, A.actividad,
            A.periodoinicia, A.periodofin, A.responsable, A.soporte, A.tipo_actividad
     FROM (SELECT DISTINCT iddistrito FROM sisecao_usuarios WHERE iddistrito <> 99 AND status = 1) AS U
     CROSS JOIN sisecao_catactividad AS A
     WHERE A.status = 1 AND A.mes = @mes AND A.ano = @anio
       ${idDistrito <= 33 ? 'AND U.iddistrito = @idDistrito' : ''}
       AND NOT EXISTS (
         SELECT 1 FROM sisecao_actividades_trabajo AS T
         WHERE T.iddistrito = U.iddistrito AND T.id_actividad = A.id_actividad
       )
     ORDER BY U.iddistrito, A.clave`,
    params
  )

  const wb = new ExcelJS.Workbook()
  const ws = wb.addWorksheet('Actividades Pendientes')

  // Fila 2: Secretaria Ejecutiva
  ws.mergeCells(2, 4, 2, 9)
  const cellSecExec = ws.getCell('D2')
  cellSecExec.value = 'Secretaria Ejecutiva'
  cellSecExec.font = { name: 'Calibri', size: 14, bold: true }
  cellSecExec.alignment = { horizontal: 'center', vertical: 'middle' }

  // Fila 4: Dirección de Apoyo a Órganos Desconcentrados
  ws.mergeCells(4, 4, 4, 9)
  const cellDirApoyo = ws.getCell('D4')
  cellDirApoyo.value = 'Dirección de Apoyo a Órganos Desconcentrados'
  cellDirApoyo.font = { name: 'Calibri', size: 14, bold: true }
  cellDirApoyo.alignment = { horizontal: 'center', vertical: 'middle' }

  // Fila 5: REPORTE CENTRAL DE ACTIVIDADES PENDIENTES POR LOS ÓRGANOS DESCONCENTRADOS
  ws.mergeCells(5, 4, 5, 9)
  const cellTitle = ws.getCell('D5')
  cellTitle.value = 'REPORTE CENTRAL DE ACTIVIDADES PENDIENTES POR LOS ÓRGANOS DESCONCENTRADOS'
  cellTitle.font = { name: 'Calibri', size: 14, bold: true }
  cellTitle.alignment = { horizontal: 'center', vertical: 'middle' }

  // Fila 7: MES
  ws.mergeCells(7, 3, 7, 4)
  const cellMes = ws.getCell('C7')
  cellMes.value = `MES: ${mesNombre}`
  cellMes.font = { name: 'Calibri', size: 14, bold: true }
  cellMes.alignment = { horizontal: 'center', vertical: 'middle' }

  // Cabecera de la tabla en Fila 10
  const headers = [
    'DISTRITO QUE FALTA POR CAPTUROR', 'DISTRITO', 'AREA', 'CONSECUTIVO', 'CLAVE COMPLETA',
    'ACTIVIDAD', 'PERIODO DE INICIO', 'PERIO DE TERMINO', 'RESPONSABLE',
    'SOPORTE DE DOCUMENTO', 'TIPO DE ACTIVIDAD'
  ]
  const hRow = ws.getRow(10)
  headers.forEach((h, colIndex) => {
    const cell = hRow.getCell(colIndex + 1)
    cell.value = h
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'CCCCCC' } }
    cell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: '000000' } }
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true }
    cell.border = {
      top: { style: 'thin' },
      bottom: { style: 'thin' },
      left: { style: 'thin' },
      right: { style: 'thin' }
    }
  })
  hRow.height = 30

  const formatearFechaDMY = (fechaStr) => {
    if (!fechaStr) return ''
    const partes = fechaStr.split('T')[0].split('-')
    if (partes.length === 3) {
      return `${partes[2]}/${partes[1]}/${partes[0]}`
    }
    return fechaStr
  }

  // Insertar filas de datos
  result.recordset.forEach((row, index) => {
    const rRow = ws.getRow(11 + index)
    const values = [
      row.distrito_falta,
      row.clave_dtos,
      row.clave_area,
      row.conse_clave,
      row.clave,
      row.actividad,
      formatearFechaDMY(row.periodoinicia),
      formatearFechaDMY(row.periodofin),
      row.responsable,
      row.soporte,
      row.tipo_actividad
    ]

    values.forEach((val, colIndex) => {
      const cell = rRow.getCell(colIndex + 1)
      cell.value = val
      cell.font = { name: 'Calibri', size: 10 }
      cell.border = {
        top: { style: 'thin' },
        bottom: { style: 'thin' },
        left: { style: 'thin' },
        right: { style: 'thin' }
      }
      
      // Alineación
      if ([1, 2, 3, 4, 7, 8, 11].includes(colIndex + 1)) {
        cell.alignment = { horizontal: 'center', vertical: 'middle' }
      } else {
        cell.alignment = { horizontal: 'left', vertical: 'middle', wrapText: true }
      }

      // Claves completas formateadas como texto explícito
      if (colIndex + 1 === 5) {
        cell.numFmt = '@'
      }
    })
  })

  // Ancho de las columnas adaptado
  const colWidths = [32, 10, 10, 15, 18, 45, 18, 18, 25, 25, 15]
  colWidths.forEach((width, index) => {
    ws.getColumn(index + 1).width = width
  })

  return wb.xlsx.writeBuffer()
}


const getAvance = async ({ mes, anio, idDistrito }) => {
  const mesActivo = mes ?? await getMesActivo()
  
  // Total catalog activities for this month and year
  const catCountResult = await query(
    `SELECT COUNT(*) AS total FROM sisecao_catactividad WHERE status = 1 AND mes = @mes AND ano = @anio`,
    {
      mes:  { type: sql.Int, value: mesActivo },
      anio: { type: sql.Int, value: anio }
    }
  )
  const total = catCountResult.recordset[0]?.total ?? 0

  // Completed / Not completed count
  const statsResult = await query(
    `SELECT 
       SUM(CASE WHEN realizo != 'NO' THEN 1 ELSE 0 END) AS si,
       SUM(CASE WHEN realizo = 'NO' THEN 1 ELSE 0 END) AS no
     FROM sisecao_actividades_trabajo 
     WHERE status = 1 AND iddistrito = @idDistrito AND mes = @mes AND ano = @anio`,
    {
      idDistrito: { type: sql.Int, value: idDistrito },
      mes:        { type: sql.Int, value: mesActivo },
      anio:       { type: sql.Int, value: anio }
    }
  )
  
  const si = statsResult.recordset[0]?.si ?? 0
  const no = statsResult.recordset[0]?.no ?? 0
  const totalCaptured = si + no
  const noCap = Math.max(0, total - totalCaptured)

  return {
    distrito: idDistrito,
    mes: mesActivo,
    anio,
    total,
    si,
    no,
    noCap
  }
}

const generarHistorico = async ({ mesInicio, mesFin, anio, idDistrito }) => {
  const result = await query(
    `SELECT T.iddistrito AS distrito, T.clave, A.actividad, A.periodoinicia, A.periodofin,
            A.responsable, A.soporte, A.tipo_actividad, T.realizo, T.tipo,
            T.num_oficio AS oficio, T.descripcion AS detalle, A.mes, A.especificaciones
     FROM sisecao_actividades_trabajo AS T
     INNER JOIN sisecao_catactividad AS A
       ON T.clave = A.clave AND T.ano = A.ano AND T.mes = A.mes
     WHERE T.iddistrito = @idDistrito AND T.status = 1 AND A.status = 1
       AND T.mes BETWEEN @mesInicio AND @mesFin AND T.ano = @anio
     ORDER BY T.clave`,
    {
      idDistrito: { type: sql.Int, value: idDistrito },
      mesInicio:  { type: sql.Int, value: mesInicio },
      mesFin:     { type: sql.Int, value: mesFin },
      anio:       { type: sql.Int, value: anio },
    }
  )

  const wb = new ExcelJS.Workbook()
  const ws = wb.addWorksheet(`Histórico Distrito ${idDistrito}`)
  
  const mesInicioNombre = MESES_ES[mesInicio] ?? ''
  const mesFinNombre = MESES_ES[mesFin] ?? ''
  agregarEncabezadoInstitucional(
    ws, 
    'REPORTE MENSUAL DE ACTIVIDADES DESARROLLADAS', 
    `${mesInicioNombre} A ${mesFinNombre}`, 
    ` — DISTRITO ${idDistrito}`,
    18
  )

  const headers = ['DISTRITO QUE CAPTURÓ', 'DISTRITO', 'ÁREA', 'CONSECUTIVO', 'CLAVE COMPLETA', 'ACTIVIDAD',
    'PERIODO DE INICIO', 'PERIODO DE TÉRMINO', 'RESPONSABLE', 'SOPORTE DE DOCUMENTO', 'TIPO DE ACTIVIDAD',
    'CUMPLIÓ', 'DOCUMENTO DE SOPORTE', 'RESUMEN CONCRETO', 'CAUSA NO CUMPLIMIENTO', 'MES', 'AÑO', 'ESPECIFICACIONES']
  const hRow = ws.addRow(headers)
  estiloEncabezado(ws, hRow)

  for (const row of result.recordset) {
    const partes = (row.clave ?? '').split('-')
    ws.addRow([
      row.distrito, row.distrito, partes[1] ?? '', partes[2] ?? '', row.clave,
      row.actividad, row.periodoinicia, row.periodofin,
      row.responsable, row.soporte, row.tipo_actividad,
      row.realizo,
      `${row.tipo ?? ''} ${row.oficio ?? ''}`.trim(),
      row.realizo === 'SI' ? row.detalle : '-',
      row.realizo !== 'SI' ? row.detalle : '-',
      MESES_ES[row.mes] ?? '',
      anio,
      row.especificaciones ?? '',
    ])
  }

  ws.columns.forEach(col => { col.width = 18 })
  return wb.xlsx.writeBuffer()
}

const getAvanceDistritos = async () => {
  // Total actividades del catálogo activas
  const catCountResult = await query(
    `SELECT COUNT(*) AS total FROM sisecao_catactividad WHERE status = 1`
  )
  const totalCat = catCountResult.recordset[0]?.total ?? 0

  // Avance agrupado por distrito
  const result = await query(
    `SELECT iddistrito, 
            SUM(CASE WHEN realizo != 'NO' THEN 1 ELSE 0 END) AS si, 
            SUM(CASE WHEN realizo = 'NO' THEN 1 ELSE 0 END) AS no 
     FROM sisecao_actividades_trabajo 
     WHERE status = 1
     GROUP BY iddistrito 
     ORDER BY iddistrito ASC`
  )

  return result.recordset.map(row => {
    const totalCapturado = (row.si ?? 0) + (row.no ?? 0)
    const noCap = Math.max(0, totalCat - totalCapturado)
    return {
      distrito: row.distrito || row.iddistrito,
      si: row.si ?? 0,
      no: row.no ?? 0,
      noCap
    }
  })
}

const getAvanceActividades = async () => {
  const result = await query(
    `SELECT clave, 
            SUM(CASE WHEN realizo != 'NO' THEN 1 ELSE 0 END) AS si, 
            SUM(CASE WHEN realizo = 'NO' THEN 1 ELSE 0 END) AS no 
     FROM sisecao_actividades_trabajo 
     WHERE status = 1
     GROUP BY clave 
     ORDER BY clave ASC`
  )
  return result.recordset.map(row => ({
    clave: row.clave,
    si: row.si ?? 0,
    no: row.no ?? 0
  }))
}

// Función auxiliar local para evitar duplicación
const getMesActiveNum = async () => {
  const now = new Date().toISOString().slice(0, 19).replace('T', ' ')
  const r = await query(
    `SELECT TOP 1 mes FROM sisecao_settings WHERE @n BETWEEN fecha_inicio AND fecha_fin`,
    { n: { type: sql.VarChar(20), value: now } }
  )
  return r.recordset[0]?.mes ?? new Date().getMonth() + 1
}

const getAvanceGrafica = async ({ anio, distrito, perfil, clave }) => {
  const complemento1 = (distrito && distrito !== 'todos' ? ' AND iddistrito = @distrito' : '')
  const complemento2 = (perfil === 4 ? ' AND SUBSTRING(A.clave, 4, 2) = @clave' : '')

  const params = {
    anio: { type: sql.Int, value: parseInt(anio) }
  }
  if (distrito && distrito !== 'todos') {
    params.distrito = { type: sql.Int, value: parseInt(distrito) }
  }
  if (perfil === 4) {
    params.clave = { type: sql.VarChar(10), value: clave }
  }

  // 1. Obtener Distritos
  const distritosResult = await query(
    `SELECT DISTINCT iddistrito AS distrito FROM sisecao_usuarios WHERE iddistrito NOT IN (99)${complemento1}`,
    params
  )
  const distritos = distritosResult.recordset.map(r => r.distrito)

  // 2. Obtener los Meses (1 a 12)
  const meses = Array.from({ length: 12 }, (_, i) => i + 1)

  // 3. Obtener el catálogo de actividades
  // 3. Obtener el catálogo de actividades (Filtro dinámico: usa status=1 si existe, si no, usa status=0 para años archivados)
  const catalogoResult = await query(
    `SELECT clave, mes FROM sisecao_catactividad A 
     WHERE ano = @anio AND status = (SELECT MAX(status) FROM sisecao_catactividad WHERE ano = @anio)
     ${complemento2}`,
    params
  )
  const catalogo = catalogoResult.recordset

  // 4. Obtener las actividades registradas (avance)
  const avanceResult = await query(
    `SELECT A.iddistrito AS distrito, CAST(A.mes AS INT) AS mes, COUNT(*) AS actReg
     FROM sisecao_catactividad C
     LEFT JOIN sisecao_actividades_trabajo A ON C.clave = A.clave AND C.mes = A.mes
     WHERE C.ano = @anio AND A.ano = @anio 
       AND C.status = (SELECT MAX(status) FROM sisecao_catactividad WHERE ano = @anio)
       ${complemento2}
     GROUP BY A.iddistrito, A.mes`,
    params
  )
  const avances = avanceResult.recordset

  // 5. Agrupar y mapear
  const MESES_ES = ['', 'ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO',
    'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE']

  const jsonResponse = distritos.map(dist => {
    const mesesData = meses.map(m => {
      // Total planeado para este mes
      const actTotal = catalogo.filter(c => c.mes === m).length
      // Registrado por este distrito en este mes
      const avanceRow = avances.find(a => a.distrito === dist && a.mes === m)
      const actReg = avanceRow ? avanceRow.actReg : 0

      return {
        mes: MESES_ES[m] || '',
        actTotal,
        actReg
      }
    })

    return {
      distrito: dist, // Solo el número para mapeo en UI
      meses: mesesData
    }
  })

  return jsonResponse
}

const generarAvanceDistritosExcel = async ({ mes, anio, perfil, clave }) => {
  const mesActivo = mes ?? await getMesActiveNum()
  const mesNombre = MESES_ES[mesActivo] ?? ''
  const porArea = perfil === 4 ? ` AND SUBSTRING(clave, 4, 2) = @clave` : ''
  const params = {
    mes:  { type: sql.Int, value: mesActivo },
    anio: { type: sql.Int, value: anio }
  }
  if (perfil === 4) params.clave = { type: sql.VarChar(10), value: clave }

  // Total actividades del catálogo activas para este mes y año
  const catCountResult = await query(
    `SELECT COUNT(*) AS total FROM sisecao_catactividad WHERE status = 1 AND mes = @mes AND ano = @anio${porArea}`,
    params
  )
  const totalCat = catCountResult.recordset[0]?.total ?? 0

  // Avance agrupado por distrito
  const result = await query(
    `SELECT iddistrito, 
            SUM(CASE WHEN realizo != 'NO' THEN 1 ELSE 0 END) AS si, 
            SUM(CASE WHEN realizo = 'NO' THEN 1 ELSE 0 END) AS no 
     FROM sisecao_actividades_trabajo 
     WHERE status = 1 AND mes = @mes AND ano = @anio${porArea}
     GROUP BY iddistrito 
     ORDER BY iddistrito ASC`,
    params
  )

  const wb = new ExcelJS.Workbook()
  const ws = wb.addWorksheet('Avance por Distrito')
  
  // Agregar encabezados institucionales calco de la evidencia
  ws.getCell('F1').value = 'Secretaria Ejecutiva'
  ws.getCell('F1').font = { bold: true, size: 11, name: 'Calibri' }
  ws.getCell('F1').alignment = { horizontal: 'right' }
  
  ws.getCell('F3').value = 'Dirección de Apoyo a Órganos Desconcentrados'
  ws.getCell('F3').font = { bold: true, size: 11, name: 'Calibri' }
  ws.getCell('F3').alignment = { horizontal: 'right' }

  ws.getCell('F4').value = 'NÚMERO DE ACTIVIDADES REALIZADAS POR DISTRITO'
  ws.getCell('F4').font = { bold: true, size: 11, name: 'Calibri' }
  ws.getCell('F4').alignment = { horizontal: 'right' }

  ws.getCell('C5').value = `MES: ${mesNombre}`
  ws.getCell('C5').font = { bold: true, size: 11, name: 'Calibri' }
  ws.getCell('C5').alignment = { horizontal: 'center' }

  // Fila 8: Encabezados de Tabla con fondo gris #CCCCCC y bordes finos
  const headers = ['DISTRITO', 'ACTIVIDADES REALIZADAS', 'ACTIVIDADES NO REALIZADAS', 'NO CAPTURADAS']
  const hRow = ws.insertRow(8, headers)
  
  hRow.eachCell(cell => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFCCCCCC' } }
    cell.font = { bold: true, size: 10, name: 'Calibri' }
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true }
    cell.border = { 
      top: { style: 'thin' }, 
      bottom: { style: 'thin' }, 
      left: { style: 'thin' }, 
      right: { style: 'thin' } 
    }
  })
  ws.getRow(8).height = 20

  for (const row of result.recordset) {
    const si = row.si ?? 0
    const no = row.no ?? 0
    const suma = si + no
    const noCap = Math.max(0, totalCat - suma)
    
    const r = ws.addRow([row.iddistrito, si, no, noCap])
    r.eachCell(cell => {
      cell.font = { size: 10, name: 'Calibri' }
    })
  }

  ws.columns.forEach(col => { col.width = 25 })
  return wb.xlsx.writeBuffer()
}

const generarAvanceActividadesExcel = async ({ mes, anio, perfil, clave }) => {
  const mesActive = mes ?? await getMesActiveNum()
  const mesNombre = MESES_ES[mesActive] ?? ''
  const porArea = perfil === 4 ? ` AND SUBSTRING(clave, 4, 2) = @clave` : ''
  const params = {
    mes:  { type: sql.Int, value: mesActive },
    anio: { type: sql.Int, value: anio }
  }
  if (perfil === 4) params.clave = { type: sql.VarChar(10), value: clave }

  const result = await query(
    `SELECT clave, 
            SUM(CASE WHEN realizo != 'NO' THEN 1 ELSE 0 END) AS si, 
            SUM(CASE WHEN realizo = 'NO' THEN 1 ELSE 0 END) AS no 
     FROM sisecao_actividades_trabajo 
     WHERE status = 1 AND mes = @mes AND ano = @anio${porArea}
     GROUP BY clave 
     ORDER BY clave ASC`,
    params
  )

  const wb = new ExcelJS.Workbook()
  const ws = wb.addWorksheet('Avance por Actividad')

  // Agregar encabezados institucionales calco de la evidencia
  ws.getCell('F1').value = 'Secretaria Ejecutiva'
  ws.getCell('F1').font = { bold: true, size: 11, name: 'Calibri' }
  ws.getCell('F1').alignment = { horizontal: 'right' }
  
  ws.getCell('F3').value = 'Dirección de Apoyo a Órganos Desconcentrados'
  ws.getCell('F3').font = { bold: true, size: 11, name: 'Calibri' }
  ws.getCell('F3').alignment = { horizontal: 'right' }

  ws.getCell('F4').value = 'NÚMERO DE ACTIVIDADES REALIZADAS POR DISTRITO'
  ws.getCell('F4').font = { bold: true, size: 11, name: 'Calibri' }
  ws.getCell('F4').alignment = { horizontal: 'right' }

  // Fila 8: Encabezados de Tabla con fondo gris #CCCCCC y bordes finos
  const headers = ['CLAVE DE ACTIVIDAD', 'CUÁNTOS SI', 'CUÁNTOS NO']
  const hRow = ws.insertRow(8, headers)
  
  hRow.eachCell(cell => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFCCCCCC' } }
    cell.font = { bold: true, size: 10, name: 'Calibri' }
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true }
    cell.border = { 
      top: { style: 'thin' }, 
      bottom: { style: 'thin' }, 
      left: { style: 'thin' }, 
      right: { style: 'thin' } 
    }
  })
  ws.getRow(8).height = 20

  for (const row of result.recordset) {
    const r = ws.addRow([row.clave, row.si ?? 0, row.no ?? 0])
    r.eachCell(cell => {
      cell.font = { size: 10, name: 'Calibri' }
    })
    // Establecer formato de texto para la celda de la clave de actividad
    r.getCell(1).numFmt = '@'
  }

  ws.columns.forEach(col => { col.width = 25 })
  return wb.xlsx.writeBuffer()
}

const generarACapturar = async ({ mes, anio, idDistrito }) => {
  const mesActivo = mes ?? await getMesActivo()
  const mesNombre = MESES_ES[mesActivo] ?? ''
  const params = {
    mes:  { type: sql.Int, value: mesActivo },
    anio: { type: sql.Int, value: anio },
  }

  const result = await query(
    `SELECT A.clave_dtos, A.clave_area, A.conse_clave, A.clave, A.actividad,
            A.periodoinicia, A.periodofin, A.responsable, A.soporte,
            A.tipo_actividad, A.especificaciones
     FROM sisecao_catactividad AS A
     WHERE A.status = 1 AND A.mes = @mes AND A.ano = @anio
     ORDER BY A.clave`,
    params
  )

  const wb = new ExcelJS.Workbook()
  const ws = wb.addWorksheet('Actividades a Capturar')

  // Fila 2: Secretaria Ejecutiva
  ws.mergeCells(2, 4, 2, 9)
  const cellSecExec = ws.getCell('D2')
  cellSecExec.value = 'Secretaria Ejecutiva'
  cellSecExec.font = { name: 'Calibri', size: 14, bold: true }
  cellSecExec.alignment = { horizontal: 'center', vertical: 'middle' }

  // Fila 4: Dirección de Apoyo a Órganos Desconcentrados
  ws.mergeCells(4, 4, 4, 9)
  const cellDirApoyo = ws.getCell('D4')
  cellDirApoyo.value = 'Dirección de Apoyo a Órganos Desconcentrados'
  cellDirApoyo.font = { name: 'Calibri', size: 14, bold: true }
  cellDirApoyo.alignment = { horizontal: 'center', vertical: 'middle' }

  // Fila 5: REPORTE MENSUAL DE ACTIVIDADES A CAPTURAR POR LOS ÓRGANOS DESCONCENTRADOS
  ws.mergeCells(5, 4, 5, 9)
  const cellTitle = ws.getCell('D5')
  cellTitle.value = 'REPORTE MENSUAL DE ACTIVIDADES A CAPTURAR POR LOS ÓRGANOS DESCONCENTRADOS'
  cellTitle.font = { name: 'Calibri', size: 14, bold: true }
  cellTitle.alignment = { horizontal: 'center', vertical: 'middle' }

  // Fila 7: DISTRITO y MES
  ws.mergeCells(7, 3, 7, 4)
  const cellDistrito = ws.getCell('C7')
  cellDistrito.value = `DISTRITO: ${idDistrito <= 33 ? idDistrito : '33 ÓRGANOS'}`
  cellDistrito.font = { name: 'Calibri', size: 14, bold: true }
  cellDistrito.alignment = { horizontal: 'center', vertical: 'middle' }

  ws.mergeCells(7, 7, 7, 8)
  const cellMes = ws.getCell('G7')
  cellMes.value = `MES: ${mesNombre}`
  cellMes.font = { name: 'Calibri', size: 14, bold: true }
  cellMes.alignment = { horizontal: 'center', vertical: 'middle' }

  // Cabecera de la tabla en Fila 10
  const headers = [
    'DISTRITO', 'AREA', 'CONSECUTIVO', 'CLAVE COMPLETA', 'ACTIVIDAD',
    'PERIODO DE INICIO', 'PERIODO DE TERMINO', 'RESPONSABLE',
    'SOPORTE DE DOCUMENTO', 'TIPO DE ACTIVIDAD', 'ESPECIFICACIONES'
  ]
  const hRow = ws.getRow(10)
  headers.forEach((h, colIndex) => {
    const cell = hRow.getCell(colIndex + 1)
    cell.value = h
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'CCCCCC' } }
    cell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: '000000' } }
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true }
    cell.border = {
      top: { style: 'thin' },
      bottom: { style: 'thin' },
      left: { style: 'thin' },
      right: { style: 'thin' }
    }
  })
  hRow.height = 30

  const formatearFechaDMY = (fechaStr) => {
    if (!fechaStr) return ''
    const partes = fechaStr.split('T')[0].split('-')
    if (partes.length === 3) {
      return `${partes[2]}/${partes[1]}/${partes[0]}`
    }
    return fechaStr
  }

  // Insertar filas de datos
  result.recordset.forEach((row, index) => {
    const rRow = ws.getRow(11 + index)
    const values = [
      row.clave_dtos,
      row.clave_area,
      row.conse_clave,
      row.clave,
      row.actividad,
      formatearFechaDMY(row.periodoinicia),
      formatearFechaDMY(row.periodofin),
      row.responsable,
      row.soporte,
      row.tipo_actividad,
      row.especificaciones
    ]

    values.forEach((val, colIndex) => {
      const cell = rRow.getCell(colIndex + 1)
      cell.value = val
      cell.font = { name: 'Calibri', size: 10 }
      cell.border = {
        top: { style: 'thin' },
        bottom: { style: 'thin' },
        left: { style: 'thin' },
        right: { style: 'thin' }
      }
      
      // Alineación
      if ([1, 2, 3, 6, 7, 10].includes(colIndex + 1)) {
        cell.alignment = { horizontal: 'center', vertical: 'middle' }
      } else {
        cell.alignment = { horizontal: 'left', vertical: 'middle', wrapText: true }
      }

      // Claves completas formateadas como texto explícito
      if (colIndex + 1 === 4) {
        cell.numFmt = '@'
      }
    })
  })

  // Ancho de las columnas adaptado
  const colWidths = [12, 10, 15, 18, 45, 16, 16, 25, 25, 15, 45]
  colWidths.forEach((width, index) => {
    ws.getColumn(index + 1).width = width
  })

  return wb.xlsx.writeBuffer()
}

module.exports = { 
  reportesService: { 
    generarCentral, 
    generarDistrito, 
    generarPendientes, 
    getAvance, 
    generarHistorico,
    getAvanceDistritos,
    getAvanceActividades,
    getAvanceGrafica,
    generarAvanceDistritosExcel,
    generarAvanceActividadesExcel,
    generarACapturar
  } 
}
