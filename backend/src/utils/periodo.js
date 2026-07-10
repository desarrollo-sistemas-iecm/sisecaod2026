/**
 * Devuelve el nombre del mes en español dado un número de mes (1-12)
 */
const MESES_ES = [
  '', 'ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO',
  'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE'
]

const getNombreMes = (numMes) => MESES_ES[numMes] ?? ''

/**
 * Construye un objeto de periodo activo desde una fila de sisecao_settings.
 * @param {object|null} row - Fila de la BD o null si no hay periodo activo
 * @returns {{ sistemaAbierto: boolean, mesActivo: number|null, nombreMes: string, anio: number, fechaInicio: string|null, fechaFin: string|null }}
 */
const buildPeriodoActivo = (row) => {
  const anio = new Date().getFullYear()
  if (!row) {
    return { sistemaAbierto: false, mesActivo: null, nombreMes: '', anio, fechaInicio: null, fechaFin: null }
  }
  return {
    sistemaAbierto: true,
    mesActivo: row.mes,
    nombreMes: getNombreMes(row.mes),
    anio,
    fechaInicio: row.fecha_inicio,
    fechaFin: row.fecha_fin,
  }
}

module.exports = { getNombreMes, buildPeriodoActivo }
