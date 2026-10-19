'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import gsap from 'gsap'
import { ArrowLeft, X, ChevronRight, ExternalLink, ArrowUpRight, Code2 } from 'lucide-react'

/* ── Achievement Data ── */
export interface Achievement {
  id: string
  title: string
  category: string
  result?: string
  year?: string
  organization?: string
  description?: string
  imageUrl?: string
  externalUrl?: string
}

export const categories = [
  { id: 'hackathons', name: 'Hackathons', description: 'National and state-level hackathon wins', icon: '🏆', color: '#ffb477' },
  { id: 'technical', name: 'Technical Competitions', description: 'Paper presentations, coding contests, quizzes, and project showcases', icon: '⚡', color: '#22d3ee' },
  { id: 'beyond', name: 'Beyond Tech', description: 'Chess, sports, creative writing, and other non-technical achievements', icon: '♟️', color: '#4ade80' },
  { id: 'certifications', name: 'Certifications', description: 'Completed courses and professional credentials', icon: '📜', color: '#a78bfa' },
]

export const achievements: Achievement[] = [
  // Hackathons
  { id: 'hack-1', title: 'HackWithMumbai 2.0', category: 'hackathons', result: 'Winner', organization: 'HackWithMumbai', imageUrl: '/achievements/hackathons/HackWithMumbai2.0.jpg' },
  { id: 'hack-2', title: 'Codeverse 2.0', category: 'hackathons', result: '2nd Runner Up', organization: 'Codeverse', imageUrl: '/achievements/hackathons/Codeverse2.0.jpg' },
  { id: 'hack-3', title: 'Algoforge', category: 'hackathons', result: 'Runner Up', organization: 'Algoforge', imageUrl: '/achievements/hackathons/Algoforge.jpg' },
  { id: 'hack-4', title: 'Synergy 2025', category: 'hackathons', result: 'Winner', organization: 'Synergy', imageUrl: '/achievements/hackathons/Synergy25.jpg' },
  { id: 'hack-5', title: 'Synergy 3.0', category: 'hackathons', result: '2nd Runner Up', organization: 'Synergy', imageUrl: '/achievements/hackathons/Synergy3.jpg' },

  // Technical Competitions
  { id: 'tech-1', title: 'Paper Presentation', category: 'technical', result: 'Runner Up', imageUrl: '/achievements/technical/PaperPresentation1.jpg' },
  { id: 'tech-2', title: 'Paper Presentation', category: 'technical', result: 'Runner Up', imageUrl: '/achievements/technical/PaperPresentation2.jpg' },
  { id: 'tech-3', title: 'Paper Presentation', category: 'technical', result: 'Runner Up', imageUrl: '/achievements/technical/PaperPresentation3.jpg' },
  { id: 'tech-4', title: 'Paper Presentation', category: 'technical', result: 'Winner', imageUrl: '/achievements/technical/PaperPresentation4_.jpg' },
  { id: 'tech-5', title: 'Project Presentation', category: 'technical', result: 'Winner', imageUrl: '/achievements/technical/ProjectPresentation1.jpg' },
  { id: 'tech-6', title: 'Project Presentation', category: 'technical', result: 'Runner Up', imageUrl: '/achievements/technical/ProjectPresentation2.jpg' },
  { id: 'tech-7', title: 'Blind Coding', category: 'technical', result: 'Winner', imageUrl: '/achievements/technical/Blind_Coding.jpg' },
  { id: 'tech-8', title: 'CP Contest', category: 'technical', result: '2nd Runner Up', imageUrl: '/achievements/technical/CP_Contest.jpg' },
  { id: 'tech-9', title: 'Quiz Competition', category: 'technical', result: 'Runner Up', imageUrl: '/achievements/technical/Quiz1.jpg' },
  { id: 'tech-10', title: 'Quiz Competition', category: 'technical', result: 'Winner', imageUrl: '/achievements/technical/Quiz2.jpg' },

  // Beyond Tech
  { id: 'bt-1', title: 'BrandManiac', category: 'beyond', imageUrl: '/achievements/beyond/BrandManiac.jpg' },
  { id: 'bt-2', title: 'Chess Tournament', category: 'beyond', imageUrl: '/achievements/beyond/Chess1.jpg' },
  { id: 'bt-3', title: 'Chess Tournament', category: 'beyond', imageUrl: '/achievements/beyond/Chess2.jpg' },
  { id: 'bt-4', title: 'Chess Tournament', category: 'beyond', imageUrl: '/achievements/beyond/Chess3.jpg' },
  { id: 'bt-5', title: 'Creative Writing — Runner Up', category: 'beyond', result: 'Runner Up', imageUrl: '/achievements/beyond/Creative_Writing_Runner_Up.jpg' },
  { id: 'bt-6', title: 'Cricket', category: 'beyond', imageUrl: '/achievements/beyond/Cricket1.jpg' },
  { id: 'bt-7', title: 'GeoGenius', category: 'beyond', imageUrl: '/achievements/beyond/GeoGenius.jpg' },
  { id: 'bt-8', title: 'GeoGenius', category: 'beyond', imageUrl: '/achievements/beyond/GeoGenius2.jpg' },
  { id: 'bt-9', title: 'Hindi Rashtrabhasha', category: 'beyond', imageUrl: '/achievements/beyond/Hindi_Rashtrabhasha1.jpg' },
  { id: 'bt-10', title: 'Hindi Rashtrabhasha', category: 'beyond', imageUrl: '/achievements/beyond/Hindi_Rashtrabhasha2.jpg' },
  { id: 'bt-11', title: 'NSS Volunteer', category: 'beyond', imageUrl: '/achievements/beyond/NSS_Volunteer.jpg' },
  { id: 'bt-12', title: 'Poetry Recitation — Consolation', category: 'beyond', result: 'Consolation', imageUrl: '/achievements/beyond/Poetry_Recitation_Consolation.jpg' },
  { id: 'bt-13', title: 'SOF IMO', category: 'beyond', imageUrl: '/achievements/beyond/SOF_IMO.jpg' },
  { id: 'bt-14', title: 'Sack Race', category: 'beyond', imageUrl: '/achievements/beyond/SackRace.jpg' },
  { id: 'bt-15', title: 'Sprint', category: 'beyond', imageUrl: '/achievements/beyond/Sprint1.jpg' },

  // Certifications
  { id: 'cert-1', title: 'Azure AI Fundamentals (AI-901)', category: 'certifications', organization: 'Microsoft', imageUrl: '/achievements/certifications/Microsoft_-_Azure_AI_Fundamentals_AI-901.png' },
  { id: 'cert-2', title: 'AI Skills Passport', category: 'certifications', organization: 'Microsoft', imageUrl: '/achievements/certifications/Miccrosoft_AI_Skills_Passport.png' },
  { id: 'cert-3', title: 'End to End Data Science Workflows', category: 'certifications', organization: 'NVIDIA', imageUrl: '/achievements/certifications/NVIDIA-End_to_End_Data_Science_Workflows.png' },
  { id: 'cert-4', title: 'Getting Started with Deep Learning', category: 'certifications', organization: 'NVIDIA', imageUrl: '/achievements/certifications/NVIDIA-Getting_Started_with_DL.png' },
  { id: 'cert-5', title: 'AI for Beginners', category: 'certifications', organization: 'HP', imageUrl: '/achievements/certifications/HP-AI_for_Beginners.png' },
  { id: 'cert-6', title: 'Software Engineering Job Simulation', category: 'certifications', organization: 'Accenture', imageUrl: '/achievements/certifications/Accenture-Software_Engg_Job_Simulation.png' },
  { id: 'cert-7', title: 'Data Analytics Job Simulation', category: 'certifications', organization: 'Deloitte', imageUrl: '/achievements/certifications/Deloitte-Data_Analytics_Job_Simulation.png' },
  { id: 'cert-8', title: 'Data Analytics Job Simulation', category: 'certifications', organization: 'Tata', imageUrl: '/achievements/certifications/Tata-Data_Analytics_Job_Simulation.png' },
]

const codingProfiles = [
  { name: 'LeetCode', url: 'https://leetcode.com/u/NeelayJ/', stat: '370+ Problems' },
  { name: 'Codeforces', url: 'https://codeforces.com/profile/crazy_neel', stat: 'Active Competitor' },
  { name: 'CodeChef', url: 'https://www.codechef.com/users/neel_codes', stat: 'Active Competitor' },
  { name: 'GitHub', url: 'https://github.com/crazy-coder-neel', stat: 'Hacktoberfest Super Contributor' },
]

function getAchievementsByCategory(categoryId: string): Achievement[] {
  return achievements.filter(a => a.category === categoryId)
}

/* ── Vault Component ── */
export function AchievementVault() {
  const [activeView, setActiveView] = useState<'grid' | 'folder' | 'preview'>('grid')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [selectedAchievement, setSelectedAchievement] = useState<Achievement | null>(null)
  const [isAnimating, setIsAnimating] = useState(false)
  const [exitingGrid, setExitingGrid] = useState(false)
  const [exitingFolder, setExitingFolder] = useState(false)
  const filesRef = useRef<HTMLDivElement>(null)
  const previewClose = useRef<HTMLButtonElement>(null)
  const prefersReducedMotion = useRef(false)

  useEffect(() => { prefersReducedMotion.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches }, [])

  useEffect(() => {
    if (activeView !== 'preview') return
    const previousFocus = document.activeElement as HTMLElement | null
    const portfolio = document.querySelector<HTMLElement>('.portfolio')
    const previousInert = portfolio?.inert ?? false
    const overflow = document.documentElement.style.overflow
    document.documentElement.style.overflow = 'hidden'
    if (portfolio) portfolio.inert = true
    previewClose.current?.focus({ preventScroll: true })
    const trapFocus = (event: KeyboardEvent) => {
      if (event.key === 'Tab') { event.preventDefault(); previewClose.current?.focus() }
    }
    window.addEventListener('keydown', trapFocus)
    return () => {
      document.documentElement.style.overflow = overflow
      if (portfolio) portfolio.inert = previousInert
      window.removeEventListener('keydown', trapFocus)
      previousFocus?.focus({ preventScroll: true })
    }
  }, [activeView])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (activeView === 'preview') closePreview()
        else if (activeView === 'folder') closeFolder()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [activeView])

  useEffect(() => {
    if (activeView === 'folder' && filesRef.current && !prefersReducedMotion.current) {
      const items = filesRef.current.querySelectorAll('.vault-file-card')
      gsap.fromTo(items, { y: 40, opacity: 0, scale: 0.95 }, { y: 0, opacity: 1, scale: 1, duration: 0.5, stagger: 0.05, ease: 'power3.out', delay: 0.1 })
    }
  }, [activeView, selectedCategory])

  const openFolder = useCallback((categoryId: string) => {
    if (isAnimating) return
    setIsAnimating(true); setExitingGrid(true)
    const delay = prefersReducedMotion.current ? 50 : 450
    setTimeout(() => { setSelectedCategory(categoryId); setActiveView('folder'); setExitingGrid(false); setIsAnimating(false) }, delay)
  }, [isAnimating])

  const closeFolder = useCallback(() => {
    if (isAnimating) return
    setIsAnimating(true); setExitingFolder(true); setSelectedAchievement(null)
    const delay = prefersReducedMotion.current ? 50 : 350
    setTimeout(() => { setActiveView('grid'); setSelectedCategory(null); setExitingFolder(false); setIsAnimating(false) }, delay)
  }, [isAnimating])

  const openPreview = useCallback((ach: Achievement) => { setSelectedAchievement(ach); setActiveView('preview') }, [])
  const closePreview = useCallback(() => { setSelectedAchievement(null); setActiveView('folder') }, [])

  const currentCategory = categories.find(c => c.id === selectedCategory)
  const currentFiles = selectedCategory ? getAchievementsByCategory(selectedCategory) : []

  return (
    <div className="vault-container">
      {/* Header */}
      <div className="vault-header">
        <div className="vault-title-row">
          <p className="eyebrow">06 — Achievements</p>
          <h2>Achievement<br /><em>Vault.</em></h2>
        </div>
        {activeView !== 'grid' && (
          <div className="vault-breadcrumb" role="navigation" aria-label="Vault breadcrumb">
            <button className="vault-back-btn" onClick={activeView === 'preview' ? closePreview : closeFolder} aria-label="Go back"><ArrowLeft size={16} /></button>
            <button className="breadcrumb-link" onClick={closeFolder}>Achievement Vault</button>
            {currentCategory && <><ChevronRight size={12} /><span className="breadcrumb-current">{currentCategory.name}</span></>}
            {selectedAchievement && activeView === 'preview' && <><ChevronRight size={12} /><span className="breadcrumb-current">{selectedAchievement.title}</span></>}
          </div>
        )}
      </div>

      {/* ── Grid View ── */}
      {activeView === 'grid' && (
        <div className={`vault-grid ${exitingGrid ? 'vault-grid--exiting' : ''}`}>
          {categories.map((cat, i) => {
            const count = getAchievementsByCategory(cat.id).length
            return (
              <button key={cat.id} className="vault-folder" onClick={() => openFolder(cat.id)}
                style={{ '--folder-color': cat.color, '--folder-delay': `${i * 0.06}s` } as React.CSSProperties}
                aria-label={`Open ${cat.name} folder, ${count} files`}>
                <div className="folder-tab" />
                <div className="folder-body">
                  <div className="folder-glow" />
                  <div className="folder-icon">{cat.icon}</div>
                  <h3 className="folder-name">{cat.name}</h3>
                  <p className="folder-desc">{cat.description}</p>
                  <div className="folder-meta"><span className="folder-count">{count} {count === 1 ? 'file' : 'files'}</span><ChevronRight size={14} /></div>
                </div>
              </button>
            )
          })}
        </div>
      )}

      {/* ── Folder Contents ── */}
      {activeView !== 'grid' && selectedCategory && (
        <div className={`folder-contents ${exitingFolder ? 'folder-contents--exiting' : ''}`} ref={filesRef}>
          <div className="folder-contents-header" style={{ '--folder-color': currentCategory?.color } as React.CSSProperties}>
            <span className="fc-icon">{currentCategory?.icon}</span>
            <div><h3>{currentCategory?.name}</h3><p>{currentFiles.length} achievements</p></div>
          </div>

          <div className="vault-files-grid">
            {currentFiles.map((ach) => (
              <button key={ach.id} className="vault-file-card" onClick={() => openPreview(ach)} aria-label={`View ${ach.title}`}>
                {ach.imageUrl && (
                  <div className="file-card-thumb">
                    <img src={ach.imageUrl} alt={ach.title} loading="lazy" />
                  </div>
                )}
                <div className="file-card-info">
                  <h4>{ach.title}</h4>
                  {ach.result && <span className="file-card-result">{ach.result}</span>}
                  {ach.organization && <span className="file-card-org">{ach.organization}</span>}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Image Preview ── */}
      {activeView === 'preview' && selectedAchievement && createPortal(
        <div className="file-preview-overlay" onClick={closePreview}>
          <div className="file-preview-panel" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label={selectedAchievement.title}>
            <button ref={previewClose} className="preview-close" onClick={closePreview} aria-label="Close preview"><X size={20} /></button>
            {selectedAchievement.imageUrl && (
              <div className="preview-image">
                <img src={selectedAchievement.imageUrl} alt={selectedAchievement.title} />
              </div>
            )}
            <div className="preview-details">
              <h3>{selectedAchievement.title}</h3>
              {selectedAchievement.result && <span className="preview-result">{selectedAchievement.result}</span>}
              {selectedAchievement.organization && <p className="preview-org">{selectedAchievement.organization}</p>}
              {selectedAchievement.description && <p className="preview-desc">{selectedAchievement.description}</p>}
            </div>
          </div>
        </div>, document.body
      )}

      {/* ── Coding Profiles ── */}
      {activeView === 'grid' && (
        <div className="vault-coding-profiles">
          <div className="vcp-header"><Code2 size={16} /><h3>Coding Profiles</h3></div>
          <div className="vcp-grid">
            {codingProfiles.map((p) => (
              <a key={p.name} href={p.url} target="_blank" rel="noreferrer" className="vcp-card">
                <div className="vcp-name">{p.name}</div>
                <div className="vcp-stat">{p.stat}</div>
                <ArrowUpRight size={14} className="vcp-arrow" />
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
