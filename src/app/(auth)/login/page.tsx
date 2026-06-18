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
          setError('Adresse email ou mot de passe incorrect. Vérifie tes informations et réessaie.')
        } else if (error.message.includes('Email not confirmed')) {
          setError('Ton adresse email n\'a pas encore été confirmée. Vérifie ta boîte mail.')
        } else {
          setError('Impossible de te connecter actuellement. Vérifie ta connexion internet et réessaie.')
        }
        return
      }

      router.push('/chat')
      router.refresh()
    } catch {
      setError('Une erreur inattendue s\'est produite. Réessaie dans quelques instants.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full">
      {/* Logo */}
      <div className="flex flex-col items-center mb-8">
        <ClaraLogo size={52} className="mb-4" />
        <h1 className="text-2xl font-semibold text-[#fafafa] tracking-tight">Bon retour</h1>
        <p className="text-sm text-[#71717a] mt-1">Connecte-toi pour retrouver Clara</p>
      </div>

      {/* Form */}
      <form onSubmit={handleLogin} className="space-y-4">
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
          <label className="text-xs font-medium text-[#a1a1aa] uppercase tracking-wider">
            Adresse email
          </label>
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
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-[#a1a1aa] uppercase tracking-wider">
              Mot de passe
            </label>
            <Link
              href="/forgot-password"
              className="text-xs text-[#f97316] hover:text-[#fb923c] transition-colors"
            >
              Mot de passe oublié ?
            </Link>
          </div>
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
        </div>

        <button
          type="submit"
          disabled={loading || !email || !password}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-[#f97316] hover:bg-[#fb923c] disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-sm transition-all active:scale-[0.98]"
        >
          {loading ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <>
              Se connecter
              <ArrowRight size={16} />
            </>
          )}
        </button>
      </form>

      {/* Divider */}
      <div className="flex items-center gap-3 my-6">
        <div className="flex-1 h-px bg-[#2e2e35]" />
        <span className="text-xs text-[#52525b]">ou</span>
        <div className="flex-1 h-px bg-[#2e2e35]" />
      </div>

      {/* Signup link */}
      <p className="text-center text-sm text-[#71717a]">
        Pas encore de compte ?{' '}
        <Link href="/signup" className="text-[#f97316] hover:text-[#fb923c] font-medium transition-colors">
          Créer un compte
        </Link>
      </p>
    </div>
  )
}
