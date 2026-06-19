'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Eye, EyeOff, ArrowRight, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import ClaraLogo from '@/components/ui/ClaraLogo'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          setError('Email ou mot de passe incorrect. Vérifie tes informations.')
        } else if (error.message.includes('Email not confirmed')) {
          setError("Confirme ton adresse email avant de te connecter.")
        } else {
          setError('Impossible de te connecter. Vérifie ta connexion internet.')
        }
        return
      }
      router.push('/chat')
      router.refresh()
    } catch {
      setError("Une erreur inattendue s'est produite. Réessaie.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex flex-col items-center mb-8">
        <ClaraLogo size={56} className="mb-5" />
        <h1 className="text-2xl font-semibold text-white tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>
          Bon retour
        </h1>
        <p className="text-sm text-[var(--text-secondary)] mt-1.5">Connecte-toi pour retrouver Clara</p>
      </div>

      {/* Card */}
      <div className="rounded-3xl border border-white/8 p-6" style={{ background: 'rgba(26,26,29,0.7)', backdropFilter: 'blur(24px)' }}>
        <form onSubmit={handleLogin} className="space-y-4">
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3.5 rounded-2xl bg-red-500/8 border border-red-500/15 text-red-400 text-sm leading-relaxed"
            >
              {error}
            </motion.div>
          )}

          <div className="space-y-2">
            <label className="text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="toi@exemple.com"
              required
              className="w-full px-4 py-3.5 rounded-2xl bg-white/4 border border-white/8 text-white placeholder:text-[var(--text-tertiary)] text-sm focus:outline-none focus:border-[var(--clara-orange)]/50 focus:bg-white/6 transition-all"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider">Mot de passe</label>
              <Link href="/forgot-password" className="text-xs text-[var(--clara-orange)] hover:text-[var(--clara-orange-bright)] transition-colors">
                Oublié ?
              </Link>
            </div>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full px-4 py-3.5 pr-12 rounded-2xl bg-white/4 border border-white/8 text-white placeholder:text-[var(--text-tertiary)] text-sm focus:outline-none focus:border-[var(--clara-orange)]/50 focus:bg-white/6 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !email || !password}
            className="w-full flex items-center justify-center gap-2 px-4 py-3.5 rounded-2xl bg-[var(--clara-orange)] hover:bg-[var(--clara-orange-bright)] disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold text-sm transition-all active:scale-[0.98] mt-2"
            style={{ boxShadow: '0 4px 20px rgba(249,115,22,0.25)' }}
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <>Se connecter <ArrowRight size={15} /></>}
          </button>
        </form>
      </div>

      <p className="text-center text-sm text-[var(--text-secondary)] mt-5">
        Pas encore de compte ?{' '}
        <Link href="/signup" className="text-[var(--clara-orange)] hover:text-[var(--clara-orange-bright)] font-medium transition-colors">
          Créer un compte
        </Link>
      </p>
    </div>
  )
}
