'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowRight, Send, Sparkles, Brain, Zap, Shield, BookOpen, Briefcase } from 'lucide-react'
import ClaraLogo from '@/components/ui/ClaraLogo'

const DEMO_EXCHANGES = [
  {
    user: "Comment puis-je lancer mon entreprise avec un budget limité ?",
    clara: "Excellente question. Avec un budget limité, la clé est de valider ton idée avant d'investir. Commence par identifier ton client idéal et propose-lui une version minimaliste de ton produit. Le MVP — Minimum Viable Product — te permet de tester rapidement sans risque financier majeur.",
  },
  {
    user: "Explique-moi l'investissement en bourse pour débutant",
    clara: "L'investissement en bourse repose sur un principe simple : tu achètes une part d'une entreprise en espérant qu'elle prendra de la valeur. Pour commencer, je recommande les ETF — des paniers d'actions diversifiés qui réduisent le risque tout en te donnant accès aux marchés mondiaux.",
  },
  {
    user: "Aide-moi à créer un plan d'étude efficace",
    clara: "Un plan d'étude efficace repose sur trois piliers : la répétition espacée, la pratique active, et les pauses stratégiques. Je vais te créer un système personnalisé basé sur tes objectifs et le temps dont tu disposes chaque jour.",
  },
]

const FEATURES = [
  { icon: Brain, label: 'Mémoire longue durée', desc: 'Clara se souvient de toi à travers chaque conversation' },
  { icon: Zap, label: 'Réponses instantanées', desc: 'Streaming en temps réel, mot par mot' },
  { icon: BookOpen, label: 'Mode Étude', desc: 'Un professeur pédagogue disponible 24h/24' },
  { icon: Briefcase, label: 'Mode Business', desc: 'Conseils entrepreneuriaux de niveau expert' },
  { icon: Shield, label: '100% privé', desc: 'Tes données ne sont jamais partagées' },
  { icon: Sparkles, label: 'IA de pointe', desc: 'Propulsée par les meilleurs modèles disponibles' },
]

export default function LandingPage() {
  const router = useRouter()
  const [demoInput, setDemoInput] = useState('')
  const [demoMessages, setDemoMessages] = useState<{ role: 'user' | 'clara'; content: string }[]>([])
  const [demoStreaming, setDemoStreaming] = useState(false)
  const [demoCount, setDemoCount] = useState(0)
  const [showAuthPrompt, setShowAuthPrompt] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const MAX_DEMO = 2

  const streamText = async (text: string) => {
    setDemoStreaming(true)
    let current = ''
    setDemoMessages(prev => [...prev, { role: 'clara', content: '' }])

    for (let i = 0; i < text.length; i++) {
      current += text[i]
      const chunk = current
      setDemoMessages(prev => {
        const msgs = [...prev]
        msgs[msgs.length - 1] = { role: 'clara', content: chunk }
        return msgs
      })
      await new Promise(r => setTimeout(r, 12 + Math.random() * 8))
    }
    setDemoStreaming(false)
  }

  const handleDemoSend = async () => {
    const text = demoInput.trim()
    if (!text || demoStreaming) return

    if (demoCount >= MAX_DEMO) {
      setShowAuthPrompt(true)
      return
    }

    setDemoInput('')
    setDemoMessages(prev => [...prev, { role: 'user', content: text }])
    setDemoCount(c => c + 1)

    await new Promise(r => setTimeout(r, 600))

    const idx = demoCount % DEMO_EXCHANGES.length
    const response = DEMO_EXCHANGES[idx].clara
    await streamText(response)

    if (demoCount + 1 >= MAX_DEMO) {
      setTimeout(() => setShowAuthPrompt(true), 1500)
    }
  }

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [demoMessages])

  return (
    <div className="min-h-screen ambient-bg overflow-x-hidden">
      {/* Nav */}
      <motion.nav
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="fixed top-0 left-0 right-0 z-50 glass-strong"
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <ClaraLogo size={36} showText textSize="text-xl" />
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm font-medium text-[var(--text-secondary)] hover:text-white transition-colors px-4 py-2 rounded-full hover:bg-white/5">
              Connexion
            </Link>
            <Link href="/signup" className="flex items-center gap-2 text-sm font-semibold bg-[var(--clara-orange)] hover:bg-[var(--clara-orange-bright)] text-white px-5 py-2.5 rounded-full transition-all active:scale-95">
              Commencer
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </motion.nav>

      {/* Hero */}
      <section className="pt-32 pb-16 px-4 relative">
        {/* Ambient orbs */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <motion.div
            animate={{ scale: [1, 1.1, 1], opacity: [0.4, 0.6, 0.4] }}
            transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full"
            style={{ background: 'radial-gradient(ellipse, rgba(249,115,22,0.08) 0%, transparent 70%)' }}
          />
          <motion.div
            animate={{ scale: [1, 1.15, 1], opacity: [0.3, 0.5, 0.3] }}
            transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
            className="absolute top-1/3 right-1/4 w-[400px] h-[300px] rounded-full"
            style={{ background: 'radial-gradient(ellipse, rgba(13,148,136,0.06) 0%, transparent 70%)' }}
          />
        </div>

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, ease: [0.34, 1.56, 0.64, 1] }}
            className="flex justify-center mb-8"
          >
            <ClaraLogo size={88} />
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight mb-6"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Bonjour, je suis{' '}
            <span className="text-gradient">Clara</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-xl text-[var(--text-secondary)] max-w-2xl mx-auto mb-10 leading-relaxed"
          >
            Une intelligence artificielle qui écoute, comprend et t'accompagne vers tes objectifs. Essaie maintenant.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-3 justify-center"
          >
            <Link
              href="/signup"
              className="flex items-center justify-center gap-2 px-8 py-4 rounded-full bg-[var(--clara-orange)] hover:bg-[var(--clara-orange-bright)] text-white font-semibold text-base transition-all active:scale-95 shadow-lg"
              style={{ boxShadow: '0 4px 24px rgba(249,115,22,0.3)' }}
            >
              Commencer gratuitement
              <ArrowRight size={18} />
            </Link>
            <Link
              href="/login"
              className="flex items-center justify-center gap-2 px-8 py-4 rounded-full border border-white/10 text-white font-semibold text-base hover:bg-white/5 transition-all"
            >
              Se connecter
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Live Demo Chat */}
      <section className="py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 32 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="rounded-3xl border border-white/8 overflow-hidden"
            style={{ background: 'rgba(26,26,29,0.8)', backdropFilter: 'blur(24px)' }}
          >
            {/* Chat header */}
            <div className="flex items-center gap-3 px-5 py-4 border-b border-white/6">
              <ClaraLogo size={28} thinking={demoStreaming} />
              <div>
                <p className="text-sm font-semibold text-white" style={{ fontFamily: 'var(--font-display)' }}>Clara</p>
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <p className="text-xs text-[var(--text-tertiary)]">
                    {demoStreaming ? 'En train de répondre...' : 'En ligne'}
                  </p>
                </div>
              </div>
              <div className="ml-auto">
                <span className="text-xs text-[var(--text-tertiary)] bg-white/5 px-2.5 py-1 rounded-full border border-white/8">
                  Démo gratuite
                </span>
              </div>
            </div>

            {/* Messages */}
            <div className="h-72 overflow-y-auto px-4 py-4 space-y-4">
              {demoMessages.length === 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="h-full flex flex-col items-center justify-center text-center gap-3"
                >
                  <p className="text-[var(--text-secondary)] text-sm">
                    Pose-moi une question, je suis là pour t'aider.
                  </p>
                  <div className="flex flex-wrap justify-center gap-2">
                    {DEMO_EXCHANGES.slice(0, 3).map((ex, i) => (
                      <button
                        key={i}
                        onClick={() => { setDemoInput(ex.user); }}
                        className="text-xs text-[var(--text-secondary)] border border-white/8 px-3 py-1.5 rounded-full hover:bg-white/5 hover:text-white transition-all"
                      >
                        {ex.user.slice(0, 40)}...
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}

              {demoMessages.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
                >
                  {msg.role === 'clara' && <ClaraLogo size={24} thinking={demoStreaming && i === demoMessages.length - 1} className="flex-shrink-0 mt-0.5" />}
                  <div className={`max-w-[82%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-[var(--clara-orange)] text-white rounded-tr-sm'
                      : 'bg-white/6 border border-white/8 text-[var(--text-primary)] rounded-tl-sm'
                  }`}>
                    {msg.content}
                    {demoStreaming && msg.role === 'clara' && i === demoMessages.length - 1 && (
                      <span className="cursor-blink" />
                    )}
                  </div>
                </motion.div>
              ))}

              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="px-4 py-4 border-t border-white/6">
              <AnimatePresence>
                {showAuthPrompt ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center gap-3 py-2 text-center"
                  >
                    <p className="text-sm text-[var(--text-secondary)]">
                      Pour continuer la conversation avec Clara, crée ton compte gratuitement.
                    </p>
                    <div className="flex gap-2">
                      <Link href="/signup" className="flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-[var(--clara-orange)] text-white text-sm font-semibold hover:bg-[var(--clara-orange-bright)] transition-all">
                        Créer un compte
                        <ArrowRight size={14} />
                      </Link>
                      <Link href="/login" className="px-5 py-2.5 rounded-full border border-white/10 text-white text-sm font-medium hover:bg-white/5 transition-all">
                        Se connecter
                      </Link>
                    </div>
                  </motion.div>
                ) : (
                  <div className="flex gap-2">
                    <input
                      value={demoInput}
                      onChange={e => setDemoInput(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleDemoSend()}
                      placeholder="Pose ta question à Clara..."
                      disabled={demoStreaming}
                      className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white placeholder:text-[var(--text-tertiary)] focus:outline-none focus:border-[var(--clara-orange)]/40 transition-colors"
                    />
                    <button
                      onClick={handleDemoSend}
                      disabled={!demoInput.trim() || demoStreaming}
                      className="w-11 h-11 rounded-2xl bg-[var(--clara-orange)] hover:bg-[var(--clara-orange-bright)] disabled:opacity-30 flex items-center justify-center text-white transition-all active:scale-90"
                    >
                      <Send size={16} />
                    </button>
                  </div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl sm:text-4xl font-bold text-center mb-12 tracking-tight"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Tout ce dont tu as besoin,{' '}
            <span className="text-gradient">en un seul endroit</span>
          </motion.h2>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {FEATURES.map((feature, i) => {
              const Icon = feature.icon
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.07 }}
                  className="p-5 rounded-2xl border border-white/6 hover:border-white/12 transition-all group"
                  style={{ background: 'rgba(26,26,29,0.6)', backdropFilter: 'blur(12px)' }}
                >
                  <div className="w-10 h-10 rounded-xl bg-[var(--clara-orange-dim)] flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                    <Icon size={18} className="text-[var(--clara-orange)]" />
                  </div>
                  <p className="text-sm font-semibold text-white mb-1" style={{ fontFamily: 'var(--font-display)' }}>
                    {feature.label}
                  </p>
                  <p className="text-xs text-[var(--text-tertiary)] leading-relaxed">{feature.desc}</p>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="max-w-2xl mx-auto text-center rounded-3xl p-10 border border-white/8"
          style={{ background: 'rgba(249,115,22,0.04)', backdropFilter: 'blur(20px)' }}
        >
          <ClaraLogo size={56} className="justify-center mb-5" />
          <h2 className="text-3xl font-bold mb-3" style={{ fontFamily: 'var(--font-display)' }}>
            Prêt à commencer ?
          </h2>
          <p className="text-[var(--text-secondary)] mb-7">
            Rejoins Clara et découvre une nouvelle façon d'apprendre, d'entreprendre et de réfléchir.
          </p>
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-[var(--clara-orange)] hover:bg-[var(--clara-orange-bright)] text-white font-semibold text-base transition-all"
            style={{ boxShadow: '0 4px 24px rgba(249,115,22,0.3)' }}
          >
            Créer mon compte gratuitement
            <ArrowRight size={18} />
          </Link>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-white/6 text-center">
        <p className="text-xs text-[var(--text-tertiary)]">
          © 2026 Clara AI. Tous droits réservés.
        </p>
      </footer>
    </div>
  )
}
