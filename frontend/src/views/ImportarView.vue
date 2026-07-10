<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { api } from '@/services/api'
import { useSweetAlert } from '@/composables/useSweetAlert'
import DashboardLayout from '@/layouts/DashboardLayout.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppLoader from '@/components/ui/AppLoader.vue'
import { useSettingsStore } from '@/stores/settings.store'
import { useAuthStore } from '@/stores/auth.store'
import ExcelUploader from '@/components/catalogo/ExcelUploader.vue'

const router = useRouter()
const settingsStore = useSettingsStore()
const authStore = useAuthStore()
const { success, error } = useSweetAlert()

const loading      = ref(false)
const periodos     = ref<any[]>([])
const activities   = ref<any[]>([])
const yearSelected = ref(2026)
const savingRows   = ref<Record<number, boolean>>({})
const infocat      = ref(1) // 1 = deshabilitado, 0 = habilitado

const activeTab = ref<'normal' | 'desfase'>('normal')

// ── Upload state ──
const uploading    = ref(false)
const uploaderNormalRef = ref<any>(null)
const uploaderDesfaseRef = ref<any>(null)

// ── Desfase state ──
const mesRealDesfase = ref(new Date().getMonth() + 1)
const anoRealDesfase = ref(new Date().getFullYear())
const confirmModalOpen = ref(false)
const confirmText = ref('')
const confirmExpected = ref('CONFIRMAR')
const fileToUploadDesfase = ref<File | null>(null)

const NOMBRES_MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
]

const formatToInputDate = (dateStr: string) => {
  if (!dateStr) return ''
  return dateStr.replace(' ', 'T').slice(0, 16)
}

const fetchImportStatus = async () => {
  try {
    const res = await api.get('/settings/import-status')
    infocat.value = res.data.data?.infocat ?? 1
  } catch (err) {
    console.error('Error fetching import status:', err)
    infocat.value = 1
  }
}

const fetchPeriodos = async () => {
  loading.value = true
  try {
    const res = await api.get('/settings/periodos', { params: { anio: yearSelected.value } })
    const data = res.data.data || []
    periodos.value = data.map((p: any) => ({
      ...p,
      fecha_inicio_local: formatToInputDate(p.fecha_inicio),
      fecha_fin_local: formatToInputDate(p.fecha_fin)
    }))
    await fetchImportStatus()
  } catch (err: any) {
    error('Error', err.response?.data?.message || 'No se pudo cargar la configuración de periodos.')
  } finally {
    loading.value = false
  }
}

const fetchActividades = async () => {
  try {
    const res = await api.get('/catalogo')
    activities.value = res.data.data || []
  } catch (err) {
    console.error('Error fetching activities:', err)
  }
}

onMounted(async () => {
  await fetchPeriodos()
  await fetchActividades()
  await settingsStore.fetchPeriodo()
  await fetchImportStatus()
})

const getRowState = (row: any) => {
  const activeMonth = periodos.value.find(p => p.status === 1)
  
  let activeMonthExpired = false
  if (activeMonth && activeMonth.fecha_fin) {
    const dateParsed = new Date(activeMonth.fecha_fin.replace(' ', 'T'))
    if (!isNaN(dateParsed.getTime()) && new Date() > dateParsed) {
      activeMonthExpired = true
    }
  }

  if (row.status === -1) {
    return {
      text: 'Bloqueado',
      colorClass: 'text-red-600 bg-red-50 border-red-200',
      badgeVariant: 'danger',
      inicioDisabled: true,
      finDisabled: true,
      saveDisabled: true
    }
  }
  
  if (row.status === 1) {
    return {
      text: 'Configurado',
      colorClass: 'text-emerald-700 bg-emerald-50 border-emerald-200',
      badgeVariant: 'success',
      inicioDisabled: true,
      finDisabled: false,
      saveDisabled: false
    }
  }
  
  if (activeMonth && !activeMonthExpired) {
    return {
      text: 'Bloqueado',
      colorClass: 'text-red-600 bg-red-50 border-red-200',
      badgeVariant: 'danger',
      inicioDisabled: true,
      finDisabled: true,
      saveDisabled: true
    }
  } else {
    const firstConfigurable = periodos.value.find(p => p.status === 0)
    if (firstConfigurable && row.mes === firstConfigurable.mes) {
      return {
        text: 'Configurable',
        colorClass: 'text-amber-700 bg-amber-50 border-amber-200',
        badgeVariant: 'amber',
        inicioDisabled: false,
        finDisabled: false,
        saveDisabled: false
      }
    } else {
      return {
        text: 'Bloqueado',
        colorClass: 'text-red-600 bg-red-50 border-red-200',
        badgeVariant: 'danger',
        inicioDisabled: true,
        finDisabled: true,
        saveDisabled: true
      }
    }
  }
}

const guardarFila = async (row: any) => {
  if (!row.fecha_inicio_local || !row.fecha_fin_local) {
    error('Campos incompletos', 'Debes configurar fecha de inicio y de término.')
    return
  }
  
  const targetStatus = row.status === 0 ? 1 : row.status
  savingRows.value[row.mes] = true
  
  try {
    await api.put('/settings/periodos', {
      mes: row.mes,
      anio: row.ano || yearSelected.value,
      fechaInicio: row.fecha_inicio_local,
      fechaFin: row.fecha_fin_local,
      status: targetStatus
    })
    success('Configuración Guardada', `El periodo de ${NOMBRES_MESES[row.mes - 1]} ha sido actualizado correctamente.`)
    await fetchPeriodos()
    await fetchActividades()
    await settingsStore.fetchPeriodo()
  } catch (err: any) {
    error('Error al guardar', err.response?.data?.message || 'No se pudo guardar la configuración.')
  } finally {
    savingRows.value[row.mes] = false
  }
}

// ── Computed constraints for file uploading ──
const activePeriodRow = computed(() => periodos.value.find(p => p.status === 1))

const uploadRestrictionReason = computed(() => {
  if (infocat.value === 1) {
    return 'La importación de catálogo está deshabilitada (el mes activo ya cuenta con actividades, ha expirado la fecha de término, o no hay un mes configurado).'
  }
  return ''
})
const isUploadDisabled = computed(() => infocat.value === 1)

// ── Upload Normal ──
const uploadFileNormal = async (file: File) => {
  uploading.value = true
  const formData  = new FormData()
  formData.append('excel', file)
  try {
    await api.post('/catalogo/importar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    success('Importación Exitosa', 'El catálogo de actividades ha sido actualizado.')
    uploaderNormalRef.value?.clearFile()
    await fetchActividades()
    router.push('/catalogo')
  } catch (err: any) {
    error('Error de Importación', err.response?.data?.message || 'Ocurrió un error al procesar el archivo Excel.')
  } finally {
    uploading.value = false
  }
}

// ── Upload Desfase ──
const initiateDesfaseUpload = (file: File) => {
  fileToUploadDesfase.value = file
  confirmText.value = ''
  confirmModalOpen.value = true
}

const cancelDesfase = () => {
  confirmModalOpen.value = false
  fileToUploadDesfase.value = null
  confirmText.value = ''
}

const confirmDesfaseUpload = async () => {
  if (confirmText.value !== confirmExpected.value) return
  if (!fileToUploadDesfase.value) return
  
  confirmModalOpen.value = false
  uploading.value = true
  
  const formData  = new FormData()
  formData.append('excel', fileToUploadDesfase.value)
  formData.append('mesReal', mesRealDesfase.value.toString())
  formData.append('anoReal', anoRealDesfase.value.toString())
  
  try {
    const res = await api.post('/catalogo/importar-desfase', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    success('Importación con Desfase Exitosa', res.data?.message || 'El catálogo ha sido actualizado con el periodo desfasado.')
    uploaderDesfaseRef.value?.clearFile()
    fileToUploadDesfase.value = null
    await fetchActividades()
    router.push('/catalogo')
  } catch (err: any) {
    error('Error de Importación', err.response?.data?.message || 'Ocurrió un error al procesar el archivo Excel.')
  } finally {
    uploading.value = false
  }
}
</script>

<template>
  <DashboardLayout>
    <div class="space-y-6">

      <!-- Header -->
      <div>
        <h1 class="text-xl font-bold text-slate-800 dark:text-slate-100">Importación de Catálogo</h1>
        <p class="text-sm text-slate-400 dark:text-slate-500 mt-0.5">Configura calendarios y carga actividades al sistema.</p>
      </div>
      
      <!-- Tabs -->
      <div class="border-b border-slate-200 dark:border-white/10 flex gap-6">
        <button
          @click="activeTab = 'normal'"
          class="pb-3 text-sm font-bold transition-all relative"
          :class="activeTab === 'normal' ? 'text-iecm-purple dark:text-iecm-purple-light' : 'text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300'"
        >
          Calendario y Catálogo Activo
          <span v-if="activeTab === 'normal'" class="absolute bottom-0 left-0 w-full h-0.5 bg-iecm-purple dark:bg-iecm-purple-light rounded-t-full"></span>
        </button>
        <button
          v-if="authStore.perfil === 5"
          @click="activeTab = 'desfase'"
          class="pb-3 text-sm font-bold transition-all relative"
          :class="activeTab === 'desfase' ? 'text-iecm-purple dark:text-iecm-purple-light' : 'text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300'"
        >
          Importación con Desfase
          <span v-if="activeTab === 'desfase'" class="absolute bottom-0 left-0 w-full h-0.5 bg-iecm-purple dark:bg-iecm-purple-light rounded-t-full"></span>
        </button>
      </div>

      <!-- Tab: Normal -->
      <div v-if="activeTab === 'normal'" class="space-y-6">
        <!-- Year Selector for Periodos -->
        <div class="flex justify-end">
          <div class="flex items-center gap-2 bg-white dark:bg-[#0B1120] border border-slate-200 dark:border-white/10 rounded-xl px-3 py-1.5 shadow-sm">
            <label class="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Año:</label>
            <select
              v-model="yearSelected"
              @change="fetchPeriodos"
              class="border-0 bg-transparent text-sm font-bold text-slate-700 dark:text-slate-300 focus:outline-none cursor-pointer"
            >
              <option :value="2026">2026</option>
              <option :value="2025">2025</option>
              <option :value="2024">2024</option>
            </select>
          </div>
        </div>

        <!-- Month Configuration Table -->
        <div class="bg-white dark:bg-[#0B1120] rounded-2xl border border-slate-200/80 dark:border-white/10 shadow-sm p-6 overflow-x-auto transition-colors duration-200">
          <AppLoader v-if="loading" />
          <div v-else>
            <table class="w-full text-left border-collapse min-w-[750px]">
              <thead>
                <tr class="border-b border-slate-100 dark:border-white/10 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  <th class="py-3 px-4">Mes Activo</th>
                  <th class="py-3 px-4 w-60">Fecha Inicio</th>
                  <th class="py-3 px-4 w-60">Fecha Fin</th>
                  <th class="py-3 px-4 text-center w-36">Acción</th>
                  <th class="py-3 px-4 text-center w-40">Estado</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-50 dark:divide-white/5">
                <tr v-for="p in periodos" :key="p.mes" class="hover:bg-slate-50/50 dark:hover:bg-white/5 transition-colors">
                  <td class="py-4 px-4 font-bold text-slate-700 dark:text-slate-300 capitalize">{{ NOMBRES_MESES[p.mes - 1] }}</td>
                  <td class="py-3 px-4">
                    <input type="datetime-local" v-model="p.fecha_inicio_local" :disabled="getRowState(p).inicioDisabled" class="w-full rounded-xl border border-slate-200 dark:border-slate-700 px-3 py-1.5 text-sm text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 disabled:bg-slate-50 dark:disabled:bg-slate-900/50 disabled:text-slate-400 dark:disabled:text-slate-600 disabled:border-slate-100 dark:disabled:border-transparent focus:outline-none focus:ring-2 focus:ring-iecm-purple/20 transition-all duration-200" />
                  </td>
                  <td class="py-3 px-4">
                    <input type="datetime-local" v-model="p.fecha_fin_local" :disabled="getRowState(p).finDisabled" class="w-full rounded-xl border border-slate-200 dark:border-slate-700 px-3 py-1.5 text-sm text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 disabled:bg-slate-50 dark:disabled:bg-slate-900/50 disabled:text-slate-400 dark:disabled:text-slate-600 disabled:border-slate-100 dark:disabled:border-transparent focus:outline-none focus:ring-2 focus:ring-iecm-purple/20 transition-all duration-200" />
                  </td>
                  <td class="py-3 px-4 text-center">
                    <AppButton variant="primary" size="xs" :disabled="getRowState(p).saveDisabled" :loading="savingRows[p.mes]" @click="guardarFila(p)" class="font-semibold px-4 py-1.5 text-xs rounded-xl shadow-sm">Guardar</AppButton>
                  </td>
                  <td class="py-3 px-4 text-center">
                    <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border" :class="getRowState(p).colorClass">
                      <span class="w-1.5 h-1.5 rounded-full" :class="[getRowState(p).badgeVariant === 'success' ? 'bg-emerald-500' : getRowState(p).badgeVariant === 'amber' ? 'bg-amber-500' : 'bg-red-500']"></span>
                      {{ getRowState(p).text }}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <ExcelUploader
          ref="uploaderNormalRef"
          title="Subir catálogo de actividades"
          description="Sube el archivo Excel (.xlsx o .xls) correspondiente al mes activo actual."
          :disabled="isUploadDisabled"
          :disabledReason="uploadRestrictionReason"
          :infoTitle="activePeriodRow ? `Mes activo para carga: ${NOMBRES_MESES[activePeriodRow.mes - 1]}` : undefined"
          infoDescription="El sistema recibirá el catálogo Excel de actividades para este periodo."
          :uploading="uploading"
          @upload="uploadFileNormal"
        />
      </div>

      <!-- Tab: Desfase -->
      <div v-if="activeTab === 'desfase' && authStore.perfil === 5" class="space-y-6">
        <div class="bg-white dark:bg-[#0B1120] rounded-2xl border border-slate-200/80 dark:border-white/10 shadow-sm p-6 space-y-4">
          <div class="border-b border-slate-100 dark:border-white/10 pb-3">
            <h2 class="text-base font-bold text-slate-800 dark:text-slate-200">Parámetros de Desfase</h2>
            <p class="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Selecciona el mes y año real al que corresponderán las actividades importadas.</p>
          </div>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Mes Real</label>
              <select v-model="mesRealDesfase" class="w-full rounded-xl border border-slate-200 dark:border-white/10 px-4 py-2.5 text-sm bg-slate-50 dark:bg-white/5 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-iecm-purple/50 transition-all">
                <option v-for="(m, i) in NOMBRES_MESES" :key="i" :value="i + 1">{{ m }}</option>
              </select>
            </div>
            <div>
              <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Año Real</label>
              <input type="number" v-model="anoRealDesfase" class="w-full rounded-xl border border-slate-200 dark:border-white/10 px-4 py-2.5 text-sm bg-slate-50 dark:bg-white/5 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-iecm-purple/50 transition-all" />
            </div>
          </div>
        </div>

        <ExcelUploader
          ref="uploaderDesfaseRef"
          title="Subir catálogo con desfase"
          description="Sube el archivo Excel. Éste invalidará el catálogo actual de inmediato."
          :uploading="uploading"
          buttonText="Importar con Desfase"
          @upload="initiateDesfaseUpload"
        />
      </div>

    </div>

    <!-- Confirm Modal para Desfase -->
    <div v-if="confirmModalOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" @click="cancelDesfase"></div>
      <div class="relative bg-white dark:bg-[#0B1120] rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-slate-200 dark:border-white/10">
        <div class="p-6">
          <div class="flex items-center gap-3 text-red-600 dark:text-red-400 mb-4">
            <div class="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/40 flex items-center justify-center flex-shrink-0">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
              </svg>
            </div>
            <h3 class="text-lg font-bold">Confirmar Importación</h3>
          </div>
          
          <p class="text-sm text-slate-600 dark:text-slate-300 mb-4">
            Vas a importar actividades para <strong class="text-slate-800 dark:text-slate-100">{{ NOMBRES_MESES[mesRealDesfase - 1] }} {{ anoRealDesfase }}</strong>. 
            Esto desactivará el catálogo actualmente activo. Esta acción no se puede deshacer fácilmente.
          </p>
          
          <div class="mb-5">
            <label class="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">
              Escribe <span class="font-bold text-slate-800 dark:text-slate-200 select-all">{{ confirmExpected }}</span> para continuar:
            </label>
            <input
              type="text"
              v-model="confirmText"
              class="w-full rounded-xl border border-slate-300 dark:border-slate-700 px-4 py-2.5 text-sm bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-red-500/50 transition-all font-mono"
              placeholder="CONFIRMAR"
              @keyup.enter="confirmDesfaseUpload"
            />
          </div>
          
          <div class="flex justify-end gap-3">
            <AppButton variant="ghost" @click="cancelDesfase">Cancelar</AppButton>
            <AppButton
              variant="danger"
              :disabled="confirmText !== confirmExpected"
              @click="confirmDesfaseUpload"
            >
              Importar
            </AppButton>
          </div>
        </div>
      </div>
    </div>

  </DashboardLayout>
</template>
