<script setup lang="ts">
import { useAuth } from '@/composables/useAuth'
import { useUiStore } from '@/stores/ui.store'
import { useSettingsStore } from '@/stores/settings.store'
import { useSweetAlert } from '@/composables/useSweetAlert'
import { PERFILES } from '@/utils/permissions'
import { useRoute } from 'vue-router'
import { computed } from 'vue'
import { useDark, useToggle } from '@vueuse/core'

const { logout, authStore } = useAuth()
const ui       = useUiStore()
const settings = useSettingsStore()
const route    = useRoute()
const { confirmar } = useSweetAlert()

const isDark = useDark()
const toggleDark = useToggle(isDark)

const handleLogout = async () => {
  const result = await confirmar('¿Cerrar sesión?', 'Tu sesión actual se cerrará.')
  if (result.isConfirmed) await logout()
}

/* Page title map → readable section name */
const PAGE_TITLES: Record<string, string> = {
  dashboard:      'Panel Principal',
  catalogo:       'Catálogo de Actividades',
  importar:       'Importar Catálogo',
  seguimiento:    'Seguimiento de Actividades',
  reportes:       'Reportes',
  usuarios:       'Gestión de Usuarios',
  configuracion:  'Configuración',
}

const pageTitle = computed(() => PAGE_TITLES[route.name as string] ?? 'SISECAOD')
const perfil    = computed(() => PERFILES[authStore.perfil] ?? `Perfil ${authStore.perfil}`)
</script>

<template>
  <header class="relative h-16 bg-white dark:bg-slate-900 border-b border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between px-6 flex-shrink-0 transition-colors duration-200">

    <!-- Left: toggle + breadcrumb -->
    <div class="flex items-center gap-4">
      <button
        @click="ui.toggleSidebar()"
        class="p-2 rounded-xl text-slate-400 hover:bg-slate-100 hover:text-iecm-purple dark:hover:bg-slate-800 dark:hover:text-iecm-purple-light transition-all duration-200"
        title="Alternar sidebar"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h7"/>
        </svg>
      </button>

      <!-- Page title -->
      <div class="hidden sm:block">
        <h2 class="text-sm font-semibold text-slate-800 dark:text-slate-200">{{ pageTitle }}</h2>
      </div>
    </div>

    <!-- Center: App Name -->
    <div class="absolute left-1/2 -translate-x-1/2 flex flex-col items-center justify-center pointer-events-none hidden lg:flex">
      <h1 class="text-sm font-bold text-slate-800 dark:text-slate-200 leading-tight tracking-wide">SISECAOD</h1>
      <p class="text-[10px] text-slate-400 dark:text-slate-500 font-medium uppercase tracking-wider mt-0.5">Sistema de Seguimiento de Actividades y Objetivos Distritales</p>
    </div>

    <!-- Right: status + user + logout -->
    <div class="flex items-center gap-3">



      <!-- Dark mode toggle -->
      <button
        @click="toggleDark()"
        class="p-2 rounded-xl text-slate-400 hover:bg-slate-100 hover:text-iecm-purple dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-iecm-purple-light transition-all duration-200"
        title="Alternar modo oscuro"
      >
        <!-- Icono sol (cuando está oscuro) -->
        <svg v-if="isDark" class="w-5 h-5 text-amber-400 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m0-12.728l.707.707m12.728 12.728l.707.707M12 8a4 4 0 100 8 4 4 0 000-8z"/>
        </svg>
        <!-- Icono luna (cuando está claro) -->
        <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"/>
        </svg>
      </button>


    </div>
  </header>
</template>
