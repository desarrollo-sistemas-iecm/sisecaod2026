import { api } from './api'

export interface ActividadPayload {
  clave: string; actividad: string; tipoActividad: string
  soporte: string; responsable: string; numero: string
  mes: number; periodoinicia: string; periodofin: string
}

export const catalogoService = {
  getAll:          ()              => api.get('/catalogo'),
  getById:         (id: number)    => api.get(`/catalogo/${id}`),
  create:          (data: ActividadPayload) => api.post('/catalogo', data),
  update:          (id: number, data: Partial<ActividadPayload>) => api.put(`/catalogo/${id}`, data),
  getResponsables: ()              => api.get('/catalogo/responsables'),
  importar:        (file: File)    => {
    const fd = new FormData()
    fd.append('excel', file)
    return api.post('/catalogo/importar', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
  },
}
