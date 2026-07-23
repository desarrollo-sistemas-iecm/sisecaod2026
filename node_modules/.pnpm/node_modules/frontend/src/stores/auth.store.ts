import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authService } from '@/services/auth.service'
import { io, Socket } from 'socket.io-client'
import Swal from 'sweetalert2'

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
  const socket      = ref<Socket | null>(null)

  const isAuthenticated = computed(() => !!accessToken.value && !!user.value)
  const perfil          = computed(() => Number(user.value?.perfil ?? 0))
  const idDistrito      = computed(() => Number(user.value?.idDistrito ?? 0))
  const esCentral       = computed(() => Number(user.value?.idDistrito ?? 0) > 33)

  const connectSocket = () => {
    if (socket.value) {
      socket.value.disconnect()
    }
    let socketUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000'
    socketUrl = socketUrl.replace('/api/v1', '')
    socket.value = io(socketUrl, {
      auth: { token: accessToken.value },
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000
    })

    socket.value.on('sesion:invalidada', ({ mensaje }) => {
      Swal.fire({
        icon: 'warning',
        title: 'Sesión invalidada',
        text: mensaje,
        confirmButtonColor: '#7c3aed',
        confirmButtonText: 'Entendido',
        allowOutsideClick: false,
        allowEscapeKey: false
      }).then(() => {
        logout()
        window.location.href = '/login'
      })
    })
  }

  const disconnectSocket = () => {
    if (socket.value) {
      socket.value.disconnect()
      socket.value = null
    }
  }

  const setAuth = (token: string, userData: AuthUser) => {
    accessToken.value = token
    user.value        = userData
    localStorage.setItem('accessToken', token)
    localStorage.setItem('user', JSON.stringify(userData))
    connectSocket()
  }

  const login = async (usuario: string, contrasena: string) => {
    const res = await authService.login({ usuario, contrasena })
    setAuth(res.data.data.accessToken, res.data.data.user)
  }

  const refreshToken = async () => {
    const res = await authService.refresh()
    accessToken.value = res.data.data.accessToken
    localStorage.setItem('accessToken', res.data.data.accessToken)
    // Volver a conectar con el nuevo token renovado
    connectSocket()
  }

  const logout = async () => {
    disconnectSocket()
    try { await authService.logout() } catch {}
    accessToken.value = null
    user.value        = null
    localStorage.removeItem('accessToken')
    localStorage.removeItem('user')
  }

  // Auto-conectar si hay un token válido en local storage al inicializarse
  if (accessToken.value) {
    setTimeout(connectSocket, 100)
  }

  return { accessToken, user, isAuthenticated, perfil, idDistrito, esCentral, login, refreshToken, logout, socket }
})
