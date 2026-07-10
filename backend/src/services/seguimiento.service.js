const { query, sql } = require('../config/database')
const { buildPeriodoActivo } = require('../utils/periodo')

const getPeriodoDesdeDB = async () => {
  const now = new Date().toISOString().slice(0, 19).replace('T', ' ')
  const result = await query(
    `SELECT TOP 1 mes, ano, fecha_inicio, fecha_fin
     FROM sisecao_settings
     WHERE @fechaActual BETWEEN fecha_inicio AND fecha_fin AND status = 1`,
    { fechaActual: { type: sql.VarChar(20), value: now } }
  )
  return buildPeriodoActivo(result.recordset[0] ?? null)
}

const buildFiltros = ({ perfil, idDistrito, clave }) => {
  const porDistrito = idDistrito <= 33 ? ` AND b.iddistrito = @idDistrito` : ''
  const porArea = perfil === 4 ? ` AND SUBSTRING(a.clave, 4, 2) = @clave` : ''
  return { porDistrito, porArea }
}

const getAll = async ({ perfil, idDistrito, clave }) => {
  const { porDistrito, porArea } = buildFiltros({ perfil, idDistrito, clave })
  const params = { status: { type: sql.Int, value: 1 } }
  if (idDistrito <= 33) params.idDistrito = { type: sql.Int, value: idDistrito }
  if (perfil === 4)     params.clave      = { type: sql.VarChar(10), value: clave }

  const result = await query(
    `SELECT a.id_actividad, a.clave, a.actividad, a.mes, a.soporte,
            b.realizo, b.iddistrito AS idDistrito, b.tipo, b.num_oficio,
            b.descripcion, b.fecha_cumplio, b.mes AS mes_trabajo, b.ano
     FROM sisecao_catactividad AS a
     LEFT JOIN sisecao_actividades_trabajo AS b
       ON a.id_actividad = b.id_actividad${porDistrito}
     WHERE a.status = @status${porArea}
     ORDER BY a.clave`,
    params
  )
  return result.recordset
}

const getById = async (idActividad, { perfil, idDistrito, clave }) => {
  const { porDistrito, porArea } = buildFiltros({ perfil, idDistrito, clave })
  const params = {
    idActividad: { type: sql.Int, value: idActividad },
    status:      { type: sql.Int, value: 1 },
  }
  if (idDistrito <= 33) params.idDistrito = { type: sql.Int, value: idDistrito }
  if (perfil === 4)     params.clave      = { type: sql.VarChar(10), value: clave }

  const result = await query(
    `SELECT a.id_actividad, a.clave, a.actividad, a.periodoinicia, a.periodofin,
            a.tipo_actividad, a.soporte, a.responsable, a.numero,
            b.iddistrito, b.tipo, b.num_oficio, b.descripcion, b.realizo,
            b.fecha_cumplio, b.mes, b.ano
     FROM sisecao_catactividad AS a
     LEFT JOIN sisecao_actividades_trabajo AS b
       ON a.id_actividad = b.id_actividad${porDistrito}
     WHERE a.id_actividad = @idActividad AND a.status = @status${porArea}`,
    params
  )
  return result.recordset[0] ?? null
}

const save = async (body, idUsuario, idDistritoFromToken, perfil) => {
  // 1. Validaciones Iniciales de Perfil
  if (perfil !== 3 && perfil !== 1) {
    throw Object.assign(new Error('No autorizado'), { status: 403, expose: true })
  }

  const { idActividad, realizo, tipoDocumento, numeroDocumento, fechaCumplimiento, observacion, idDistrito: bodyDistrito } = body

  // Si es perfil 1, puede pasar el idDistrito en el body, de lo contrario usamos el del token
  const idDistrito = (perfil === 1 && bodyDistrito !== undefined && bodyDistrito !== null) ? parseInt(bodyDistrito) : idDistritoFromToken

  // Validaciones de Estructura según realizo (SI / NO)
  if (realizo === 'SI') {
    if (!tipoDocumento || !tipoDocumento.trim() || !numeroDocumento || !numeroDocumento.trim() || !fechaCumplimiento || !fechaCumplimiento.trim()) {
      throw Object.assign(new Error('Campos de soporte requeridos si la actividad se realizó'), { status: 400, expose: true })
    }
  } else if (realizo === 'NO') {
    if (!observacion || !observacion.trim()) {
      throw Object.assign(new Error('La justificación de incumplimiento es obligatoria si no se realizó la actividad'), { status: 400, expose: true })
    }
  } else {
    throw Object.assign(new Error('El valor de realizo debe ser SI o NO'), { status: 400, expose: true })
  }

  // 2. Validación Temporal de Periodos (Regla de Bloqueo Crítica)
  const periodo = await getPeriodoDesdeDB()
  if (!periodo.sistemaAbierto) {
    throw Object.assign(new Error('El periodo de captura se encuentra cerrado en esta fecha'), { status: 403, expose: true })
  }
  // const mes = periodo.mesActivo // Obsoleto: se toma de la actividad real
  // const anio = periodo.anio     // Obsoleto: se toma de la actividad real

  // 3. Recuperación de la clave y periodo de catálogo original
  const claveResult = await query(
    `SELECT clave, mes, ano FROM sisecao_catactividad WHERE id_actividad = @idActividad AND status = 1`,
    { idActividad: { type: sql.Int, value: idActividad } }
  )
  if (!claveResult.recordset.length) {
    throw Object.assign(new Error('Actividad no encontrada en el catálogo activo'), { status: 404, expose: true })
  }
  const { clave, mes, ano: anio } = claveResult.recordset[0]

  // 4. Inserción o Actualización Condicionada (Upsert)
  const countResult = await query(
    `SELECT COUNT(*) AS total FROM sisecao_actividades_trabajo
     WHERE id_actividad = @idActividad AND iddistrito = @idDistrito`,
    {
      idActividad: { type: sql.Int, value: idActividad },
      idDistrito:  { type: sql.Int, value: idDistrito },
    }
  )
  const existe = countResult.recordset[0].total > 0

  const fechaHoy = new Date().toISOString().slice(0, 10)
  const tipo      = tipoDocumento   ?? ''
  const oficio    = numeroDocumento ?? ''
  const fechaCump = fechaCumplimiento ?? ''
  const desc      = observacion     ?? ''

  if (!existe) {
    // Registro Inicial
    await query(
      `INSERT INTO sisecao_actividades_trabajo
         (id_actividad, clave, iddistrito, tipo, num_oficio, descripcion,
          realizo, fecha_cumplio, fecha_alta, usr_alta, status, mes, ano)
       VALUES
         (@idActividad, @clave, @idDistrito, @tipo, @oficio, @desc,
          @realizo, @fechaCump, @fechaAlta, @idUsuario, 1, @mes, @anio)`,
      {
        idActividad:  { type: sql.Int,          value: idActividad },
        clave:        { type: sql.VarChar(20),  value: clave },
        idDistrito:   { type: sql.Int,          value: idDistrito },
        tipo:         { type: sql.VarChar(20),  value: tipo },
        oficio:       { type: sql.VarChar(100), value: oficio },
        desc:         { type: sql.NVarChar(sql.MAX), value: desc },
        realizo:      { type: sql.VarChar(3),   value: realizo },
        fechaCump:    { type: sql.VarChar(20),  value: fechaCump },
        fechaAlta:    { type: sql.VarChar(20),  value: fechaHoy },
        idUsuario:    { type: sql.Int,          value: idUsuario },
        mes:          { type: sql.Int,          value: mes },
        anio:         { type: sql.Int,          value: anio },
      }
    )
    return { mensaje: 'Registro de avance creado exitosamente' }
  } else {
    // Modificación de Avance Existente
    await query(
      `UPDATE sisecao_actividades_trabajo
       SET tipo = @tipo, num_oficio = @oficio, descripcion = @desc,
           realizo = @realizo, fecha_cumplio = @fechaCump,
           fecha_modif = @fechaModif, usr_alta = @idUsuario
       WHERE id_actividad = @idActividad AND iddistrito = @idDistrito`,
      {
        idActividad: { type: sql.Int,          value: idActividad },
        idDistrito:  { type: sql.Int,          value: idDistrito },
        tipo:        { type: sql.VarChar(20),  value: tipo },
        oficio:      { type: sql.VarChar(100), value: oficio },
        desc:        { type: sql.NVarChar(sql.MAX), value: desc },
        realizo:     { type: sql.VarChar(3),   value: realizo },
        fechaCump:   { type: sql.VarChar(20),  value: fechaCump },
        fechaModif:  { type: sql.VarChar(20),  value: fechaHoy },
        idUsuario:   { type: sql.Int,          value: idUsuario },
      }
    )
    return { mensaje: 'Registro de avance actualizado exitosamente' }
  }
}

module.exports = { seguimientoService: { getAll, getById, save } }
