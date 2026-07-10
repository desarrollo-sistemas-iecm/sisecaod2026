<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { gsap } from 'gsap'
import AuthLayout from '@/layouts/AuthLayout.vue'
import { useAuth } from '@/composables/useAuth'
import { useStatusPublico } from '@/composables/useStatusPublico'

const { login }                         = useAuth()
const { status, cargando, fetchStatus } = useStatusPublico()

const form    = ref({ usuario: '', contrasena: '' })
const loading = ref(false)
const showPwd = ref(false)

// Año siempre del cliente, nunca del backend
const anioActual = new Date().getFullYear()

const textoMes = computed(() => {
  if (cargando.value) return '—'
  if (!status.value.mes) return 'Sin periodo activo'
  const m = status.value.mes.charAt(0).toUpperCase() + status.value.mes.slice(1).toLowerCase()
  return `Periodo de ${m} ${anioActual}`
})

onMounted(async () => {
  fetchStatus()

  const tl = gsap.timeline({ defaults: { ease: 'power3.out' } })
  tl.from('.lp-logo',   { opacity: 0, y: -20, duration: 0.70, clearProps: 'opacity,transform' })
    .from('.lp-card',   { opacity: 0, y: 24,  duration: 0.70, clearProps: 'opacity,transform' }, '-=0.35')
    .from('.lp-title',  { opacity: 0, y: 12,  duration: 0.50, clearProps: 'opacity,transform' }, '-=0.40')
    .from('.lp-desc',   { opacity: 0, y: 8,   duration: 0.40, clearProps: 'opacity,transform' }, '-=0.30')
    .from('.lp-status', { opacity: 0, y: 10,  duration: 0.40, clearProps: 'opacity,transform' }, '-=0.25')
    .from('.lp-field',  { opacity: 0, y: 10,  duration: 0.38, stagger: 0.08, clearProps: 'opacity,transform' }, '-=0.30')
    .from('.lp-submit', { opacity: 0, y: 8,   duration: 0.32, clearProps: 'opacity,transform' }, '-=0.18')
    .from('.lp-footer', { opacity: 0,          duration: 0.38, clearProps: 'opacity' }, '-=0.10')
})

const handleSubmit = async () => {
  if (!form.value.usuario || !form.value.contrasena) return
  loading.value = true
  try {
    await login(form.value.usuario, form.value.contrasena)
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <AuthLayout>
    <!-- Layout v2: Logo hero arriba, paneles debajo, footer al fondo -->
    <div class="w-full max-w-5xl flex flex-col items-center gap-6 py-8 lg:py-10">

      <!-- ── LOGO HERO ─────────────────────────────────────────── -->
      <div class="lp-logo flex flex-col items-center gap-4 mb-2">
        <img
          src="@/assets/logos/logo-whitetxt.png"
          alt="IECM — SISECAOD Sistema de Seguimiento"
          class="h-24 lg:h-32 w-auto object-contain"
          style="filter: drop-shadow(0 0 32px rgba(138,92,220,0.30));"
          draggable="false"
        />
        <!-- Separador visual + nombre del sistema -->
        <div class="flex flex-col items-center gap-2 mt-2">
          <div class="flex items-center gap-3">
            <div class="h-px w-14 bg-white/20 rounded-full"></div>
            <span
              class="text-[28px] lg:text-[36px] font-extrabold text-white tracking-[0.12em] uppercase"
              style="letter-spacing: 0.16em;"
            >SISECAOD</span>
            <div class="h-px w-14 bg-white/20 rounded-full"></div>
          </div>
          <p class="text-[11px] lg:text-[13px] font-semibold uppercase tracking-[0.22em] text-white/40">
            Sistema de Seguimiento de Actividades y Objetivos Distritales
          </p>
        </div>
      </div>

      <!-- ── BLOQUE DE PANELES ──────────────────────────────────── -->
      <div
        class="lp-card w-full grid grid-cols-1 lg:grid-cols-12 overflow-hidden rounded-2xl"
        style="
          min-height: 500px;
          border: 1px solid rgba(255,255,255,0.06);
          box-shadow: 0 24px 70px rgba(0,0,0,0.55), 0 0 0 1px rgba(138,92,220,0.08);
        "
      >

        <!-- PANEL IZQUIERDO — Identidad + Estado de Captura -->
        <div
          class="col-span-1 lg:col-span-7 flex flex-col justify-between
                 p-8 lg:p-12 border-b lg:border-b-0 lg:border-r"
          style="
            background: rgba(13,11,30,0.72);
            border-color: rgba(255,255,255,0.06);
            backdrop-filter: blur(6px);
          "
        >
          <!-- Propósito editorial -->
          <div class="my-8 lg:my-0">
            <h2
              class="lp-title text-[clamp(1.55rem,2.8vw,2.3rem)] font-extrabold text-white leading-[1.08]"
              style="letter-spacing: -0.025em; text-wrap: balance;"
            >
              Control de actividades y metas institucionales
            </h2>
            <p class="lp-desc text-[13px] text-white/50 leading-relaxed mt-4 max-w-sm font-medium">
              Plataforma del Instituto Electoral de la Ciudad de México para la planeación,
              registro y monitoreo del cumplimiento de metas operativas y de proyectos.
            </p>
          </div>

          <!-- Card Estado de Captura -->
          <div
            class="lp-status rounded-xl p-4"
            style="
              background: rgba(255,255,255,0.03);
              border: 1px solid rgba(255,255,255,0.07);
            "
          >
            <div class="flex items-center justify-between mb-2.5">
              <span class="text-[10px] font-bold uppercase tracking-[0.14em] text-white/40">
                Estado de Captura
              </span>
              <span
                class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider"
                :class="status.abierto
                  ? 'bg-emerald-500/12 text-emerald-400 border border-emerald-500/20'
                  : 'bg-red-500/12 text-red-400 border border-red-500/20'"
              >
                <span
                  class="w-1.5 h-1.5 rounded-full"
                  :class="status.abierto ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'"
                />
                {{ status.abierto ? 'Activo' : 'Cerrado' }}
              </span>
            </div>
            <p class="text-[13px] text-white/80 font-semibold mb-1">
              {{ textoMes }}
            </p>
            <p class="text-[11px] text-white/40 leading-relaxed">
              <template v-if="status.abierto">
                El portal se encuentra abierto para el registro y validación del cumplimiento
                de actividades ordinarias y especiales.
              </template>
              <template v-else>
                El periodo de captura está cerrado. Contacta al administrador de tu distrito
                para más información.
              </template>
            </p>
          </div>
        </div>

        <!-- PANEL DERECHO — Formulario de acceso -->
        <div
          class="col-span-1 lg:col-span-5 flex flex-col justify-between p-8 lg:p-12"
          style="
            background: rgba(255, 255, 255, 0.16);
            border-left: 1px solid rgba(255, 255, 255, 0.20);
            backdrop-filter: blur(20px);
            box-shadow: inset 0 1px 0 0 rgba(255, 255, 255, 0.10);
          "
        >
          <!-- Encabezado del formulario -->
          <div>
            <h3 class="text-[15px] font-bold text-white tracking-tight">
              Acceso al portal
            </h3>
            <p class="text-[12px] text-white/35 mt-1 leading-relaxed">
              Ingresa tus credenciales oficiales de acceso
            </p>
          </div>

          <!-- Formulario -->
          <form
            @submit.prevent="handleSubmit"
            class="space-y-5 my-8 lg:my-0"
            autocomplete="off"
            novalidate
          >
            <!-- Campo Usuario -->
            <div class="lp-field">
              <label
                for="login-usuario"
                class="block text-[10px] font-bold uppercase tracking-[0.14em] text-white/60 mb-2"
              >
                Usuario
              </label>
              <div class="relative group">
                <span
                  class="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/25
                         group-focus-within:text-fuchsia-400 transition-colors duration-150"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                  </svg>
                </span>
                <input
                  id="login-usuario"
                  v-model="form.usuario"
                  type="text"
                  placeholder="Ej. dtto01"
                  autocomplete="off"
                  class="w-full text-white text-[13px] placeholder-white/35
                         px-4 py-2.5 pl-10 rounded-xl outline-none
                         transition-shadow duration-200"
                  style="
                    background: rgba(13, 11, 30, 0.50);
                    border: 1px solid rgba(255, 255, 255, 0.08);
                  "
                  @focus="($event.target as HTMLInputElement).style.cssText +=
                    'border-color:rgba(123,79,191,0.7);box-shadow:0 0 0 3px rgba(123,79,191,0.2)'"
                  @blur="($event.target as HTMLInputElement).style.cssText =
                    'background:rgba(13,11,30,0.50);border:1px solid rgba(255,255,255,0.08)'"
                />
              </div>
            </div>

            <!-- Campo Contraseña -->
            <div class="lp-field">
              <label
                for="login-contrasena"
                class="block text-[10px] font-bold uppercase tracking-[0.14em] text-white/60 mb-2"
              >
                Contraseña
              </label>
              <div class="relative group">
                <span
                  class="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/25
                         group-focus-within:text-fuchsia-400 transition-colors duration-150"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002
                         2zm10-10V7a4 4 0 00-8 0v4h8z"/>
                  </svg>
                </span>
                <input
                  id="login-contrasena"
                  v-model="form.contrasena"
                  :type="showPwd ? 'text' : 'password'"
                  placeholder="Tu contraseña"
                  autocomplete="new-password"
                  class="w-full text-white text-[13px] placeholder-white/35
                         px-4 py-2.5 pl-10 pr-11 rounded-xl outline-none
                         transition-shadow duration-200"
                  style="
                    background: rgba(13, 11, 30, 0.50);
                    border: 1px solid rgba(255, 255, 255, 0.08);
                  "
                  @focus="($event.target as HTMLInputElement).style.cssText +=
                    'border-color:rgba(123,79,191,0.7);box-shadow:0 0 0 3px rgba(123,79,191,0.2)'"
                  @blur="($event.target as HTMLInputElement).style.cssText =
                    'background:rgba(13,11,30,0.50);border:1px solid rgba(255,255,255,0.08)'"
                />
                <button
                  type="button"
                  :aria-label="showPwd ? 'Ocultar contraseña' : 'Mostrar contraseña'"
                  @click="showPwd = !showPwd"
                  class="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/25
                         hover:text-fuchsia-400 transition-colors duration-150 focus:outline-none"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path v-if="!showPwd" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0zM2.458 12C3.732 7.943 7.523 5 12 5
                         c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7
                         -4.477 0-8.268-2.943-9.542-7z"/>
                    <path v-else stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7
                         a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242
                         M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0
                         A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411
                         m0 0L21 21"/>
                  </svg>
                </button>
              </div>
            </div>

            <!-- Botón submit -->
            <button
              id="login-submit"
              type="submit"
              :disabled="loading || !form.usuario || !form.contrasena"
              class="lp-submit w-full flex items-center justify-center gap-2
                     text-[13px] font-bold text-white py-3 px-4 rounded-xl
                     transition-[box-shadow] duration-150
                     disabled:opacity-40 disabled:cursor-not-allowed"
              style="
                background: linear-gradient(135deg, #5B21B6, #4A1D8F);
                box-shadow: 0 4px 18px rgba(74,29,143,0.35);
                margin-top: 1.5rem;
              "
              @mouseenter="($event.target as HTMLElement).style.boxShadow = '0 6px 22px rgba(74,29,143,0.50)'"
              @mouseleave="($event.target as HTMLElement).style.boxShadow = '0 4px 18px rgba(74,29,143,0.35)'"
              @mousedown="($event.target as HTMLElement).style.transform = 'scale(0.97)'"
              @mouseup="($event.target as HTMLElement).style.transform = 'scale(1)'"
            >
              <svg v-if="loading" class="animate-spin w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
              <span>{{ loading ? 'Verificando credenciales…' : 'Acceder al sistema' }}</span>
            </button>
          </form>

          <!-- Footer dentro del panel derecho -->
          <p class="lp-footer text-[10px] text-white/20 leading-relaxed tracking-wide text-center">
            Instituto Electoral de la Ciudad de México &copy; {{ anioActual }}<br />
            Todos los derechos reservados.
          </p>
        </div>

      </div>
    </div>
  </AuthLayout>
</template>
