'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Eye, EyeOff, ArrowRight, Loader2, Check } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import ClaraLogo from '@/components/ui/ClaraLogo'

const checks = [
  { label: 'Au moins 8 caractères', test: (p: string) => p.length >= 8 },
  { label: 'Une majuscule', test: (p: string) => /[A-Z]/.test(p) },
  { label: 'Un chiffre', test: (p: string) => /\d/.test(p) },
]

export default function SignupPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!checks.every(c => c.test(password))) {
      setError('Ton mot de passe ne respecte pas les critères de sécurité.')
      return
    }
    setLoading(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.signUp({
        email, password,
        options: {
          data: { display_name: name },
          emailRedirectTo: `${window.location.origin}/chat`,
        },
      })
      if (error) {
        if (error.message.includes('already registered')) {
          setError('Cette adresse email est déjà utilisée. Connecte-toi.')
        } else {
          setError('Impossible de créer ton compte. Réessaie.')
        }
        return
      }
      setSuccess(true)
    } catch {
      setError("Une erreur inattendue s'est produite.")
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center"
      >
        <div className="w-16 h-16 rounded-full bg-[var(--clara-orange-dim)] border border-[var(--clara-orange)]/20 flex items-center justify-center mx-auto mb-5">
          <Check size={28} className="text-[var(--clara-orange)]" />
        </div>
        <h2 className="text-xl font-semibold text-white mb-2" style={{ fontFamily: 'var(--font-display)' }}>Vérifie ta boîte mail</h2>
        <p className="text-sm text-[var(--text-secondary)] leading-relaxed mb-6">
          Un lien de confirmation a été envoyé à <span className="text-white">{email}</span>. Clique dessus pour activer ton compte.
        </p>
        <Link href="/login" className="text-sm text-[var(--clara-orange)] hover:text-[var(--clara-orange-bright)] font-medium transition-colors">
          Retourner à la connexion
        </Link>
      </motion.div>
    )
  }

  return (
    <div className="w-full">
      <div className="flex flex-col items-center mb-8">
        <ClaraLogo size={56} className="mb-5" />
        <h1 className="text-2xl font-semibold text-white tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>
          Créer un compte
        </h1>
        <p className="text-sm text-[var(--text-secondary)] mt-1.5">Rejoins Clara et commence à explorer</p>
      </div>

      <div className="rounded-3xl border border-white/8 p-6" style={{ background: 'rgba(26,26,29,0.7)', backdropFilter: 'blur(24px)' }}>
        <form onSubmit={handleSignup} className="space-y-4">
          {error && (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
              className="p-3.5 rounded-2xl bg-red-500/8 border border-red-500/15 text-red-400 text-sm leading-relaxed">
              {error}
            </motion.div>
          )}

          {[
            { label: 'Prénom', value: name, onChange: setName, type: 'text', placeholder: 'Comment tu t\'appelles ?' },
            { label: 'Email', value: email, onChange: setEmail, type: 'email', placeholder: 'toi@exemple.com' },
          ].map(field => (
            <div key={field.label} className="space-y-2">
              <label className="text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider">{field.label}</label>
              <input
                type={field.type}
                value={field.value}
                onChange={e => field.onChange(e.target.value)}
                placeholder={field.placeholder}
                required
                className="w-full px-4 py-3.5 rounded-2xl bg-white/4 border border-white/8 text-white placeholder:text-[var(--text-tertiary)] text-sm focus:outline-none focus:border-[var(--clara-orange)]/50 focus:bg-white/6 transition-all"
              />
            </div>
          ))}

          <div className="space-y-2">
            <label className="text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider">Mot de passe</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full px-4 py-3.5 pr-12 rounded-2xl bg-white/4 border border-white/8 text-white placeholder:text-[var(--text-tertiary)] text-sm focus:outline-none focus:border-[var(--clara-orange)]/50 focus:bg-white/6 transition-all"
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors">
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {password && (
              <div className="flex gap-3 pt-1">
                {checks.map(c => {
                  const ok = c.test(password)
                  return (
                    <div key={c.label} className="flex items-center gap-1.5">
                      <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center transition-colors ${ok ? 'bg-[var(--clara-orange)]' : 'bg-white/10'}`}>
                        {ok && <Check size={8} className="text-white" strokeWidth={3} />}
                      </div>
                      <span className={`text-[10px] transition-colors ${ok ? 'text-[var(--text-secondary)]' : 'text-[var(--text-tertiary)]'}`}>{c.label}</span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={loading || !name || !email || !password}
            className="w-full flex items-center justify-center gap-2 px-4 py-3.5 rounded-2xl bg-[var(--clara-orange)] hover:bg-[var(--clara-orange-bright)] disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold text-sm transition-all active:scale-[0.98] mt-2"
            style={{ boxShadow: '0 4px 20px rgba(249,115,22,0.25)' }}
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <>Créer mon compte <ArrowRight size={15} /></>}
          </button>
        </form>
      </div>

      <p className="text-center text-sm text-[var(--text-secondary)] mt-5">
        Déjà un compte ?{' '}
        <Link href="/login" className="text-[var(--clara-orange)] hover:text-[var(--clara-orange-bright)] font-medium transition-colors">
          Se connecter
        </Link>
      </p>
    </div>
  )
}
