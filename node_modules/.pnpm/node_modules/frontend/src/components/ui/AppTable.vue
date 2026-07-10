<script setup lang="ts">
import { ref, computed, watch } from 'vue'

const props = withDefaults(defineProps<{
  columns:    { key: string; label: string; sortable?: boolean }[]
  rows:       Record<string, any>[]
  loading?:   boolean
  searchable?: boolean
  paginated?:  boolean
  pageSize?:  number
}>(), { loading: false, searchable: true, paginated: true, pageSize: 10 })

const search  = ref('')
const page    = ref(1)
const sortKey = ref('')
const sortDir = ref<'asc'|'desc'>('asc')
const limit   = ref(props.pageSize)

watch(() => props.pageSize, (v) => { limit.value = v })

const filtered = computed(() => {
  let data = [...props.rows]
  if (search.value.trim()) {
    const q = search.value.toLowerCase()
    data = data.filter(r =>
      Object.values(r).some(v => String(v ?? '').toLowerCase().includes(q))
    )
  }
  if (sortKey.value) {
    data.sort((a, b) => {
      const va = String(a[sortKey.value] ?? '').toLowerCase()
      const vb = String(b[sortKey.value] ?? '').toLowerCase()
      return sortDir.value === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va)
    })
  }
  return data
})

const totalPages = computed(() => Math.max(1, Math.ceil(filtered.value.length / limit.value)))
const paginated  = computed(() => {
  const start = (page.value - 1) * limit.value
  return filtered.value.slice(start, start + limit.value)
})

const setSort = (key: string) => {
  if (sortKey.value === key) {
    sortDir.value = sortDir.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortKey.value = key
    sortDir.value = 'asc'
  }
  page.value = 1
}

const onSearch = () => { page.value = 1 }

const visiblePages = computed(() => {
  const total = totalPages.value
  const cur   = page.value
  const pages: number[] = []
  for (let i = Math.max(1, cur - 2); i <= Math.min(total, cur + 2); i++) pages.push(i)
  return pages
})
</script>

<template>
  <div class="space-y-4">
    <!-- Toolbar -->
    <div
      v-if="searchable"
      class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 px-1"
    >
      <!-- Records per page -->
      <div class="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
        <span>Mostrar</span>
        <select
          v-model="limit"
          @change="page = 1"
          class="border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl px-2.5 py-1.5 text-sm text-slate-700 dark:text-slate-300 font-medium
                 focus:outline-none focus:ring-2 focus:ring-iecm-purple/30 focus:border-iecm-purple transition-all cursor-pointer"
        >
          <option :value="5">5</option>
          <option :value="10">10</option>
          <option :value="15">15</option>
          <option :value="25">25</option>
          <option :value="50">50</option>
          <option :value="100">100</option>
        </select>
        <span>registros</span>
      </div>

      <!-- Search + count -->
      <div class="flex items-center gap-3">
        <div class="relative">
          <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 dark:text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
          </svg>
          <input
            v-model="search"
            @input="onSearch"
            type="text"
            placeholder="Buscar…"
            class="pl-9 pr-4 py-1.5 w-52 text-sm border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300
                   focus:outline-none focus:ring-2 focus:ring-iecm-purple/30 focus:border-iecm-purple dark:focus:border-iecm-purple-light transition-all"
          />
        </div>
        <span class="text-xs font-medium text-slate-400 dark:text-slate-500 whitespace-nowrap">{{ filtered.length }} registros</span>
      </div>
    </div>

    <!-- Table -->
    <div class="overflow-x-auto rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#0B1120] shadow-sm transition-colors duration-200">
      <table class="w-full text-sm">
        <thead>
          <tr class="bg-slate-50/80 dark:bg-white/5 border-b border-slate-200/80 dark:border-white/10 text-slate-500 dark:text-slate-400">
            <th
              v-for="col in columns"
              :key="col.key"
              class="px-4 py-3.5 text-left font-bold text-xs uppercase tracking-wider whitespace-nowrap select-none"
              :class="col.sortable ? 'cursor-pointer hover:bg-slate-100 dark:hover:bg-white/10 transition-colors' : ''"
              @click="col.sortable && setSort(col.key)"
            >
              <span class="flex items-center gap-1.5">
                {{ col.label }}
                <span v-if="col.sortable" class="inline-flex flex-col gap-px opacity-60">
                  <span class="w-0 h-0 border-l-2 border-r-2 border-b-2 border-transparent"
                    :class="sortKey === col.key && sortDir === 'asc' ? 'border-b-slate-700 dark:border-b-slate-300 opacity-100' : 'border-b-slate-400 dark:border-b-slate-600'"></span>
                  <span class="w-0 h-0 border-l-2 border-r-2 border-t-2 border-transparent"
                    :class="sortKey === col.key && sortDir === 'desc' ? 'border-t-slate-700 dark:border-t-slate-300 opacity-100' : 'border-t-slate-400 dark:border-t-slate-600'"></span>
                </span>
              </span>
            </th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100 dark:divide-white/5">
          <template v-if="loading">
            <tr>
              <td :colspan="columns.length" class="px-4 py-12 text-center text-slate-400">
                <div class="flex justify-center">
                  <div class="w-7 h-7 border-[3px] border-slate-100 dark:border-slate-800 border-t-iecm-purple rounded-full animate-spin"></div>
                </div>
              </td>
            </tr>
          </template>
          <template v-else-if="!paginated.length">
            <tr>
              <td :colspan="columns.length" class="px-4 py-12 text-center">
                <div class="flex flex-col items-center gap-3 text-slate-400 dark:text-slate-500">
                  <svg class="w-10 h-10 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
                      d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                  </svg>
                  <span class="text-sm font-medium">Sin resultados</span>
                </div>
              </td>
            </tr>
          </template>
          <template v-else>
            <tr
              v-for="(row, i) in paginated"
              :key="i"
              class="hover:bg-slate-50/50 dark:hover:bg-white/5 transition-all"
            >
              <td v-for="col in columns" :key="col.key" class="px-4 py-3 text-slate-600 dark:text-slate-300 align-middle">
                <slot :name="`cell-${col.key}`" :row="row" :value="row[col.key]" :index="(page - 1) * limit + i + 1">
                  {{ row[col.key] ?? '—' }}
                </slot>
              </td>
            </tr>
          </template>
        </tbody>
      </table>
    </div>

    <!-- Pagination -->
    <div v-if="totalPages > 1" class="flex items-center justify-between text-sm text-slate-500 dark:text-slate-400 px-1">
      <span class="text-xs text-slate-400 dark:text-slate-500">
        Mostrando {{ (page - 1) * limit + 1 }}–{{ Math.min(page * limit, filtered.length) }}
        de {{ filtered.length }}
      </span>
      <div class="flex items-center gap-1">
        <button
          @click="page = 1" :disabled="page === 1"
          class="p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-40 transition-colors"
          title="Primera"
        >
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M11 19l-7-7 7-7M17 19l-7-7 7-7"/>
          </svg>
        </button>
        <button
          @click="page--" :disabled="page === 1"
          class="p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-40 transition-colors"
        >
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M15 19l-7-7 7-7"/>
          </svg>
        </button>
        <template v-for="p in visiblePages" :key="p">
          <button
            @click="page = p"
            class="w-8 h-8 rounded-xl border text-xs font-bold transition-all"
            :class="page === p
              ? 'bg-iecm-purple text-white border-iecm-purple shadow-sm'
              : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'"
          >{{ p }}</button>
        </template>
        <button
          @click="page++" :disabled="page === totalPages"
          class="p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-40 transition-colors"
        >
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 5l7 7-7 7"/>
          </svg>
        </button>
        <button
          @click="page = totalPages" :disabled="page === totalPages"
          class="p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-40 transition-colors"
          title="Última"
        >
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M13 5l7 7-7 7M7 5l7 7-7 7"/>
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>
