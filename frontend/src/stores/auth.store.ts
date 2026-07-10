import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authService } from '@/services/auth.service'
import { api } from '@/services/api'

export interface AuthUser {
  id: number
  nombre: string
  perfil: number
  idDistrito: number
  area: string
  clave: string
}

export const useAuthStore = defineStore('auth', () => {
  const accessToken = ref<string | null>(localStorage.getItem('accessToken'))
  const user        = ref<AuthUser | null>(JSON.parse(localStorage.getItem('user') ?? 'null'))

  const isAuthenticated = computed(() => !!accessToken.value && !!user.value)
  const perfil          = computed(() => Number(user.value?.perfil ?? 0))
  const idDistrito      = computed(() => Number(user.value?.idDistrito ?? 0))
  const esCentral       = computed(() => Number(user.value?.idDistrito ?? 0) > 33)

  const setAuth = (token: string, userData: AuthUser) => {
    accessToken.value = token
    user.value        = userData
    localStorage.setItem('accessToken', token)
    localStorage.setItem('user', JSON.stringify(userData))
  }

  const login = async (usuario: string, contrasena: string) => {
    const res = await authService.login({ usuario, contrasena })
    setAuth(res.data.data.accessToken, res.data.data.user)
  }

  const refreshToken = async () => {
    const res = await authService.refresh()
    accessToken.value = res.data.data.accessToken
    localStorage.setItem('accessToken', res.data.data.accessToken)
  }

  const logout = async () => {
    try { await authService.logout() } catch {}
    accessToken.value = null
    user.value        = null
    localStorage.removeItem('accessToken')
    localStorage.removeItem('user')
  }

  return { accessToken, user, isAuthenticated, perfil, idDistrito, esCentral, login, refreshToken, logout }
})
