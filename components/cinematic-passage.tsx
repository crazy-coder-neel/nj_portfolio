'use client'

import { useLayoutEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

const chapters = [
  { number: '01', title: 'QUESTION\nEVERYTHING.', detail: 'I’m Neelay a Third Year Computer Engineering student at VJTI Mumbai. I start with a problem worth solving, then follow the questions wherever they lead.', caption: 'Every idea starts with a little curiosity.', label: 'THE SPARK' },
  { number: '02', title: 'EXPLORE\nTHE UNKNOWN.', detail: 'From solving complex problems through DSA and competitive programming to building AI-powered solutions for real-world challenges, I combine algorithmic thinking, software engineering, and machine learning to turn ideas into impactful products.', caption: 'Experiment. Break things. Find another way.', label: 'THE EXPLORATION' },
  { number: '03', title: 'MAKE\nIT REAL.', detail: 'I build across the stack, compete at hackathons, and bring developers together. The goal is always the same: turn an idea into something people can use.', caption: 'From the first line of code to something that matters.', label: 'THE CREATION' },
]

export function CinematicPassage({ images }: { images: string[] }) {
  const root = useRef<HTMLElement>(null)
  useLayoutEffect(() => {
    gsap.registerPlugin(ScrollTrigger)
    const media = gsap.matchMedia()
    media.add('(prefers-reduced-motion: no-preference)', () => {
      const cards = gsap.utils.toArray<HTMLElement>('.passage-card', root.current)
      const timeline = gsap.timeline({ scrollTrigger: { trigger: root.current, start: 'top top', end: 'bottom bottom', scrub: .7, invalidateOnRefresh: true } })
      gsap.set(cards.slice(1), { yPercent: 110, scale: .84, rotation: 5 })
      cards.slice(1).forEach(card => gsap.set(card.querySelectorAll('.passage-copy > *, .passage-card-bottom'), { y: 45, opacity: 0, scale: .92, transformOrigin: 'left center' }))
      cards.slice(0, -1).forEach((card, i) => {
        const at = i * 2.4
        timeline.to(card, { scale: .84, rotation: -3, opacity: .3, duration: 1.2, ease: 'power1.inOut' }, at + .8)
          .to(cards[i + 1], { yPercent: 0, scale: 1, rotation: 0, duration: 1.2, ease: 'power2.inOut' }, at + .8)
          .fromTo(cards[i + 1].querySelector('.passage-art'), { scale: 1.2 }, { scale: 1, duration: 1.2 }, at + .8)
          .to(card.querySelectorAll('.passage-copy > *, .passage-card-bottom'), { y: -35, scale: .86, opacity: 0, stagger: .05, duration: .6, ease: 'power2.in' }, at + .8)
          .to(cards[i + 1].querySelectorAll('.passage-copy > *, .passage-card-bottom'), { y: 0, scale: 1, opacity: 1, stagger: .1, duration: .55, ease: 'power2.out' }, at + 1.45)
      })
      timeline.to({}, { duration: .65 })
      timeline.to('.passage-progress i', { scaleX: 1, ease: 'none', duration: timeline.duration() }, 0)
    }, root)
    return () => media.revert()
  }, [])

  return <section ref={root} id="journey" className="cinematic-passage" aria-label="From curiosity to creation">
    <div className="passage-stage">
      <div className="passage-topline"><span>THE PROCESS / A FIELD JOURNAL</span><span>SCROLL TO UNFOLD ↓</span></div>
      <div className="passage-deck">
        {chapters.map((chapter, i) => <article className="passage-card" key={chapter.number}>
          <div className="passage-art" style={{ backgroundImage: `url(${images[i]})` }} />
          <div className="passage-shade" />
          <div className="passage-card-meta"><span>{chapter.label}</span><span>FIELD NOTE / {chapter.number}</span></div>
          <div className="passage-copy"><h2>{chapter.title.split('\n').map(line => <span key={line}>{line}</span>)}</h2><p className="passage-detail">{chapter.detail}</p></div>
          <div className="passage-card-bottom"><p>{chapter.caption}</p><span aria-hidden="true">↗</span></div>
          <span className="passage-number" aria-hidden="true">{chapter.number}</span>
        </article>)}
      </div>
      <div className="passage-progress" aria-hidden="true"><i /></div>
      <div className="passage-bottomline"><span>CURIOUS BY NATURE. BUILDER BY CHOICE.</span><span>NJ / BEHIND THE WORK</span></div>
    </div>
  </section>
}
