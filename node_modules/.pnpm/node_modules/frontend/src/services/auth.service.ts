import { api } from './api'

export interface LoginPayload { usuario: string; contrasena: string }

export const authService = {
  login: (payload: LoginPayload) => api.post('/auth/login', payload),
  refresh: ()                    => api.post('/auth/refresh'),
  logout: ()                     => api.post('/auth/logout'),
}
