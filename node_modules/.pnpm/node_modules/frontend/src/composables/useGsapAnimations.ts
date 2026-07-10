import { nextTick } from 'vue'
import { gsap } from 'gsap'

/**
 * Composable con animaciones GSAP reutilizables.
 * No toca ninguna lógica de negocio.
 */
export function useGsapAnimations() {

  /** Entrada en cascada de cards */
  const animateCards = (selector: string, delay = 0) => {
    nextTick(() => {
      gsap.from(selector, {
        opacity: 0,
        y: 24,
        duration: 0.45,
        ease: 'power2.out',
        stagger: 0.09,
        delay,
        clearProps: 'all',
      })
    })
  }

  /** Fade-in suave de un contenedor */
  const fadeIn = (el: string | Element, delay = 0) => {
    nextTick(() => {
      gsap.from(el, {
        opacity: 0,
        duration: 0.35,
        ease: 'power1.out',
        delay,
        clearProps: 'opacity',
      })
    })
  }

  /** Slide desde la izquierda (sidebar mobile) */
  const slideInLeft = (el: string | Element) => {
    gsap.fromTo(el, { x: -280, opacity: 0 }, { x: 0, opacity: 1, duration: 0.3, ease: 'power2.out' })
  }

  const slideOutLeft = (el: string | Element, onComplete?: () => void) => {
    gsap.to(el, { x: -280, opacity: 0, duration: 0.25, ease: 'power2.in', onComplete })
  }

  /** Escala hover en card */
  const hoverScale = (el: Element, scale = 1.015) => {
    gsap.to(el, { scale, duration: 0.2, ease: 'power1.out' })
  }

  const hoverScaleReset = (el: Element) => {
    gsap.to(el, { scale: 1, duration: 0.2, ease: 'power1.in' })
  }

  /** Animación de número contando desde 0 hasta target */
  const countUp = (el: HTMLElement | null, target: number, duration = 1.8) => {
    if (!el) return
    const obj = { val: 0 }
    gsap.to(obj, {
      val: target,
      duration,
      ease: 'power2.out',
      onUpdate: () => {
        if (el) el.textContent = Math.round(obj.val).toString()
      }
    })
  }

  /** Entrada del layout principal */
  const pageEnter = (selector = '#main-content') => {
    nextTick(() => {
      gsap.from(selector, {
        opacity: 0,
        y: 12,
        duration: 0.38,
        ease: 'power2.out',
        clearProps: 'all',
      })
    })
  }

  return {
    animateCards,
    fadeIn,
    slideInLeft,
    slideOutLeft,
    hoverScale,
    hoverScaleReset,
    countUp,
    pageEnter,
  }
}
