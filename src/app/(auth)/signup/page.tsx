'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Eye, EyeOff, ArrowRight, Loader2, Check } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import ClaraLogo from '@/components/ui/ClaraLogo'

const passwordChecks = [
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

  const isPasswordStrong = passwordChecks.every((c) => c.test(password))

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!isPasswordStrong) {
      setError('Ton mot de passe ne respecte pas les critères de sécurité requis.')
      return
    }

    setLoading(true)

    try {
      const supabase = createClient()
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { display_name: name },
          emailRedirectTo: `${window.location.origin}/chat`,
        },
      })

      if (error) {
        if (error.message.includes('already registered')) {
          setError('Cette adresse email est déjà associée à un compte. Connecte-toi ou réinitialise ton mot de passe.')
        } else {
          setError('Impossible de créer ton compte pour le moment. Réessaie dans quelques instants.')
        }
        return
      }

      setSuccess(true)
    } catch {
      setError('Une erreur inattendue s\'est produite. Réessaie dans quelques instants.')
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
        <div className="w-16 h-16 rounded-full bg-[#f97316]/10 border border-[#f97316]/20 flex items-center justify-center mx-auto mb-6">
          <Check className="text-[#f97316]" size={28} />
        </div>
        <h2 className="text-xl font-semibold text-[#fafafa] mb-2">Vérifie ta boîte mail</h2>
        <p className="text-sm text-[#71717a] leading-relaxed mb-6">
          Un lien de confirmation a été envoyé à <span className="text-[#e4e4e7]">{email}</span>. 
          Clique dessus pour activer ton compte et commencer avec Clara.
        </p>
        <Link
          href="/login"
          className="text-sm text-[#f97316] hover:text-[#fb923c] font-medium transition-colors"
        >
          Retourner à la connexion
        </Link>
      </motion.div>
    )
  }

  return (
    <div className="w-full">
      <div className="flex flex-col items-center mb-8">
        <ClaraLogo size={52} className="mb-4" />
        <h1 className="text-2xl font-semibold text-[#fafafa] tracking-tight">Créer un compte</h1>
        <p className="text-sm text-[#71717a] mt-1">Rejoins Clara et commence à explorer</p>
      </div>

      <form onSubmit={handleSignup} className="space-y-4">
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm leading-relaxed"
          >
            {error}
          </motion.div>
        )}

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-[#a1a1aa] uppercase tracking-wider">Prénom</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Comment tu t'appelles ?"
            required
            className="w-full px-4 py-3 rounded-xl bg-[#18181b] border border-[#2e2e35] text-[#e4e4e7] placeholder:text-[#52525b] text-sm focus:outline-none focus:border-[#f97316] focus:ring-1 focus:ring-[#f97316]/30 transition-all"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-[#a1a1aa] uppercase tracking-wider">Adresse email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="toi@exemple.com"
            required
            className="w-full px-4 py-3 rounded-xl bg-[#18181b] border border-[#2e2e35] text-[#e4e4e7] placeholder:text-[#52525b] text-sm focus:outline-none focus:border-[#f97316] focus:ring-1 focus:ring-[#f97316]/30 transition-all"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-[#a1a1aa] uppercase tracking-wider">Mot de passe</label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full px-4 py-3 pr-11 rounded-xl bg-[#18181b] border border-[#2e2e35] text-[#e4e4e7] placeholder:text-[#52525b] text-sm focus:outline-none focus:border-[#f97316] focus:ring-1 focus:ring-[#f97316]/30 transition-all"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#52525b] hover:text-[#a1a1aa] transition-colors"
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {password && (
            <div className="space-y-1.5 pt-1">
              {passwordChecks.map((check) => {
                const passed = check.test(password)
                return (
                  <div key={check.label} className="flex items-center gap-2">
                    <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center transition-colors ${passed ? 'bg-[#f97316]' : 'bg-[#2e2e35]'}`}>
                      {passed && <Check size={8} className="text-white" strokeWidth={3} />}
                    </div>
                    <span className={`text-xs transition-colors ${passed ? 'text-[#a1a1aa]' : 'text-[#52525b]'}`}>
                      {check.label}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={loading || !name || !email || !password}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-[#f97316] hover:bg-[#fb923c] disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-sm transition-all active:scale-[0.98] mt-2"
        >
          {loading ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <>
              Créer mon compte
              <ArrowRight size={16} />
            </>
          )}
        </button>
      </form>

      <div className="flex items-center gap-3 my-6">
        <div className="flex-1 h-px bg-[#2e2e35]" />
        <span className="text-xs text-[#52525b]">ou</span>
        <div className="flex-1 h-px bg-[#2e2e35]" />
      </div>

      <p className="text-center text-sm text-[#71717a]">
        Déjà un compte ?{' '}
        <Link href="/login" className="text-[#f97316] hover:text-[#fb923c] font-medium transition-colors">
          Se connecter
        </Link>
      </p>
    </div>
  )
}
