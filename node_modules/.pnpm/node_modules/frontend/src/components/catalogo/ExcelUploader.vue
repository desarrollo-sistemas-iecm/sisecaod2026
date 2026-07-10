<script setup lang="ts">
import { ref } from 'vue'
import AppButton from '@/components/ui/AppButton.vue'
import { useSweetAlert } from '@/composables/useSweetAlert'

const props = defineProps<{
  title: string
  description: string
  disabled?: boolean
  disabledReason?: string
  infoTitle?: string
  infoDescription?: string
  uploading?: boolean
  buttonText?: string
}>()

const emit = defineEmits<{
  (e: 'upload', file: File): void
}>()

const { error } = useSweetAlert()

const fileInput = ref<HTMLInputElement | null>(null)
const selectedFile = ref<File | null>(null)
const dragActive = ref(false)

const triggerFileInput = () => {
  if (props.disabled) return
  fileInput.value?.click()
}

const handleFileChange = (e: Event) => {
  if (props.disabled) return
  const target = e.target as HTMLInputElement
  if (target.files && target.files.length > 0) {
    processFile(target.files[0])
  }
}

const handleDragOver = (e: DragEvent) => {
  e.preventDefault()
  if (!props.disabled) dragActive.value = true
}

const handleDragLeave = () => {
  dragActive.value = false
}

const handleDrop = (e: DragEvent) => {
  e.preventDefault()
  dragActive.value = false
  if (props.disabled) return
  if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
    processFile(e.dataTransfer.files[0])
  }
}

const processFile = (file: File) => {
  const ext = file.name.split('.').pop()?.toLowerCase()
  if (ext !== 'xls' && ext !== 'xlsx') {
    error('Archivo no válido', 'Por favor selecciona únicamente archivos Excel (.xlsx, .xls)')
    return
  }
  if (file.size > 5 * 1024 * 1024) {
    error('Archivo demasiado grande', 'El archivo no debe superar los 5 MB')
    return
  }
  selectedFile.value = file
}

const handleUpload = () => {
  if (!selectedFile.value || props.disabled) return
  emit('upload', selectedFile.value)
}

const clearFile = () => {
  selectedFile.value = null
  if (fileInput.value) fileInput.value.value = ''
}

const fileSizeKb = (bytes: number) => (bytes / 1024).toFixed(1)

defineExpose({ clearFile })
</script>

<template>
  <div class="bg-white dark:bg-[#0B1120] rounded-2xl border border-slate-200/80 dark:border-white/10 shadow-sm p-6 space-y-4 transition-colors duration-200">
    <div class="border-b border-slate-100 dark:border-white/10 pb-3">
      <h2 class="text-base font-bold text-slate-800 dark:text-slate-200">{{ title }}</h2>
      <p class="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{{ description }}</p>
    </div>

    <!-- Restriction explanation banner if disabled -->
    <div
      v-if="disabled"
      class="bg-red-50 border border-red-200 dark:bg-red-950/20 dark:border-red-900/50 rounded-xl p-4 flex items-start gap-3 text-xs text-red-700 dark:text-red-400"
    >
      <svg class="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
      </svg>
      <div>
        <p class="font-bold">Carga deshabilitada</p>
        <p class="mt-0.5 text-red-600/90 dark:text-red-400/80">{{ disabledReason }}</p>
      </div>
    </div>

    <!-- Info banner if enabled and info provided -->
    <div
      v-else-if="infoTitle"
      class="bg-emerald-50 border border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-900/50 rounded-xl p-4 flex items-start gap-3 text-xs text-emerald-800 dark:text-emerald-400"
    >
      <svg class="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
      </svg>
      <div>
        <p class="font-bold">{{ infoTitle }}</p>
        <p class="mt-0.5 text-emerald-700/90 dark:text-emerald-400/80">{{ infoDescription }}</p>
      </div>
    </div>

    <!-- Drag & Drop Zone -->
    <div
      @dragover="handleDragOver"
      @dragleave="handleDragLeave"
      @drop="handleDrop"
      @click="triggerFileInput"
      class="relative border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center transition-all duration-300 text-center select-none"
      :class="[
        disabled
          ? 'border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/5 cursor-not-allowed opacity-60'
          : dragActive
            ? 'border-iecm-purple dark:border-iecm-purple-light bg-violet-50/80 dark:bg-iecm-purple/20 scale-[1.01] cursor-pointer'
            : 'border-slate-300 dark:border-white/10 hover:border-iecm-purple/60 dark:hover:border-iecm-purple-light/60 hover:bg-slate-50/50 dark:hover:bg-white/5 cursor-pointer'
      ]"
    >
      <input
        ref="fileInput"
        type="file"
        accept=".xlsx,.xls"
        class="hidden"
        :disabled="disabled"
        @change="handleFileChange"
      />

      <div
        class="w-12 h-12 rounded-xl flex items-center justify-center mb-3 transition-colors"
        :class="[
          disabled
            ? 'bg-slate-100 dark:bg-slate-700 text-slate-400'
            : dragActive
              ? 'bg-iecm-purple text-white shadow-md'
              : 'bg-violet-50 dark:bg-violet-950/60 text-iecm-purple dark:text-iecm-purple-light'
        ]"
      >
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/>
        </svg>
      </div>

      <p class="text-sm font-semibold" :class="disabled ? 'text-slate-400 dark:text-slate-600' : 'text-slate-700 dark:text-slate-300'">
        {{ dragActive ? '¡Suelta el archivo aquí!' : 'Arrastra tu archivo Excel aquí o haz clic para buscar' }}
      </p>
      <p class="text-xs text-slate-400 dark:text-slate-500 mt-1">Soporta .xlsx y .xls · Max 5 MB</p>
    </div>

    <!-- Selected file row -->
    <div
      v-if="selectedFile"
      class="flex items-center justify-between p-4 bg-emerald-50/60 dark:bg-emerald-950/20 rounded-xl border border-emerald-100 dark:border-emerald-800/30 shadow-sm"
    >
      <div class="flex items-center gap-3">
        <div class="w-8 h-8 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 rounded-lg flex items-center justify-center flex-shrink-0">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
          </svg>
        </div>
        <div class="min-w-0">
          <p class="text-sm font-semibold text-slate-700 dark:text-slate-300 truncate max-w-[250px] sm:max-w-md">{{ selectedFile.name }}</p>
          <p class="text-xs text-slate-500 dark:text-slate-450">{{ fileSizeKb(selectedFile.size) }} KB · Listo para importar</p>
        </div>
      </div>
      <button
        @click.stop="clearFile"
        class="p-1.5 text-slate-400 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12"/>
        </svg>
      </button>
    </div>

    <!-- Upload Actions -->
    <div class="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-700/80">
      <AppButton
        v-if="selectedFile"
        variant="ghost"
        @click="clearFile"
      >
        Limpiar
      </AppButton>
      <AppButton
        variant="primary"
        :disabled="!selectedFile || disabled"
        :loading="uploading"
        @click="handleUpload"
        class="flex items-center gap-1.5 shadow-sm font-semibold"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/>
        </svg>
        {{ uploading ? 'Subiendo...' : (buttonText || 'Subir catálogo') }}
      </AppButton>
    </div>
  </div>
</template>
