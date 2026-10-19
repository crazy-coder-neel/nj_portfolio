'use client'

import { useLayoutEffect, useRef, useState, useEffect, useCallback } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { ArrowDown, ArrowUpRight, ExternalLink, Menu, X, Mail, Phone, MapPin, Code2, Trophy, Users, BookOpen, Briefcase, GraduationCap, Sparkles, ArrowUp, Filter } from 'lucide-react'
import { AchievementVault } from './achievement-vault'
import { PhotoGallery } from './photo-gallery'
import { SceneAtmosphere } from './scene-atmosphere'
import { IntroSplash } from './intro-splash'
import { CinematicPassage } from './cinematic-passage'

if (typeof window !== 'undefined') gsap.registerPlugin(ScrollTrigger)

// Brand icons (not available in lucide-react)
function Github({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.6.11.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
    </svg>
  )
}

function Linkedin({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  )
}

/* ── 7 Scenes (Community section removed) ── */
const scenes = [
  { id: 'hero', number: '01', label: 'The Arrival', image: '/scenes/hero.webp' },
  { id: 'about', number: '02', label: 'The Observatory', image: '/scenes/about.webp' },
  { id: 'skills', number: '03', label: 'The Digital Monolith', image: '/scenes/skills.webp' },
  { id: 'work', number: '04', label: 'The Portal', image: '/scenes/work.webp' },
  { id: 'experience', number: '05', label: 'The Path', image: '/scenes/experience.webp' },
  { id: 'achievements', number: '06', label: 'The Eclipse', image: '/scenes/achievements.webp' },
  { id: 'contact', number: '07', label: 'The Final Horizon', image: '/scenes/contact.webp' },
]

type ProjectCategory = 'ai-ml' | 'app-dev' | 'fullstack'
const projectFilters = [
  { id: 'all' as const, label: 'All Projects' },
  { id: 'ai-ml' as ProjectCategory, label: 'AI / ML' },
  { id: 'app-dev' as ProjectCategory, label: 'App Dev' },
  { id: 'fullstack' as ProjectCategory, label: 'Full Stack' },
]
const projects = [
  // — AI / ML —
  { title: 'NyayaSaathi', type: 'AI LEGAL INTELLIGENCE PLATFORM', category: 'ai-ml' as ProjectCategory,
    description: 'AI-augmented legal intelligence system for India\'s undertrial crisis. Multi-LLM pipeline (Llama 3 + Mistral 7B) with Bhashini API for multilingual support, Supabase-backed case management, and Twilio SMS integration for undertrial notifications.',
    tags: ['FastAPI', 'Supabase', 'Ollama', 'Llama 3', 'React', 'Twilio', 'Bhashini API'],
    link: 'https://nayaya-saathi.vercel.app/', github: 'https://github.com/crazy-coder-neel', icon: '⚖️', color: '#f59e0b' },
  { title: 'AnnadataSaathi', type: 'PRECISION AGRICULTURE PLATFORM', category: 'ai-ml' as ProjectCategory,
    description: 'Full-stack precision-agriculture platform integrating Sentinel-2 satellite data for field-level crop monitoring. ResNet + EfficientNet ensemble for disease detection (38 classes), NDVI-based multispectral pipeline, and XGBoost crop-yield prediction.',
    tags: ['Python', 'XGBoost', 'TensorFlow', 'FastAPI', 'React', 'Sentinel-2', 'GCP', 'Supabase'],
    link: 'https://annadatasaathi.vercel.app/', github: 'https://github.com/crazy-coder-neel', icon: '🌾', color: '#4ade80' },
  { title: 'SankatSaathi', type: 'NATIONAL EMERGENCY RESPONSE SYSTEM', category: 'ai-ml' as ProjectCategory,
    description: 'Comprehensive AI-powered crisis management platform with real-time incident monitoring, ML hotspot detection, multi-language support (5 languages), 3D Earth visualization, voice navigation, and emergency SOS integration.',
    tags: ['React', 'FastAPI', 'Firebase', 'Gemini AI', 'Twilio', 'Three.js'],
    link: 'https://sankat-saathi.vercel.app/landing', github: 'https://github.com/crazy-coder-neel', icon: '🚨', color: '#ef4444' },
  { title: 'Episteme', type: 'DETERMINISTIC LEARNING ENGINE', category: 'ai-ml' as ProjectCategory,
    description: 'AI diagnostic engine replacing guessing with Fault Tree Analysis and Knowledge DAGs to identify cognitive gaps. IRT ability estimation, Behavior Tree sequencer for adaptive learning, and RAG-powered QA grounded in textbook facts.',
    tags: ['React', 'FastAPI', 'spaCy', 'NLTK', 'Scikit-Learn', 'Supabase', 'py-trees'],
    link: 'https://zentrix-liard.vercel.app/login', github: 'https://github.com/crazy-coder-neel/zentrix', icon: '🧬', color: '#a78bfa' },
  { title: 'Zenith', type: 'AGENTIC AI CODE EDITOR', category: 'ai-ml' as ProjectCategory,
    description: 'Multi-agent AI coding pipeline using LangGraph with planner, coder, tester, and reviewer agents for autonomous code changes. Features codebase RAG with ChromaDB, GitHub-integrated version control, and real-time code visualization.',
    tags: ['Python', 'Langchain', 'LangGraph', 'Electron', 'ChromaDB'],
    link: 'https://github.com/crazy-coder-neel/ZENITH_AI_CODE_EDITOR', github: 'https://github.com/crazy-coder-neel/ZENITH_AI_CODE_EDITOR', icon: '⚡', color: '#8b5cf6' },
  { title: 'MedTrack', type: 'AI HEALTHCARE ASSISTANT', category: 'ai-ml' as ProjectCategory,
    description: 'CNN for X-ray-based diagnosis (81% accuracy) and classical ML models for symptom-based detection (85–88% accuracy). Integrated local Qwen 2.5 3B model for treatment recommendations with PostgreSQL-backed appointment-booking flow.',
    tags: ['Python', 'TensorFlow', 'Scikit-learn', 'Flask', 'PostgreSQL'],
    link: 'https://github.com/crazy-coder-neel/MedTrack_Final', github: 'https://github.com/crazy-coder-neel/MedTrack_Final', icon: '🏥', color: '#06b6d4' },
  { title: 'WebQA Extension', type: 'BROWSER AI ASSISTANT', category: 'ai-ml' as ProjectCategory,
    description: 'Browser extension powered by LangChain and Python that analyzes webpage content in real-time. Extracts page text via JavaScript, processes with LangChain pipeline, and returns instant answers using Meta Llama.',
    tags: ['Python', 'Flask', 'LangChain', 'Llama', 'BeautifulSoup', 'JavaScript'],
    link: 'https://github.com/crazy-coder-neel/WebQA-Extension', github: 'https://github.com/crazy-coder-neel/WebQA-Extension', icon: '🔍', color: '#22d3ee' },
  { title: 'Twitter Sentiment Analysis', type: 'ML WEB APP', category: 'ai-ml' as ProjectCategory,
    description: 'Machine learning web app that classifies tweet sentiment (positive, negative, neutral) using TF-IDF vectorization and Logistic Regression with visual feedback indicators.',
    tags: ['Python', 'Flask', 'Scikit-learn', 'TF-IDF', 'Pandas'],
    link: 'https://github.com/crazy-coder-neel/Twitter-Sentiment-Analysis', github: 'https://github.com/crazy-coder-neel/Twitter-Sentiment-Analysis', icon: '🐦', color: '#38bdf8' },
  { title: 'Spam Mail Detection', type: 'ML CLASSIFIER', category: 'ai-ml' as ProjectCategory,
    description: 'Spam email classifier built with TF-IDF vectorization and Logistic Regression. Takes raw email text and classifies it as Spam or Ham with visual feedback.',
    tags: ['Python', 'Flask', 'Scikit-learn', 'TF-IDF', 'Logistic Regression'],
    link: 'https://github.com/crazy-coder-neel/SpamMailDetection', github: 'https://github.com/crazy-coder-neel/SpamMailDetection', icon: '📧', color: '#f472b6' },
  // — App Dev —
  { title: 'EncryptX', type: 'ANDROID SECURITY APP', category: 'app-dev' as ProjectCategory,
    description: 'Android application providing secure encryption and decryption of text and images using AES/RSA algorithms. Features custom secret key support and a clean, minimal UI.',
    tags: ['Java', 'Android', 'AES', 'RSA', 'XML'],
    link: 'https://github.com/crazy-coder-neel/EncryptX', github: 'https://github.com/crazy-coder-neel/EncryptX', icon: '🔐', color: '#10b981' },
  { title: 'Flashcard Quiz App', type: 'FLUTTER AI QUIZ APP', category: 'app-dev' as ProjectCategory,
    description: 'Interactive quiz app with Gemini AI integration for smart quiz generation and chatbot interaction. Features domain-organized flashcards, dynamic question generation, and Firebase authentication.',
    tags: ['Flutter', 'Firebase', 'Gemini API', 'Dart'],
    link: 'https://github.com/crazy-coder-neel/Flashcard_Quiz_App', github: 'https://github.com/crazy-coder-neel/Flashcard_Quiz_App', icon: '🃏', color: '#6366f1' },
  { title: 'Quotify', type: 'MULTILINGUAL QUOTE GENERATOR', category: 'app-dev' as ProjectCategory,
    description: 'Random multilingual quote generator based on user mood or prompt, built with Flutter and Generative AI for personalized quote delivery.',
    tags: ['Flutter', 'Generative AI', 'Dart'],
    link: 'https://github.com/crazy-coder-neel/Quotify_1x', github: 'https://github.com/crazy-coder-neel/Quotify_1x', icon: '💬', color: '#fbbf24' },
  // — Full Stack —
  { title: 'Fast Food Ordering Website', type: 'FULL-STACK WEB APP', category: 'fullstack' as ProjectCategory,
    description: 'Dynamic food ordering system with session-managed cart, payment options (cash/online), and auto-generated PDF invoices using FPDF. Built with PHP + MySQL on Apache.',
    tags: ['PHP', 'MySQL', 'HTML/CSS', 'JavaScript', 'FPDF'],
    link: 'https://github.com/crazy-coder-neel/FoodOrderingWebApp', github: 'https://github.com/crazy-coder-neel/FoodOrderingWebApp', icon: '🍔', color: '#fb923c' },
  { title: 'Random Quiz Generator', type: 'JAVA EE WEB APP', category: 'fullstack' as ProjectCategory,
    description: 'Java Servlet-based web app that dynamically generates random quizzes from PostgreSQL. Uses JDBC for database operations, JSP for rendering, and Apache Tomcat for hosting.',
    tags: ['Java Servlets', 'JSP', 'PostgreSQL', 'JDBC', 'Tomcat'],
    link: 'https://github.com/crazy-coder-neel/RandomQuizGenerator', github: 'https://github.com/crazy-coder-neel/RandomQuizGenerator', icon: '🎯', color: '#e879f9' },
  { title: 'FastFood Application (VB.NET)', type: 'DESKTOP APPLICATION', category: 'fullstack' as ProjectCategory,
    description: 'Fast food ordering desktop application built with VB.NET, featuring menu browsing, order management, and billing functionality.',
    tags: ['VB.NET', 'Windows Forms'],
    link: 'https://github.com/crazy-coder-neel/NJ_FastFood_', github: 'https://github.com/crazy-coder-neel/NJ_FastFood_', icon: '🖥️', color: '#94a3b8' },
]

const skillCategories = [
  { title: 'Languages', items: ['Python', 'C++', 'Java', 'JavaScript', 'SQL', 'HTML/CSS'], icon: '{ }' },
  { title: 'Development', items: ['React', 'Flask', 'FastAPI', 'Spring Boot', 'OpenCV', 'Twilio', 'REST APIs'], icon: '⚙️' },
  { title: 'AI / ML', items: ['TensorFlow', 'PyTorch', 'Keras', 'Scikit-learn', 'LangChain', 'LangGraph', 'NumPy', 'Pandas'], icon: '🧠' },
  { title: 'Cloud & DevTools', items: ['GCP', 'Azure', 'Microsoft Foundry AI', 'Vercel', 'Render', 'Git/GitHub', 'Linux/Unix', 'Docker'], icon: '☁️' },
  { title: 'Other', items: ['Product Thinking', 'Technical Writing', 'Event Operations', 'Community Building', 'UI/UX Design'], icon: '✦' },
]

const constellationNodes = [
  { id: 'python', label: 'Python', x: 0.22, y: 0.18, size: 18, color: '#4B8BBE' },
  { id: 'react', label: 'React', x: 0.75, y: 0.12, size: 16, color: '#61DAFB' },
  { id: 'tensorflow', label: 'TensorFlow', x: 0.12, y: 0.45, size: 16, color: '#FF6F00' },
  { id: 'langchain', label: 'LangChain', x: 0.42, y: 0.32, size: 15, color: '#1C3C3C' },
  { id: 'gcp', label: 'GCP', x: 0.82, y: 0.38, size: 15, color: '#4285F4' },
  { id: 'flask', label: 'Flask', x: 0.55, y: 0.55, size: 13, color: '#888888' },
  { id: 'postgres', label: 'PostgreSQL', x: 0.88, y: 0.62, size: 14, color: '#336791' },
  { id: 'docker', label: 'Docker', x: 0.68, y: 0.72, size: 13, color: '#2496ED' },
  { id: 'pytorch', label: 'PyTorch', x: 0.28, y: 0.65, size: 14, color: '#EE4C2C' },
  { id: 'git', label: 'Git', x: 0.48, y: 0.82, size: 13, color: '#F05032' },
  { id: 'azure', label: 'Azure', x: 0.15, y: 0.78, size: 13, color: '#0078D4' },
  { id: 'js', label: 'JavaScript', x: 0.62, y: 0.25, size: 14, color: '#F7DF1E' },
  { id: 'cpp', label: 'C++', x: 0.35, y: 0.48, size: 13, color: '#00599C' },
  { id: 'langgraph', label: 'LangGraph', x: 0.52, y: 0.12, size: 12, color: '#22d3ee' },
  { id: 'fastapi', label: 'FastAPI', x: 0.78, y: 0.48, size: 13, color: '#009688' },
  { id: 'keras', label: 'Keras', x: 0.08, y: 0.58, size: 12, color: '#D00000' },
  { id: 'supabase', label: 'Supabase', x: 0.92, y: 0.22, size: 12, color: '#3ECF8E' },
  { id: 'linux', label: 'Linux', x: 0.38, y: 0.92, size: 12, color: '#FCC624' },
  { id: 'opencv', label: 'OpenCV', x: 0.18, y: 0.32, size: 12, color: '#5C3EE8' },
  { id: 'twilio', label: 'Twilio', x: 0.72, y: 0.88, size: 11, color: '#F22F46' },
]

const constellationEdges = [
  ['python', 'tensorflow'], ['python', 'pytorch'], ['python', 'flask'], ['python', 'langchain'],
  ['python', 'fastapi'], ['python', 'keras'], ['python', 'opencv'],
  ['react', 'js'], ['js', 'flask'], ['react', 'langgraph'],
  ['tensorflow', 'pytorch'], ['tensorflow', 'keras'],
  ['langchain', 'langgraph'], ['langchain', 'gcp'],
  ['gcp', 'azure'], ['gcp', 'docker'], ['gcp', 'postgres'], ['gcp', 'supabase'],
  ['flask', 'postgres'], ['flask', 'docker'],
  ['docker', 'linux'], ['docker', 'git'],
  ['fastapi', 'react'], ['fastapi', 'gcp'],
  ['pytorch', 'azure'], ['cpp', 'python'],
  ['git', 'linux'], ['twilio', 'flask'],
]

const TOTAL_SCENES = 7

function Chapter({ number, label }: { number: string; label: string }) {
  return <div className="chapter"><span>{number} / 0{TOTAL_SCENES}</span><i /><span>{label}</span></div>
}

function TypingText({ texts }: { texts: string[] }) {
  const [currentText, setCurrentText] = useState('')
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    const text = texts[currentIndex]
    const timeout = setTimeout(() => {
      if (!isDeleting) {
        setCurrentText(text.substring(0, currentText.length + 1))
        if (currentText.length === text.length) {
          setTimeout(() => setIsDeleting(true), 2000)
        }
      } else {
        setCurrentText(text.substring(0, currentText.length - 1))
        if (currentText.length === 0) {
          setIsDeleting(false)
          setCurrentIndex((prev) => (prev + 1) % texts.length)
        }
      }
    }, isDeleting ? 40 : 80)
    return () => clearTimeout(timeout)
  }, [currentText, currentIndex, isDeleting, texts])

  return <span className="typing-text">{currentText}<span className="typing-cursor">|</span></span>
}

function StatCounter({ end, label, suffix = '' }: { end: number; label: string; suffix?: string }) {
  // These are content, so render the real values before hydration or animation.
  return <div className="stat-counter"><span className="stat-number">{end}{suffix}</span><span className="stat-label">{label}</span></div>
}

function TechConstellation() {
  const [selected, setSelected] = useState<string>('python')
  const positions = constellationNodes.map((node, i) => {
    const inner = i < 8
    const angle = ((inner ? i / 8 : (i - 8) / 12) * Math.PI * 2) - Math.PI / 2
    const radius = inner ? 178 : 306
    return { ...node, px: Math.round((420 + Math.cos(angle) * radius) * 100) / 100, py: Math.round((420 + Math.sin(angle) * radius) * 100) / 100 }
  })
  const connected = new Set(constellationEdges.filter(edge => edge.includes(selected)).flat())
  const current = positions.find(node => node.id === selected)!
  return (
    <div className="ecosystem-panel">
      <div className="ecosystem-heading"><span className="live-dot" /> Technology ecosystem <span>20 technologies</span></div>
      <svg className="ecosystem-map" viewBox="0 0 840 840" role="group" aria-label="Interactive technology network. Select a technology to trace its connections.">
        <defs>
          <radialGradient id="core-light"><stop stopColor="#ffb477" stopOpacity=".22" /><stop offset="1" stopColor="#ffb477" stopOpacity="0" /></radialGradient>
          <linearGradient id="orbit-line"><stop stopColor="#ffb477" stopOpacity=".6" /><stop offset="1" stopColor="#8fcbff" stopOpacity=".15" /></linearGradient>
        </defs>
        <circle cx="420" cy="420" r="380" fill="url(#core-light)" />
        <g className="ecosystem-orbits" fill="none" stroke="url(#orbit-line)">
          <circle cx="420" cy="420" r="178" /><circle cx="420" cy="420" r="306" />
          <circle cx="420" cy="420" r="365" strokeDasharray="2 12" />
        </g>
        <g className="ecosystem-scan" fill="none" stroke="#ffb477" strokeWidth="2"><circle cx="420" cy="420" r="255" strokeDasharray="100 1500" /></g>
        {constellationEdges.map(([fromId, toId]) => {
          const from = positions.find(n => n.id === fromId)!, to = positions.find(n => n.id === toId)!
          const active = fromId === selected || toId === selected
          return <path key={`${fromId}-${toId}`} d={`M ${from.px} ${from.py} Q 420 420 ${to.px} ${to.py}`} className={active ? 'ecosystem-edge active' : 'ecosystem-edge'} />
        })}
        <circle cx="420" cy="420" r="78" fill="#0a121c" stroke="#ffb477" strokeOpacity=".6" />
        <text x="420" y="409" className="ecosystem-core-title">BUILD.</text><text x="420" y="438" className="ecosystem-core-subtitle">CONNECT. SHIP.</text>
        {positions.map(node => <g key={node.id} transform={`translate(${node.px}, ${node.py})`} role="button" tabIndex={0}
          aria-label={`Explore ${node.label} connections`} aria-pressed={selected === node.id}
          onClick={() => setSelected(node.id)} onFocus={() => setSelected(node.id)}
          onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelected(node.id) } }}
          className={`ecosystem-node ${connected.has(node.id) ? 'connected' : ''} ${selected === node.id ? 'selected' : ''}`}>
          <circle r="29" fill="#0c1825" stroke={selected === node.id ? '#ffb477' : '#8fcbff'} />
          <circle r="9" fill={node.id === 'langchain' ? '#79cbbb' : node.color} />
          <rect x="-62" y="33" width="124" height="30" rx="15" fill="#080f18" />
          <text y="54">{node.label}</text>
        </g>)}
      </svg>
      <label className="ecosystem-picker">Explore a technology<select value={selected} onChange={event => setSelected(event.target.value)}>{positions.map(node => <option key={node.id} value={node.id}>{node.label}</option>)}</select></label>
      <div className="ecosystem-detail" aria-live="polite"><span className="ecosystem-detail-label">Explore the connections</span><strong>{current.label}</strong><p>{positions.filter(node => node.id !== selected && connected.has(node.id)).map(node => node.label).join(' · ')}</p></div>
      <p className="ecosystem-hint">Select a node to explore how the stack connects.</p>
    </div>
  )
}

/* ── Projects Section with Filter ── */
function ProjectsSection({ sceneImage, scrollTo }: { sceneImage: string; scrollTo: (id: string) => void }) {
  const [activeFilter, setActiveFilter] = useState<'all' | ProjectCategory>('all')
  const [isMobile, setIsMobile] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const projectRoot = useRef<HTMLElement>(null)

  useEffect(() => {
    const query = window.matchMedia('(max-width: 700px)')
    const update = () => setIsMobile(query.matches)
    update()
    query.addEventListener('change', update)
    return () => query.removeEventListener('change', update)
  }, [])

  useLayoutEffect(() => {
    const media = gsap.matchMedia()
    media.add('(prefers-reduced-motion: no-preference)', () => {
      gsap.utils.toArray<HTMLElement>('.project-card-v2', projectRoot.current).forEach((card, i) => {
        gsap.fromTo(card, { y: 95, scale: .88, rotation: i % 2 ? 3 : -3 }, {
          y: 0, scale: 1, rotation: 0, ease: 'none',
          scrollTrigger: { trigger: card.parentElement, start: 'top 95%', end: 'top 50%', scrub: .5, invalidateOnRefresh: true },
        })
      })
    }, projectRoot)
    ScrollTrigger.refresh()
    return () => media.revert()
  }, [activeFilter, isMobile, expanded])

  const filtered = activeFilter === 'all' ? projects : projects.filter(p => p.category === activeFilter)
  const visible = isMobile && !expanded ? filtered.slice(0, 5) : filtered

  return (
    <div className="scene-track"><section ref={projectRoot} id="work" className="scene projects-scene-v2" style={{ '--scene-image': `url(${sceneImage})` } as React.CSSProperties}>
      <SceneAtmosphere /><div className="scene-overlay" />
      <div className="scene-content projects-content-v2">
        <div className="projects-header">
          <div><p className="eyebrow">04 — Projects</p><h2>Ideas<br /><em>in action.</em></h2></div>
          <div className="project-filters">
            {projectFilters.map((f) => (
              <button key={f.id} aria-pressed={activeFilter === f.id} className={`project-filter-btn ${activeFilter === f.id ? 'pf-active' : ''}`} onClick={() => { setActiveFilter(f.id as typeof activeFilter); setExpanded(false) }}>
                {f.label}
                <span className="pf-count">{f.id === 'all' ? projects.length : projects.filter(p => p.category === f.id).length}</span>
              </button>
            ))}
          </div>
        </div>
        <div id="project-list" className="project-cards-grid" data-expanded={expanded}>
          {visible.map((project) => (
            <div className="project-card-track" key={project.title}><article className="project-card-v2" style={{ '--accent': project.color } as React.CSSProperties}>
              <div className="project-card-glow" />
              <div className="project-card-inner">
                <div className="project-card-top"><span className="project-icon">{project.icon}</span><span className="project-category-badge">{project.category === 'ai-ml' ? 'AI / ML' : project.category === 'app-dev' ? 'App Dev' : 'Full Stack'}</span></div>
                <p className="project-type">{project.type}</p><h3>{project.title}</h3>
                <p className="project-description">{project.description}</p>
                <div className="tags">{project.tags.map((tag) => <span key={tag}>{tag}</span>)}</div>
                <div className="project-links">
                  <a href={project.link} target="_blank" rel="noreferrer" className="project-link">View project <ArrowUpRight size={14} /></a>
                  {project.github && project.github !== project.link && (
                    <a href={project.github} target="_blank" rel="noreferrer" className="project-link project-link-secondary"><Github size={13} /> GitHub</a>
                  )}
                </div>
              </div>
            </article></div>
          ))}
        </div>
        {filtered.length > 5 && <div className="mobile-projects-more">
          <p aria-live="polite">Showing {expanded ? filtered.length : 5} of {filtered.length} projects</p>
          <button className="button button-primary" aria-expanded={expanded} aria-controls="project-list" onClick={() => {
            setExpanded(!expanded)
            if (expanded) projectRoot.current?.scrollIntoView({ behavior: 'instant' })
          }}>{expanded ? 'Show fewer projects' : `View ${filtered.length - 5} more projects`} <ArrowDown aria-hidden="true" /></button>
        </div>}
      </div>
      <Chapter number="04" label="The Portal" />
    </section></div>
  )
}

export function Portfolio() {
  const root = useRef<HTMLDivElement>(null)
  const cursorRef = useRef<HTMLDivElement>(null)
  const cursorDotRef = useRef<HTMLDivElement>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [active, setActive] = useState('hero')
  const [introReady, setIntroReady] = useState(false)
  const [introSequence, setIntroSequence] = useState(0)
  const revealIntro = useCallback(() => setIntroReady(true), [])
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce), (pointer: coarse)').matches) return
    const glow = cursorRef.current, dot = cursorDotRef.current
    if (!glow || !dot) return
    const glowX = gsap.quickTo(glow, 'x', { duration: .6, ease: 'power3.out' })
    const glowY = gsap.quickTo(glow, 'y', { duration: .6, ease: 'power3.out' })
    const dotX = gsap.quickTo(dot, 'x', { duration: .1, ease: 'power2.out' })
    const dotY = gsap.quickTo(dot, 'y', { duration: .1, ease: 'power2.out' })
    const move = (e: MouseEvent) => { glowX(e.clientX); glowY(e.clientY); dotX(e.clientX); dotY(e.clientY) }
    window.addEventListener('mousemove', move, { passive: true })
    return () => { window.removeEventListener('mousemove', move); gsap.killTweensOf([glow, dot]) }
  }, [])

  useLayoutEffect(() => {
    let removePointerListener = () => { }
    const ctx = gsap.context(() => {
      const sections = gsap.utils.toArray<HTMLElement>('.scene')
      const motion = gsap.matchMedia()
      motion.add('(prefers-reduced-motion: no-preference)', () => {
        sections.forEach(section => {
          const track = section.parentElement!
          const content = section.querySelector('.scene-content')
          const hold = gsap.to({}, { duration: 1, paused: true })
          const sequence = gsap.timeline({ scrollTrigger: {
            trigger: track, start: 'top 95%', end: 'bottom 15%', scrub: .6,
            onRefresh: () => hold.duration(Math.max(.1, track.offsetHeight / innerHeight - .7)),
          } })
          sequence.fromTo(section, {
            scaleX: section.id === 'hero' ? 1 : .94,
            borderRadius: section.id === 'hero' ? 0 : 32,
          }, { scaleX: 1, borderRadius: 0, duration: .8, ease: 'none' })
          sequence.add(hold.play())
          sequence.to(section, { scaleX: .94, borderRadius: 32, duration: .7, ease: 'none' })
          sequence.to(content, { opacity: .65, duration: .7, ease: 'none' }, '<')
        })
        gsap.to('.hero .scene-art', { opacity: .4, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'bottom 75%', end: 'bottom top', scrub: true } })
        gsap.to('.world-title', { yPercent: -22, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } })
        gsap.fromTo('.manifesto-word', { xPercent: 12 }, { xPercent: -12, ease: 'none', scrollTrigger: { trigger: '.world-manifesto', start: 'top bottom', end: 'bottom top', scrub: true } })
        gsap.from('.manifesto-bars i', { scaleY: 0, stagger: .035, transformOrigin: 'bottom', ease: 'power3.inOut', scrollTrigger: { trigger: '.world-manifesto', start: 'top 90%', end: 'top 25%', scrub: 1 } })
      })
      sections.forEach((section) => {
        const content = section.querySelector('.scene-content')
        const art = section.querySelector('.scene-art')
        gsap.fromTo(art, { scale: 1.14, filter: 'saturate(.65) brightness(.68)' }, { scale: 1, filter: 'saturate(1) brightness(1)', duration: 1.8, ease: 'power2.out', scrollTrigger: { trigger: section, start: 'top bottom', end: 'bottom top', scrub: 1 } })
        gsap.to(section.querySelector('.chapter'), { x: -14, opacity: .9, scrollTrigger: { trigger: section, start: 'top bottom', end: 'bottom top', scrub: 1 } })
        ScrollTrigger.create({ trigger: section, start: 'top 45%', end: 'bottom 45%', onEnter: () => setActive(section.id), onEnterBack: () => setActive(section.id) })
      })


      gsap.utils.toArray<HTMLElement>('.skill-card').forEach((card, i) => {
        gsap.fromTo(card, { y: 40, opacity: 0, scale: 0.95 }, { y: 0, opacity: 1, scale: 1, duration: 0.7, delay: i * 0.08, ease: 'power3.out', scrollTrigger: { trigger: card, start: 'top 88%', once: true } })
      })
      gsap.utils.toArray<HTMLElement>('.achievement-item').forEach((el, i) => {
        gsap.fromTo(el, { x: -30, opacity: 0 }, { x: 0, opacity: 1, duration: 0.6, delay: i * 0.12, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 88%', once: true } })
      })
      gsap.utils.toArray<HTMLElement>('.timeline-item').forEach((el, i) => {
        gsap.fromTo(el, { x: -40, opacity: 0 }, { x: 0, opacity: 1, duration: 0.7, delay: i * 0.15, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 85%', once: true } })
      })

      const aboutLeft = document.querySelector('.about-left')
      const aboutRight = document.querySelector('.about-right')
      if (aboutLeft) gsap.fromTo(aboutLeft, { x: -40, opacity: 0 }, { x: 0, opacity: 1, duration: 1, ease: 'power3.out', scrollTrigger: { trigger: aboutLeft, start: 'top 80%', once: true } })
      if (aboutRight) gsap.fromTo(aboutRight, { x: 40, opacity: 0 }, { x: 0, opacity: 1, duration: 1, delay: 0.2, ease: 'power3.out', scrollTrigger: { trigger: aboutRight, start: 'top 80%', once: true } })

      const expLeft = document.querySelector('.exp-col-left')
      const expRight = document.querySelector('.exp-col-right')
      if (expLeft) gsap.fromTo(expLeft, { x: -40, opacity: 0 }, { x: 0, opacity: 1, duration: 1, ease: 'power3.out', scrollTrigger: { trigger: expLeft, start: 'top 80%', once: true } })
      if (expRight) gsap.fromTo(expRight, { x: 40, opacity: 0 }, { x: 0, opacity: 1, duration: 1, delay: 0.2, ease: 'power3.out', scrollTrigger: { trigger: expRight, start: 'top 80%', once: true } })

      // Vault folder entrance
      gsap.utils.toArray<HTMLElement>('.vault-folder').forEach((el, i) => {
        gsap.fromTo(el, { y: 50, opacity: 0, scale: 0.92 }, { y: 0, opacity: 1, scale: 1, duration: 0.7, delay: i * 0.08, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 88%', once: true } })
      })

      const glitter = document.querySelector('.cursor-glitter')
      let lastSpark = 0
      const move = (event: MouseEvent) => {
        if (!glitter || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
        if (performance.now() - lastSpark < 65) return
        lastSpark = performance.now()
        const spark = document.createElement('span')
        spark.className = 'cursor-spark'
        spark.style.left = `${event.clientX}px`
        spark.style.top = `${event.clientY}px`
        glitter.appendChild(spark)
        gsap.fromTo(spark, { scale: 0, opacity: 1, x: gsap.utils.random(-8, 8), y: gsap.utils.random(-8, 8) }, { scale: gsap.utils.random(.5, 1.4), opacity: 0, x: gsap.utils.random(-28, 28), y: gsap.utils.random(18, 48), duration: gsap.utils.random(.45, .9), ease: 'power2.out', onComplete: () => spark.remove() })
      }
      window.addEventListener('pointermove', move, { passive: true })
      removePointerListener = () => window.removeEventListener('pointermove', move)
    }, root)
    // Filters, vault folders and loaded images can move all later sections.
    // Keep trigger positions synchronized with the actual document height.
    let refreshTimer: ReturnType<typeof setTimeout> | undefined
    const main = root.current?.querySelector('main')
    let lastHeight = main?.getBoundingClientRect().height ?? 0
    const refreshWhenSettled = () => {
      if (ScrollTrigger.isScrolling()) { refreshTimer = setTimeout(refreshWhenSettled, 150); return }
      ScrollTrigger.refresh()
    }
    const layoutObserver = new ResizeObserver(() => {
      const height = main?.getBoundingClientRect().height ?? 0
      if (Math.abs(height - lastHeight) < 1) return
      lastHeight = height
      clearTimeout(refreshTimer)
      refreshTimer = setTimeout(refreshWhenSettled, 250)
    })
    if (main) layoutObserver.observe(main)
    return () => { layoutObserver.disconnect(); clearTimeout(refreshTimer); removePointerListener(); ctx.revert() }
  }, [])

  useLayoutEffect(() => {
    if (!introReady || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const ctx = gsap.context(() => {
      gsap.fromTo('.hero-content > :not(.hero-stats)', { y: 28, opacity: 0 }, { y: 0, opacity: 1, duration: 1, stagger: .1, ease: 'power3.out' })
    }, root)
    return () => ctx.revert()
  }, [introReady])

  const scrollTo = (id: string) => { document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' }); setMenuOpen(false) }

  return (
    <>
    <IntroSplash key={introSequence} replay={introSequence > 0} onReveal={revealIntro} />
    <div ref={root} className="portfolio">
      <div ref={cursorRef} className="cursor-glow" aria-hidden="true" />
      <div ref={cursorDotRef} className="cursor-dot" aria-hidden="true" />
      <div className="cursor-glitter" aria-hidden="true" />
      <div className="film-grain" aria-hidden="true" />
      <div className="scene-vignette" aria-hidden="true" />
      <div className="world-frame" aria-hidden="true"><span> NJ / PERSONAL UNIVERSE</span><b>+</b><span>EST. IN MUMBAI</span></div>

      <header className="site-nav">
        <button className="monogram" onClick={() => scrollTo('hero')} aria-label="Back to top">NJ<span>.</span></button>
        <nav className={menuOpen ? 'nav-links open' : 'nav-links'} aria-label="Primary navigation">
          {['about', 'skills', 'work', 'experience', 'achievements', 'contact'].map((id) => <button key={id} onClick={() => scrollTo(id)} className={active === id ? 'nav-active' : ''}>{id}</button>)}
        </nav>
        <div className="nav-socials">
          <a href="https://github.com/crazy-coder-neel" target="_blank" rel="noreferrer" aria-label="GitHub"><Github size={16} /></a>
          <a href="https://www.linkedin.com/in/joshi-neelay7/" target="_blank" rel="noreferrer" aria-label="LinkedIn"><Linkedin size={16} /></a>
        </div>
        <button className="menu-toggle" onClick={() => setMenuOpen(!menuOpen)} aria-label={menuOpen ? 'Close menu' : 'Open menu'}>{menuOpen ? <X /> : <Menu />}</button>
      </header>

      <aside className="side-progress" aria-label="Chapter navigation">
        {scenes.map((scene) => <button key={scene.id} className={active === scene.id ? 'active' : ''} onClick={() => scrollTo(scene.id)} aria-label={`Go to ${scene.label}`}><span>{scene.number}</span></button>)}
      </aside>

      <main>
        {/* ===== 01 HERO ===== */}
        <div className="scene-track"><section id="hero" className="scene hero" style={{ '--scene-image': `url(${scenes[0].image})` } as React.CSSProperties}>
          <SceneAtmosphere /><div className="scene-overlay" />
          <div className="scene-content hero-content">
            <div className="world-coordinates"><span>PORTFOLIO / VOL. 01</span><span>19.0760° N &nbsp; 72.8777° E</span></div>
            <p className="eyebrow">A curious mind. An expanding universe.</p>
            <h1 className="world-title" tabIndex={-1}><span>NEELAY</span><span>JOSHI<span className="world-asterisk" aria-hidden="true">✳</span></span></h1>
            <div className="world-intro"><span className="world-index">[ 001 — THE ARRIVAL ]</span><p className="hero-copy">Exploring what comes next.<br />Building it into something real.<br /><small>AI / Software / Community · VJTI Mumbai</small></p></div>
            <div className="hero-actions">
              <button className="button button-primary" onClick={() => scrollTo('work')}>Explore my work <ArrowDown /></button>
              <a className="text-link" href="/neelay-joshi-resume.pdf" target="_blank" rel="noreferrer">View résumé <ArrowUpRight /></a>
              <button className="text-link" onClick={() => scrollTo('contact')}>Let&apos;s connect <ArrowUpRight /></button>
            </div>
            <div className="hero-stats">
              <StatCounter end={600} suffix="+" label="DSA Problems" />
              <StatCounter end={5} label="Hackathon Awards" />
              <StatCounter end={15} suffix="+" label="Projects Built" />
            </div>
          </div>
          <Chapter number="01" label="The Arrival" />
          <button className="scroll-cue" onClick={() => scrollTo('about')}><span>Scroll to explore</span><ArrowDown /></button>
        </section></div>

        <section className="world-manifesto" aria-label="From curiosity to creation">
          <div className="manifesto-meta"><span>THE MIND BEHIND THE WORK</span><span>01 — 02 / KEEP EXPLORING ↘</span></div>
          <div className="manifesto-bars" aria-hidden="true">{Array.from({ length: 18 }, (_, i) => <i key={i} style={{ '--bar': i } as React.CSSProperties} />)}</div>
          <p className="manifesto-word">STAY CURIOUS.</p>
          <div className="manifesto-bottom"><span>Ideas are only the beginning.</span><p>I turn curiosity into code, experiments into projects,<br />and shared ambition into communities.</p><button onClick={() => scrollTo('about')} aria-label="Meet Neelay"><ArrowDown /></button></div>
        </section>

        <CinematicPassage images={[scenes[1].image, scenes[2].image, scenes[3].image]} />

        {/* ===== 02 ABOUT ===== */}
        <div className="scene-track"><section id="about" className="scene about-scene" style={{ '--scene-image': `url(${scenes[1].image})` } as React.CSSProperties}>
          <SceneAtmosphere /><div className="scene-overlay warm" />
          <div className="scene-content layout-split about-split-content">
            <div className="about-left">
              <p className="eyebrow">02 — About</p>
              <h2>Curiosity is<br /><em>where it begins.</em></h2>
              
<p>I’m Neelay Joshi, a Computer Engineering student at VJTI Mumbai passionate about building impactful software and solving complex problems. From engineering backend systems and full-stack applications to developing AI-powered solutions and agentic systems, I enjoy turning ideas into reliable, scalable products.</p>
<p>With a strong interest in DSA, competitive programming, and system design, I approach challenges through analytical thinking and continuous experimentation. I actively contribute to open source, explore emerging technologies, and continuously learn and adapt to become a better engineer.</p>
<p>Beyond code, I serve as Secretary at Digital VJTI, organize technical events and initiatives, and mentor peers. I believe in continuous growth, collaborative problem-solving, and using technology to build solutions that make a meaningful difference.</p>

              <div className="currently-developing"><Sparkles size={14} /><div><span className="cd-label">Currently Developing</span><span className="cd-text">Agentic AI · Cloud-Native Architectures · System Design</span></div></div>
            </div>
            <div className="about-right">
              <div className="profile-panel profile-panel-lg">
                <div className="profile-panel-header"><GraduationCap size={20} /><span>Education</span></div>
                <div className="edu-timeline edu-timeline-lg">
                  <div className="edu-item">
                    <div className="edu-dot edu-dot-active" />
                    <div className="edu-details">
                      <h3>VJTI Mumbai</h3>
                      <p className="edu-degree">B.Tech in Computer Engineering</p>
                      <div className="edu-meta"><span className="edu-score">CGPA: 7.24</span><span className="edu-year">2025 – 2028</span></div>
                      <p className="edu-note">One of India&apos;s premier autonomous engineering institutions</p>
                    </div>
                  </div>
                  <div className="edu-item">
                    <div className="edu-dot" />
                    <div className="edu-details">
                      <h3>Bhausaheb Vartak Polytechnic</h3>
                      <p className="edu-degree">Diploma in Computer Engineering</p>
                      <div className="edu-meta"><span className="edu-score edu-highlight">96.57% · Department Topper</span><span className="edu-year">2022 – 2025</span></div>
                      <p className="edu-note">Highest score in the entire Computer Engineering department</p>
                    </div>
                  </div>
                  <div className="edu-item">
                    <div className="edu-dot" />
                    <div className="edu-details">
                      <h3>R.B.K School, Mira Road</h3>
                      <p className="edu-degree">ICSE Board · Class 10</p>
                      <div className="edu-meta"><span className="edu-score">88.80%</span><span className="edu-year">2022</span></div>
                    </div>
                  </div>
                </div>
                <div className="profile-quick-facts profile-quick-facts-lg">
                  <div><MapPin size={14} /> Mumbai, India</div>
                  <div><Code2 size={14} /> Computer Engineering</div>
                  <div><Trophy size={14} /> 5 Hackathon Awards</div>
                </div>
              </div>
            </div>
          </div>
          <Chapter number="02" label="The Observatory" />
        </section></div>

        {/* ===== 03 SKILLS ===== */}
        <div className="scene-track"><section id="skills" className="scene skills-scene-v3" style={{ '--scene-image': `url(${scenes[2].image})` } as React.CSSProperties}>
          <SceneAtmosphere /><div className="scene-overlay cool" />
          <div className="scene-content layout-split skills-split-content">
            <div className="skills-left">
              <p className="eyebrow">03 — Skills &amp; Arsenal</p>
              <h2>The tools are only<br /><em>the beginning.</em></h2>
              <div className="skills-grid-2col">
                {skillCategories.map((cat, catIndex) => (
                  <div className="skill-card skill-card-lg" key={cat.title} style={{ '--card-delay': `${catIndex * 0.08}s` } as React.CSSProperties}>
                    <div className="skill-card-header"><span className="skill-card-icon">{cat.icon}</span><h3>{cat.title}</h3></div>
                    <div className="skill-pills">{cat.items.map((item) => (<span key={item} className="skill-pill">{item}</span>))}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="skills-right skills-right-lg"><TechConstellation /></div>
          </div>
          <Chapter number="03" label="The Digital Monolith" />
        </section></div>

        {/* ===== 04 PROJECTS ===== */}
        <ProjectsSection sceneImage={scenes[3].image} scrollTo={scrollTo} />

        {/* ===== 05 EXPERIENCE ===== */}
        <div className="scene-track"><section id="experience" className="scene experience-scene-v3" style={{ '--scene-image': `url(${scenes[4].image})` } as React.CSSProperties}>
          <SceneAtmosphere /><div className="scene-overlay warm" />
          <div className="scene-content experience-split-content experience-full">
            <p className="eyebrow">05 — Experience &amp; Leadership</p>
            <h2>A journey<br /><em>of growth.</em></h2>
            <div className="layout-split experience-columns experience-columns-full">
              {/* LEFT — College & Community */}
              <div className="exp-col-left">
                <div className="exp-col-header"><Users size={18} /><h3>College &amp; Community</h3></div>
                <div className="timeline timeline-lg">
                  <div className="timeline-item"><span className="timeline-date">Jun 2026 – Present</span><div className="timeline-badge"><Users size={14} /></div><h3>GDG VJTI - Secretary</h3><p>Google Developer Group at VJTI. Leading developer community initiatives, organizing tech talks, workshops, and hackathons.</p></div>
                  <div className="timeline-item"><span className="timeline-date">Jun 2026 – Present</span><div className="timeline-badge"><Code2 size={14} /></div><h3>Digital VJTI - Secretary</h3><p>Managing events, leading a group of passionate people, and building cool stuff for VJTI&apos;s digital infrastructure.</p></div>
                  <div className="timeline-item"><span className="timeline-date">Jan 2026 – Jun 2026</span><div className="timeline-badge"><Code2 size={14} /></div><h3>Digital VJTI - Technical Team</h3><p>Co-built software handling 50+ teams for the Black Box Debuggathon, working cross-functionally from design through live operation.</p></div>
                  <div className="timeline-item"><span className="timeline-date">Ongoing</span><div className="timeline-badge"><Users size={14} /></div><h3>Community of Coders &amp; Project X</h3><p>Developed softwares for events, mentored a group of students for projects, and conducted a workshop under Project X at VJTI.</p></div>
                </div>
              </div>
              {/* RIGHT — Work Experience + Certificate */}
              <div className="exp-col-right">
                <div className="exp-col-header"><Briefcase size={18} /><h3>Work Experience</h3></div>
                <div className="timeline timeline-lg">
                  <div className="timeline-item">
                    <span className="timeline-date">Jun 2024 – Jul 2024</span>
                    <div className="timeline-badge work-badge"><Briefcase size={14} /></div>
                    <h3>AI/ML Intern</h3>
                    <p className="timeline-org">Alvin IT Solutions · Vasai, Maharashtra</p>
                    <ul className="timeline-bullets">
                      
<li>Achieved 92% classification accuracy on a 10K+ email dataset using an NLP pipeline combining TF-IDF feature extraction and Logistic Regression for spam detection.</li>
<li>Implemented an end-to-end sentiment analysis workflow for 4K labeled tweets, spanning text preprocessing, feature engineering, model training, and evaluation.</li>
<li>Experimented with feature representations and model hyperparameters using Pandas, NumPy, and scikit-learn to evaluate classification performance and refine the ML pipeline.</li>

                    </ul>
                    <div className="tags" style={{ marginTop: 14 }}><span>Python</span><span>Scikit-learn</span><span>Pandas</span><span>NLP</span></div>
                  </div>
                </div>
                <div className="intern-certificate">
                  <div className="cert-label"><BookOpen size={14} /> Internship Certificate</div>
                  <div className="cert-image-wrap">
                    <img src="/achievements/internship_certificate.png" width="839" height="602" alt="AI/ML Internship Certificate — Alvin IT Solutions" loading="lazy" />
                  </div>
                </div>
              </div>
            </div>
          </div>
          <Chapter number="05" label="The Path" />
        </section></div>

        {/* ===== 06 ACHIEVEMENT VAULT ===== */}
        <div className="scene-track"><section id="achievements" className="scene achievements-vault-scene" style={{ '--scene-image': `url(${scenes[5].image})` } as React.CSSProperties}>
          <SceneAtmosphere /><div className="scene-overlay vault-overlay" />
          <div className="scene-content vault-section-content">
            <AchievementVault />
          </div>
          <Chapter number="06" label="The Eclipse" />
        </section></div>

        {/* ===== 07 CONTACT ===== */}
        <div className="scene-track"><section id="contact" className="scene contact-scene align-left" style={{ '--scene-image': `url(${scenes[6].image})` } as React.CSSProperties}>
          <SceneAtmosphere /><div className="scene-overlay warm" />
          <div className="scene-content contact-content">
            <p className="eyebrow">07 — Contact me</p>
            <h2>Let&apos;s build<br /><em>something meaningful.</em></h2>
            <p>Have an idea, a challenge, or a reason to build together? I&apos;d love to hear from you.</p>
            <div className="contact-links">
              <a href="mailto:neelayjoshico2@gmail.com" className="contact-card"><Mail size={18} /> neelayjoshico2@gmail.com <ArrowUpRight size={14} /></a>
              <a href="tel:+917718883299" className="contact-card"><Phone size={18} /> +91 77188 83299 <ArrowUpRight size={14} /></a>
              <a href="https://www.linkedin.com/in/joshi-neelay7/" target="_blank" rel="noreferrer" className="contact-card"><Linkedin size={18} /> LinkedIn <ArrowUpRight size={14} /></a>
              <a href="https://github.com/crazy-coder-neel" target="_blank" rel="noreferrer" className="contact-card"><Github size={18} /> GitHub <ArrowUpRight size={14} /></a>
            </div>
          </div>
          <Chapter number="07" label="The Final Horizon" />
        </section></div>
        <PhotoGallery />
      </main>

      {/* ===== FOOTER ===== */}
      <footer className="site-footer">
        <div className="footer-inner">
          <div className="footer-contact">
            <div><p className="eyebrow">Let&apos;s stay in touch</p><h2>Contact <em>me.</em></h2></div>
            <a className="button button-primary" href="mailto:neelayjoshico2@gmail.com">Let&apos;s talk <ArrowUpRight size={18} /></a>
          </div>
          <div className="footer-top">
            <div className="footer-brand">
              <span className="footer-monogram">NJ<span>.</span></span>
              <span className="footer-name">Neelay Joshi</span>
            </div>
            <nav className="footer-nav" aria-label="Footer navigation">
              {['About', 'Skills', 'Projects', 'Experience', 'Achievements', 'Contact'].map((name) => (
                <button key={name} onClick={() => scrollTo(name === 'Projects' ? 'work' : name.toLowerCase())}>{name}</button>
              ))}
            </nav>
          </div>
          <div className="footer-divider" />
          <div className="footer-bottom">
            <div className="footer-social">
              <a href="https://github.com/crazy-coder-neel" target="_blank" rel="noreferrer" aria-label="GitHub"><Github size={16} /> GitHub</a>
              <a href="https://www.linkedin.com/in/joshi-neelay7/" target="_blank" rel="noreferrer" aria-label="LinkedIn"><Linkedin size={16} /> LinkedIn</a>
              <a href="mailto:neelayjoshico2@gmail.com" aria-label="Email"><Mail size={14} /> Email</a>
            </div>
            <div className="footer-signature">
              Made with <span className="footer-heart" aria-label="love">♥</span> by Neelay Joshi
            </div>
            <div className="footer-meta">
              <span className="footer-copyright">© {new Date().getFullYear()} Neelay Joshi. All rights reserved.</span>
              <button className="footer-top-btn" onClick={() => {
                window.scrollTo({ top: 0, behavior: 'instant' })
                setIntroReady(false)
                setIntroSequence(value => value + 1)
              }}>Replay intro <Sparkles size={12} /></button>
              <button className="footer-top-btn" onClick={() => scrollTo('hero')} aria-label="Back to top"><ArrowUp size={14} /> Back to top</button>
            </div>
          </div>
        </div>
      </footer>
    </div>
    </>
  )
}
