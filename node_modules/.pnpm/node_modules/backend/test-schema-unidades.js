const { connectDb, query } = require('./src/config/database')

async function run() {
  await connectDb()
  const res = await query(`
    SELECT COLUMN_NAME, CHARACTER_MAXIMUM_LENGTH, DATA_TYPE 
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_NAME = 'sisecao_unidades'
  `)
  console.table(res.recordset)
  process.exit(0)
}
run()
