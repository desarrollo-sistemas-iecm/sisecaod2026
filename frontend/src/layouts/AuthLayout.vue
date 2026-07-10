<script setup lang="ts">
import { ref } from 'vue'
import { useParticles } from '@/composables/useParticles'

const canvasRef = ref<HTMLCanvasElement | null>(null)

useParticles(canvasRef, {
  particleCount: 42,
  maxDist: 130,
  color: '138, 92, 220',
  velocityMultiplier: 0.28,
  alphaMultiplier: 0.35,
  dotSize: 1.5,
  pauseOnHidden: true
})
</script>

<template>
  <!--
    AuthLayout — "Meridiano Institucional"
    Fondo oscuro morado casi negro. El canvas de partículas vive como
    capa decorativa (pointer-events: none, aria-hidden).
  -->
  <div
    class="min-h-screen w-full flex items-stretch relative overflow-hidden"
    style="background: #0D0B1E;"
  >
    <!-- Canvas de partículas — ocupa toda la pantalla como fondo, bajo el contenido -->
    <canvas
      ref="canvasRef"
      aria-hidden="true"
      class="absolute inset-0 w-full h-full pointer-events-none"
      style="z-index: 0;"
    />

    <!-- Viñeta radial superior-izquierda (acento morado) -->
    <div
      aria-hidden="true"
      class="absolute top-0 left-0 w-[520px] h-[520px] pointer-events-none"
      style="
        background: radial-gradient(ellipse at 20% 10%, oklch(42% 0.18 290 / 0.22) 0%, transparent 70%);
        z-index: 0;
      "
    />
    <!-- Viñeta inferior-derecha (contraste suave) -->
    <div
      aria-hidden="true"
      class="absolute bottom-0 right-0 w-[400px] h-[400px] pointer-events-none"
      style="
        background: radial-gradient(ellipse at 80% 90%, oklch(35% 0.12 290 / 0.15) 0%, transparent 65%);
        z-index: 0;
      "
    />

    <!-- Contenido (slot) sobre el canvas -->
    <div class="relative flex w-full items-center justify-center p-6 lg:p-0" style="z-index: 1;">
      <slot />
    </div>
  </div>
</template>
