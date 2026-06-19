'use client'

import { motion } from 'framer-motion'
import { BookOpen, Briefcase, FolderKanban, Sparkles, ArrowRight } from 'lucide-react'
import type { ChatMode } from '@/types'
import ClaraLogo from '@/components/ui/ClaraLogo'

interface WelcomeScreenProps {
  userName?: string
  onSuggestion: (text: string) => void
  onModeSelect: (mode: ChatMode) => void
}

const suggestions = [
  { text: "Aide-moi à créer un business plan solide", mode: 'business' as ChatMode },
  { text: "Explique-moi les bases de l'investissement en bourse", mode: 'study' as ChatMode },
  { text: "Guide-moi pour lancer mon projet étape par étape", mode: 'project' as ChatMode },
  { text: "Comment développer de bonnes habitudes de travail ?", mode: 'default' as ChatMode },
  { text: "Analyse les tendances actuelles de l'IA", mode: 'default' as ChatMode },
  { text: "Aide-moi à préparer un entretien important", mode: 'business' as ChatMode },
]

const modes = [
  { value: 'study' as ChatMode, label: 'Étude', desc: 'Apprentissage guidé', icon: BookOpen, color: 'text-blue-400', bg: 'rgba(59,130,246,0.08)', border: 'rgba(59,130,246,0.15)' },
  { value: 'business' as ChatMode, label: 'Business', desc: 'Conseils stratégiques', icon: Briefcase, color: 'text-emerald-400', bg: 'rgba(16,185,129,0.08)', border: 'rgba(16,185,129,0.15)' },
  { value: 'project' as ChatMode, label: 'Projet', desc: 'Construction guidée', icon: FolderKanban, color: 'text-purple-400', bg: 'rgba(168,85,247,0.08)', border: 'rgba(168,85,247,0.15)' },
]

function getGreeting(name?: string): { greeting: string; sub: string } {
  const h = new Date().getHours()
  const g = h >= 18 || h < 5 ? 'Bonsoir' : h < 12 ? 'Bonjour' : 'Bonjour'
  return {
    greeting: name ? `${g}, ${name}` : g,
    sub: h >= 18 || h < 5
      ? "Bonne soirée. Comment puis-je t'aider ce soir ?"
      : h < 12
      ? "Belle matinée. Qu'est-ce qu'on explore aujourd'hui ?"
      : "Comment puis-je t'accompagner aujourd'hui ?",
  }
}

export default function WelcomeScreen({ userName, onSuggestion, onModeSelect }: WelcomeScreenProps) {
  const { greeting, sub } = getGreeting(userName)

  return (
    <div className="flex flex-col items-center justify-center min-h-full px-4 py-10 max-w-2xl mx-auto w-full">
      {/* Greeting */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
        className="text-center mb-10"
      >
        <motion.div
          initial={{ scale: 0.7, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
          className="flex justify-center mb-6"
        >
          <ClaraLogo size={72} />
        </motion.div>

        <h1
          className="text-4xl sm:text-5xl font-bold tracking-tight text-white mb-3"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          {greeting}
        </h1>
        <p className="text-[var(--text-secondary)] text-lg">{sub}</p>
      </motion.div>

      {/* Mode cards */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.15 }}
        className="grid grid-cols-3 gap-3 w-full mb-6"
      >
        {modes.map((m, i) => {
          const Icon = m.icon
          return (
            <motion.button
              key={m.value}
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 + i * 0.06, type: 'spring', stiffness: 260, damping: 20 }}
              onClick={() => onModeSelect(m.value)}
              className="flex flex-col items-center gap-2.5 p-4 rounded-2xl border transition-all active:scale-95 group"
              style={{ background: m.bg, borderColor: m.border }}
            >
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.06)' }}>
                <Icon size={17} className={m.color} />
              </div>
              <div className="text-center">
                <p className="text-xs font-semibold text-white leading-tight">{m.label}</p>
                <p className="text-[10px] text-[var(--text-tertiary)] mt-0.5 hidden sm:block">{m.desc}</p>
              </div>
            </motion.button>
          )
        })}
      </motion.div>

      {/* Suggestions */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="w-full"
      >
        <p className="text-[10px] text-[var(--text-tertiary)] uppercase tracking-widest font-medium text-center mb-3">
          Suggestions
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {suggestions.map((s, i) => (
            <motion.button
              key={i}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45 + i * 0.05 }}
              onClick={() => onSuggestion(s.text)}
              className="text-left px-4 py-3.5 rounded-2xl border border-white/6 hover:border-white/12 transition-all group"
              style={{ background: 'rgba(26,26,29,0.5)' }}
            >
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm text-[var(--text-secondary)] group-hover:text-white transition-colors leading-snug">
                  {s.text}
                </p>
                <ArrowRight size={13} className="text-[var(--text-tertiary)] group-hover:text-[var(--clara-orange)] transition-colors flex-shrink-0 opacity-0 group-hover:opacity-100" />
              </div>
            </motion.button>
          ))}
        </div>
      </motion.div>
    </div>
  )
}
