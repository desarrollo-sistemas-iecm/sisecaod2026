import { onMounted, onUnmounted, Ref } from 'vue'

export interface UseParticlesOptions {
  particleCount?: number
  maxDist?: number
  color?: string
  velocityMultiplier?: number
  alphaMultiplier?: number
  dotSize?: number
  pauseOnHidden?: boolean
}

interface Node {
  x: number; y: number
  vx: number; vy: number
}

export function useParticles(
  canvasRef: Ref<HTMLCanvasElement | null>,
  options: UseParticlesOptions = {}
) {
  const PARTICLE_COUNT = options.particleCount ?? 42
  const MAX_DIST       = options.maxDist ?? 130
  const COLOR          = options.color ?? '138, 92, 220'
  const VELOCITY       = options.velocityMultiplier ?? 0.28
  const ALPHA          = options.alphaMultiplier ?? 0.35
  const DOT_SIZE       = options.dotSize ?? 1.5
  const PAUSE_HIDDEN   = options.pauseOnHidden ?? true

  let animFrameId = 0
  let isVisible = true

  const prefersReducedMotion =
    typeof window !== 'undefined'
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : false

  onMounted(() => {
    const canvas = canvasRef.value
    if (!canvas || prefersReducedMotion) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return
    let W = 0, H = 0
    const nodes: Node[] = []

    const resize = () => {
      W = canvas.width  = canvas.offsetWidth
      H = canvas.height = canvas.offsetHeight
    }
    resize()

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      nodes.push({
        x:  Math.random() * W,
        y:  Math.random() * H,
        vx: (Math.random() - 0.5) * VELOCITY,
        vy: (Math.random() - 0.5) * VELOCITY
      })
    }

    const tick = () => {
      if (!isVisible) {
        animFrameId = requestAnimationFrame(tick)
        return
      }

      ctx.clearRect(0, 0, W, H)

      for (const n of nodes) {
        n.x += n.vx; n.y += n.vy
        if (n.x < 0 || n.x > W) n.vx *= -1
        if (n.y < 0 || n.y > H) n.vy *= -1
      }

      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x
          const dy = nodes[i].y - nodes[j].y
          const d  = Math.sqrt(dx * dx + dy * dy)
          if (d < MAX_DIST) {
            const alpha = (1 - d / MAX_DIST) * ALPHA
            ctx.beginPath()
            ctx.strokeStyle = `rgba(${COLOR}, ${alpha})`
            ctx.lineWidth = 0.8
            ctx.moveTo(nodes[i].x, nodes[i].y)
            ctx.lineTo(nodes[j].x, nodes[j].y)
            ctx.stroke()
          }
        }
      }

      for (const n of nodes) {
        ctx.beginPath()
        ctx.arc(n.x, n.y, DOT_SIZE, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(${COLOR}, 0.5)`
        ctx.fill()
      }

      animFrameId = requestAnimationFrame(tick)
    }

    const ro = new ResizeObserver(resize)
    ro.observe(canvas)
    
    const handleVisibilityChange = () => {
      isVisible = !document.hidden
    }

    if (PAUSE_HIDDEN) {
      document.addEventListener('visibilitychange', handleVisibilityChange)
    }

    tick()

    onUnmounted(() => {
      cancelAnimationFrame(animFrameId)
      ro.disconnect()
      if (PAUSE_HIDDEN) {
        document.removeEventListener('visibilitychange', handleVisibilityChange)
      }
    })
  })
}
