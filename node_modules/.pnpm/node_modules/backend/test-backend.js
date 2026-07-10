const { connectDb, query, sql } = require('./src/config/database')
const { unidadesService } = require('./src/services/unidades.service')
const { usuariosService } = require('./src/services/usuarios.service')

async function runTest() {
  try {
    await connectDb()
    console.log('✅ Conectado a BD')

    // 1. Crear Unidad de Prueba
    const unidad = await unidadesService.create({ nombre: 'Unidad Test Cascada', clave: 'U1' })
    const idUnidad = unidad.id_unidad
    console.log('✅ Unidad creada con ID:', idUnidad, 'y clave: U1')

    // 2. Crear Usuario Perfil 4 asignado a esta Unidad
    const user = await usuariosService.create({
      nombre: 'Usr Test Cascada',
      usuario: 't_cascada',
      contrasena: '123456',
      perfil: 4,
      id_unidad: idUnidad
    })
    const idUsuario = user.id_usuario
    console.log('✅ Usuario creado con ID:', idUsuario)

    // 3. Verificar clave actual del usuario en BD
    let res = await query(`SELECT clave, iddistrito, id_unidad FROM sisecao_usuarios WHERE id_usuario = @id`, { id: { type: sql.Int, value: idUsuario } })
    console.log('🔍 Estado inicial del usuario:', res.recordset[0])
    if (res.recordset[0].clave !== 'U1') throw new Error('La clave inicial no coincide')
    if (res.recordset[0].iddistrito !== null) throw new Error('iddistrito no es NULL')

    // 3b. Probar crear un perfil 3
    const user3 = await usuariosService.create({
      nombre: 'Usr Test Dist',
      usuario: 't_dist',
      contrasena: '123456',
      perfil: 3,
      iddistrito: 5
    })
    const idUsuario3 = user3.id_usuario
    let res3 = await query(`SELECT clave, iddistrito, id_unidad FROM sisecao_usuarios WHERE id_usuario = @id`, { id: { type: sql.Int, value: idUsuario3 } })
    console.log('🔍 Estado inicial del usuario perfil 3:', res3.recordset[0])
    if (res3.recordset[0].iddistrito !== 5) throw new Error('iddistrito no es 5')
    if (res3.recordset[0].id_unidad !== null) throw new Error('id_unidad no es NULL')
    console.log('✅ Usuario perfil 3 creado correctamente con iddistrito')

    // 4. Actualizar Unidad (Cambiar Clave)
    console.log('🔄 Actualizando clave de unidad a U2...')
    await unidadesService.update(idUnidad, { nombre: 'Unidad Test Cascada', clave: 'U2', status: 1 })

    // 5. Verificar si la clave del usuario perfil 4 cambió
    res = await query(`SELECT clave FROM sisecao_usuarios WHERE id_usuario = @id`, { id: { type: sql.Int, value: idUsuario } })
    console.log('🔍 Clave del usuario después del update de unidad:', res.recordset[0].clave)
    
    if (res.recordset[0].clave === 'U2') {
      console.log('✅ CASCADA EXITOSA: El update de la unidad actualizó automáticamente la clave del usuario.')
    } else {
      console.error('❌ FALLO CASCADA: La clave del usuario no se actualizó.')
    }

    // Limpieza
    await query(`DELETE FROM sisecao_usuarios WHERE id_usuario = @id`, { id: { type: sql.Int, value: idUsuario } })
    await query(`DELETE FROM sisecao_usuarios WHERE id_usuario = @id`, { id: { type: sql.Int, value: idUsuario3 } })
    await query(`DELETE FROM sisecao_unidades WHERE id_unidad = @id`, { id: { type: sql.Int, value: idUnidad } })
    console.log('🧹 Limpieza completada')

  } catch (err) {
    console.error('Error en prueba:', err)
  } finally {
    process.exit(0)
  }
}

runTest()
