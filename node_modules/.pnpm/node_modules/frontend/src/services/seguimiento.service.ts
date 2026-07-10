import { api } from './api'

export interface SeguimientoPayload {
  idActividad: number
  realizo: 'SI' | 'NO'
  tipoDocumento?: string
  numeroDocumento?: string
  fechaCumplimiento?: string
  observacion: string
}

export const seguimientoService = {
  getAll:   ()                       => api.get('/seguimiento'),
  getById:  (id: number)             => api.get(`/seguimiento/${id}`),
  save:     (data: SeguimientoPayload) => api.post('/seguimiento', data),
}
