const { query, sql, getPool } = require('../config/database')

const getAll = async () => {
  const result = await query(
    `SELECT id_unidad, nombre, clave, status,
            CONVERT(VARCHAR(10), fecha_alta, 120)    AS fecha_alta,
            CONVERT(VARCHAR(10), fecha_modifi, 120)  AS fecha_modifi
     FROM sisecao_unidades
     ORDER BY nombre ASC`
  )
  return result.recordset
}

const getActivas = async () => {
  const result = await query(
    `SELECT id_unidad, nombre, clave
     FROM sisecao_unidades
     WHERE status = 1
     ORDER BY nombre ASC`
  )
  return result.recordset
}

const create = async ({ nombre, clave }) => {
  const result = await query(
    `INSERT INTO sisecao_unidades (nombre, clave, status, fecha_alta, fecha_modifi)
     OUTPUT INSERTED.id_unidad
     VALUES (@nombre, @clave, 1, GETDATE(), GETDATE())`,
    {
      nombre: { type: sql.NVarChar(100), value: nombre },
      clave:  { type: sql.VarChar(20),  value: clave  },
    }
  )
  return { id_unidad: result.recordset[0].id_unidad }
}

const update = async (id, { nombre, clave, status }) => {
  const pool = getPool()
  const transaction = new sql.Transaction(pool)
  await transaction.begin()
  try {
    // 1. Actualizar la unidad (fecha_modifi EXPLÍCITO — el DEFAULT no se aplica en UPDATE)
    const reqUnidad = new sql.Request(transaction)
    reqUnidad.input('id',     sql.Int,          parseInt(id))
    reqUnidad.input('nombre', sql.NVarChar(100), nombre)
    reqUnidad.input('clave',  sql.VarChar(20),   clave)
    reqUnidad.input('status', sql.Int,           parseInt(status))
    await reqUnidad.query(`
      UPDATE sisecao_unidades
      SET nombre = @nombre, clave = @clave, status = @status,
          fecha_modifi = GETDATE()
      WHERE id_unidad = @id
    `)

    // 2. Cascada: propagar la nueva clave a todos los usuarios de esta unidad
    //    (evita desincronización silenciosa con el filtro SUBSTRING de catalogo.service.js)
    const reqCascada = new sql.Request(transaction)
    reqCascada.input('clave', sql.VarChar(20), clave)
    reqCascada.input('id',    sql.Int,         parseInt(id))
    await reqCascada.query(`
      UPDATE sisecao_usuarios
      SET clave = @clave
      WHERE id_unidad = @id
    `)

    await transaction.commit()
  } catch (err) {
    await transaction.rollback()
    throw err
  }
}

module.exports = {
  unidadesService: { getAll, getActivas, create, update }
}
