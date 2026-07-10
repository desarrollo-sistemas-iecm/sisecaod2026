<script setup lang="ts">
import { onMounted, watch } from 'vue'
import { gsap } from 'gsap'
import { useUiStore } from '@/stores/ui.store'
import AppSidebar from '@/components/layout/AppSidebar.vue'
import AppTopbar  from '@/components/layout/AppTopbar.vue'
import AppFooter  from '@/components/layout/AppFooter.vue'
import AppLoader  from '@/components/ui/AppLoader.vue'

const ui = useUiStore()

onMounted(() => {
  gsap.from('#main-content', { opacity: 0, y: 12, duration: 0.4, ease: 'power2.out', clearProps: 'all' })
  gsap.set('#sidebar', { width: ui.sidebarOpen ? 256 : 76 })
})

watch(() => ui.sidebarOpen, (open) => {
  gsap.to('#sidebar', { width: open ? 256 : 76, duration: 0.3, ease: 'power2.inOut' })
})
</script>

<template>
  <div class="flex h-screen overflow-hidden bg-slate-50 dark:bg-[#0B1120] font-sans transition-colors duration-200">
    <!-- Sidebar -->
    <AppSidebar id="sidebar" />

    <!-- Content area -->
    <div class="flex flex-col flex-1 overflow-hidden min-w-0 bg-slate-50 dark:bg-[#0B1120] transition-colors duration-200">
      <AppTopbar />

      <main id="main-content" class="flex-1 overflow-y-auto p-6">
        <AppLoader v-if="ui.globalLoading" />
        <slot v-else />
      </main>

      <AppFooter />
    </div>
  </div>
</template>
