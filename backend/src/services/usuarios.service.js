const { query, sql } = require('../config/database')
const bcrypt = require('bcryptjs')

/**
 * Resuelve los campos clave, iddistrito e id_unidad según el perfil:
 *   perfil 3 → iddistrito requerido, id_unidad = NULL
 *   perfil 4 → id_unidad requerido, clave copiada de sisecao_unidades, iddistrito = NULL
 *   cualquier otro → ambos NULL, clave manual opcional
 */
const resolverCamposPorPerfil = async (perfil, { iddistrito, id_unidad, clave }) => {
  const p = parseInt(perfil)

  if (p === 3) {
    if (!iddistrito || parseInt(iddistrito) < 1 || parseInt(iddistrito) > 33) {
      const err = new Error('Se requiere un distrito válido (1-33) para el perfil Capturista Distrital')
      err.status = 400; err.expose = true
      throw err
    }
    return { clave: clave || '', iddistrito: parseInt(iddistrito), id_unidad: null }
  }

  if (p === 4) {
    if (!id_unidad) {
      const err = new Error('Se requiere seleccionar una unidad para el perfil Área Específica')
      err.status = 400; err.expose = true
      throw err
    }
    // Copiar la clave desde la unidad seleccionada (fuente de verdad)
    const res = await query(
      `SELECT clave FROM sisecao_unidades WHERE id_unidad = @id_unidad AND status = 1`,
      { id_unidad: { type: sql.Int, value: parseInt(id_unidad) } }
    )
    if (!res.recordset.length) {
      const err = new Error('La unidad seleccionada no existe o está inactiva')
      err.status = 400; err.expose = true
      throw err
    }
    return { clave: res.recordset[0].clave, iddistrito: null, id_unidad: parseInt(id_unidad) }
  }

  // Perfiles 1, 2, 5 → ambos NULL
  return { clave: clave || '', iddistrito: null, id_unidad: null }
}

const getAll = async () => {
  const result = await query(
    `SELECT u.id_usuario, u.nombre, u.usuario, u.clave, u.perfil,
            u.iddistrito, u.id_unidad,
            un.nombre AS nombre_unidad
     FROM sisecao_usuarios u
     LEFT JOIN sisecao_unidades un ON u.id_unidad = un.id_unidad
     ORDER BY u.nombre ASC`
  )
  return result.recordset
}

const create = async (body) => {
  const { nombre, usuario, contrasena, perfil } = body
  const hashedPassword = await bcrypt.hash(contrasena, 10)

  const { clave, iddistrito, id_unidad } = await resolverCamposPorPerfil(perfil, body)

  const result = await query(
    `INSERT INTO sisecao_usuarios (nombre, usuario, contrasena, clave, perfil, iddistrito, id_unidad)
     OUTPUT INSERTED.id_usuario
     VALUES (@nombre, @usuario, @contrasena, @clave, @perfil, @iddistrito, @id_unidad)`,
    {
      nombre:     { type: sql.NVarChar(100), value: nombre },
      usuario:    { type: sql.VarChar(100),  value: usuario },
      contrasena: { type: sql.VarChar(100),  value: hashedPassword },
      clave:      { type: sql.VarChar(50),   value: clave },
      perfil:     { type: sql.Int,           value: parseInt(perfil) },
      iddistrito: { type: sql.Int,           value: iddistrito },
      id_unidad:  { type: sql.Int,           value: id_unidad },
    }
  )
  return { id_usuario: result.recordset[0].id_usuario }
}

const update = async (id, body) => {
  const { nombre, usuario, contrasena, perfil } = body

  const { clave, iddistrito, id_unidad } = await resolverCamposPorPerfil(perfil, body)

  let contrasenaQuery = ''
  const params = {
    id:         { type: sql.Int,           value: parseInt(id) },
    nombre:     { type: sql.NVarChar(100), value: nombre },
    usuario:    { type: sql.VarChar(100),  value: usuario },
    clave:      { type: sql.VarChar(50),   value: clave },
    perfil:     { type: sql.Int,           value: parseInt(perfil) },
    iddistrito: { type: sql.Int,           value: iddistrito },
    id_unidad:  { type: sql.Int,           value: id_unidad },
  }

  if (contrasena && contrasena.trim() !== '') {
    const hashedPassword = await bcrypt.hash(contrasena, 10)
    contrasenaQuery = ', contrasena = @contrasena'
    params.contrasena = { type: sql.VarChar(100), value: hashedPassword }
  }

  await query(
    `UPDATE sisecao_usuarios
     SET nombre = @nombre, usuario = @usuario, clave = @clave,
         perfil = @perfil, iddistrito = @iddistrito, id_unidad = @id_unidad${contrasenaQuery}
     WHERE id_usuario = @id`,
    params
  )
}

const remove = async (id) => {
  await query(
    `DELETE FROM sisecao_usuarios WHERE id_usuario = @id`,
    { id: { type: sql.Int, value: parseInt(id) } }
  )
}

module.exports = {
  usuariosService: { getAll, create, update, remove }
}
