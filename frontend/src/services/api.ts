import axios from 'axios'
import { useAuthStore } from '@/stores/auth.store'
import router from '@/router'

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1',
  withCredentials: true,
})

api.interceptors.request.use(config => {
  const authStore = useAuthStore()
  if (authStore.accessToken) {
    config.headers.Authorization = `Bearer ${authStore.accessToken}`
  }
  return config
})

api.interceptors.response.use(
  res => res,
  async err => {
    const original = err.config
    const isAuthRoute = original.url?.includes('/auth/login') || original.url?.includes('/auth/refresh')

    if (err.response?.status === 401 && !original._retry && !isAuthRoute) {
      original._retry = true
      try {
        const authStore = useAuthStore()
        await authStore.refreshToken()
        original.headers.Authorization = `Bearer ${authStore.accessToken}`
        return api(original)
      } catch {
        const authStore = useAuthStore()
        authStore.logout()
        router.push({ name: 'login' })
      }
    }
    return Promise.reject(err)
  }
)
