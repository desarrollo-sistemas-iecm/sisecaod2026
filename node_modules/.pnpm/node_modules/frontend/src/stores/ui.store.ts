import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useUiStore = defineStore('ui', () => {
  const sidebarOpen  = ref(true)
  const globalLoading = ref(false)

  const toggleSidebar  = () => { sidebarOpen.value  = !sidebarOpen.value }
  const setLoading     = (val: boolean) => { globalLoading.value = val }

  return { sidebarOpen, globalLoading, toggleSidebar, setLoading }
})
