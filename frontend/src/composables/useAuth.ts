import { useAuthStore } from '@/stores/auth.store'
import { useSweetAlert } from './useSweetAlert'
import { useRouter } from 'vue-router'

export const useAuth = () => {
  const authStore = useAuthStore()
  const { error, sistemaCerrado }  = useSweetAlert()
  const router     = useRouter()

  const login = async (usuario: string, contrasena: string) => {
    try {
      await authStore.login(usuario, contrasena)
      await router.push({ name: 'dashboard' })
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? 'Error al iniciar sesión'
      if (msg.includes('Sistema cerrado') || msg.includes('periodo de captura')) {
        await sistemaCerrado()
      } else {
        await error(msg)
      }
    }
  }

  const logout = async () => {
    await authStore.logout()
    await router.push({ name: 'login' })
  }

  return { login, logout, authStore }
}
