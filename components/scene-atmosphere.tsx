'use client'

import { useEffect, useRef } from 'react'

/** Perspective layers share the original artwork; text stays on a stable plane. */
export function SceneAtmosphere() {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const scene = ref.current?.closest<HTMLElement>('.scene')
    if (!scene) return
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)')
    let visible = false, frame = 0, px = 0, py = 0
    const paint = () => {
      frame = 0
      if (!visible || reduced.matches) return
      const rect = scene.getBoundingClientRect()
      const progress = Math.max(-1, Math.min(1, (innerHeight / 2 - rect.top - rect.height / 2) / (innerHeight + rect.height)))
      scene.style.setProperty('--camera-x', `${px * 28}px`)
      scene.style.setProperty('--camera-y', `${py * 18 + progress * 45}px`)
      scene.style.setProperty('--foreground-x', `${px * -40}px`)
      scene.style.setProperty('--foreground-y', `${py * -20 + progress * -30}px`)
      scene.style.setProperty('--light-x', `${50 + px * 28}%`)
    }
    const schedule = () => { if (!frame && visible && !reduced.matches) frame = requestAnimationFrame(paint) }
    const pointer = (event: PointerEvent) => {
      if (event.pointerType === 'touch') return
      const rect = scene.getBoundingClientRect()
      px = (event.clientX - rect.left) / rect.width - .5
      py = (event.clientY - rect.top) / rect.height - .5
      schedule()
    }
    const leave = () => { px = 0; py = 0; schedule() }
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting
      scene.dataset.inView = String(visible)
      schedule()
    })
    observer.observe(scene)
    scene.addEventListener('pointermove', pointer, { passive: true })
    scene.addEventListener('pointerleave', leave)
    window.addEventListener('scroll', schedule, { passive: true })
    return () => { observer.disconnect(); cancelAnimationFrame(frame); scene.removeEventListener('pointermove', pointer); scene.removeEventListener('pointerleave', leave); window.removeEventListener('scroll', schedule); delete scene.dataset.inView }
  }, [])

  return <>
    <div className="scene-art" ref={ref} aria-hidden="true"><div className="scene-backdrop" /><div className="scene-foreground" /></div>
    <div className="scene-atmosphere" aria-hidden="true">
      <div className="scene-light-shaft" /><div className="scene-mist scene-mist-far" /><div className="scene-mist scene-mist-near" />
      <div className="scene-dust">{Array.from({ length: 12 }, (_, i) => <i key={i} style={{ '--particle': i } as React.CSSProperties} />)}</div>
    </div>
  </>
}
