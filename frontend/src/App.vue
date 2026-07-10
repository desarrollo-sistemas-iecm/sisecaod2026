<script setup lang="ts">
import { onMounted, watch } from 'vue'
import { RouterView } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'
import { useSettingsStore } from '@/stores/settings.store'

const authStore = useAuthStore()
const settingsStore = useSettingsStore()

const loadPeriodo = () => {
  if (authStore.isAuthenticated) {
    settingsStore.fetchPeriodo()
  }
}

onMounted(() => {
  loadPeriodo()
})

// Volver a cargar el periodo si el usuario inicia sesión
watch(() => authStore.isAuthenticated, (val) => {
  if (val) loadPeriodo()
})
</script>

<template>
  <RouterView />
</template>
