import { defineStore } from 'pinia'
import { ref } from 'vue'
import { api } from '@/services/api'

export interface PeriodoActivo {
  sistemaAbierto: boolean
  mesActivo: number | null
  nombreMes: string
  anio: number
  fechaInicio: string | null
  fechaFin: string | null
}

export const useSettingsStore = defineStore('settings', () => {
  const periodo  = ref<PeriodoActivo | null>(null)
  const loading  = ref(false)

  const fetchPeriodo = async () => {
    loading.value = true
    try {
      const res    = await api.get('/settings/periodo-activo')
      periodo.value = res.data.data
    } finally {
      loading.value = false
    }
  }

  return { periodo, loading, fetchPeriodo }
})
