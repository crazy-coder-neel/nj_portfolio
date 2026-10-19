'use client'

import { useLayoutEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { ArrowUpRight } from 'lucide-react'

const SESSION_KEY = 'neelay:arrival:v1'

export function IntroSplash({ onReveal, replay = false }: { onReveal: () => void; replay?: boolean }) {
  const [visible, setVisible] = useState(false)
  const root = useRef<HTMLDivElement>(null)
  const skip = useRef<HTMLButtonElement>(null)
  const timeline = useRef<gsap.core.Timeline | null>(null)

  useLayoutEffect(() => {
    let seen = false
    try { seen = sessionStorage.getItem(SESSION_KEY) === 'seen' } catch { /* Storage is optional. */ }
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || (!replay && (seen || window.location.hash || window.scrollY > 100))) {
      onReveal()
      return
    }
    setVisible(true)
  }, [onReveal, replay])

  useLayoutEffect(() => {
    const element = root.current
    if (!visible || !element) return
    const portfolio = document.querySelector<HTMLElement>('.portfolio')
    const previousInert = portfolio?.inert ?? false
    const htmlOverflow = document.documentElement.style.overflow
    const bodyOverflow = document.body.style.overflow
    document.documentElement.style.overflow = 'hidden'
    document.body.style.overflow = 'hidden'
    if (portfolio) portfolio.inert = true
    skip.current?.focus({ preventScroll: true })
    let revealed = false, finished = false
    const reveal = () => {
      if (revealed) return
      revealed = true
      onReveal()
    }
    const restore = () => {
      document.documentElement.style.overflow = htmlOverflow
      document.body.style.overflow = bodyOverflow
      if (portfolio) portfolio.inert = previousInert
    }
    const finish = () => {
      if (finished) return
      finished = true
      reveal()
      restore()
      try { sessionStorage.setItem(SESSION_KEY, 'seen') } catch { /* No persistence required to enter. */ }
      setVisible(false)
      document.querySelector<HTMLElement>('#hero h1')?.focus({ preventScroll: true })
    }
    const ctx = gsap.context(() => {
      const sequence = gsap.timeline({ onComplete: finish })
      timeline.current = sequence
      sequence
        .from('.intro-meta', { opacity: 0, y: 8, duration: .45, stagger: .06 }, 0)
        .fromTo('.intro-orbit', { opacity: 0, scale: .7, rotation: -35 }, { opacity: 1, scale: 1, rotation: 0, duration: 1.5, ease: 'power3.out' }, .05)
        .from('.intro-name-line > span', { yPercent: 115, rotate: 5, duration: 1.05, stagger: .13, ease: 'power4.out' }, .2)
        .from('.intro-caption', { opacity: 0, y: 12, duration: .65, ease: 'power2.out' }, .7)
        .fromTo('.intro-track span', { scaleX: 0 }, { scaleX: 1, duration: 2.25, ease: 'power2.inOut' }, 0)
        .addLabel('reveal', 2.25)
        .call(reveal, [], 'reveal')
        .to('.intro-name-line > span', { yPercent: -115, duration: .55, stagger: .05, ease: 'power3.in' }, 'reveal')
        .to('.intro-meta, .intro-caption, .intro-track', { opacity: 0, duration: .3 }, 'reveal')
        .to('.intro-orbit', { scale: 1.35, opacity: 0, duration: .65, ease: 'power2.in' }, 'reveal')
        .to('.intro-shutter-top', { yPercent: -102, duration: .95, ease: 'power4.inOut' }, 'reveal+=.3')
        .to('.intro-shutter-bottom', { yPercent: 102, duration: .95, ease: 'power4.inOut' }, 'reveal+=.3')
    }, element)
    const dismiss = () => {
      const sequence = timeline.current
      if (sequence && sequence.time() < sequence.labels.reveal) sequence.seek('reveal', false)
    }
    const keydown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { event.preventDefault(); dismiss() }
      if (event.key === 'Tab') { event.preventDefault(); skip.current?.focus() }
    }
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)')
    const motionChanged = () => { if (motion.matches) finish() }
    window.addEventListener('keydown', keydown)
    motion.addEventListener('change', motionChanged)
    // The entrance can never prevent access if an animation fails to finish.
    const failsafe = setTimeout(finish, 5000)
    return () => {
      clearTimeout(failsafe)
      window.removeEventListener('keydown', keydown)
      motion.removeEventListener('change', motionChanged)
      ctx.revert()
      timeline.current = null
      restore()
    }
  }, [visible, onReveal])

  if (!visible) return null

  return (
    <div className="intro-splash" ref={root} role="dialog" aria-modal="true" aria-labelledby="intro-title" aria-describedby="intro-description">
      <div className="intro-shutter intro-shutter-top" aria-hidden="true" />
      <div className="intro-shutter intro-shutter-bottom" aria-hidden="true" />
      <div className="intro-topline intro-meta"><span className="intro-brand">NJ<span>.</span></span><span>Personal portfolio / 01</span></div>
      <button ref={skip} className="intro-skip intro-meta" onClick={() => {
        const sequence = timeline.current
        if (sequence && sequence.time() < sequence.labels.reveal) sequence.seek('reveal', false)
      }}>Skip intro <ArrowUpRight size={15} /></button>
      <div className="intro-orbit" aria-hidden="true">
        <svg viewBox="0 0 600 600" fill="none">
          <circle cx="300" cy="300" r="275" stroke="currentColor" strokeOpacity=".16" />
          <circle cx="300" cy="300" r="253" stroke="currentColor" strokeOpacity=".3" strokeDasharray="1 13" />
          <circle className="intro-orbit-arc" cx="300" cy="300" r="275" stroke="currentColor" strokeWidth="2" strokeDasharray="160 1568" />
          <ellipse cx="300" cy="300" rx="275" ry="100" stroke="currentColor" strokeOpacity=".14" transform="rotate(-35 300 300)" />
          <path d="M300 12v24 M300 564v24 M12 300h24 M564 300h24" stroke="currentColor" strokeOpacity=".6" />
        </svg>
        <span className="intro-orbit-center" />
      </div>
      <div className="intro-center">
        <p className="intro-caption intro-kicker">Curiosity is the beginning.</p>
        <h2 id="intro-title" className="intro-name"><span className="intro-name-line"><span>Neelay</span></span><span className="intro-name-line"><span>Joshi<span className="intro-period">.</span></span></span></h2>
        <p className="intro-caption intro-disciplines" id="intro-description">AI / Engineering / Community</p>
      </div>
      <div className="intro-bottomline intro-meta"><span>A world of ideas.<br /><strong>Built into something real.</strong></span><span className="intro-enter-label">The journey starts here <span>↗</span></span></div>
      <div className="intro-track" aria-hidden="true"><span /></div>
    </div>
  )
}
