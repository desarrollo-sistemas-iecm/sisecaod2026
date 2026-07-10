<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useAuthStore } from '@/stores/auth.store'
import { useSettingsStore } from '@/stores/settings.store'
import { useSweetAlert } from '@/composables/useSweetAlert'
import { api } from '@/services/api'
import DashboardLayout from '@/layouts/DashboardLayout.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppTable from '@/components/ui/AppTable.vue'
import AppModal from '@/components/ui/AppModal.vue'
import AppBadge from '@/components/ui/AppBadge.vue'
import AppLoader from '@/components/ui/AppLoader.vue'
import { getNombreMes } from '@/utils/format'
import { RouterLink } from 'vue-router'

const authStore    = useAuthStore()
const settingsStore = useSettingsStore()
const { success, error, confirmar } = useSweetAlert()

const loading       = ref(false)
const actividades   = ref<any[]>([])
const modalAbierto  = ref(false)
const modoEditar    = ref(false)
const guardando     = ref(false)

const form = ref({
  id:            null as number | null,
  clave:         '',
  clavePart1:    '',
  clavePart2:    '',
  clavePart3:    '',
  actividad:     '',
  tipoActividad: 'S',
  soporte:       '',
  responsable:   '',
  numero:        '',
  mes:           1,
  periodoinicia: '',
  periodofin:    '',
  medicionActividad: '1'
})

const isReadOnly           = computed(() => authStore.perfil === 2 || authStore.perfil === 3)
const responsables         = ref<string[]>([])
const selectedResponsable  = ref('')

const defaultSoportes = [
  { value: 'Circular', label: 'Circular' },
  { value: 'CIRCULAR', label: 'Circular' },
  { value: 'Oficio', label: 'Oficio' },
  { value: 'OFICIO', label: 'Oficio' },
  { value: 'Correo Electronico', label: 'Correo Electrónico' },
  { value: 'CORREO_ELECTRONICO', label: 'Correo Electrónico' },
  { value: 'Tarjeta', label: 'Tarjeta' },
  { value: 'TARJETA', label: 'Tarjeta' },
  { value: 'Reunion Trabajo', label: 'Reunión de Trabajo' },
  { value: 'REUNION_TRABAJO', label: 'Reunión de Trabajo' },
  { value: 'Otro', label: 'Otro' },
  { value: 'OTRO', label: 'Otro' }
]

const soporteOptions = computed(() => {
  const list = [...defaultSoportes]
  if (form.value.soporte && !list.some(item => item.value.toLowerCase() === form.value.soporte.toLowerCase())) {
    list.push({ value: form.value.soporte, label: form.value.soporte })
  }
  const seen = new Set()
  return list.filter(item => {
    const key = item.value.toLowerCase()
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
})

const defaultTipos = [
  { value: 'S', label: 'Sistemática' },
  { value: 'T', label: 'Transversal' },
  { value: 'AD', label: 'Adicional' }
]

const tipoOptions = computed(() => {
  const list = [...defaultTipos]
  if (form.value.tipoActividad && !list.some(item => item.value.toLowerCase() === form.value.tipoActividad.toLowerCase())) {
    list.push({ value: form.value.tipoActividad, label: form.value.tipoActividad })
  }
  const seen = new Set()
  return list.filter(item => {
    const key = item.value.toLowerCase()
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
})

// ── Column definitions ──
const columns = computed(() => {
  if (isReadOnly.value) {
    return [
      { key: 'num',           label: '#',                sortable: false },
      { key: 'clave',         label: 'Clave',            sortable: true },
      { key: 'actividad',     label: 'Actividad',        sortable: true },
      { key: 'periodoinicia', label: 'Periodo de Inicio' },
      { key: 'periodofin',    label: 'Periodo de Fin' },
      { key: 'soporte',       label: 'Soporte' },
    ]
  }
  const cols: any[] = [
    { key: 'num',           label: '#',                 sortable: false },
    { key: 'clave',         label: 'Clave',             sortable: true },
    { key: 'actividad',     label: 'Actividad',         sortable: true },
    { key: 'periodoinicia', label: 'Periodo de Inicio' },
    { key: 'periodofin',    label: 'Periodo de Fin' },
    { key: 'responsable',   label: 'Responsable' },
  ]
  if (authStore.perfil === 1 || authStore.perfil === 4) {
    cols.push({ key: 'acciones', label: 'Acciones' })
  }
  return cols
})

const filteredActividades = computed(() => {
  if (isReadOnly.value) {
    if (!selectedResponsable.value) return []
    return actividades.value.filter(act =>
      act.responsable && act.responsable.toLowerCase().includes(selectedResponsable.value.toLowerCase())
    )
  }
  return actividades.value
})

// ── Data fetching (original logic preserved) ──
const fetchResponsables = async () => {
  try {
    const res = await api.get('/catalogo/responsables')
    responsables.value = res.data.data || []
  } catch (err: any) {
    error('Error', err.response?.data?.message || 'No se pudo cargar la lista de responsables.')
  }
}

const fetchActividades = async () => {
  loading.value = true
  try {
    const res = await api.get('/catalogo')
    actividades.value = res.data.data || []
  } catch (err: any) {
    error('Error', err.response?.data?.message || 'No se pudo cargar el catálogo de actividades.')
  } finally {
    loading.value = false
  }
}

// ── Modal handlers (original logic preserved) ──
const abrirModalNuevo = () => {
  modoEditar.value = false
  form.value = {
    id: null, clave: '', clavePart1: '', clavePart2: '', clavePart3: '',
    actividad: '', tipoActividad: 'AD', soporte: '', responsable: '',
    numero: '', mes: settingsStore.periodo?.mesActivo || 1, periodoinicia: '', periodofin: '',
    medicionActividad: '1'
  }
  modalAbierto.value = true
}

const abrirModalEditar = (act: any) => {
  modoEditar.value = true
  const parts = (act.clave || '').split('-')
  form.value = {
    id:            act.id_actividad || act.id,
    clave:         act.clave,
    clavePart1:    parts[0] || '',
    clavePart2:    parts[1] || '',
    clavePart3:    parts[2] || '',
    actividad:     act.actividad,
    tipoActividad: act.tipo_actividad || act.tipoActividad || 'S',
    soporte:       act.soporte,
    responsable:   act.responsable,
    numero:        act.numero,
    mes:           act.mes,
    periodoinicia: act.periodoinicia ? act.periodoinicia.split('T')[0] : '',
    periodofin:    act.periodofin ? act.periodofin.split('T')[0] : '',
    medicionActividad: act.medicion_actividad || act.medicionActividad || '1'
  }
  modalAbierto.value = true
}

const guardarActividad = async () => {
  guardando.value = true
  form.value.clave = `${form.value.clavePart1}-${form.value.clavePart2}-${form.value.clavePart3}`.trim()
  if (!form.value.clavePart1 || !form.value.clavePart2 || !form.value.clavePart3) {
    error('Clave incompleta', 'Debes completar las tres secciones de la clave de la actividad.')
    guardando.value = false
    return
  }
  try {
    if (modoEditar.value && form.value.id) {
      await api.put(`/catalogo/${form.value.id}`, form.value)
      success('Actualizado', 'Actividad actualizada con éxito.')
    } else {
      await api.post('/catalogo', form.value)
      success('Creado', 'Actividad registrada con éxito.')
    }
    modalAbierto.value = false
    fetchActividades()
  } catch (err: any) {
    error('Error', err.response?.data?.message || 'No se pudo guardar la actividad.')
  } finally {
    guardando.value = false
  }
}

const eliminarActividad = async (id: number) => {
  const confirm = await confirmar('¿Eliminar actividad?', 'Esta acción no se puede deshacer y podría afectar el seguimiento.')
  if (!confirm.isConfirmed) return
  try {
    await api.delete(`/catalogo/${id}`)
    success('Eliminado', 'Actividad eliminada del catálogo.')
    fetchActividades()
  } catch (err: any) {
    error('Error', err.response?.data?.message || 'No se pudo eliminar la actividad.')
  }
}

onMounted(() => {
  settingsStore.fetchPeriodo()
  fetchActividades()
  if (isReadOnly.value) fetchResponsables()
})

// ── Shared input class ──
const IC = `w-full rounded-xl border border-slate-200 dark:border-slate-700 px-3 py-2 text-sm text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800
  focus:outline-none focus:ring-2 focus:ring-iecm-purple/30 focus:border-iecm-purple dark:focus:border-iecm-purple-light transition-all`
const IC_DISABLED = `w-full rounded-xl border border-slate-200 dark:border-slate-700 px-3 py-2 text-sm text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-900/50 cursor-not-allowed`
</script>

<template>
  <DashboardLayout>
    <div class="space-y-5">

      <!-- ── Header ── -->
      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h1 class="text-xl font-bold text-slate-800 dark:text-slate-100">Catálogo de Actividades</h1>
          <p class="text-sm text-slate-400 dark:text-slate-500 mt-0.5">Administra las actividades institucionales del año en curso.</p>
        </div>
        <div v-if="authStore.perfil === 1 || authStore.perfil === 4" class="flex gap-2 flex-shrink-0">
          <AppButton variant="primary" size="sm" @click="abrirModalNuevo">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
            </svg>
            Actividad Adicional
          </AppButton>
        </div>
      </div>

      <!-- ── Responsable selector (read-only profiles) ── -->
      <div v-if="isReadOnly" class="bg-white dark:bg-[#0B1120] rounded-2xl border border-slate-200/80 dark:border-white/10 shadow-sm p-5 transition-colors duration-200">
        <div class="flex items-center gap-2 mb-3">
          <div class="w-1 h-4 rounded-full bg-iecm-purple"></div>
          <label class="text-sm font-bold text-slate-700 dark:text-slate-300">Filtrar por Responsable</label>
        </div>
        <select
          v-model="selectedResponsable"
          class="w-full sm:max-w-sm rounded-xl border border-slate-200 dark:border-slate-700 px-3 py-2 text-sm text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800
                 focus:outline-none focus:ring-2 focus:ring-iecm-purple/30 focus:border-iecm-purple dark:focus:border-iecm-purple-light transition-all"
        >
          <option value="" disabled>Selecciona un responsable…</option>
          <option v-for="resp in responsables" :key="resp" :value="resp">{{ resp }}</option>
        </select>
      </div>

      <!-- ── Table card ── -->
      <div v-if="!isReadOnly || selectedResponsable" class="bg-white dark:bg-[#0B1120] rounded-2xl border border-slate-200/80 dark:border-white/10 shadow-sm p-5 transition-colors duration-200">
        <AppLoader v-if="loading" />
        <div v-else>
          <AppTable :columns="columns" :rows="filteredActividades" searchable>

            <template #cell-num="{ index }">
              <span class="text-sm font-semibold text-slate-500 dark:text-slate-400">{{ index }}</span>
            </template>

            <template #cell-clave="{ row }">
              <span class="font-bold text-iecm-purple dark:text-iecm-purple-light text-xs tracking-wide whitespace-nowrap">{{ row.clave }}</span>
            </template>

            <template #cell-tipoActividad="{ row }">
              <AppBadge
                v-if="row.tipo_actividad === 'S' || row.tipoActividad === 'S'"
                variant="purple" text="Sistemática" :dot="true"
              />
              <AppBadge
                v-if="row.tipo_actividad === 'T' || row.tipoActividad === 'T'"
                variant="success" text="Transversal" :dot="true"
              />
              <AppBadge v-else variant="gray" text="Adicional" :dot="true" />
            </template>

            <template #cell-mes="{ row }">
              <span class="text-sm capitalize text-slate-600 dark:text-slate-300">{{ getNombreMes(row.mes) }}</span>
            </template>

            <template #cell-periodoinicia="{ value }">
              <span class="text-sm text-slate-500 dark:text-slate-400">{{ value ? value.split('T')[0] : '—' }}</span>
            </template>

            <template #cell-periodofin="{ value }">
              <span class="text-sm text-slate-500 dark:text-slate-400">{{ value ? value.split('T')[0] : '—' }}</span>
            </template>

            <template #cell-acciones="{ row }">
              <div class="flex items-center justify-center">
                <!-- Edit -->
                <button
                  class="p-2 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-950/30 rounded-xl transition-all"
                  title="Editar"
                  @click="abrirModalEditar(row)"
                >
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                  </svg>
                </button>
              </div>
            </template>

          </AppTable>
        </div>
      </div>

      <!-- ── Empty state when no responsable selected ── -->
      <div
        v-else-if="isReadOnly && !selectedResponsable"
        class="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm p-12 flex flex-col items-center gap-3 text-center transition-colors duration-200"
      >
        <div class="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
          <svg class="w-7 h-7 text-slate-300 dark:text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
          </svg>
        </div>
        <p class="text-sm font-semibold text-slate-500 dark:text-slate-400">Selecciona un responsable para ver las actividades</p>
        <p class="text-xs text-slate-400 dark:text-slate-500">Usa el selector de arriba para filtrar el catálogo</p>
      </div>

      <!-- ── Create / Edit Modal ── -->
      <AppModal
        v-model="modalAbierto"
        :title="modoEditar ? 'Editar Actividad' : 'Nueva Actividad Adicional'"
        size="lg"
      >
        <form @submit.prevent="guardarActividad" class="space-y-4 text-slate-700 dark:text-slate-300">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">

            <!-- Clave segmentada -->
            <div>
              <label class="block text-xs font-semibold text-slate-500 dark:text-slate-450 uppercase tracking-wide mb-1.5">
                Clave <span class="text-red-500">*</span>
              </label>
              <div class="flex items-center gap-2">
                <input v-model="form.clavePart1" type="text" required maxlength="5" placeholder="XX"
                  class="w-1/3 text-center rounded-xl border border-slate-200 dark:border-slate-700 px-2 py-2 text-sm bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300
                         focus:outline-none focus:ring-2 focus:ring-iecm-purple/30 focus:border-iecm-purple transition-all"/>
                <span class="text-slate-400 dark:text-slate-600 font-bold text-sm">-</span>
                <input v-model="form.clavePart2" type="text" required maxlength="5" placeholder="XX"
                  class="w-1/3 text-center rounded-xl border border-slate-200 dark:border-slate-700 px-2 py-2 text-sm bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300
                         focus:outline-none focus:ring-2 focus:ring-iecm-purple/30 focus:border-iecm-purple transition-all"/>
                <span class="text-slate-400 dark:text-slate-600 font-bold text-sm">-</span>
                <input v-model="form.clavePart3" type="text" required maxlength="5" placeholder="X"
                  class="w-1/3 text-center rounded-xl border border-slate-200 dark:border-slate-700 px-2 py-2 text-sm bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300
                         focus:outline-none focus:ring-2 focus:ring-iecm-purple/30 focus:border-iecm-purple transition-all"/>
              </div>
            </div>

            <!-- Tipo de actividad -->
            <div>
              <label class="block text-xs font-semibold text-slate-500 dark:text-slate-450 uppercase tracking-wide mb-1.5">
                Tipo de actividad <span class="text-red-500">*</span>
              </label>
              <select v-model="form.tipoActividad" required disabled
                :class="IC_DISABLED + ' bg-slate-55 dark:bg-slate-900/50 cursor-not-allowed'">
                <option v-for="opt in tipoOptions" :key="opt.value" :value="opt.value">
                  {{ opt.label }}
                </option>
              </select>
            </div>

            <!-- Descripción -->
            <div class="md:col-span-2">
              <label class="block text-xs font-semibold text-slate-500 dark:text-slate-450 uppercase tracking-wide mb-1.5">
                Descripción de la Actividad <span class="text-red-500">*</span>
              </label>
              <textarea v-model="form.actividad" required rows="3"
                placeholder="Escribe la descripción de la actividad…"
                :class="IC + ' resize-none'"></textarea>
            </div>

            <!-- Medición de la Actividad -->
            <div>
              <label class="block text-xs font-semibold text-slate-500 dark:text-slate-450 uppercase tracking-wide mb-1.5">
                Medición de la Actividad <span class="text-red-500">*</span>
              </label>
              <select v-model="form.medicionActividad" required :class="IC">
                <option value="1">Cuantificable</option>
                <option value="2">No cuantificable</option>
              </select>
            </div>

            <!-- Soporte -->
            <div>
              <label class="block text-xs font-semibold text-slate-500 dark:text-slate-450 uppercase tracking-wide mb-1.5">
                Soporte de cumplimiento <span class="text-red-500">*</span>
              </label>
              <select v-model="form.soporte" required :class="IC">
                <option value="" disabled>Selecciona…</option>
                <option v-for="opt in soporteOptions" :key="opt.value" :value="opt.value">
                  {{ opt.label }}
                </option>
              </select>
            </div>

            <!-- Responsable -->
            <div>
              <label class="block text-xs font-semibold text-slate-500 dark:text-slate-450 uppercase tracking-wide mb-1.5">
                Responsable <span class="text-red-500">*</span>
              </label>
              <input v-model="form.responsable" type="text" required
                placeholder="Ej. Órgano Desconcentrado / UTALA"
                :class="IC"/>
            </div>

            <!-- Número -->
            <div>
              <label class="block text-xs font-semibold text-slate-500 dark:text-slate-450 uppercase tracking-wide mb-1.5">Número</label>
              <input v-model="form.numero" type="text" placeholder="Ej. 1" :class="IC"/>
            </div>

            <!-- Mes -->
            <div>
              <label class="block text-xs font-semibold text-slate-500 dark:text-slate-450 uppercase tracking-wide mb-1.5">
                Mes de actividad <span class="text-red-500">*</span>
              </label>
              <select v-model="form.mes" required :class="IC">
                <option v-for="m in 12" :key="m" :value="m">{{ getNombreMes(m) }}</option>
              </select>
            </div>

            <!-- Periodo inicio -->
            <div>
              <label class="block text-xs font-semibold text-slate-500 dark:text-slate-450 uppercase tracking-wide mb-1.5">Fecha de Inicio</label>
              <input v-model="form.periodoinicia" type="date" :class="IC"/>
            </div>

            <!-- Periodo fin -->
            <div>
              <label class="block text-xs font-semibold text-slate-500 dark:text-slate-450 uppercase tracking-wide mb-1.5">Fecha de Término</label>
              <input v-model="form.periodofin" type="date" :class="IC"/>
            </div>
          </div>
        </form>

        <template #footer="{ close }">
          <AppButton variant="ghost" @click="close">Cancelar</AppButton>
          <AppButton variant="primary" :loading="guardando" @click="guardarActividad">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
            </svg>
            {{ modoEditar ? 'Actualizar' : 'Guardar' }}
          </AppButton>
        </template>
      </AppModal>

    </div>
  </DashboardLayout>
</template>
