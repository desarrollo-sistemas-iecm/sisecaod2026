import { ref } from 'vue'
import axios from 'axios'

export interface StatusPublico {
  abierto: boolean
  mes: string // 'MAYO' | 'JUNIO' | ... | ''
}

/**
 * Composable ligero para la pantalla de login.
 * Llama al endpoint público (sin token) y expone solo { abierto, mes }.
 * El año se resuelve en el template con new Date().getFullYear() del cliente.
 */
export const useStatusPublico = () => {
  const status  = ref<StatusPublico>({ abierto: false, mes: '' })
  const cargando = ref(true)

  const fetchStatus = async () => {
    try {
      // Usamos axios crudo (sin el interceptor de auth) para no exponer tokens
      const baseURL = (import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1').replace(/\/$/, '')
      const res = await axios.get(`${baseURL}/settings/status-publico`, { timeout: 4000 })
      status.value = res.data?.data ?? { abierto: false, mes: '' }
    } catch {
      // Falla silenciosa — la card simplemente muestra "Sistema" sin mes
      status.value = { abierto: false, mes: '' }
    } finally {
      cargando.value = false
    }
  }

  return { status, cargando, fetchStatus }
}
