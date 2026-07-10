<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'

const props = withDefaults(defineProps<{
  modelValue: boolean
  title: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
}>(), { size: 'md' })

const emit = defineEmits<{ (e: 'update:modelValue', v: boolean): void }>()
const close = () => emit('update:modelValue', false)

const sizes: Record<string, string> = {
  sm: 'max-w-sm',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
}

const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close() }
onMounted(() => document.addEventListener('keydown', onKey))
onUnmounted(() => document.removeEventListener('keydown', onKey))
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="modelValue"
        class="fixed inset-0 z-50 flex items-center justify-center p-4"
      >
        <!-- Backdrop -->
        <div class="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" @click="close" />

        <!-- Panel -->
        <Transition
          enter-active-class="transition duration-200 ease-out"
          enter-from-class="opacity-0 scale-95 translate-y-4"
          enter-to-class="opacity-100 scale-100 translate-y-0"
          leave-active-class="transition duration-150 ease-in"
          leave-from-class="opacity-100 scale-100"
          leave-to-class="opacity-0 scale-95"
        >
          <div
            v-if="modelValue"
            class="relative bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full flex flex-col max-h-[92vh] ring-1 ring-slate-200/60 dark:ring-slate-800/80 transition-colors duration-200"
            :class="sizes[size]"
          >
            <!-- Header -->
            <div class="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800/60 flex-shrink-0">
              <div class="flex items-center gap-3">
                <div class="w-1 h-5 rounded-full bg-iecm-purple flex-shrink-0"></div>
                <h3 class="text-sm font-bold text-slate-850 dark:text-slate-100 leading-tight">{{ title }}</h3>
              </div>
              <button
                @click="close"
                class="p-1.5 rounded-lg text-slate-400 dark:text-slate-500 hover:text-slate-650 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex-shrink-0"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>

            <!-- Body -->
            <div class="flex-1 overflow-y-auto px-6 py-5 text-slate-700 dark:text-slate-300">
              <slot />
            </div>

            <!-- Footer slot -->
            <div v-if="$slots.footer" class="px-6 py-4 border-t border-slate-100 dark:border-slate-800/60 flex justify-end gap-3 flex-shrink-0 bg-slate-50/50 dark:bg-slate-950/60 rounded-b-2xl">
              <slot name="footer" :close="close" />
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>
