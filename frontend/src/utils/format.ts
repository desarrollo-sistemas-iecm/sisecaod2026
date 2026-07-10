const MESES_ES = ['', 'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']

export const getNombreMes = (num: number): string => MESES_ES[num] ?? ''

export const formatFecha = (fecha: string | null | undefined): string => {
  if (!fecha) return '—'
  const d = new Date(fecha)
  if (isNaN(d.getTime())) return fecha
  return d.toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export const anioActual = (): number => new Date().getFullYear()

export const rangoAnios = (desde = 2019): number[] => {
  const actual = anioActual()
  return Array.from({ length: actual - desde + 1 }, (_, i) => desde + i).reverse()
}
