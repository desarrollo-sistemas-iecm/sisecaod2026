<script setup lang="ts">
withDefaults(defineProps<{
  variant?: 'primary' | 'secondary' | 'amber' | 'danger' | 'ghost' | 'success'
  size?:    'xs' | 'sm' | 'md' | 'lg'
  loading?: boolean
  disabled?: boolean
  type?:    'button' | 'submit' | 'reset'
}>(), {
  variant:  'primary',
  size:     'md',
  loading:  false,
  disabled: false,
  type:     'button',
})

const classes: Record<string, string> = {
  primary:   'bg-iecm-purple text-white hover:bg-iecm-purple-dark dark:bg-iecm-purple dark:hover:bg-iecm-purple-light shadow-sm hover:shadow-md dark:shadow-none hover:-translate-y-0.5 active:translate-y-0',
  secondary: 'border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 hover:border-slate-300 dark:hover:border-slate-600 shadow-sm hover:-translate-y-0.5 active:translate-y-0',
  amber:     'bg-iecm-amber text-white hover:bg-iecm-amber-dark dark:bg-iecm-amber dark:hover:bg-amber-400 shadow-sm hover:shadow-md dark:shadow-none hover:-translate-y-0.5 active:translate-y-0',
  danger:    'bg-red-500 text-white hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-500 shadow-sm hover:shadow-md dark:shadow-none hover:-translate-y-0.5 active:translate-y-0',
  success:   'bg-emerald-500 text-white hover:bg-emerald-600 dark:bg-emerald-600 dark:hover:bg-emerald-550 shadow-sm hover:shadow-md dark:shadow-none hover:-translate-y-0.5 active:translate-y-0',
  ghost:     'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200',
}

const sizes: Record<string, string> = {
  xs: 'px-2.5 py-1    text-xs  gap-1.5',
  sm: 'px-3.5 py-1.5  text-xs  gap-2',
  md: 'px-4   py-2    text-sm  gap-2',
  lg: 'px-6   py-2.5  text-sm  gap-2.5',
}
</script>

<template>
  <button
    :type="type"
    :disabled="disabled || loading"
    class="inline-flex items-center justify-center rounded-xl font-semibold transition-all duration-200
           active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 disabled:translate-y-0
           focus:outline-none focus:ring-2 focus:ring-iecm-purple/30 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-slate-900"
    :class="[classes[variant], sizes[size]]"
  >
    <svg v-if="loading" class="animate-spin w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24">
      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
    </svg>
    <slot />
  </button>
</template>
