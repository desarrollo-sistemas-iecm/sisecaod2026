<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useGsapAnimations } from '@/composables/useGsapAnimations'

const props = withDefaults(defineProps<{
  title: string
  value: number
  sublabel?: string
  iconColor?: string
  animateCount?: boolean
}>(), {
  sublabel: '',
  iconColor: 'bg-iecm-purple/10 text-iecm-purple dark:bg-iecm-purple/20 dark:text-iecm-purple-light',
  animateCount: true,
})

const valueEl = ref<HTMLElement | null>(null)
const cardEl = ref<HTMLElement | null>(null)
const { countUp, hoverScale, hoverScaleReset } = useGsapAnimations()

onMounted(() => {
  if (props.animateCount && valueEl.value) {
    countUp(valueEl.value, props.value, 1.2)
  }
})
</script>

<template>
  <div
    ref="cardEl"
    @mouseenter="hoverScale(cardEl!)"
    @mouseleave="hoverScaleReset(cardEl!)"
    class="card flex items-center justify-between border border-slate-100 dark:border-slate-800/80 bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-200 cursor-pointer"
  >
    <div class="space-y-1.5">
      <span class="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">{{ title }}</span>
      <h3 class="text-3xl font-black text-slate-800 dark:text-white tracking-tight flex items-baseline">
        <span ref="valueEl">{{ animateCount ? 0 : value }}</span>
      </h3>
      <p v-if="sublabel" class="text-xs font-semibold text-slate-500 dark:text-slate-400 leading-none">
        {{ sublabel }}
      </p>
    </div>
    <div 
      class="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm"
      :class="iconColor"
    >
      <slot name="icon" />
    </div>
  </div>
</template>
