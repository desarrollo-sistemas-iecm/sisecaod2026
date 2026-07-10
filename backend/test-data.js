const { connectDb, query } = require('./src/config/database')

async function run() {
  await connectDb()
  const res = await query(`
    SELECT DISTINCT clave 
    FROM sisecao_usuarios 
    WHERE clave IS NOT NULL AND clave <> ''
    ORDER BY clave
  `)
  console.log(res.recordset)
  process.exit(0)
}
run()
