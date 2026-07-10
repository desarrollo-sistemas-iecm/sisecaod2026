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

const authStore     = useAuthStore()
const settingsStore = useSettingsStore()
const { success, error, confirmar } = useSweetAlert()

const loading           = ref(false)
const actividades       = ref<any[]>([])
const modalAbierto      = ref(false)
const guardando         = ref(false)
const selectedActividad = ref<any>(null)

const form = ref({
  realizo:          'SI' as 'SI' | 'NO',
  tipoDocumento:    '',
  numeroDocumento:  '',
  fechaCumplimiento:'',
  observacion:      ''
})

const columns = computed(() => {
  const base = [
    { key: 'num',      label: '#',        sortable: false },
    { key: 'clave',    label: 'Clave',    sortable: true },
    { key: 'actividad',label: 'Actividad' },
    { key: 'estatus',  label: 'Estatus' },
  ]
  if (authStore.perfil !== 3) {
    base.splice(2, 0, { key: 'distrito', label: 'Distrito', sortable: true })
  }
  base.push({ key: 'acciones', label: 'Capturar/Editar' })
  return base
})

const fetchSeguimiento = async () => {
  loading.value = true
  try {
    const res = await api.get('/seguimiento')
    actividades.value = res.data.data || []
  } catch (err: any) {
    error('Error', err.response?.data?.message || 'No se pudieron cargar las actividades de seguimiento.')
  } finally {
    loading.value = false
  }
}

const abrirFormulario = (act: any) => {
  selectedActividad.value = act
  form.value = {
    realizo:           act.realizo || 'SI',
    tipoDocumento:     act.tipo || '',
    numeroDocumento:   act.num_oficio || '',
    fechaCumplimiento: act.fecha_cumplio || '',
    observacion:       act.descripcion || ''
  }
  modalAbierto.value = true
}

const guardarSeguimiento = async () => {
  if (!selectedActividad.value) return
  guardando.value = true
  try {
    await api.post(`/seguimiento`, {
      idActividad:       selectedActividad.value.id_actividad || selectedActividad.value.idActividad,
      realizo:           form.value.realizo,
      tipoDocumento:     form.value.tipoDocumento,
      numeroDocumento:   form.value.numeroDocumento,
      fechaCumplimiento: form.value.fechaCumplimiento,
      observacion:       form.value.observacion
    })
    success('Guardado', 'El seguimiento de la actividad fue registrado con éxito.')
    modalAbierto.value = false
    fetchSeguimiento()
  } catch (err: any) {
    const validationErrors = err.response?.data?.data
    if (Array.isArray(validationErrors) && validationErrors.length > 0) {
      const errMsg = validationErrors.map((e: any) => `• ${e.message}`).join('<br>')
      error('Error de Validación', errMsg)
    } else {
      error('Error', err.response?.data?.message || 'No se pudo registrar el seguimiento.')
    }
  } finally {
    guardando.value = false
  }
}

onMounted(() => {
  fetchSeguimiento()
  settingsStore.fetchPeriodo()
})

const INPUT_CLS = `w-full rounded-xl border border-slate-200 dark:border-slate-700 px-3 py-2 text-sm text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800
  focus:outline-none focus:ring-2 focus:ring-iecm-purple/30 focus:border-iecm-purple dark:focus:border-iecm-purple-light transition-all
  disabled:bg-slate-50 dark:disabled:bg-slate-900/50 disabled:text-slate-400 dark:disabled:text-slate-555 disabled:cursor-not-allowed`
</script>

<template>
  <DashboardLayout>
    <div class="space-y-5">

      <!-- Header -->
      <div>
        <h1 class="text-xl font-bold text-slate-800 dark:text-slate-100">Seguimiento de Actividades</h1>
        <p class="text-sm text-slate-400 dark:text-slate-500 mt-0.5">
          Registra el cumplimiento mensual de las actividades programadas de tu órgano desconcentrado.
        </p>
      </div>

      <!-- Period warning -->
      <div
        v-if="!settingsStore.periodo?.sistemaAbierto"
        class="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 dark:bg-amber-950/20 dark:border-amber-900/50 rounded-2xl text-amber-800 dark:text-amber-450 transition-colors duration-200"
      >
        <svg class="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
        </svg>
        <div>
          <h4 class="text-sm font-bold">Periodo de captura cerrado</h4>
          <p class="text-xs mt-0.5">El periodo de registro o modificación de actividades está cerrado temporalmente.</p>
        </div>
      </div>

      <!-- Table card -->
      <div class="bg-white dark:bg-[#0B1120] rounded-2xl border border-slate-200/80 dark:border-white/10 shadow-sm p-5 transition-colors duration-200">
        <AppLoader v-if="loading" />
        <div v-else>
          <AppTable :columns="columns" :rows="actividades" searchable>
            <template #cell-num="{ index }">
              <span class="text-sm font-semibold text-slate-500 dark:text-slate-400">{{ index }}</span>
            </template>

            <template #cell-clave="{ row }">
              <span class="font-bold text-iecm-purple dark:text-iecm-purple-light text-xs">{{ row.clave }}</span>
            </template>

            <template #cell-distrito="{ row }">
              <span class="text-sm font-semibold text-slate-600 dark:text-slate-300">Distrito {{ row.idDistrito }}</span>
            </template>


            <template #cell-estatus="{ row }">
              <AppBadge
                v-if="row.realizo === 'SI'"
                variant="success"
                text="Realizada"
                :dot="true"
              />
              <AppBadge
                v-else-if="row.realizo === 'NO'"
                variant="danger"
                text="No Realizada"
                :dot="true"
              />
              <AppBadge
                v-else
                variant="gray"
                text="Pendiente"
                :dot="true"
              />
            </template>

            <template #cell-acciones="{ row }">
              <div class="flex items-center justify-center w-full">
                <button
                  v-if="authStore.perfil === 3 && settingsStore.periodo?.sistemaAbierto"
                  type="button"
                  class="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition-colors p-1.5 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-950/30 focus:outline-none flex items-center justify-center"
                  title="Registrar / Editar"
                  @click="abrirFormulario(row)"
                >
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                  </svg>
                </button>
                <button
                  v-else-if="authStore.perfil === 1"
                  type="button"
                  class="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition-colors p-1.5 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-950/30 focus:outline-none flex items-center justify-center"
                  title="Editar"
                  @click="abrirFormulario(row)"
                >
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                  </svg>
                </button>
                <button
                  v-else
                  type="button"
                  class="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition-colors p-1.5 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-950/30 focus:outline-none flex items-center justify-center"
                  title="Ver"
                  @click="abrirFormulario(row)"
                >
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0zM2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                  </svg>
                </button>
              </div>
            </template>
          </AppTable>
        </div>
      </div>

      <!-- Detail Modal -->
      <AppModal
        v-model="modalAbierto"
        :title="selectedActividad ? `Seguimiento: ${selectedActividad.clave}` : 'Detalle'"
        size="md"
      >
        <div class="space-y-4 text-slate-750 dark:text-slate-300">
          <!-- Activity info card -->
          <div class="rounded-xl bg-violet-50/60 dark:bg-violet-950/20 border border-violet-200 dark:border-violet-800/40 p-4 space-y-1.5 transition-colors duration-200">
            <p class="text-xs font-bold text-iecm-purple dark:text-iecm-purple-light uppercase tracking-wide">Detalle de Actividad</p>
            <p class="text-sm font-bold text-slate-700 dark:text-slate-200">{{ selectedActividad?.actividad }}</p>
            <p class="text-xs text-slate-500 dark:text-slate-400">Soporte requerido: {{ selectedActividad?.soporte }}</p>
          </div>

          <form @submit.prevent="guardarSeguimiento" class="space-y-4">
            <!-- ¿Se realizó? -->
            <div>
              <label class="block text-xs font-semibold text-slate-500 dark:text-slate-450 uppercase tracking-wide mb-1.5">
                ¿Se realizó la actividad? <span class="text-red-500">*</span>
              </label>
              <select
                v-model="form.realizo"
                required
                :disabled="!(authStore.perfil === 1 || (authStore.perfil === 3 && settingsStore.periodo?.sistemaAbierto))"
                :class="INPUT_CLS"
              >
                <option value="SI">Sí, se realizó</option>
                <option value="NO">No se realizó</option>
              </select>
            </div>

            <!-- Documento info (if SI) -->
            <div v-if="form.realizo === 'SI'" class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-semibold text-slate-500 dark:text-slate-450 uppercase tracking-wide mb-1.5">Tipo de Documento</label>
                <input
                  v-model="form.tipoDocumento"
                  type="text"
                  placeholder="Ej. Oficio, Minuta"
                  :disabled="!(authStore.perfil === 1 || (authStore.perfil === 3 && settingsStore.periodo?.sistemaAbierto))"
                  :class="INPUT_CLS"
                />
              </div>
              <div>
                <label class="block text-xs font-semibold text-slate-500 dark:text-slate-450 uppercase tracking-wide mb-1.5">Número de Documento</label>
                <input
                  v-model="form.numeroDocumento"
                  type="text"
                  placeholder="Ej. IECM/DD/001"
                  :disabled="!(authStore.perfil === 1 || (authStore.perfil === 3 && settingsStore.periodo?.sistemaAbierto))"
                  :class="INPUT_CLS"
                />
              </div>
              <div class="col-span-2">
                <label class="block text-xs font-semibold text-slate-500 dark:text-slate-450 uppercase tracking-wide mb-1.5">Fecha de Cumplimiento</label>
                <input
                  v-model="form.fechaCumplimiento"
                  type="date"
                  :disabled="!(authStore.perfil === 1 || (authStore.perfil === 3 && settingsStore.periodo?.sistemaAbierto))"
                  :class="INPUT_CLS"
                />
              </div>
            </div>

            <!-- Observaciones -->
            <div>
              <label class="block text-xs font-semibold text-slate-500 dark:text-slate-450 uppercase tracking-wide mb-1.5">Observaciones / Justificaciones</label>
              <textarea
                v-model="form.observacion"
                rows="3"
                placeholder="Ingresa justificaciones si no se realizó, o notas adicionales..."
                :disabled="!(authStore.perfil === 1 || (authStore.perfil === 3 && settingsStore.periodo?.sistemaAbierto))"
                :class="INPUT_CLS + ' resize-none'"
              ></textarea>
            </div>
          </form>
        </div>

        <template #footer="{ close }">
          <AppButton variant="ghost" @click="close">Cerrar</AppButton>
          <AppButton
            v-if="authStore.perfil === 1 || (authStore.perfil === 3 && settingsStore.periodo?.sistemaAbierto)"
            variant="primary"
            :loading="guardando"
            @click="guardarSeguimiento"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
            </svg>
            Guardar Cambios
          </AppButton>
        </template>
      </AppModal>

    </div>
  </DashboardLayout>
</template>
