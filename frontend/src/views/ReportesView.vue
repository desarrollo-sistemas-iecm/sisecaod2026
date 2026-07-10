<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { api } from '@/services/api'
import { useAuthStore } from '@/stores/auth.store'
import { useSettingsStore } from '@/stores/settings.store'
import { useSweetAlert } from '@/composables/useSweetAlert'
import DashboardLayout from '@/layouts/DashboardLayout.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppModal from '@/components/ui/AppModal.vue'
import { getNombreMes } from '@/utils/format'
import { RouterLink } from 'vue-router'

const authStore    = useAuthStore()
const settingsStore = useSettingsStore()
const { success, exito, error: alertError } = useSweetAlert()

// ── Años disponibles ──
const anios = ref<number[]>([2026])
const fetchAnios = async () => {
  try {
    const res = await api.get('/settings/anios')
    anios.value = res.data.data || [2026]
    if (anios.value.length > 0 && !anios.value.includes(anioSelected.value)) {
      anioSelected.value = anios.value[0]
    }
  } catch (err) {
    console.error('Error fetching years:', err)
  }
}

onMounted(() => {
  settingsStore.fetchPeriodo()
  fetchAnios()
})

// ── Filtros ──
const mesSelected  = ref(new Date().getMonth() + 1)
const anioSelected = ref(2026)
const downloading  = ref(false)

// ── Modales (toda la lógica preservada exactamente) ──
const modalAvanceOpen          = ref(false)
const loadingAvance            = ref(false)
const avanceData               = ref<any>(null)

const modalAvanceDistritosOpen = ref(false)
const loadingAvanceDistritos   = ref(false)
const avanceDistritosData      = ref<any[]>([])

const modalAvanceActividadesOpen = ref(false)
const loadingAvanceActividades   = ref(false)
const avanceActividadesData      = ref<any[]>([])

const modalHistoricoOpen   = ref(false)
const mesInicioSelected    = ref(1)
const mesFinSelected       = ref(new Date().getMonth() + 1)
const modalHistoricoAniosOpen = ref(false)

// ── Reports list (original logic preserved) ──
const reports = computed(() => {
  if (authStore.perfil === 1 || authStore.perfil === 4) {
    return [
      { id: 1, name: 'Reporte de los 33 órganos desconcentrados',           type: 'download', action: 'central' },
      { id: 2, name: 'Reporte Actividades pendientes por capturar',         type: 'download', action: 'pendientes' },
      { id: 3, name: 'Número de actividades realizadas por distrito',        type: 'download', action: 'avance_distritos_excel' },
      { id: 4, name: 'Actividades realizadas',                               type: 'download', action: 'avance_actividades_excel' },
      { id: 5, name: 'Reporte Trimestral',                                   type: 'download', action: 'central' },
      { id: 6, name: 'Reporte de Actividades Históricas (Años anteriores)', type: 'view',     action: 'historico_anios' },
    ]
  } else {
    return [
      { id: 1, name: 'Reporte Mensual de Actividades a Capturar',   type: 'download', action: 'a_capturar' },
      { id: 2, name: 'Reporte Mensual de Actividades Desarrolladas', type: 'download', action: 'distrito' },
      { id: 3, name: 'Reporte Actividades pendientes por capturar',  type: 'download', action: 'pendientes' },
      { id: 4, name: 'Reporte de Avance',                            type: 'view',     action: 'avance' },
      { id: 5, name: 'Reporte Histórico por Mes',                    type: 'view',     action: 'historico_mes' },
    ]
  }
})

// ── Actions (original logic preserved) ──
const openReport = async (report: any) => {
  if (report.action === 'pendientes') {
    await downloadExcelFile('/reportes/pendientes', 'REPORTE_PENDIENTES')
  } else if (report.action === 'distrito') {
    await downloadExcelFile('/reportes/distrito', 'REPORTE_DESARROLLADAS')
  } else if (report.action === 'central') {
    await downloadExcelFile('/reportes/central', 'REPORTE_CENTRAL')
  } else if (report.action === 'a_capturar') {
    await downloadExcelFile('/reportes/a-capturar', 'REPORTE_A_CAPTURAR')
  } else if (report.action === 'avance_distritos_excel') {
    await downloadExcelFile('/reportes/avance-distritos-excel', 'ACTIVIDADES_REALIZADAS_DISTRITO')
  } else if (report.action === 'avance_actividades_excel') {
    await downloadExcelFile('/reportes/avance-actividades-excel', 'ACTIVIDADES_REALIZADAS')
  } else if (report.action === 'avance') {
    modalAvanceOpen.value = true
    loadingAvance.value = true
    try {
      const res = await api.get('/reportes/avance', {
        params: { mes: mesSelected.value, anio: anioSelected.value }
      })
      avanceData.value = res.data.data
    } catch {
      alertError('Error', 'No se pudo cargar el avance de actividades.')
      modalAvanceOpen.value = false
    } finally {
      loadingAvance.value = false
    }
  } else if (report.action === 'avance_distritos') {
    modalAvanceDistritosOpen.value = true
    loadingAvanceDistritos.value = true
    try {
      const res = await api.get('/reportes/avance-distritos')
      avanceDistritosData.value = res.data.data || []
    } catch {
      alertError('Error', 'No se pudo cargar el número de actividades por distrito.')
      modalAvanceDistritosOpen.value = false
    } finally {
      loadingAvanceDistritos.value = false
    }
  } else if (report.action === 'avance_actividades') {
    modalAvanceActividadesOpen.value = true
    loadingAvanceActividades.value = true
    try {
      const res = await api.get('/reportes/avance-actividades')
      avanceActividadesData.value = res.data.data || []
    } catch {
      alertError('Error', 'No se pudo cargar el avance de actividades.')
      modalAvanceActividadesOpen.value = false
    } finally {
      loadingAvanceActividades.value = false
    }
  } else if (report.action === 'historico_mes') {
    modalHistoricoOpen.value = true
  } else if (report.action === 'historico_anios') {
    modalHistoricoAniosOpen.value = true
  }
}

const downloadExcelFile = async (url: string, prefix: string) => {
  downloading.value = true
  try {
    const response = await api.get(url, {
      params: { mes: mesSelected.value, anio: anioSelected.value },
      responseType: 'blob'
    })
    const blob = new Blob([response.data], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    })
    const downloadUrl = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = downloadUrl
    const mesStr = getNombreMes(mesSelected.value).toUpperCase()
    link.setAttribute('download', `${prefix}_${mesStr}_${anioSelected.value}.xlsx`)
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.URL.revokeObjectURL(downloadUrl)
    success('¡Descargado!', 'El reporte Excel se ha generado correctamente.')
  } catch {
    alertError('Error', 'No se pudo generar el reporte. Verifica si existen registros para los filtros seleccionados.')
  } finally {
    downloading.value = false
  }
}

const handleDownloadHistorico = async () => {
  downloading.value = true
  try {
    const response = await api.get('/reportes/historico', {
      params: {
        mes_inicio: mesInicioSelected.value,
        mes_fin:    mesFinSelected.value,
        anio:       anioSelected.value
      },
      responseType: 'blob'
    })
    const blob = new Blob([response.data], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    })
    const downloadUrl = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = downloadUrl
    const mesInicioStr = getNombreMes(mesInicioSelected.value).toUpperCase()
    const mesFinStr    = getNombreMes(mesFinSelected.value).toUpperCase()
    link.setAttribute('download', `REPORTE_HISTORICO_${mesInicioStr}_A_${mesFinStr}_${anioSelected.value}.xlsx`)
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.URL.revokeObjectURL(downloadUrl)
    modalHistoricoOpen.value = false
    success('¡Descargado!', 'El reporte histórico se ha generado correctamente.')
  } catch {
    alertError('Error', 'No se pudo generar el reporte histórico.')
  } finally {
    downloading.value = false
  }
}

const descargarExcelHistoricoAnio = async (anio: number) => {
  try {
    downloading.value = true
    const res = await api.get(`/reportes/descargar-historico/${anio}`, { responseType: 'blob' })
    const url = window.URL.createObjectURL(new Blob([res.data]))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `actividades_${anio}.xlsx`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    exito('¡Descargado!', `El reporte histórico del año ${anio} se descargó correctamente.`)
  } catch (err) {
    console.error(err)
    alertError('Error', 'No se pudo descargar el reporte histórico.')
  } finally {
    downloading.value = false
  }
}

const SELECT_CLS = `w-full rounded-xl border border-slate-200 dark:border-slate-700 px-3 py-2 text-sm text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800
  focus:outline-none focus:ring-2 focus:ring-iecm-purple/30 focus:border-iecm-purple dark:focus:border-iecm-purple-light transition-all`
</script>

<template>
  <DashboardLayout>
    <div class="max-w-4xl mx-auto space-y-6">

      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 class="text-xl font-bold text-slate-800 dark:text-slate-100">Módulo de Reportes</h1>
          <p class="text-sm text-slate-400 dark:text-slate-500 mt-0.5">Genera y descarga reportes detallados en formato Excel o visualiza resúmenes.</p>
        </div>
      </div>

      <!-- Grid -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-5">

        <!-- ── Filter Panel ── -->
        <div class="md:col-span-1">
          <div class="bg-white dark:bg-[#0B1120] rounded-2xl border border-slate-200/80 dark:border-white/10 shadow-sm p-5 space-y-4 h-fit transition-colors duration-200">
            <div class="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-white/10">
              <div class="w-1 h-4 rounded-full bg-iecm-purple"></div>
              <h3 class="text-sm font-bold text-slate-800 dark:text-slate-200">Filtros</h3>
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">Año</label>
              <select v-model="anioSelected" :class="SELECT_CLS">
                <option v-for="ano in anios" :key="ano" :value="ano">{{ ano }}</option>
              </select>
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">Mes</label>
              <select v-model="mesSelected" :class="SELECT_CLS">
                <option v-for="m in 12" :key="m" :value="m">{{ getNombreMes(m) }}</option>
              </select>
            </div>

            <!-- Info box -->
            <div class="rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-700/50 p-3 text-xs text-slate-500 dark:text-slate-400 transition-colors duration-200">
              <p class="font-semibold text-slate-600 dark:text-slate-300 mb-1">Filtros actuales</p>
              <p>Año: <span class="font-bold text-iecm-purple dark:text-iecm-purple-light">{{ anioSelected }}</span></p>
              <p>Mes: <span class="font-bold text-iecm-purple dark:text-iecm-purple-light capitalize">{{ getNombreMes(mesSelected) }}</span></p>
            </div>
          </div>
        </div>

        <!-- ── Reports List ── -->
        <div class="md:col-span-2">
          <div class="bg-white dark:bg-[#0B1120] rounded-2xl border border-slate-200/80 dark:border-white/10 shadow-sm overflow-hidden transition-colors duration-200">
            <div class="flex items-center gap-2 px-6 py-4 border-b border-slate-100 dark:border-white/10">
              <div class="w-1 h-4 rounded-full bg-iecm-purple"></div>
              <h3 class="text-sm font-bold text-slate-800 dark:text-slate-200">Reportes disponibles</h3>
              <span class="ml-auto text-xs font-bold text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded-full transition-colors">
                {{ reports.length }}
              </span>
            </div>
            <div class="divide-y divide-slate-100 dark:divide-white/5">
              <div
                v-for="report in reports"
                :key="report.id"
                class="flex items-center gap-4 px-6 py-4 hover:bg-slate-50/60 dark:hover:bg-white/5 transition-colors"
              >
                <!-- Number -->
                <span class="w-6 h-6 rounded-full bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-400 text-xs font-bold flex items-center justify-center flex-shrink-0 transition-colors">
                  {{ report.id }}
                </span>

                <!-- Name -->
                <span class="flex-1 text-sm text-slate-700 dark:text-slate-300 font-semibold">{{ report.name }}</span>

                <!-- Action button -->
                <button
                  v-if="report.type === 'download'"
                  class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400
                         ring-1 ring-emerald-200/60 dark:ring-emerald-900/30 text-xs font-bold hover:bg-emerald-100 dark:hover:bg-emerald-900/20 transition-all
                         disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                  @click="openReport(report)"
                  :disabled="downloading"
                >
                  <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
                  </svg>
                  {{ downloading ? '…' : 'Excel' }}
                </button>
                <button
                  v-else
                  class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-400
                         ring-1 ring-blue-200/60 dark:ring-blue-900/30 text-xs font-bold hover:bg-blue-100 dark:hover:bg-blue-900/20 transition-all flex-shrink-0"
                  @click="openReport(report)"
                >
                  <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0zM2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                  </svg>
                  Visualizar
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ── Modal: Avance ── -->
    <AppModal v-model="modalAvanceOpen" title="Número de Actividades Desarrolladas" size="md">
      <div v-if="loadingAvance" class="flex justify-center py-8">
        <div class="w-8 h-8 border-[3px] border-slate-100 border-t-iecm-purple rounded-full animate-spin"></div>
      </div>
      <div v-else class="space-y-4">
        <p class="text-sm font-semibold text-slate-700">
          Mes: <span class="text-iecm-purple capitalize">{{ getNombreMes(mesSelected) }}</span>
        </p>
        <div class="overflow-hidden border border-slate-200 rounded-xl text-sm shadow-sm">
          <table class="w-full text-center">
            <thead class="bg-iecm-indigo text-white text-xs uppercase tracking-wide">
              <tr>
                <th class="px-4 py-3">Distrito</th>
                <th class="px-4 py-3">Realizadas</th>
                <th class="px-4 py-3">No Realizadas</th>
                <th class="px-4 py-3">No Capturadas</th>
              </tr>
            </thead>
            <tbody>
              <tr class="border-t border-slate-100 hover:bg-slate-50">
                <td class="px-4 py-3 font-semibold text-slate-700">{{ avanceData?.distrito }}</td>
                <td class="px-4 py-3 font-semibold text-emerald-600">{{ avanceData?.si }}</td>
                <td class="px-4 py-3 font-semibold text-red-500">{{ avanceData?.no }}</td>
                <td class="px-4 py-3 font-semibold text-amber-600">{{ avanceData?.noCap }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      <template #footer="{ close }">
        <AppButton variant="secondary" @click="close">Cerrar</AppButton>
      </template>
    </AppModal>

    <!-- ── Modal: Histórico por Mes ── -->
    <AppModal v-model="modalHistoricoOpen" title="Reporte Histórico por Mes" size="md">
      <form @submit.prevent="handleDownloadHistorico" class="space-y-4">
        <div>
          <label class="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Periodo de Inicio</label>
          <select v-model="mesInicioSelected" :class="SELECT_CLS">
            <option v-for="m in 12" :key="m" :value="m">{{ getNombreMes(m) }}</option>
          </select>
        </div>
        <div>
          <label class="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Periodo de Término</label>
          <select v-model="mesFinSelected" :class="SELECT_CLS">
            <option v-for="m in 12" :key="m" :value="m">{{ getNombreMes(m) }}</option>
          </select>
        </div>
      </form>
      <template #footer="{ close }">
        <AppButton variant="ghost" @click="close">Cancelar</AppButton>
        <AppButton variant="primary" :loading="downloading" @click="handleDownloadHistorico">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
          </svg>
          Descargar
        </AppButton>
      </template>
    </AppModal>

    <!-- ── Modal: Avance Distritos ── -->
    <AppModal v-model="modalAvanceDistritosOpen" title="Número de Actividades Desarrolladas por los Órganos Desconcentrados" size="lg">
      <div v-if="loadingAvanceDistritos" class="flex justify-center py-8">
        <div class="w-8 h-8 border-[3px] border-slate-100 border-t-iecm-purple rounded-full animate-spin"></div>
      </div>
      <div v-else class="space-y-3">
        <p class="text-sm font-semibold text-slate-700">
          Mes: <span class="text-iecm-purple capitalize">{{ settingsStore.periodo?.nombreMes || 'N/A' }}</span>
        </p>
        <div class="overflow-y-auto max-h-96 border border-slate-200 rounded-xl shadow-sm text-sm">
          <table class="w-full text-center">
            <thead class="bg-iecm-indigo text-white text-xs uppercase tracking-wide sticky top-0">
              <tr>
                <th class="px-4 py-3">Distrito</th>
                <th class="px-4 py-3">Realizadas</th>
                <th class="px-4 py-3">No Realizadas</th>
                <th class="px-4 py-3">No Capturadas</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 bg-white">
              <tr
                v-for="row in avanceDistritosData" :key="row.distrito"
                class="hover:bg-slate-50 transition-colors"
              >
                <td class="px-4 py-3 font-semibold text-slate-700">{{ row.distrito }}</td>
                <td class="px-4 py-3 font-semibold text-emerald-600">{{ row.si }}</td>
                <td class="px-4 py-3 font-semibold text-red-500">{{ row.no }}</td>
                <td class="px-4 py-3 font-semibold text-amber-600">{{ row.noCap }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      <template #footer="{ close }">
        <AppButton variant="secondary" @click="close">Cerrar</AppButton>
      </template>
    </AppModal>

    <!-- ── Modal: Avance Actividades ── -->
    <AppModal v-model="modalAvanceActividadesOpen" title="Actividades Desarrolladas por los Órganos Desconcentrados" size="lg">
      <div v-if="loadingAvanceActividades" class="flex justify-center py-8">
        <div class="w-8 h-8 border-[3px] border-slate-100 border-t-iecm-purple rounded-full animate-spin"></div>
      </div>
      <div v-else class="space-y-3">
        <p class="text-sm font-semibold text-slate-700">
          Mes: <span class="text-iecm-purple capitalize">{{ settingsStore.periodo?.nombreMes || 'N/A' }}</span>
        </p>
        <div class="overflow-y-auto max-h-96 border border-slate-200 rounded-xl shadow-sm text-sm">
          <table class="w-full text-center">
            <thead class="bg-iecm-indigo text-white text-xs uppercase tracking-wide sticky top-0">
              <tr>
                <th class="px-4 py-3">Clave de Actividad</th>
                <th class="px-4 py-3">Cuántos Sí</th>
                <th class="px-4 py-3">Cuántos No</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 bg-white">
              <tr
                v-for="row in avanceActividadesData" :key="row.clave"
                class="hover:bg-slate-50 transition-colors"
              >
                <td class="px-4 py-3 font-bold text-iecm-purple">{{ row.clave }}</td>
                <td class="px-4 py-3 font-semibold text-emerald-600">{{ row.si }}</td>
                <td class="px-4 py-3 font-semibold text-red-500">{{ row.no }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      <template #footer="{ close }">
        <AppButton variant="secondary" @click="close">Cerrar</AppButton>
      </template>
    </AppModal>

    <!-- ── Modal: Reporte Histórico por Año Realizado ── -->
    <AppModal v-model="modalHistoricoAniosOpen" title="Reporte Histórico por Año Realizado" size="md">
      <div class="space-y-4 py-1">
        <p class="text-sm text-slate-500 dark:text-slate-400">
          Selecciona el año para descargar el reporte histórico de actividades en formato Excel:
        </p>
        <div class="space-y-2">
          <div 
            v-for="anio in [2019, 2020, 2021, 2022, 2023]" 
            :key="anio"
            class="flex items-center justify-between p-3.5 rounded-xl border border-slate-100 dark:border-slate-750 bg-slate-50/50 dark:bg-slate-900/30 hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-slate-200 dark:hover:border-slate-700 transition-all duration-200"
          >
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-lg bg-iecm-purple/10 dark:bg-iecm-purple/20 flex items-center justify-center text-iecm-purple dark:text-iecm-purple-light font-bold text-sm">
                {{ anio }}
              </div>
              <div>
                <h4 class="text-sm font-bold text-slate-800 dark:text-slate-200">Actividades del año {{ anio }}</h4>
                <p class="text-xs text-slate-400 dark:text-slate-500">Reporte anual consolidado (.xlsx)</p>
              </div>
            </div>
            <AppButton 
              size="sm"
              variant="secondary"
              :loading="downloading"
              @click="descargarExcelHistoricoAnio(anio)"
              class="flex items-center gap-1.5"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
              </svg>
              Descargar
            </AppButton>
          </div>
        </div>
      </div>
      <template #footer="{ close }">
        <AppButton variant="secondary" @click="close">Cerrar</AppButton>
      </template>
    </AppModal>

  </DashboardLayout>
</template>
