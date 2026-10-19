'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { ArrowLeft, ArrowRight, Pause, Play, Sparkles } from 'lucide-react'

const photos = [
  ['Recognition, earned', 'Receiving a trophy and certificate at a technical event'],
  ['Built together', 'Team photograph on stage at Synergy'],
  ['The team behind the build', 'Team holding trophies and certificates at a college event'],
  ['A moment on stage', 'Group receiving recognition on an auditorium stage'],
  ['A community of builders', 'Participants gathered with their certificates'],
  ['From idea to demo', 'Team holding a prize cheque at Algoforge'],
  ['Late nights. Shared wins.', 'Hackathon team celebrating with a trophy and prize cheque'],
  ['Small moments, big meaning', 'Receiving a certificate with fellow participants'],
  ['Beyond the code', 'A moment at the TEDx VJTI event'],
  ['Learning. Building. Growing.', 'Team receiving a trophy and certificates'],
  ['Better, together', 'Group photograph with certificates'],
  ['The journey started early', 'An outdoor photograph holding a trophy'],
].map(([caption, alt], index) => ({ src: `/gallery/moment-${String(index + 1).padStart(2, '0')}.webp`, caption, alt }))
const slides = [...photos, { src: '', caption: 'Many more…', alt: '' }]
const loopSlides = [slides[slides.length - 1], ...slides, slides[0]]

export function PhotoGallery() {
  const section = useRef<HTMLElement>(null)
  const track = useRef<HTMLDivElement>(null)
  const settleTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const activeRef = useRef(0)
  const [active, setActive] = useState(0)
  const [paused, setPaused] = useState(false)
  const [interacting, setInteracting] = useState(false)
  const [visible, setVisible] = useState(false)
  const [reduced, setReduced] = useState(true)
  const total = slides.length

  const move = useCallback((physical: number, instant = false) => {
    const rail = track.current
    const card = rail?.children[physical] as HTMLElement | undefined
    if (!rail || !card) return
    rail.scrollTo({ left: card.offsetLeft - (rail.clientWidth - card.clientWidth) / 2, behavior: instant || window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' })
  }, [])

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setReduced(media.matches)
    update(); media.addEventListener('change', update)
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { threshold: .25 })
    if (section.current) observer.observe(section.current)
    const resize = new ResizeObserver(() => move(activeRef.current + 1, true))
    if (track.current) resize.observe(track.current)
    return () => { observer.disconnect(); resize.disconnect(); media.removeEventListener('change', update); if (settleTimer.current) clearTimeout(settleTimer.current) }
  }, [move])

  useEffect(() => {
    if (paused || interacting || !visible || reduced) return
    const timer = setInterval(() => { if (!document.hidden) move(activeRef.current + 2) }, 4200)
    return () => clearInterval(timer)
  }, [paused, interacting, visible, reduced, move, active])

  return (
    <section ref={section} className="gallery-section" id="gallery" aria-labelledby="gallery-title">
      <div className="scene-content gallery-content">
        <div className="gallery-heading">
          <div><p className="eyebrow">Beyond the screen</p><h2 id="gallery-title">Moments that<br /><em>made the journey.</em></h2></div>
          <p>The people. The work. The memories. <ArrowRight size={16} /></p>
        </div>
        <div className="gallery-track" ref={track} tabIndex={0} role="region" aria-label="Gallery slides" aria-roledescription="carousel"
          onMouseEnter={() => setInteracting(true)} onMouseLeave={() => setInteracting(false)}
          onFocus={() => setInteracting(true)} onBlur={e => { if (!e.currentTarget.contains(e.relatedTarget)) setInteracting(false) }}
          onTouchStart={() => setPaused(true)}
          onKeyDown={e => {
            if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
              e.preventDefault(); setPaused(true); move(activeRef.current + (e.key === 'ArrowRight' ? 2 : 0))
            }
          }}
          onScroll={() => {
            if (settleTimer.current) clearTimeout(settleTimer.current)
            const rail = track.current
            if (!rail) return
            const center = rail.scrollLeft + rail.clientWidth / 2
            let nearest = 0, distance = Infinity
            Array.from(rail.children).forEach((child, i) => {
              const card = child as HTMLElement
              const delta = Math.abs(card.offsetLeft + card.clientWidth / 2 - center)
              if (delta < distance) { nearest = i; distance = delta }
            })
            const logical = (nearest - 1 + total) % total
            activeRef.current = logical; setActive(logical)
            settleTimer.current = setTimeout(() => {
              if (nearest === 0) move(total, true)
              if (nearest === total + 1) move(1, true)
            }, 180)
          }}>
          {loopSlides.map((photo, physical) => {
            const index = (physical - 1 + total) % total
            const clone = physical === 0 || physical === total + 1
            return photo.src ? (
              <figure className={`gallery-slide ${index === active ? 'is-current' : ''}`} key={physical} role="group" aria-roledescription="slide" aria-hidden={clone || undefined} aria-label={`${index + 1} of ${total}: ${photo.caption}`}>
                <div className="gallery-photo"><img src={photo.src} alt={clone ? '' : photo.alt} loading="lazy" width={1600} height={1100} /></div>
                <figcaption><span>{photo.caption}</span><span>{String(index + 1).padStart(2, '0')}</span></figcaption>
              </figure>
            ) : (
              <div key={physical} className={`gallery-slide gallery-more ${index === active ? 'is-current' : ''}`} role="group" aria-roledescription="slide" aria-hidden={clone || undefined} aria-label={`${total} of ${total}: Many more`}>
                <Sparkles size={36} /><h3>Many <em>more…</em></h3><p>The story is still unfolding.</p>
              </div>
            )
          })}
        </div>
        <div className="gallery-controls">
          <button onClick={() => { setPaused(true); move(activeRef.current) }} aria-label="Previous gallery slide"><ArrowLeft size={20} /></button>
          <span aria-live={paused ? 'polite' : 'off'}>{String(active + 1).padStart(2, '0')} / {String(total).padStart(2, '0')}</span>
          <button onClick={() => { setPaused(true); move(activeRef.current + 2) }} aria-label="Next gallery slide"><ArrowRight size={20} /></button>
          {!reduced && <button onClick={() => setPaused(value => !value)} aria-label={paused ? 'Play gallery' : 'Pause gallery'}>{paused ? <Play size={17} /> : <Pause size={17} />}</button>}
        </div>
      </div>
    </section>
  )
}
