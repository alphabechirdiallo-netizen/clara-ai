'use client'

import { motion } from 'framer-motion'
import { BookOpen, Briefcase, FolderKanban, Sparkles } from 'lucide-react'
import type { ChatMode } from '@/types'

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
  {
    value: 'study' as ChatMode,
    label: 'Mode Étude',
    description: 'Apprentissage guidé et pédagogie adaptée',
    icon: BookOpen,
    color: 'text-blue-400',
    bg: 'bg-blue-500/10 border-blue-500/20 hover:border-blue-500/40',
  },
  {
    value: 'business' as ChatMode,
    label: 'Mode Business',
    description: 'Conseils entrepreneuriaux et stratégie',
    icon: Briefcase,
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10 border-emerald-500/20 hover:border-emerald-500/40',
  },
  {
    value: 'project' as ChatMode,
    label: 'Mode Projet',
    description: 'Construction pas à pas de tes projets',
    icon: FolderKanban,
    color: 'text-purple-400',
    bg: 'bg-purple-500/10 border-purple-500/20 hover:border-purple-500/40',
  },
]

function getGreeting(name?: string): string {
  const hour = new Date().getHours()
  const greeting = hour >= 18 || hour < 5 ? 'Bonsoir' : 'Bonjour'
  return name ? `${greeting}, ${name}` : greeting
}

export default function WelcomeScreen({ userName, onSuggestion, onModeSelect }: WelcomeScreenProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-full px-4 py-8 max-w-2xl mx-auto w-full">
      {/* Greeting */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
        className="text-center mb-8"
      >
        <div className="relative inline-flex mb-4">
          <div className="absolute inset-0 rounded-full bg-[#f97316]/20 blur-2xl" />
          <div className="relative w-14 h-14 rounded-full bg-[#f97316]/10 border border-[#f97316]/20 flex items-center justify-center">
            <Sparkles size={24} className="text-[#f97316]" />
          </div>
        </div>

        <h1 className="text-3xl font-semibold text-[#fafafa] tracking-tight">
          {getGreeting(userName)}
        </h1>
        <p className="text-[#71717a] mt-2 text-base leading-relaxed">
          Comment puis-je t'accompagner aujourd'hui ?
        </p>
      </motion.div>

      {/* Mode cards */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="grid grid-cols-3 gap-3 w-full mb-6"
      >
        {modes.map((m, i) => {
          const Icon = m.icon
          return (
            <motion.button
              key={m.value}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 + i * 0.05 }}
              onClick={() => onModeSelect(m.value)}
              className={`flex flex-col items-center gap-2 p-3 rounded-xl border transition-all text-center ${m.bg}`}
            >
              <Icon size={18} className={m.color} />
              <div>
                <p className="text-xs font-semibold text-[#e4e4e7] leading-tight">{m.label}</p>
                <p className="text-[10px] text-[#71717a] mt-0.5 leading-tight hidden sm:block">{m.description}</p>
              </div>
            </motion.button>
          )
        })}
      </motion.div>

      {/* Suggestions */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="w-full space-y-2"
      >
        <p className="text-xs text-[#52525b] text-center mb-3 uppercase tracking-widest font-medium">
          Suggestions
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {suggestions.map((s, i) => (
            <motion.button
              key={i}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 + i * 0.04 }}
              onClick={() => onSuggestion(s.text)}
              className="text-left px-4 py-3 rounded-xl bg-[#18181b] border border-[#2e2e35] hover:border-[#f97316]/30 hover:bg-[#1e1e22] transition-all group"
            >
              <p className="text-sm text-[#a1a1aa] group-hover:text-[#e4e4e7] transition-colors leading-snug">
                {s.text}
              </p>
            </motion.button>
          ))}
        </div>
      </motion.div>
    </div>
  )
}
