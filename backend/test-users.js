const { connectDb, query } = require('./src/config/database')

async function run() {
  await connectDb()
  const res1 = await query(`SELECT TOP 1 usuario, contrasena FROM sisecao_usuarios WHERE perfil = 1`)
  const res5 = await query(`SELECT TOP 1 usuario, contrasena FROM sisecao_usuarios WHERE perfil = 5`)
  console.log("Perfil 1:", res1.recordset[0]?.usuario)
  console.log("Perfil 5:", res5.recordset[0]?.usuario)
  process.exit(0)
}
run()
