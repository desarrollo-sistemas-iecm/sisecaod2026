<script setup lang="ts">
withDefaults(defineProps<{
  variant?: 'success' | 'warning' | 'danger' | 'purple' | 'gray' | 'amber' | 'blue'
  text: string
  dot?: boolean
}>(), { variant: 'gray', dot: false })

const classes: Record<string, string> = {
  success: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 dark:ring-emerald-800/30',
  warning: 'bg-amber-50  text-amber-700  ring-1 ring-amber-200 dark:bg-amber-950/20 dark:text-amber-400 dark:ring-amber-800/30',
  danger:  'bg-red-50    text-red-700    ring-1 ring-red-200 dark:bg-red-950/20 dark:text-red-400 dark:ring-red-800/30',
  purple:  'bg-violet-50 text-violet-700 ring-1 ring-violet-200 dark:bg-violet-950/20 dark:text-violet-400 dark:ring-violet-800/30',
  gray:    'bg-slate-100 text-slate-600  ring-1 ring-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:ring-slate-700/50',
  amber:   'bg-orange-50 text-orange-700 ring-1 ring-orange-200 dark:bg-orange-950/20 dark:text-orange-400 dark:ring-orange-800/30',
  blue:    'bg-blue-50   text-blue-700   ring-1 ring-blue-200 dark:bg-blue-950/20 dark:text-blue-400 dark:ring-blue-800/30',
}

const dotColors: Record<string, string> = {
  success: 'bg-emerald-500',
  warning: 'bg-amber-500',
  danger:  'bg-red-500',
  purple:  'bg-violet-500',
  gray:    'bg-slate-400',
  amber:   'bg-orange-500',
  blue:    'bg-blue-500',
}
</script>

<template>
  <span
    class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap"
    :class="classes[variant]"
  >
    <span v-if="dot" class="w-1.5 h-1.5 rounded-full flex-shrink-0" :class="dotColors[variant]" />
    {{ text }}
  </span>
</template>
