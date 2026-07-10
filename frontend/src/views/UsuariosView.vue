<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { api } from '@/services/api'
import { useSweetAlert } from '@/composables/useSweetAlert'
import DashboardLayout from '@/layouts/DashboardLayout.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppTable from '@/components/ui/AppTable.vue'
import AppModal from '@/components/ui/AppModal.vue'
import AppBadge from '@/components/ui/AppBadge.vue'
import AppLoader from '@/components/ui/AppLoader.vue'
import { PERFILES } from '@/utils/permissions'

const { success, error, confirmar } = useSweetAlert()

// ── Pestaña activa ──
const tabActiva = ref<'usuarios' | 'unidades'>('usuarios')

// ─────────────────────────────────────────────
// USUARIOS
// ─────────────────────────────────────────────
const loading      = ref(false)
const usuarios     = ref<any[]>([])
const modalAbierto = ref(false)
const modoEditar   = ref(false)
const guardando    = ref(false)

const form = ref({
  id:         null as number | null,
  nombre:     '',
  usuario:    '',
  contrasena: '',
  clave:      '',
  perfil:     3,
  iddistrito: 1 as number | null,
  id_unidad:  null as number | null,
})

// Reiniciar campos de distrito/unidad cuando cambia el perfil
watch(() => form.value.perfil, (nuevoPerfil) => {
  form.value.iddistrito = nuevoPerfil === 3 ? 1    : null
  form.value.id_unidad  = nuevoPerfil === 4 ? null : null
})

const columns = [
  { key: 'num',        label: '#',                sortable: false },
  { key: 'nombre',     label: 'Nombre',           sortable: true  },
  { key: 'usuario',    label: 'Usuario',          sortable: true  },
  { key: 'perfil',     label: 'Perfil',           sortable: true  },
  { key: 'asignacion', label: 'Distrito / Unidad' },
  { key: 'acciones',   label: 'Acciones' },
]

const fetchUsuarios = async () => {
  loading.value = true
  try {
    const res = await api.get('/usuarios')
    usuarios.value = res.data.data || []
  } catch (err: any) {
    error('Error', err.response?.data?.message || 'No se pudo cargar la lista de usuarios.')
  } finally {
    loading.value = false
  }
}

const abrirModalNuevo = () => {
  modoEditar.value = false
  form.value = { id: null, nombre: '', usuario: '', contrasena: '', clave: '', perfil: 3, iddistrito: 1, id_unidad: null }
  modalAbierto.value = true
}

const abrirModalEditar = (u: any) => {
  modoEditar.value = true
  form.value = {
    id:         u.id_usuario,
    nombre:     u.nombre,
    usuario:    u.usuario,
    contrasena: '',
    clave:      u.clave || '',
    perfil:     u.perfil,
    iddistrito: u.iddistrito,
    id_unidad:  u.id_unidad,
  }
  modalAbierto.value = true
}

const guardarUsuario = async () => {
  if (!form.value.nombre || !form.value.usuario || !form.value.perfil) {
    error('Datos incompletos', 'Por favor llena los campos requeridos.')
    return
  }
  if (!modoEditar.value && !form.value.contrasena) {
    error('Contraseña requerida', 'Debes ingresar una contraseña para el nuevo usuario.')
    return
  }
  if (form.value.perfil === 3 && !form.value.iddistrito) {
    error('Distrito requerido', 'Selecciona un distrito para el Capturista Distrital.')
    return
  }
  if (form.value.perfil === 4 && !form.value.id_unidad) {
    error('Unidad requerida', 'Selecciona una unidad para el perfil Área Específica.')
    return
  }
  guardando.value = true
  try {
    if (modoEditar.value && form.value.id) {
      await api.put(`/usuarios/${form.value.id}`, form.value)
      success('Actualizado', 'Usuario actualizado con éxito.')
    } else {
      await api.post('/usuarios', form.value)
      success('Creado', 'Usuario creado con éxito.')
    }
    modalAbierto.value = false
    fetchUsuarios()
  } catch (err: any) {
    const apiData = err.response?.data
    let msg = apiData?.message || 'No se pudo guardar el usuario.'
    if (apiData?.data && Array.isArray(apiData.data)) {
      msg = apiData.data.map((e: any) => e.message).join('\n')
    }
    error('Error', msg)
  } finally {
    guardando.value = false
  }
}

const eliminarUsuario = async (id: number) => {
  const confirm = await confirmar('¿Eliminar usuario?', 'Esta acción eliminará de forma permanente al usuario del sistema.')
  if (!confirm.isConfirmed) return
  try {
    await api.delete(`/usuarios/${id}`)
    success('Eliminado', 'Usuario eliminado con éxito.')
    fetchUsuarios()
  } catch (err: any) {
    error('Error', err.response?.data?.message || 'No se pudo eliminar el usuario.')
  }
}

const getPerfilBadgeVariant = (perfil: number): any => {
  switch (perfil) {
    case 1: return 'purple'
    case 5: return 'danger'
    case 4: return 'success'
    case 2: return 'amber'
    default: return 'gray'
  }
}

const getInitials = (nombre: string) => {
  const parts = (nombre || '').trim().split(' ')
  return parts.length >= 2
    ? (parts[0][0] + parts[1][0]).toUpperCase()
    : nombre.substring(0, 2).toUpperCase()
}

const getAvatarColor = (perfil: number): string => {
  switch (perfil) {
    case 1: return 'bg-violet-500'
    case 4: return 'bg-emerald-500'
    case 2: return 'bg-amber-500'
    case 5: return 'bg-red-500'
    default: return 'bg-slate-400'
  }
}

const totalUsuarios = computed(() => usuarios.value.length)

// ─────────────────────────────────────────────
// UNIDADES
// ─────────────────────────────────────────────
const loadingUnidades    = ref(false)
const unidades           = ref<any[]>([])
const modalUnidadAbierto = ref(false)
const modoEditarUnidad   = ref(false)
const guardandoUnidad    = ref(false)

const formUnidad = ref({
  id:     null as number | null,
  nombre: '',
  clave:  '',
  status: 1,
})

const columnsUnidades = [
  { key: 'num',          label: '#',           sortable: false },
  { key: 'nombre',       label: 'Nombre',      sortable: true  },
  { key: 'clave',        label: 'Clave',       sortable: true  },
  { key: 'status',       label: 'Estado',      sortable: false },
  { key: 'fecha_alta',   label: 'Alta',        sortable: false },
  { key: 'fecha_modifi', label: 'Modificada',  sortable: false },
  { key: 'acciones',     label: 'Acciones' },
]

const fetchUnidades = async () => {
  loadingUnidades.value = true
  try {
    const res = await api.get('/unidades')
    unidades.value = res.data.data || []
  } catch (err: any) {
    error('Error', err.response?.data?.message || 'No se pudo cargar las unidades.')
  } finally {
    loadingUnidades.value = false
  }
}

// Unidades activas para el select del formulario de usuario perfil 4
const unidadesActivas = ref<any[]>([])
const fetchUnidadesActivas = async () => {
  try {
    const res = await api.get('/unidades/activas')
    unidadesActivas.value = res.data.data || []
  } catch { /* silencioso, solo afecta el select */ }
}

const abrirModalNuevaUnidad = () => {
  modoEditarUnidad.value = false
  formUnidad.value = { id: null, nombre: '', clave: '', status: 1 }
  modalUnidadAbierto.value = true
}

const abrirModalEditarUnidad = (u: any) => {
  modoEditarUnidad.value = true
  formUnidad.value = { id: u.id_unidad, nombre: u.nombre, clave: u.clave, status: u.status }
  modalUnidadAbierto.value = true
}

const guardarUnidad = async () => {
  if (!formUnidad.value.nombre || !formUnidad.value.clave) {
    error('Datos incompletos', 'El nombre y la clave son requeridos.')
    return
  }
  guardandoUnidad.value = true
  try {
    if (modoEditarUnidad.value && formUnidad.value.id) {
      await api.put(`/unidades/${formUnidad.value.id}`, formUnidad.value)
      success('Actualizada', 'Unidad actualizada. La clave se propagó a todos sus usuarios.')
    } else {
      await api.post('/unidades', formUnidad.value)
      success('Creada', 'Unidad creada correctamente.')
    }
    modalUnidadAbierto.value = false
    fetchUnidades()
    fetchUnidadesActivas()
  } catch (err: any) {
    const apiData = err.response?.data
    let msg = apiData?.message || 'No se pudo guardar la unidad.'
    if (apiData?.data && Array.isArray(apiData.data)) {
      msg = apiData.data.map((e: any) => e.message).join('\n')
    }
    error('Error', msg)
  } finally {
    guardandoUnidad.value = false
  }
}

const toggleStatusUnidad = async (u: any) => {
  const accion   = u.status === 1 ? 'desactivar' : 'activar'
  const confirm  = await confirmar(`¿${accion.charAt(0).toUpperCase() + accion.slice(1)} unidad?`, `La unidad "${u.nombre}" será ${accion}ada.`)
  if (!confirm.isConfirmed) return
  try {
    await api.put(`/unidades/${u.id_unidad}`, { nombre: u.nombre, clave: u.clave, status: u.status === 1 ? 0 : 1 })
    success('Actualizada', `Unidad ${accion}ada correctamente.`)
    fetchUnidades()
    fetchUnidadesActivas()
  } catch (err: any) {
    error('Error', err.response?.data?.message || `No se pudo ${accion} la unidad.`)
  }
}

const IC = `w-full rounded-xl border border-slate-200 dark:border-slate-700 px-3 py-2 text-sm text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800
  focus:outline-none focus:ring-2 focus:ring-iecm-purple/30 focus:border-iecm-purple dark:focus:border-iecm-purple-light transition-all`

onMounted(() => {
  fetchUsuarios()
  fetchUnidades()
  fetchUnidadesActivas()
})
</script>

<template>
  <DashboardLayout>
    <div class="space-y-5">

      <!-- ── Header ── -->
      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h1 class="text-xl font-bold text-slate-800 dark:text-slate-100">Gestión de Usuarios</h1>
          <p class="text-sm text-slate-400 dark:text-slate-500 mt-0.5">
            Administra las cuentas de usuario y las unidades del sistema.
            <span class="ml-1 text-iecm-purple dark:text-iecm-purple-light font-semibold">{{ totalUsuarios }} usuarios</span>
          </p>
        </div>
        <!-- Botón contextual según pestaña -->
        <AppButton v-if="tabActiva === 'usuarios'" variant="primary" size="sm" @click="abrirModalNuevo">
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
          </svg>
          Nuevo Usuario
        </AppButton>
        <AppButton v-else variant="primary" size="sm" @click="abrirModalNuevaUnidad">
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
          </svg>
          Nueva Unidad
        </AppButton>
      </div>

      <!-- ── Pestañas ── -->
      <div class="flex gap-1 p-1 bg-slate-100 dark:bg-white/5 rounded-2xl w-fit border border-slate-200/60 dark:border-white/10">
        <button
          v-for="tab in [{ key: 'usuarios', label: 'Usuarios' }, { key: 'unidades', label: 'Catálogo de Unidades' }]"
          :key="tab.key"
          @click="tabActiva = tab.key as any"
          class="px-4 py-1.5 rounded-xl text-sm font-semibold transition-all duration-200"
          :class="tabActiva === tab.key
            ? 'bg-white dark:bg-iecm-purple text-iecm-purple dark:text-white shadow-sm'
            : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'"
        >
          {{ tab.label }}
        </button>
      </div>

      <!-- ══════════════════════════════════════════
           PESTAÑA: USUARIOS
           ══════════════════════════════════════════ -->
      <div v-if="tabActiva === 'usuarios'" class="bg-white dark:bg-[#0B1120] rounded-2xl border border-slate-200/80 dark:border-white/10 shadow-sm p-5 transition-colors duration-200">
        <AppLoader v-if="loading" />
        <div v-else>
          <AppTable :columns="columns" :rows="usuarios" searchable>

            <template #cell-num="{ index }">
              <span class="text-sm font-semibold text-slate-500 dark:text-slate-400">{{ index }}</span>
            </template>

            <!-- Nombre con avatar -->
            <template #cell-nombre="{ row }">
              <div class="flex items-center gap-3">
                <div
                  class="w-8 h-8 rounded-xl flex items-center justify-center text-white text-xs font-black flex-shrink-0 shadow-sm"
                  :class="getAvatarColor(row.perfil)"
                >
                  {{ getInitials(row.nombre) }}
                </div>
                <span class="font-bold text-slate-800 dark:text-slate-200 text-sm">{{ row.nombre }}</span>
              </div>
            </template>

            <!-- Usuario (monospace) -->
            <template #cell-usuario="{ row }">
              <code class="text-xs bg-slate-100 dark:bg-white/5 text-slate-650 dark:text-slate-300 px-2 py-0.5 rounded-lg font-mono transition-colors border border-slate-200/40 dark:border-white/5">
                {{ row.usuario }}
              </code>
            </template>

            <!-- Perfil badge -->
            <template #cell-perfil="{ row }">
              <AppBadge
                :variant="getPerfilBadgeVariant(row.perfil)"
                :text="PERFILES[row.perfil] || `Perfil ${row.perfil}`"
                :dot="true"
              />
            </template>

            <!-- Distrito / Unidad — muestra inteligentemente según perfil -->
            <template #cell-asignacion="{ row }">
              <span v-if="row.perfil === 3" class="text-sm font-bold text-iecm-purple dark:text-iecm-purple-light">
                Distrito {{ row.iddistrito }}
              </span>
              <span v-else-if="row.perfil === 4 && row.nombre_unidad" class="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                {{ row.nombre_unidad }}
              </span>
              <span v-else class="text-xs text-slate-400 dark:text-slate-500 italic">
                Adm. Central
              </span>
            </template>

            <!-- Acciones -->
            <template #cell-acciones="{ row }">
              <div class="flex items-center gap-1">
                <button
                  class="p-1.5 text-slate-450 hover:text-iecm-purple dark:hover:text-iecm-purple-light hover:bg-violet-50 dark:hover:bg-white/5 rounded-xl transition-all"
                  title="Editar usuario"
                  @click="abrirModalEditar(row)"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                  </svg>
                </button>
                <button
                  class="p-1.5 text-slate-450 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl transition-all"
                  title="Eliminar usuario"
                  @click="eliminarUsuario(row.id_usuario)"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                  </svg>
                </button>
              </div>
            </template>

          </AppTable>
        </div>
      </div>

      <!-- ══════════════════════════════════════════
           PESTAÑA: UNIDADES
           ══════════════════════════════════════════ -->
      <div v-if="tabActiva === 'unidades'" class="bg-white dark:bg-[#0B1120] rounded-2xl border border-slate-200/80 dark:border-white/10 shadow-sm p-5 transition-colors duration-200">
        <AppLoader v-if="loadingUnidades" />
        <div v-else>
          <AppTable :columns="columnsUnidades" :rows="unidades" searchable>

            <template #cell-num="{ index }">
              <span class="text-sm font-semibold text-slate-500 dark:text-slate-400">{{ index }}</span>
            </template>

            <template #cell-nombre="{ row }">
              <span class="font-semibold text-slate-800 dark:text-slate-200 text-sm">{{ row.nombre }}</span>
            </template>

            <template #cell-clave="{ row }">
              <code class="text-xs bg-slate-100 dark:bg-white/5 text-slate-650 dark:text-slate-300 px-2 py-0.5 rounded-lg font-mono border border-slate-200/40 dark:border-white/5">
                {{ row.clave }}
              </code>
            </template>

            <template #cell-status="{ row }">
              <AppBadge
                :variant="row.status === 1 ? 'success' : 'gray'"
                :text="row.status === 1 ? 'Activa' : 'Inactiva'"
                :dot="true"
              />
            </template>

            <template #cell-fecha_alta="{ row }">
              <span class="text-xs text-slate-500 dark:text-slate-400">{{ row.fecha_alta }}</span>
            </template>

            <template #cell-fecha_modifi="{ row }">
              <span class="text-xs text-slate-500 dark:text-slate-400">{{ row.fecha_modifi }}</span>
            </template>

            <template #cell-acciones="{ row }">
              <div class="flex items-center gap-1">
                <button
                  class="p-1.5 text-slate-450 hover:text-iecm-purple dark:hover:text-iecm-purple-light hover:bg-violet-50 dark:hover:bg-white/5 rounded-xl transition-all"
                  title="Editar unidad"
                  @click="abrirModalEditarUnidad(row)"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                  </svg>
                </button>
                <button
                  class="p-1.5 rounded-xl transition-all"
                  :class="row.status === 1
                    ? 'text-slate-450 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950/30'
                    : 'text-slate-450 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-950/30'"
                  :title="row.status === 1 ? 'Desactivar unidad' : 'Activar unidad'"
                  @click="toggleStatusUnidad(row)"
                >
                  <svg v-if="row.status === 1" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"/>
                  </svg>
                  <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                </button>
              </div>
            </template>

          </AppTable>
        </div>
      </div>

      <!-- ══════════════════════════════════════════
           MODAL: CREAR / EDITAR USUARIO
           ══════════════════════════════════════════ -->
      <AppModal
        v-model="modalAbierto"
        :title="modoEditar ? 'Editar Usuario' : 'Nuevo Usuario'"
        size="md"
      >
        <form @submit.prevent="guardarUsuario" class="space-y-4 text-slate-750 dark:text-slate-300">

          <!-- Nombre -->
          <div>
            <label class="block text-xs font-semibold text-slate-500 dark:text-slate-450 uppercase tracking-wide mb-1.5">
              Nombre Completo <span class="text-red-500">*</span>
            </label>
            <input v-model="form.nombre" type="text" required placeholder="Ej. Bruno Corona" :class="IC"/>
          </div>

          <!-- Usuario -->
          <div>
            <label class="block text-xs font-semibold text-slate-500 dark:text-slate-450 uppercase tracking-wide mb-1.5">
              Nombre de Usuario <span class="text-red-500">*</span>
            </label>
            <input v-model="form.usuario" type="text" required placeholder="Ej. bcorona" :class="IC"/>
          </div>

          <!-- Contraseña -->
          <div>
            <label class="block text-xs font-semibold text-slate-500 dark:text-slate-450 uppercase tracking-wide mb-1.5">
              Contraseña
              <span v-if="!modoEditar" class="text-red-500">*</span>
              <span v-else class="ml-1 text-slate-400 dark:text-slate-500 font-normal normal-case">(Dejar en blanco para no cambiar)</span>
            </label>
            <input
              v-model="form.contrasena"
              type="password"
              :required="!modoEditar"
              placeholder="••••••••"
              :class="IC"
            />
          </div>

          <!-- Perfil -->
          <div>
            <label class="block text-xs font-semibold text-slate-500 dark:text-slate-450 uppercase tracking-wide mb-1.5">
              Perfil / Rol <span class="text-red-500">*</span>
            </label>
            <select v-model="form.perfil" required :class="IC">
              <option v-for="(label, value) in PERFILES" :key="value" :value="Number(value)">
                {{ label }}
              </option>
            </select>
          </div>

          <!-- Campo dinámico según perfil -->
          <!-- Perfil 3: select de Distrito -->
          <div v-if="form.perfil === 3">
            <label class="block text-xs font-semibold text-slate-500 dark:text-slate-450 uppercase tracking-wide mb-1.5">
              Distrito Asignado <span class="text-red-500">*</span>
            </label>
            <select v-model="form.iddistrito" required :class="IC">
              <option v-for="d in 33" :key="d" :value="d">Distrito {{ d }}</option>
            </select>
          </div>

          <!-- Perfil 3: clave manual opcional -->
          <div v-if="form.perfil === 3">
            <label class="block text-xs font-semibold text-slate-500 dark:text-slate-450 uppercase tracking-wide mb-1.5">
              Clave de Área
              <span class="ml-1 text-slate-400 dark:text-slate-500 font-normal normal-case">(Opcional)</span>
            </label>
            <input v-model="form.clave" type="text" placeholder="Ej. UTALA" :class="IC"/>
          </div>

          <!-- Perfil 4: select de Unidad (clave se llena automáticamente en el backend) -->
          <div v-if="form.perfil === 4">
            <label class="block text-xs font-semibold text-slate-500 dark:text-slate-450 uppercase tracking-wide mb-1.5">
              Unidad Asignada <span class="text-red-500">*</span>
            </label>
            <select v-model="form.id_unidad" required :class="IC">
              <option :value="null" disabled>Selecciona una unidad...</option>
              <option v-for="u in unidadesActivas" :key="u.id_unidad" :value="u.id_unidad">
                {{ u.nombre }} ({{ u.clave }})
              </option>
            </select>
            <p class="mt-1.5 text-[11px] text-slate-400 dark:text-slate-500">
              La clave de área se asignará automáticamente desde la unidad seleccionada.
            </p>
          </div>

          <!-- Perfiles 1, 2, 5: sin campo adicional -->

        </form>

        <template #footer="{ close }">
          <AppButton variant="ghost" @click="close">Cancelar</AppButton>
          <AppButton variant="primary" :loading="guardando" @click="guardarUsuario">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
            </svg>
            {{ modoEditar ? 'Actualizar' : 'Crear Usuario' }}
          </AppButton>
        </template>
      </AppModal>

      <!-- ══════════════════════════════════════════
           MODAL: CREAR / EDITAR UNIDAD
           ══════════════════════════════════════════ -->
      <AppModal
        v-model="modalUnidadAbierto"
        :title="modoEditarUnidad ? 'Editar Unidad' : 'Nueva Unidad'"
        size="sm"
      >
        <form @submit.prevent="guardarUnidad" class="space-y-4 text-slate-750 dark:text-slate-300">

          <div>
            <label class="block text-xs font-semibold text-slate-500 dark:text-slate-450 uppercase tracking-wide mb-1.5">
              Nombre <span class="text-red-500">*</span>
            </label>
            <input v-model="formUnidad.nombre" type="text" required placeholder="Ej. Central - Organización Territorial" :class="IC"/>
          </div>

          <div>
            <label class="block text-xs font-semibold text-slate-500 dark:text-slate-450 uppercase tracking-wide mb-1.5">
              Clave <span class="text-red-500">*</span>
            </label>
            <input v-model="formUnidad.clave" type="text" required maxlength="2" placeholder="Ej. OT" :class="IC"/>

            <p v-if="modoEditarUnidad" class="mt-1.5 text-[11px] text-amber-500 dark:text-amber-400 flex items-center gap-1">
              <svg class="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
              </svg>
              Cambiar la clave actualizará automáticamente a todos los usuarios de esta unidad.
            </p>
          </div>

          <div v-if="modoEditarUnidad">
            <label class="block text-xs font-semibold text-slate-500 dark:text-slate-450 uppercase tracking-wide mb-1.5">
              Estado
            </label>
            <select v-model="formUnidad.status" :class="IC">
              <option :value="1">Activa</option>
              <option :value="0">Inactiva</option>
            </select>
          </div>

        </form>

        <template #footer="{ close }">
          <AppButton variant="ghost" @click="close">Cancelar</AppButton>
          <AppButton variant="primary" :loading="guardandoUnidad" @click="guardarUnidad">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
            </svg>
            {{ modoEditarUnidad ? 'Actualizar' : 'Crear Unidad' }}
          </AppButton>
        </template>
      </AppModal>

    </div>
  </DashboardLayout>
</template>
