'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  ArrowLeft, User, Palette, Brain, Volume2, Bell, Globe,
  Trash2, Camera, Loader2, Check
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useUserStore } from '@/store'
import ClaraLogo from '@/components/ui/ClaraLogo'

export default function SettingsPage() {
  const router = useRouter()
  const { profile, preferences, setProfile, setPreferences } = useUserStore()

  const [displayName, setDisplayName] = useState(profile?.display_name || '')
  const [bio, setBio] = useState(profile?.bio || '')
  const [theme, setTheme] = useState(preferences?.theme || 'dark')
  const [fontSize, setFontSize] = useState(preferences?.font_size || 'md')
  const [language, setLanguage] = useState(preferences?.language || 'fr')
  const [memoryEnabled, setMemoryEnabled] = useState(preferences?.memory_enabled ?? true)
  const [voiceEnabled, setVoiceEnabled] = useState(preferences?.voice_enabled ?? true)
  const [notificationsEnabled, setNotificationsEnabled] = useState(preferences?.notifications_enabled ?? true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [memories, setMemories] = useState<any[]>([])
  const [loadingMemories, setLoadingMemories] = useState(false)

  useEffect(() => {
    fetch('/api/memories').then(r => r.json()).then(data => {
      if (Array.isArray(data)) setMemories(data)
    })
  }, [])

  const handleSave = async () => {
    setSaving(true)
    const supabase = createClient()

    try {
      // Update profile
      await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ display_name: displayName, bio }),
      })

      // Update preferences via Supabase directly
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        await supabase.from('user_preferences').upsert({
          user_id: user.id,
          theme, font_size: fontSize, language,
          memory_enabled: memoryEnabled,
          voice_enabled: voiceEnabled,
          notifications_enabled: notificationsEnabled,
        })
      }

      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } finally {
      setSaving(false)
    }
  }

  const handleClearMemories = async () => {
    if (!confirm('Effacer toute la mémoire de Clara ? Elle ne se souviendra plus de tes préférences.')) return
    await fetch('/api/memories', { method: 'DELETE' })
    setMemories([])
  }

  const handleDeleteMemory = async (id: string) => {
    await fetch(`/api/memories?id=${id}`, { method: 'DELETE' })
    setMemories(prev => prev.filter(m => m.id !== id))
  }

  return (
    <div className="min-h-screen bg-[#0a0a0b] text-[#e4e4e7]">
      {/* Header */}
      <header className="sticky top-0 z-10 flex items-center gap-3 px-4 h-14 border-b border-[#1e1e22] bg-[#0a0a0b]/80 backdrop-blur-sm">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-lg text-[#71717a] hover:text-[#a1a1aa] hover:bg-[#18181b] transition-colors"
        >
          <ArrowLeft size={18} />
        </button>
        <h1 className="text-sm font-semibold text-[#fafafa]">Paramètres</h1>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Profile section */}
        <Section icon={User} title="Profil">
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="relative w-16 h-16 rounded-full bg-[#f97316]/10 border-2 border-[#f97316]/20 flex items-center justify-center flex-shrink-0">
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
                ) : (
                  <span className="text-xl font-semibold text-[#f97316]">
                    {displayName?.charAt(0)?.toUpperCase() || 'C'}
                  </span>
                )}
                <button className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-[#18181b] border border-[#2e2e35] flex items-center justify-center text-[#71717a] hover:text-[#f97316] transition-colors">
                  <Camera size={11} />
                </button>
              </div>
              <div className="flex-1 space-y-2">
                <input
                  value={displayName}
                  onChange={e => setDisplayName(e.target.value)}
                  placeholder="Ton prénom"
                  className="w-full px-3 py-2.5 rounded-xl bg-[#18181b] border border-[#2e2e35] text-[#e4e4e7] text-sm focus:outline-none focus:border-[#f97316]/40 transition-colors"
                />
                <input
                  value={bio}
                  onChange={e => setBio(e.target.value)}
                  placeholder="Courte description (optionnel)"
                  className="w-full px-3 py-2.5 rounded-xl bg-[#18181b] border border-[#2e2e35] text-[#e4e4e7] text-sm focus:outline-none focus:border-[#f97316]/40 transition-colors"
                />
              </div>
            </div>
          </div>
        </Section>

        {/* Appearance */}
        <Section icon={Palette} title="Apparence">
          <div className="space-y-4">
            <SettingRow label="Thème">
              <div className="flex gap-2">
                {(['dark', 'light', 'system'] as const).map(t => (
                  <button
                    key={t}
                    onClick={() => setTheme(t)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      theme === t
                        ? 'bg-[#f97316] text-white'
                        : 'bg-[#18181b] border border-[#2e2e35] text-[#71717a] hover:text-[#a1a1aa]'
                    }`}
                  >
                    {t === 'dark' ? 'Sombre' : t === 'light' ? 'Clair' : 'Système'}
                  </button>
                ))}
              </div>
            </SettingRow>
            <SettingRow label="Taille du texte">
              <div className="flex gap-2">
                {(['sm', 'md', 'lg'] as const).map(s => (
                  <button
                    key={s}
                    onClick={() => setFontSize(s)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      fontSize === s
                        ? 'bg-[#f97316] text-white'
                        : 'bg-[#18181b] border border-[#2e2e35] text-[#71717a] hover:text-[#a1a1aa]'
                    }`}
                  >
                    {s === 'sm' ? 'Petit' : s === 'md' ? 'Normal' : 'Grand'}
                  </button>
                ))}
              </div>
            </SettingRow>
          </div>
        </Section>

        {/* Language */}
        <Section icon={Globe} title="Langue">
          <div className="flex gap-2 flex-wrap">
            {[
              { code: 'fr', label: 'Français' },
              { code: 'en', label: 'English' },
              { code: 'es', label: 'Español' },
              { code: 'ar', label: 'العربية' },
            ].map(l => (
              <button
                key={l.code}
                onClick={() => setLanguage(l.code)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  language === l.code
                    ? 'bg-[#f97316] text-white'
                    : 'bg-[#18181b] border border-[#2e2e35] text-[#71717a] hover:text-[#a1a1aa]'
                }`}
              >
                {l.label}
              </button>
            ))}
          </div>
        </Section>

        {/* Memory */}
        <Section icon={Brain} title="Mémoire de Clara">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[#e4e4e7]">Activer la mémoire</p>
                <p className="text-xs text-[#71717a] mt-0.5">Clara retient tes préférences et projets</p>
              </div>
              <Toggle value={memoryEnabled} onChange={setMemoryEnabled} />
            </div>

            {memories.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-[#52525b] uppercase tracking-wider">Souvenirs enregistrés</p>
                  <button
                    onClick={handleClearMemories}
                    className="text-xs text-red-400 hover:text-red-300 transition-colors flex items-center gap-1"
                  >
                    <Trash2 size={11} /> Tout effacer
                  </button>
                </div>
                <div className="space-y-1.5 max-h-48 overflow-y-auto">
                  {memories.map(m => (
                    <div key={m.id} className="flex items-center justify-between px-3 py-2 rounded-lg bg-[#18181b] border border-[#2e2e35]">
                      <div>
                        <span className="text-xs text-[#a1a1aa] font-medium">{m.key}</span>
                        <span className="text-xs text-[#52525b] mx-2">—</span>
                        <span className="text-xs text-[#71717a]">{m.value}</span>
                      </div>
                      <button onClick={() => handleDeleteMemory(m.id)} className="text-[#52525b] hover:text-red-400 transition-colors ml-2">
                        <Trash2 size={11} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Section>

        {/* Voice */}
        <Section icon={Volume2} title="Voix">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[#e4e4e7]">Réponses vocales</p>
              <p className="text-xs text-[#71717a] mt-0.5">Clara peut lire ses réponses à voix haute</p>
            </div>
            <Toggle value={voiceEnabled} onChange={setVoiceEnabled} />
          </div>
        </Section>

        {/* Notifications */}
        <Section icon={Bell} title="Notifications">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[#e4e4e7]">Notifications</p>
              <p className="text-xs text-[#71717a] mt-0.5">Alertes quand Clara termine une réponse</p>
            </div>
            <Toggle value={notificationsEnabled} onChange={setNotificationsEnabled} />
          </div>
        </Section>

        {/* Save button */}
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-[#f97316] hover:bg-[#fb923c] disabled:opacity-50 text-white font-semibold text-sm transition-all active:scale-[0.98]"
        >
          {saving ? (
            <Loader2 size={16} className="animate-spin" />
          ) : saved ? (
            <><Check size={16} /> Enregistré</>
          ) : (
            'Enregistrer les modifications'
          )}
        </button>
      </div>
    </div>
  )
}

function Section({ icon: Icon, title, children }: { icon: any; title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl bg-[#111113] border border-[#1e1e22] overflow-hidden">
      <div className="flex items-center gap-2.5 px-4 py-3 border-b border-[#1e1e22]">
        <Icon size={15} className="text-[#f97316]" />
        <h2 className="text-sm font-semibold text-[#fafafa]">{title}</h2>
      </div>
      <div className="p-4">{children}</div>
    </div>
  )
}

function SettingRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-sm text-[#a1a1aa]">{label}</span>
      {children}
    </div>
  )
}

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!value)}
      className={`relative w-11 h-6 rounded-full transition-colors ${value ? 'bg-[#f97316]' : 'bg-[#2e2e35]'}`}
    >
      <div
        className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${
          value ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  )
}
