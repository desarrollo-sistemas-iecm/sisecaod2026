const sql = require('mssql');
const cfg = {server:'145.0.40.72',database:'utalaod',user:'user1',password:'u53r1',options:{trustServerCertificate:true,encrypt:false}};

(async () => {
  const pool = await sql.connect(cfg);

  // 1. Ver exactamente las 12 filas capturadas
  const caps = await pool.request().query(
    'SELECT iddistrito, clave, mes, ano, id_actividad, status FROM sisecao_actividades_trabajo WHERE status=1 AND mes=8 AND ano=2026 ORDER BY iddistrito, clave'
  );
  console.log('\n=== 12 ACTIVIDADES CAPTURADAS ===');
  console.table(caps.recordset);

  // 2. Ver cuántos de esas claves existen en el catálogo con mes=8, ano=2026
  const match = await pool.request().query(`
    SELECT T.iddistrito, T.clave AS t_clave, A.clave AS a_clave, T.mes AS t_mes, A.mes AS a_mes, T.ano AS t_ano, A.ano AS a_ano, A.id_actividad, T.id_actividad AS t_id_act
    FROM sisecao_actividades_trabajo T
    LEFT JOIN sisecao_catactividad A ON A.clave = T.clave AND A.mes = T.mes AND A.ano = T.ano AND A.status = 1
    WHERE T.status = 1 AND T.mes = 8 AND T.ano = 2026
  `);
  console.log('\n=== MATCH clave+mes+ano entre trabajo y catalogo ===');
  console.table(match.recordset);

  // 3. Cuántos distritos distintos hay en la subquery del reporte
  const dists = await pool.request().query(
    'SELECT DISTINCT iddistrito FROM sisecao_usuarios WHERE iddistrito <> 99 AND status = 1 ORDER BY iddistrito'
  );
  console.log('\n=== DISTRITOS EN LA SUBQUERY (status=1, iddistrito!=99) ===');
  console.log('Total:', dists.recordset.length);
  console.table(dists.recordset);

  // 4. Cómo calcula el dashboard el avance
  process.exit(0);
})().catch(e => { console.error(e.message); process.exit(1); });
