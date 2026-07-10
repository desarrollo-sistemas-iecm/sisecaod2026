<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'
import { useSettingsStore } from '@/stores/settings.store'
import { useUiStore } from '@/stores/ui.store'
import { canAccess, PERFILES } from '@/utils/permissions'
import { useParticles } from '@/composables/useParticles'

const canvasRef = ref<HTMLCanvasElement | null>(null)
useParticles(canvasRef, {
  particleCount: 25,
  maxDist: 100,
  color: '138, 92, 220',
  velocityMultiplier: 0.2,
  alphaMultiplier: 0.5,
  dotSize: 1.2,
  pauseOnHidden: true
})

import { useAuth } from '@/composables/useAuth'
import { useSweetAlert } from '@/composables/useSweetAlert'

const { logout } = useAuth()
const { confirmar } = useSweetAlert()

const handleLogout = async () => {
  const result = await confirmar('¿Cerrar sesión?', 'Tu sesión actual se cerrará.')
  if (result.isConfirmed) await logout()
}

const auth     = useAuthStore()
const settings = useSettingsStore()
const ui       = useUiStore()
const route    = useRoute()

interface NavItem {
  name:  string
  label: string
  icon:  string
  roles: number[]
  activeColor: string
  hoverColor: string
  indicatorClass: string
}

const navItems = computed((): NavItem[] => ([
  {
    name:  'dashboard',
    label: 'Inicio',
    roles: [1,2,3,4,5],
    activeColor: 'text-blue-400 drop-shadow-sm',
    hoverColor: 'group-hover:text-blue-400/70',
    indicatorClass: 'bg-blue-400',
    icon:  `<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>
            </svg>`,
  },
  {
    name:  'catalogo',
    label: 'Actividades a desarrollar',
    roles: [1,2,3,4],
    activeColor: 'text-emerald-400 drop-shadow-sm',
    hoverColor: 'group-hover:text-emerald-400/70',
    indicatorClass: 'bg-emerald-400',
    icon:  `<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"/>
            </svg>`,
  },
  {
    name:  'importar',
    label: 'Importar Catálogo de Act.',
    roles: [1, 5],
    activeColor: 'text-iecm-amber drop-shadow-sm',
    hoverColor: 'group-hover:text-iecm-amber/70',
    indicatorClass: 'bg-iecm-amber',
    icon:  `<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/>
            </svg>`,
  },
  {
    name:  'seguimiento',
    label: 'Seguimiento',
    roles: [3, 5],
    activeColor: 'text-rose-400 drop-shadow-sm',
    hoverColor: 'group-hover:text-rose-400/70',
    indicatorClass: 'bg-rose-400',
    icon:  `<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>`,
  },
  {
    name:  'reportes',
    label: 'Reportes',
    roles: [1,2,3,4],
    activeColor: 'text-teal-400 drop-shadow-sm',
    hoverColor: 'group-hover:text-teal-400/70',
    indicatorClass: 'bg-teal-400',
    icon:  `<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
            </svg>`,
  },
  {
    name:  'usuarios',
    label: 'Usuarios',
    roles: [5],
    activeColor: 'text-purple-400 drop-shadow-sm',
    hoverColor: 'group-hover:text-purple-400/70',
    indicatorClass: 'bg-purple-400',
    icon:  `<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/>
            </svg>`,
  },
].filter(i => canAccess(Number(auth.user?.perfil ?? 0), i.roles))))

const isActive = (name: string) => route.name === name

const perfil = computed(() => PERFILES[auth.perfil] ?? `Perfil ${auth.perfil}`)
const initials = computed(() => {
  const n = auth.user?.nombre ?? ''
  const parts = n.trim().split(' ')
  return parts.length >= 2
    ? (parts[0][0] + parts[1][0]).toUpperCase()
    : n.substring(0, 2).toUpperCase()
})
</script>

<template>
  <aside
    id="sidebar"
    class="relative w-64 flex flex-col h-full flex-shrink-0 overflow-hidden bg-[#0B1120] border-r border-white/5"
  >
    <canvas ref="canvasRef" aria-hidden="true" class="absolute inset-0 w-full h-full pointer-events-none" style="z-index: 0;" />
    
    <!-- ── Brand ── -->
    <div class="relative z-10 px-5 py-5 flex-shrink-0">
      <div class="flex items-center justify-center transition-all duration-300 w-full" :class="ui.sidebarOpen ? 'px-2' : 'px-0'">
        <div class="flex items-center justify-center flex-shrink-0 transition-all duration-300" :class="ui.sidebarOpen ? 'h-20 w-auto' : 'h-10 w-10'">
          <img v-if="ui.sidebarOpen" src="@/assets/logos/logo-whitetxt.png" alt="IECM Logo" class="h-full w-auto object-contain drop-shadow-md" />
          <img v-else src="@/assets/logos/logo-white.svg" alt="IECM Logo" class="w-full h-full object-contain drop-shadow-md" />
        </div>
      </div>
    </div>

    <!-- ── Periodo badge ── -->
    <div v-if="ui.sidebarOpen && settings.periodo" class="px-4 pb-4 flex-shrink-0 transition-opacity duration-200">
      <div
        class="rounded-xl px-3 py-2 text-xs flex items-center gap-2"
        :class="settings.periodo.sistemaAbierto
          ? 'bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/20'
          : 'bg-red-500/15 text-red-300 ring-1 ring-red-500/20'"
      >
        <span class="w-1.5 h-1.5 rounded-full flex-shrink-0"
          :class="settings.periodo.sistemaAbierto ? 'bg-emerald-400' : 'bg-red-400'"></span>
        <span>
          Periodo: <strong class="font-semibold">{{ settings.periodo.nombreMes }} {{ settings.periodo.anio }}</strong>
        </span>
      </div>
    </div>

    <!-- ── Separator label ── -->
    <div v-if="ui.sidebarOpen" class="relative z-10 px-5 mb-1 flex-shrink-0 transition-opacity duration-200">
      <p class="text-xs font-semibold text-white/25 uppercase tracking-widest">Menú</p>
    </div>

    <!-- ── Main Navigation ── -->
    <nav class="relative z-10 flex-1 px-3 py-1 space-y-0.5 overflow-y-auto">
      <RouterLink
        v-for="item in navItems"
        :key="item.name"
        :to="{ name: item.name }"
        class="group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 relative"
        :class="[
          isActive(item.name)
            ? 'bg-white/15 text-white shadow-sm'
            : 'text-white/55 hover:bg-white/8 hover:text-white/90',
          !ui.sidebarOpen ? 'justify-center px-0 w-12 mx-auto' : ''
        ]"
        :title="!ui.sidebarOpen ? item.label : ''"
      >
        <!-- Active indicator -->
        <span
          v-if="isActive(item.name)"
          class="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-r-full"
          :class="[item.indicatorClass, { 'left-1': !ui.sidebarOpen }]"
        ></span>

        <!-- Icon -->
        <span
          class="flex items-center justify-center flex-shrink-0 transition-colors"
          :class="isActive(item.name) ? item.activeColor : `text-purple-200/50 ${item.hoverColor}`"
          v-html="item.icon"
        ></span>

        <!-- Label -->
        <span v-if="ui.sidebarOpen" class="truncate transition-opacity duration-200">{{ item.label }}</span>
      </RouterLink>
    </nav>

    <!-- ── Footer (User Info) ── -->
    <div class="relative z-10 flex-shrink-0 mx-3 mt-2 mb-1 p-3 rounded-xl ring-1 ring-white/10 bg-white/5 transition-all duration-200">
      <div class="flex items-center gap-3" :class="{ 'justify-center': !ui.sidebarOpen }">
        <div class="w-9 h-9 rounded-xl bg-gradient-to-br from-iecm-purple to-purple-800 flex items-center justify-center text-white text-xs font-black flex-shrink-0 shadow-md">
          {{ initials }}
        </div>
        <div v-if="ui.sidebarOpen" class="overflow-hidden min-w-0 flex-1 transition-opacity duration-200">
          <p class="text-white text-xs font-semibold truncate">{{ auth.user?.nombre }}</p>
          <p class="text-white/40 text-xs truncate mt-0.5">{{ perfil }}</p>
        </div>
      </div>
    </div>

    <!-- ── Logout Button ── -->
    <div class="relative z-10 flex-shrink-0 px-3 pb-3 pt-1">
      <button
        @click="handleLogout"
        class="group flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200"
        :class="[
          !ui.sidebarOpen ? 'justify-center px-0 w-12 mx-auto' : '',
          'hover:bg-red-600/15'
        ]"
        :title="!ui.sidebarOpen ? 'Cerrar sesión' : ''"
      >
        <span class="flex items-center justify-center flex-shrink-0 transition-colors text-red-500 group-hover:text-red-400">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
          </svg>
        </span>
        <span v-if="ui.sidebarOpen" class="truncate transition-opacity duration-200 text-white/90 group-hover:text-white">Cerrar sesión</span>
      </button>
    </div>
  </aside>
</template>
