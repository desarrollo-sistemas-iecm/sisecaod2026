<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, watch, nextTick } from 'vue'
import { gsap } from 'gsap'
import DashboardLayout from '@/layouts/DashboardLayout.vue'
import { useAuthStore }     from '@/stores/auth.store'
import { useSettingsStore } from '@/stores/settings.store'
import { getNombreMes }     from '@/utils/format'
import { PERFILES, canAccess } from '@/utils/permissions'
import { api }              from '@/services/api'
import { RouterLink }       from 'vue-router'

const auth     = useAuthStore()
const settings = useSettingsStore()

/* ── Chart filters (Perfil 1) ── */
const anioSelected     = ref(2026)
const distritoSelected = ref('todos')
const loadingChart     = ref(false)
const chartEmpty       = ref(false)
const anios            = ref<number[]>([2026])  // PERFIL 3 (PIDE NUEVO)

const isReadOnly      = computed(() => auth.perfil === 2)
const isCentralAdmin  = computed(() => auth.perfil === 1 || auth.perfil === 4 || auth.perfil === 5)
const isCaptureUser   = computed(() => auth.perfil === 3)

/* ── KPIs Ejecutivos (Perfil 1) ── */
const kpiAvance = ref({ total: 0, capturadas: 0, pct: 0, loading: true })
const kpiDias   = ref({ restantes: 0, pct: 0, vencido: false, label: '' })

const getKpiDiasColor = computed(() => {
  const p = kpiDias.value.pct
  if (p <= 21) return { gradient: 'url(#gradRojo)', shadow: 'rgba(239,68,68,0.5)', textClass: 'text-red-500' }
  if (p <= 50) return { gradient: 'url(#gradNaranja)', shadow: 'rgba(249,115,22,0.4)', textClass: 'text-orange-500' }
  if (p <= 75) return { gradient: 'url(#gradAmarillo)', shadow: 'rgba(234,179,8,0.4)', textClass: 'text-yellow-500' }
  return { gradient: 'url(#gradVerde)', shadow: 'rgba(34,197,94,0.4)', textClass: 'text-green-500' }
})

const circleAvance = ref<SVGElement | null>(null)
const circleDias   = ref<SVGElement | null>(null)

const fetchGlobalKPIs = async () => {
  if (!isCentralAdmin.value) {
    kpiAvance.value.loading = false
    animarKPIs()
    return
  }
  kpiAvance.value.loading = true
  try {
    const res = await api.get('/reportes/avance-grafica', {
      params: { anio: anioSelected.value, distrito: 'todos' }
    })
    const json = res.data.data || []
    let total = 0
    let capturadas = 0
    for (const d of json) {
      if (d.meses) {
        for (const m of d.meses) {
          total += m.actTotal || 0
          capturadas += m.actReg || 0
        }
      }
    }
    kpiAvance.value.total = total
    kpiAvance.value.capturadas = capturadas
    kpiAvance.value.pct = total > 0 ? (capturadas / total) * 100 : 0
  } catch (err) {
    console.error('Error fetching global KPIs:', err)
  } finally {
    kpiAvance.value.loading = false
    animarKPIs()
  }
}

const calcularDiasPeriodo = () => {
  const p = settings.periodo
  if (!p || !p.fechaInicio || !p.fechaFin) {
    kpiDias.value.vencido = true
    kpiDias.value.label = 'Sin periodo'
    kpiDias.value.pct = 0
    return
  }
  
  // Extraer la parte de la fecha YYYY-MM-DD para forzar la medianoche local correctamente
  const inicio = new Date(p.fechaInicio.split('T')[0] + 'T00:00:00')
  const fin = new Date(p.fechaFin.split('T')[0] + 'T23:59:59')
  const hoy = new Date()
  // Calculate calendar days difference (strip hours to avoid partial day ceiling issues)
  const hoyStr = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-${String(hoy.getDate()).padStart(2, '0')}`
  const hoyMidnight = new Date(hoyStr + 'T00:00:00')
  const finMidnight = new Date(p.fechaFin.split('T')[0] + 'T00:00:00')
  
  const totalDiasMs = finMidnight.getTime() - inicio.getTime()
  const diasTotales = Math.round(totalDiasMs / (1000 * 60 * 60 * 24))
  
  const restantesMs = finMidnight.getTime() - hoyMidnight.getTime()
  const restantes = Math.round(restantesMs / (1000 * 60 * 60 * 24))
  
  const porcentajeRestante = diasTotales > 0 ? (restantes / diasTotales) * 100 : 0
  
  if (restantes < 0) {
    kpiDias.value.vencido = true
    kpiDias.value.restantes = Math.abs(restantes)
    kpiDias.value.label = 'días de atraso'
    kpiDias.value.pct = 0
  } else {
    kpiDias.value.vencido = false
    kpiDias.value.restantes = restantes
    kpiDias.value.label = restantes === 1 ? 'día restante' : 'días restantes'
    kpiDias.value.pct = Math.min(100, Math.max(0, porcentajeRestante))
  }
}

const animarKPIs = () => {
  nextTick(() => {
    if (circleAvance.value) {
      const circ = 2 * Math.PI * 54
      const offset = circ - (kpiAvance.value.pct / 100) * circ
      gsap.fromTo(circleAvance.value, 
        { strokeDashoffset: circ }, 
        { strokeDashoffset: offset, duration: 1.5, ease: 'power3.out' }
      )
    }
    if (circleDias.value) {
      const circ = 2 * Math.PI * 54
      const offset = circ - (kpiDias.value.pct / 100) * circ
      gsap.fromTo(circleDias.value, 
        { strokeDashoffset: circ }, 
        { strokeDashoffset: offset, duration: 1.5, ease: 'power3.out' }
      )
    }
  })
}

watch(() => settings.periodo, () => {
  calcularDiasPeriodo()
  if (!kpiAvance.value.loading) animarKPIs()
}, { immediate: true })

watch(anioSelected, () => {
  if (isCentralAdmin.value) fetchGlobalKPIs()
})

/* ── Custom Dropdowns State & Handlers ── */
const dropdownAnioOpen = ref(false)
const dropdownDistritoOpen = ref(false)

const toggleDropdownAnio = () => {
  dropdownAnioOpen.value = !dropdownAnioOpen.value
  dropdownDistritoOpen.value = false
}

const toggleDropdownDistrito = () => {
  dropdownDistritoOpen.value = !dropdownDistritoOpen.value
  dropdownAnioOpen.value = false
}

const selectAnio = (ano: number) => {
  anioSelected.value = ano
  dropdownAnioOpen.value = false
}

const selectDistrito = (dist: string) => {
  distritoSelected.value = dist
  dropdownDistritoOpen.value = false
}

const closeDropdowns = (e: MouseEvent) => {
  const target = e.target as HTMLElement
  if (!target.closest('.dropdown-container')) {
    dropdownAnioOpen.value = false
    dropdownDistritoOpen.value = false
  }
}

/* ── Highcharts zone colors (existing logic preserved) ── */
const zones = [
  { value: 21.001, color: '#ef4444' },
  { value: 50.001, color: '#f97316' },
  { value: 99.999, color: '#eab308' },
  { color: '#22c55e' }
]

/* ── Load external script helper ── */
const loadScript = (src: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) { resolve(); return }
    const s = document.createElement('script')
    s.src = src
    s.onload = () => resolve()
    s.onerror = () => reject()
    document.head.appendChild(s)
  })
}

/* ── Fetch available years ── */
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

/* ── Initialize & render Highcharts (Perfil 1 only) ── */
const initHighcharts = async () => {
  if (!isCentralAdmin.value) return
  try {
    loadingChart.value = true
    fetchGlobalKPIs() // Fetch KPIs together with charts
    await loadScript('https://code.highcharts.com/highcharts.js')
    await loadScript('https://code.highcharts.com/modules/drilldown.js')
    await renderGrafica()
  } catch (err) {
    console.error('Error loading Highcharts:', err)
  } finally {
    loadingChart.value = false
  }
}

const animarBarras = () => {
  requestAnimationFrame(() => {
    const points = document.querySelectorAll('#container-hc .highcharts-series-group rect.highcharts-point')
    points.forEach(point => {
      const finalHeight = parseFloat(point.getAttribute('height') || '0')
      const finalY = parseFloat(point.getAttribute('y') || '0')
      if (finalHeight <= 0) return

      const baseY = finalY + finalHeight

      // Forzar altura 0 en la base
      point.setAttribute('height', '0')
      point.setAttribute('y', baseY.toString())

      // Animar de abajo hacia arriba de forma segura con GSAP
      gsap.to(point, {
        attr: { height: finalHeight, y: finalY },
        duration: 0.85,
        ease: 'power2.out',
        delay: 0.05
      })
    })
  })
}

const renderGrafica = async () => {
  if (!isCentralAdmin.value) return
  try {
    const res  = await api.get('/reportes/avance-grafica', {
      params: { anio: anioSelected.value, distrito: distritoSelected.value }
    })
    const json = res.data.data || []

    let dSeries: any[]  = [{ name: '', data: [], zones }]
    let dDrilldown: any = {}

    if (distritoSelected.value !== 'todos') {
      dSeries[0].name = 'Actividades completadas'
      const { meses } = json[0] || { meses: [] }
      for (const { mes, actTotal, actReg } of meses) {
        dSeries[0].data.push({
          name: mes,
          y: parseFloat(((actReg * 100) / (actTotal || 1)).toFixed(2)) || 0,
          t: `${actReg} de ${actTotal}`,
          drilldown: null
        })
      }
    } else {
      dSeries[0].name = 'Avance de los distritos'
      dDrilldown = { series: [] }
      for (const { distrito: dist, meses } of json) {
        const totalA = meses.reduce((s: number, m: any) => s + m.actTotal, 0)
        const totalR = meses.reduce((s: number, m: any) => s + m.actReg,   0)
        dSeries[0].data.push({
          name: `Distrito ${dist}`,
          y: parseFloat(((totalR * 100) / (totalA || 1)).toFixed(2)) || 0,
          t: `${totalR} de ${totalA}`,
          drilldown: `Distrito ${dist}`
        })
        const data = meses.map((m: any) => ({
          name: m.mes,
          y: parseFloat(((m.actReg * 100) / (m.actTotal || 1)).toFixed(2)) || 0,
          t: `${m.actReg} de ${m.actTotal}`
        }))
        dDrilldown.series.push({ name: 'Actividades completadas', id: `Distrito ${dist}`, data, zones })
      }
    }

    // Comprobar si no hay actividades capturadas (Empty State)
    chartEmpty.value = dSeries[0].data.every((d: any) => d.y === 0)

    const isDark = document.documentElement.classList.contains('dark')
    const themeTextColor = isDark ? '#f1f5f9' : '#1e293b'
    const themeMutedColor = isDark ? '#94a3b8' : '#64748b'
    const themeGridColor = isDark ? '#334155' : '#f1f5f9'

    // @ts-ignore
    Highcharts.chart('container-hc', {
      chart: {
        backgroundColor: 'transparent',
        type: 'column',
        height: 380,
        spacingBottom: 15,
        spacingTop: 10,
        style: { fontFamily: 'Inter, system-ui, sans-serif' },
        events: {
          load() {
            animarBarras()
          },
          drilldown() {
            setTimeout(() => { animarBarras() }, 60)
            gsap.fromTo('#container-hc', 
              { opacity: 0, x: 25 }, 
              { opacity: 1, x: 0, duration: 0.45, ease: 'power2.out' }
            )
          },
          drillup() {
            setTimeout(() => { animarBarras() }, 60)
            gsap.fromTo('#container-hc', 
              { opacity: 0, x: -25 }, 
              { opacity: 1, x: 0, duration: 0.45, ease: 'power2.out' }
            )
          }
        }
      },
      title: {
        text: 'Actividades completadas',
        style: { fontSize: '14px', fontWeight: '700', color: themeTextColor }
      },
      subtitle: distritoSelected.value === 'todos'
        ? { text: 'Haz clic en el distrito para ver desglose mensual', style: { color: themeMutedColor } }
        : {},
      xAxis: {
        type: 'category',
        labels: { style: { color: themeMutedColor, fontSize: '11px', fontWeight: '500' } },
        lineColor: isDark ? '#334155' : '#e2e8f0', tickColor: isDark ? '#334155' : '#e2e8f0'
      },
      yAxis: {
        min: 0, max: 100,
        title: { text: 'Porcentaje de avance', style: { color: themeMutedColor, fontSize: '11px', fontWeight: '500' } },
        labels: {
          format: '{value}%',
          style: { color: themeMutedColor, fontSize: '11px' }
        },
        gridLineColor: themeGridColor
      },
      legend: { enabled: false },
      plotOptions: {
        column: {
          pointPadding: 0.12,
          groupPadding: 0.12,
          borderWidth: 0,
          borderRadius: 6
        },
        series: {
          cursor: 'pointer',
          borderWidth: 0,
          animation: false,
          dataLabels: { enabled: false }
        }
      },
      tooltip: {
        useHTML: true,
        shadow: false,
        borderWidth: 0,
        backgroundColor: 'transparent',
        padding: 0,
        hideDelay: 100,
        formatter: function (this: any) {
          const isDark = document.documentElement.classList.contains('dark')
          const point = this.point
          const rangeColor = point.color || '#6366f1'
          
          return `
            <div class="px-4 py-3 rounded-xl border shadow-xl min-w-[200px] transition-all duration-100 ease-out
                        ${isDark 
                          ? 'bg-slate-950/90 border-slate-800 text-slate-100' 
                          : 'bg-white/95 border-slate-100/80 text-slate-800'}"
                 style="transform: scale(0.98); animation: tooltipEnter 0.15s cubic-bezier(0.16, 1, 0.3, 1) forwards;">
              <div class="flex items-center justify-between gap-3 mb-1.5 pb-1.5 border-b ${isDark ? 'border-slate-800/80' : 'border-slate-100'}">
                <span class="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">${this.series.name}</span>
                <span class="w-2 h-2 rounded-full" style="background-color: ${rangeColor}"></span>
              </div>
              <div class="space-y-1">
                <p class="text-xs font-extrabold ${isDark ? 'text-slate-200' : 'text-slate-700'}">${point.name}</p>
                <div class="flex items-baseline gap-1">
                  <span class="text-lg font-black" style="color: ${rangeColor}">${point.y}%</span>
                  <span class="text-[10px] text-slate-450 dark:text-slate-500 font-medium">de avance</span>
                </div>
                <p class="text-[10px] text-slate-400 dark:text-slate-500 mt-1 flex items-center gap-1">
                  <svg class="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
                  </svg>
                  ${point.options.t || ''} actividades
                </p>
              </div>
            </div>
            <style>
              @keyframes tooltipEnter {
                to { transform: scale(1); opacity: 1; }
              }
            </style>
          `
        }
      },
      series: dSeries,
      drilldown: dDrilldown,
      credits: { enabled: false }
    })
  } catch (err) {
    console.error('Error rendering chart:', err)
  }
}

onMounted(async () => {
  document.addEventListener('click', closeDropdowns)
  await settings.fetchPeriodo()
  if (isCentralAdmin.value) {
    await fetchAnios()
  }
  await nextTick()
  // Animate cards (check if they exist to avoid GSAP warnings during hot-reloads)
  const statCards = document.querySelectorAll('.stat-card')
  if (statCards.length > 0) {
    gsap.from(statCards, {
      opacity: 0, y: 22, stagger: 0.1, duration: 0.5, ease: 'back.out(1.4)', clearProps: 'opacity,transform'
    })
  }

  const quickCards = document.querySelectorAll('.quick-card')
  if (quickCards.length > 0) {
    gsap.from(quickCards, {
      opacity: 0, y: 16, stagger: 0.08, duration: 0.45, ease: 'power2.out', delay: 0.2, clearProps: 'opacity,transform'
    })
  }
  await initHighcharts()
})

onUnmounted(() => {
  document.removeEventListener('click', closeDropdowns)
})

watch([anioSelected, distritoSelected], () => { renderGrafica() })

/* ── Stat cards ── */
const stats = computed(() => {
  return [
    {
      label: 'Mes de captura',
      value: settings.periodo?.sistemaAbierto
        ? `${getNombreMes(settings.periodo.mesActivo ?? 0)} ${settings.periodo.anio}`
        : 'Sistema cerrado',
      sublabel: settings.periodo?.sistemaAbierto
        ? `${settings.periodo.fechaInicio ? settings.periodo.fechaInicio.split('T')[0].split('-').reverse().join('/') : ''} — ${settings.periodo.fechaFin ? settings.periodo.fechaFin.split('T')[0].split('-').reverse().join('/') : ''}`
        : 'Sin periodo activo',
      icon: `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
               <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                 d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
             </svg>`,
      iconBg: settings.periodo?.sistemaAbierto ? 'bg-iecm-purple/10 text-iecm-purple dark:bg-iecm-purple-light/15 dark:text-iecm-purple-light' : 'bg-red-500/10 text-red-500',
      border:  '',
      dot:     settings.periodo?.sistemaAbierto ? 'bg-emerald-500' : 'bg-red-500',
      dotLabel: settings.periodo?.sistemaAbierto ? 'Abierto' : 'Cerrado',
      dotColor: settings.periodo?.sistemaAbierto ? 'text-emerald-600' : 'text-red-500',
    },
  ]
})

/* ── Quick links ── */
const quickLinks = computed(() => {
  const links = [
    {
      to: 'catalogo',
      label: 'Actividades a desarrollar',
      sublabel: 'Ver actividades',
      roles: [1,2,3,4],
      icon: `<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
               <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                 d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"/>
             </svg>`,
      color: 'text-violet-650 dark:text-violet-400 bg-violet-50 dark:bg-violet-950/20'
    },
    {
      to: 'seguimiento',
      label: 'Seguimiento',
      sublabel: 'Capturar actividades',
      roles: [3, 5],
      icon: `<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
               <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                 d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
             </svg>`,
      color: 'text-emerald-650 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/20'
    },
    {
      to: 'reportes',
      label: 'Reportes',
      sublabel: 'Ver y descargar',
      roles: [1,2,3,4],
      icon: `<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
               <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                 d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
             </svg>`,
      color: 'text-blue-650 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/20'
    },
    {
      to: 'importar',
      label: 'Importar Catálogo de Act.',
      sublabel: 'Cargar catálogo',
      roles: [1, 5],
      icon: `<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
               <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                 d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/>
             </svg>`,
      color: 'text-orange-650 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/20'
    },
  ]
  return links.filter(l => canAccess(auth.user?.perfil, l.roles))
})
</script>

<template>
  <DashboardLayout>

    <!-- ── Welcome header ── -->
    <div class="mb-6">
      <div class="flex items-center gap-2 mb-1">
        <span class="text-xl animate-bounce"></span>
        <h1 class="text-xl font-bold text-slate-800 dark:text-slate-100 transition-colors">
          Bienvenido, <span class="text-iecm-purple dark:text-iecm-purple-light">{{ auth.user?.nombre }}</span>
        </h1>
      </div>
      <p class="text-slate-400 dark:text-slate-500 text-sm">Panel principal · SISECAOD {{ anioSelected }}</p>
    </div>

    <!-- ── Header Section: Stat & Quick Links ── -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      
      <!-- Stats Column (Junio) -->
      <div v-if="stats.length > 0" class="col-span-1 flex flex-col gap-4">
        <div
          v-for="stat in stats"
          :key="stat.label"
          class="stat-card relative bg-white dark:bg-[#0B1120] rounded-3xl border border-iecm-purple/15 dark:border-white/5 p-8 shadow-iecm dark:shadow-[0_20px_40px_rgba(0,0,0,0.4)] transition-all duration-300 flex flex-col h-full hover:border-slate-200 dark:hover:border-white/10"
        >
          <div class="flex items-start justify-between mb-6">
            <!-- Icon badge -->
            <div class="flex items-center justify-center w-12 h-12 rounded-2xl flex-shrink-0 shadow-sm dark:shadow-lg" :class="stat.iconBg" v-html="stat.icon"></div>
            <!-- Trend badge (Status dot) -->
            <div class="flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10" :class="stat.dotColor">
              <span class="w-1.5 h-1.5 rounded-full shadow-[0_0_8px_currentColor]" :class="stat.dot"></span>
              {{ stat.dotLabel }}
            </div>
          </div>
          <div class="mt-auto">
            <p class="text-4xl font-black text-slate-800 dark:text-white tracking-tighter leading-tight mb-2" style="font-feature-settings: 'tnum';">{{ stat.value }}</p>
            <p class="text-xs font-bold text-slate-400 dark:text-white/50 uppercase tracking-[0.1em]">
              {{ stat.label }} <span v-if="stat.sublabel" class="opacity-70 ml-1 font-semibold capitalize">({{ stat.sublabel }})</span>
            </p>
          </div>
        </div>
      </div>

      <!-- Quick Links Column -->
      <div class="col-span-1 lg:col-span-2 flex flex-col">
        <h2 class="text-sm font-bold text-slate-700 dark:text-slate-300 mb-3 px-1">Accesos rápidos</h2>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 flex-1">
          <RouterLink
            v-for="link in quickLinks"
            :key="link.to"
            :to="{ name: link.to }"
            class="quick-card relative h-full bg-white dark:bg-[#0B1120] rounded-3xl border border-iecm-purple/15 dark:border-white/5 p-6 shadow-iecm dark:shadow-[0_20px_40px_rgba(0,0,0,0.4)] transition-all duration-300 flex flex-col items-start hover:border-iecm-purple/50 dark:hover:border-iecm-purple-light/50 hover:-translate-y-1 group"
          >
            <div class="flex items-center w-full gap-4">
              <div
                class="flex items-center justify-center w-12 h-12 rounded-2xl flex-shrink-0 shadow-sm dark:shadow-lg transition-transform duration-300 group-hover:scale-110"
                :class="link.color"
                v-html="link.icon"
              ></div>
              <div>
                <p class="text-[15px] font-black text-slate-800 dark:text-white tracking-tighter leading-tight group-hover:text-iecm-purple dark:group-hover:text-iecm-purple-light transition-colors" style="font-feature-settings: 'tnum';">{{ link.label }}</p>
                <p class="text-[10px] font-bold text-slate-400 dark:text-white/50 uppercase tracking-[0.1em] mt-1">{{ link.sublabel }}</p>
              </div>
            </div>
          </RouterLink>
        </div>
      </div>
    </div>

    <!-- ── Vista Ejecutiva: KPIs ── -->
    <div v-if="isCentralAdmin || isCaptureUser || isReadOnly" class="grid grid-cols-1 gap-6 mb-6" :class="{ 'md:grid-cols-2': isCentralAdmin }">
      
      <!-- KPI 1: Avance Global -->
      <div
        v-if="isCentralAdmin"
        class="relative flex flex-col items-center justify-center p-8 rounded-3xl overflow-hidden bg-white dark:bg-[#0B1120] border border-iecm-purple/15 dark:border-white/5 shadow-iecm dark:shadow-[0_20px_40px_rgba(0,0,0,0.4)] transition-colors duration-200"
      >
        <!-- Título -->
        <h3 class="text-slate-500 dark:text-white/60 text-xs font-bold uppercase tracking-[0.15em] mb-6">
          Avance Global de Captura
        </h3>
        
        <div class="relative flex items-center justify-center w-40 h-40">
          <!-- Background track -->
          <svg class="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
            <circle cx="60" cy="60" r="54" fill="none" class="stroke-iecm-purple-100 dark:stroke-white/5" stroke-width="8" />
          </svg>
          <!-- Animated progress -->
          <svg class="absolute inset-0 w-full h-full transform -rotate-90" viewBox="0 0 120 120">
            <defs>
              <linearGradient id="gradAvance" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="#E879F9" />
                <stop offset="100%" stop-color="#8B5CF6" />
              </linearGradient>
            </defs>
            <circle
              ref="circleAvance"
              cx="60" cy="60" r="54"
              fill="none"
              stroke="url(#gradAvance)"
              stroke-width="8"
              stroke-linecap="round"
              stroke-dasharray="339.292"
              stroke-dashoffset="339.292"
              style="filter: drop-shadow(0 0 8px rgba(232,121,249,0.3));"
            />
          </svg>
          
          <!-- Center Text -->
          <div class="absolute flex flex-col items-center justify-center">
            <span v-if="kpiAvance.loading" class="animate-pulse w-8 h-8 rounded-full border-2 border-fuchsia-500/30 border-t-fuchsia-500"></span>
            <template v-else>
              <span class="text-3xl font-extrabold text-slate-800 dark:text-white tracking-tighter" style="font-feature-settings: 'tnum';">
                {{ Math.round(kpiAvance.pct) }}%
              </span>
              <span class="text-[10px] text-slate-400 dark:text-white/40 font-semibold uppercase tracking-wider mt-0.5">
                Total
              </span>
            </template>
          </div>
        </div>

        <!-- Footer Info -->
        <div class="w-full mt-6 grid grid-cols-3 gap-2 pt-5 border-t border-slate-100 dark:border-white/10">
          <div class="text-center">
            <p class="text-[10px] font-bold text-slate-400 dark:text-white/40 uppercase tracking-wider mb-1">Total</p>
            <p class="text-xs font-semibold text-slate-700 dark:text-white/80">{{ kpiAvance.total.toLocaleString() }}</p>
          </div>
          <div class="text-center border-l border-slate-100 dark:border-white/10">
            <p class="text-[10px] font-bold text-slate-400 dark:text-white/40 uppercase tracking-wider mb-1">Capturadas</p>
            <p class="text-xs font-bold text-fuchsia-500 dark:text-fuchsia-400">{{ kpiAvance.capturadas.toLocaleString() }}</p>
          </div>
          <div class="text-center border-l border-slate-100 dark:border-white/10">
            <p class="text-[10px] font-bold text-slate-400 dark:text-white/40 uppercase tracking-wider mb-1">Pendientes</p>
            <p class="text-xs font-semibold text-slate-500 dark:text-white/50">{{ (kpiAvance.total - kpiAvance.capturadas).toLocaleString() }}</p>
          </div>
        </div>
      </div>

      <!-- KPI 2: Días Restantes -->
      <div
        class="relative flex flex-col items-center justify-center p-8 rounded-3xl overflow-hidden bg-white dark:bg-[#0B1120] border border-iecm-purple/15 dark:border-white/5 shadow-iecm dark:shadow-[0_20px_40px_rgba(0,0,0,0.4)] transition-colors duration-200"
      >
        <h3 class="text-slate-500 dark:text-white/60 text-xs font-bold uppercase tracking-[0.15em] mb-6">
          Tiempo del Periodo
        </h3>
        
        <div class="relative flex items-center justify-center w-40 h-40">
          <svg class="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
            <circle cx="60" cy="60" r="54" fill="none" class="stroke-iecm-purple-100 dark:stroke-white/5" stroke-width="8" />
          </svg>
          
          <svg class="absolute inset-0 w-full h-full transform -rotate-90" viewBox="0 0 120 120">
            <defs>
              <linearGradient id="gradRojo" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="#ef4444" />
                <stop offset="100%" stop-color="#dc2626" />
              </linearGradient>
              <linearGradient id="gradNaranja" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="#f97316" />
                <stop offset="100%" stop-color="#ea580c" />
              </linearGradient>
              <linearGradient id="gradAmarillo" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="#eab308" />
                <stop offset="100%" stop-color="#ca8a04" />
              </linearGradient>
              <linearGradient id="gradVerde" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="#22c55e" />
                <stop offset="100%" stop-color="#16a34a" />
              </linearGradient>
            </defs>
            <circle
              ref="circleDias"
              cx="60" cy="60" r="54"
              fill="none"
              :stroke="getKpiDiasColor.gradient"
              stroke-width="8"
              stroke-linecap="round"
              stroke-dasharray="339.292"
              stroke-dashoffset="339.292"
              :style="`filter: drop-shadow(0 0 10px ${getKpiDiasColor.shadow});`"
            />
          </svg>
          
          <div class="absolute flex flex-col items-center justify-center">
            <span
              class="text-4xl font-black tracking-tighter"
              style="font-feature-settings: 'tnum';"
              :class="getKpiDiasColor.textClass"
            >
              {{ kpiDias.restantes }}
            </span>
          </div>
        </div>

        <!-- Footer Info -->
        <div class="w-full mt-6 grid grid-cols-3 gap-2 pt-5 border-t border-slate-100 dark:border-white/10">
          <div class="text-center">
            <p class="text-[10px] font-bold text-slate-400 dark:text-white/40 uppercase tracking-wider mb-1">Inicio</p>
            <p class="text-xs font-semibold text-slate-700 dark:text-white/80">{{ settings.periodo?.fechaInicio ? settings.periodo.fechaInicio.split('T')[0].split('-').reverse().join('/') : '--' }}</p>
          </div>
          <div class="text-center border-l border-slate-100 dark:border-white/10">
            <p class="text-[10px] font-bold text-slate-400 dark:text-white/40 uppercase tracking-wider mb-1">Cierre</p>
            <p class="text-xs font-semibold text-slate-700 dark:text-white/80">{{ settings.periodo?.fechaFin ? settings.periodo.fechaFin.split('T')[0].split('-').reverse().join('/') : '--' }}</p>
          </div>
          <div class="text-center border-l border-slate-100 dark:border-white/10">
            <p class="text-[10px] font-bold text-slate-400 dark:text-white/40 uppercase tracking-wider mb-1">Restantes</p>
            <p class="text-xs font-bold" :class="kpiDias.vencido ? 'text-red-500' : 'text-blue-500 dark:text-blue-400'">{{ kpiDias.restantes }} <span class="text-[10px] opacity-70 font-normal">días</span></p>
          </div>
        </div>
      </div>
    </div>
    <!-- ── Cuadro de Mando (Perfil Central Admin) ── -->
    <div v-if="isCentralAdmin" class="bg-white dark:bg-[#0B1120] rounded-2xl border border-iecm-purple/15 dark:border-white/10 shadow-iecm p-6 mb-6 transition-all duration-200">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5 pb-4 border-b border-slate-100 dark:border-white/10">
        <div>
          <h2 class="text-base font-bold text-slate-800 dark:text-slate-200">Cuadro de Mando</h2>
          <p class="text-slate-400 dark:text-slate-500 text-xs mt-0.5">Avance de cumplimiento · 33 órganos desconcentrados</p>
        </div>
        
        <!-- Dropdowns de Filtro Personalizados -->
        <div class="flex flex-wrap items-end gap-3 z-30">
          
          <!-- Año Dropdown -->
          <div class="relative dropdown-container">
            <label class="block text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide mb-1.5">Año</label>
            <button
              type="button"
              @click="toggleDropdownAnio"
              class="flex items-center justify-between gap-2 px-3 py-2 min-w-[90px] border border-slate-200 dark:border-slate-700/80 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800
                     hover:bg-slate-50 dark:hover:bg-slate-700/50 focus:outline-none focus:ring-2 focus:ring-iecm-purple/20 focus:border-iecm-purple transition-all"
            >
              <span>{{ anioSelected }}</span>
              <svg class="w-4 h-4 text-slate-400 transition-transform duration-200" :class="{ 'rotate-180': dropdownAnioOpen }" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M19 9l-7 7-7-7"/>
              </svg>
            </button>
            <Transition
              enter-active-class="transition duration-100 ease-out"
              enter-from-class="transform scale-95 opacity-0 -translate-y-1"
              enter-to-class="transform scale-100 opacity-100 translate-y-0"
              leave-active-class="transition duration-75 ease-in"
              leave-from-class="transform scale-100 opacity-100 translate-y-0"
              leave-to-class="transform scale-95 opacity-0 -translate-y-1"
            >
              <div v-if="dropdownAnioOpen" class="absolute right-0 mt-1.5 w-full min-w-[100px] max-h-60 overflow-y-auto bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-lg z-50 py-1">
                <button
                  v-for="ano in anios"
                  :key="ano"
                  type="button"
                  @click="selectAnio(ano)"
                  class="w-full px-3 py-1.5 text-left text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-iecm-light dark:hover:bg-slate-700 transition-colors"
                  :class="{ 'text-iecm-purple dark:text-iecm-purple-light bg-iecm-light/40 dark:bg-slate-700/50': anioSelected === ano }"
                >
                  {{ ano }}
                </button>
              </div>
            </Transition>
          </div>

          <!-- Distrito Dropdown -->
          <div class="relative dropdown-container">
            <label class="block text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide mb-1.5">Distrito</label>
            <button
              type="button"
              @click="toggleDropdownDistrito"
              class="flex items-center justify-between gap-2 px-3 py-2 min-w-[135px] border border-slate-200 dark:border-slate-700/80 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800
                     hover:bg-slate-50 dark:hover:bg-slate-700/50 focus:outline-none focus:ring-2 focus:ring-iecm-purple/20 focus:border-iecm-purple transition-all"
            >
              <span>{{ distritoSelected === 'todos' ? 'TODOS' : `Distrito ${distritoSelected}` }}</span>
              <svg class="w-4 h-4 text-slate-400 transition-transform duration-200" :class="{ 'rotate-180': dropdownDistritoOpen }" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M19 9l-7 7-7-7"/>
              </svg>
            </button>
            <Transition
              enter-active-class="transition duration-100 ease-out"
              enter-from-class="transform scale-95 opacity-0 -translate-y-1"
              enter-to-class="transform scale-100 opacity-100 translate-y-0"
              leave-active-class="transition duration-75 ease-in"
              leave-from-class="transform scale-100 opacity-100 translate-y-0"
              leave-to-class="transform scale-95 opacity-0 -translate-y-1"
            >
              <div v-if="dropdownDistritoOpen" class="absolute right-0 mt-1.5 w-48 max-h-60 overflow-y-auto bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-lg z-50 py-1">
                <button
                  type="button"
                  @click="selectDistrito('todos')"
                  class="w-full px-3 py-1.5 text-left text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-iecm-light dark:hover:bg-slate-700 transition-colors"
                  :class="{ 'text-iecm-purple dark:text-iecm-purple-light bg-iecm-light/40 dark:bg-slate-700/50': distritoSelected === 'todos' }"
                >
                  TODOS
                </button>
                <button
                  v-for="d in 33"
                  :key="d"
                  type="button"
                  @click="selectDistrito(String(d))"
                  class="w-full px-3 py-1.5 text-left text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-iecm-light dark:hover:bg-slate-700 transition-colors"
                  :class="{ 'text-iecm-purple dark:text-iecm-purple-light bg-iecm-light/40 dark:bg-slate-700/50': distritoSelected === String(d) }"
                >
                  Distrito {{ d }}
                </button>
              </div>
            </Transition>
          </div>

        </div>
      </div>

      <!-- Chart Container with Scroll -->
      <div class="relative rounded-xl overflow-hidden">
        
        <!-- Empty State Overlay -->
        <div v-if="chartEmpty && !loadingChart" class="absolute inset-0 flex items-center justify-center bg-white dark:bg-slate-800 z-20">
          <div class="flex flex-col items-center gap-4 text-slate-400 dark:text-slate-500">
            <div class="relative flex items-center justify-center w-16 h-16 rounded-full bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
              <svg class="w-8 h-8 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
                <line x1="3" y1="3" x2="21" y2="21" stroke-width="2" stroke="currentColor" class="opacity-40" />
              </svg>
            </div>
            <p class="text-sm font-medium text-center px-4">
              Aún no hay actividades capturadas para {{ settings.periodo?.nombreMes || 'este periodo' }} {{ anioSelected }} <br/>
              <span class="text-xs opacity-70 font-normal">en {{ distritoSelected === 'todos' ? 'ningún distrito' : `el Distrito ${distritoSelected}` }}.</span>
            </p>
          </div>
        </div>

        <div v-if="loadingChart" class="absolute inset-0 flex items-center justify-center bg-white/80 dark:bg-slate-800/80 z-30">
          <div class="flex flex-col items-center gap-3">
            <div class="w-10 h-10 border-[3px] border-slate-100 dark:border-slate-700 border-t-iecm-purple rounded-full animate-spin"></div>
            <p class="text-xs text-slate-400 dark:text-slate-500">Cargando gráfica…</p>
          </div>
        </div>
        
        <!-- Mobile Scroll Indicator -->
        <div class="md:hidden flex items-center justify-center gap-1.5 mb-2.5 py-1.5 px-3 bg-iecm-purple/5 dark:bg-iecm-purple-light/5 text-iecm-purple dark:text-iecm-purple-light text-xs font-bold rounded-lg border border-iecm-purple/10">
          <svg class="w-4 h-4 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"/>
          </svg>
          Desliza para ver todos los distritos ↔
        </div>

        <div class="overflow-x-auto select-none scrollbar-thin rounded-xl">
          <div id="container-hc" class="w-full h-[380px] min-w-[850px] md:min-w-0"></div>
        </div>
      </div>

      <!-- Badges del Semáforo -->
      <div class="flex flex-wrap items-center gap-3 mt-4 pt-4 border-t border-slate-100 dark:border-slate-700/80">
        <div class="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mr-1">Rangos de Avance:</div>
        
        <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-500/10 text-red-650 dark:text-red-400 border border-red-500/20">
          <span class="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
          0–21% Crítico
        </span>
        
        <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-orange-500/10 text-orange-650 dark:text-orange-400 border border-orange-500/20">
          <span class="w-1.5 h-1.5 rounded-full bg-orange-500"></span>
          22–50% Bajo
        </span>
        
        <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-yellow-500/10 text-yellow-650 dark:text-yellow-400 border border-yellow-500/20">
          <span class="w-1.5 h-1.5 rounded-full bg-yellow-450 dark:bg-yellow-400"></span>
          51–99% Moderado
        </span>
        
        <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-650 dark:text-emerald-400 border border-emerald-500/20">
          <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
          100% Completo
        </span>
      </div>
    </div>



  </DashboardLayout>
</template>
