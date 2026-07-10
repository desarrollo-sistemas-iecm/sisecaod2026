import { api } from './api'

export const reportesService = {
  central:    (mes?: number, anio?: number) =>
    api.get('/reportes/central',    { params: { mes, anio }, responseType: 'blob' }),
  distrito:   (mes?: number, anio?: number) =>
    api.get('/reportes/distrito',   { params: { mes, anio }, responseType: 'blob' }),
  pendientes: (mes?: number, anio?: number) =>
    api.get('/reportes/pendientes', { params: { mes, anio }, responseType: 'blob' }),
}

export const descargarBlob = (blob: Blob, filename: string) => {
  const url  = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href  = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}
