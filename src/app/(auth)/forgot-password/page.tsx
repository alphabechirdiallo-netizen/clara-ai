'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowLeft, Loader2, Mail } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import ClaraLogo from '@/components/ui/ClaraLogo'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const supabase = createClient()
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })

      if (error) {
        setError('Impossible d\'envoyer l\'email de réinitialisation. Vérifie ton adresse et réessaie.')
        return
      }

      setSent(true)
    } catch {
      setError('Une erreur inattendue s\'est produite. Réessaie dans quelques instants.')
    } finally {
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center"
      >
        <div className="w-16 h-16 rounded-full bg-[#f97316]/10 border border-[#f97316]/20 flex items-center justify-center mx-auto mb-6">
          <Mail className="text-[#f97316]" size={28} />
        </div>
        <h2 className="text-xl font-semibold text-[#fafafa] mb-2">Email envoyé</h2>
        <p className="text-sm text-[#71717a] leading-relaxed mb-6">
          Un lien de réinitialisation a été envoyé à <span className="text-[#e4e4e7]">{email}</span>.
          Vérifie ta boîte mail et clique sur le lien pour choisir un nouveau mot de passe.
        </p>
        <Link href="/login" className="text-sm text-[#f97316] hover:text-[#fb923c] font-medium transition-colors">
          Retourner à la connexion
        </Link>
      </motion.div>
    )
  }

  return (
    <div className="w-full">
      <div className="flex flex-col items-center mb-8">
        <ClaraLogo size={52} className="mb-4" />
        <h1 className="text-2xl font-semibold text-[#fafafa] tracking-tight">Mot de passe oublié</h1>
        <p className="text-sm text-[#71717a] mt-1 text-center">
          Indique ton email pour recevoir un lien de réinitialisation
        </p>
      </div>

      <form onSubmit={handleReset} className="space-y-4">
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

        <button
          type="submit"
          disabled={loading || !email}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-[#f97316] hover:bg-[#fb923c] disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-sm transition-all active:scale-[0.98]"
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : 'Envoyer le lien'}
        </button>
      </form>

      <div className="mt-6 text-center">
        <Link href="/login" className="inline-flex items-center gap-1.5 text-sm text-[#71717a] hover:text-[#a1a1aa] transition-colors">
          <ArrowLeft size={14} />
          Retour à la connexion
        </Link>
      </div>
    </div>
  )
}
