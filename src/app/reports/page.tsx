'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  ArrowLeft, BarChart2, MessageSquare, Brain,
  TrendingUp, Clock, Zap, Calendar
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Skeleton } from '@/components/animations'

interface Stats {
  totalConversations: number
  totalMessages: number
  totalTokens: number
  avgMessagesPerConv: number
  mostActiveDay: string
  topMode: string
  streakDays: number
  thisWeekMessages: number
}

interface DailyActivity {
  date: string
  count: number
}

export default function ReportsPage() {
  const router = useRouter()
  const [stats, setStats] = useState<Stats | null>(null)
  const [activity, setActivity] = useState<DailyActivity[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return

      const [convRes, msgRes, logRes] = await Promise.all([
        supabase.from('conversations').select('id, mode, created_at').eq('user_id', user.id),
        supabase.from('messages').select('id, role, created_at, conversation_id').eq('role', 'user'),
        supabase.from('usage_logs').select('tokens_input, tokens_output, created_at').eq('user_id', user.id),
      ])

      const convs = convRes.data || []
      const msgs = msgRes.data || []
      const logs = logRes.data || []

      const totalTokens = logs.reduce((sum, l) => sum + (l.tokens_input || 0) + (l.tokens_output || 0), 0)

      // Day of week analysis
      const dayCounts: Record<string, number> = {}
      const dayNames = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi']
      msgs.forEach(m => {
        const day = dayNames[new Date(m.created_at).getDay()]
        dayCounts[day] = (dayCounts[day] || 0) + 1
      })
      const mostActiveDay = Object.entries(dayCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Lundi'

      // Mode analysis
      const modeCounts: Record<string, number> = {}
      convs.forEach(c => { modeCounts[c.mode] = (modeCounts[c.mode] || 0) + 1 })
      const topMode = Object.entries(modeCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'default'
      const modeLabels: Record<string, string> = { default: 'Standard', study: 'Étude', business: 'Business', project: 'Projet' }

      // This week
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      const thisWeekMessages = msgs.filter(m => new Date(m.created_at) > weekAgo).length

      // Daily activity (last 14 days)
      const dailyMap: Record<string, number> = {}
      for (let i = 13; i >= 0; i--) {
        const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000)
        dailyMap[d.toISOString().slice(0, 10)] = 0
      }
      msgs.forEach(m => {
        const day = m.created_at.slice(0, 10)
        if (dailyMap[day] !== undefined) dailyMap[day]++
      })

      setActivity(Object.entries(dailyMap).map(([date, count]) => ({ date, count })))
      setStats({
        totalConversations: convs.length,
        totalMessages: msgs.length,
        totalTokens,
        avgMessagesPerConv: convs.length ? Math.round(msgs.length / convs.length) : 0,
        mostActiveDay,
        topMode: modeLabels[topMode] || topMode,
        streakDays: 0,
        thisWeekMessages,
      })
      setLoading(false)
    })
  }, [])

  const maxActivity = Math.max(...activity.map(a => a.count), 1)

  return (
    <div className="min-h-screen bg-[#0a0a0b]">
      <header className="sticky top-0 z-10 flex items-center gap-3 px-4 h-14 border-b border-[#1e1e22] bg-[#0a0a0b]/80 backdrop-blur-sm">
        <button onClick={() => router.back()} className="p-2 rounded-lg text-[#71717a] hover:text-[#a1a1aa] hover:bg-[#18181b] transition-colors">
          <ArrowLeft size={18} />
        </button>
        <BarChart2 size={16} className="text-[#f97316]" />
        <h1 className="text-sm font-semibold text-[#fafafa]">Rapports</h1>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-6 space-y-5">
        {loading ? (
          <>
            <div className="grid grid-cols-2 gap-3">
              {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24" />)}
            </div>
            <Skeleton className="h-48" />
          </>
        ) : stats ? (
          <>
            {/* Stats grid */}
            <div className="grid grid-cols-2 gap-3">
              <StatCard icon={MessageSquare} label="Conversations" value={stats.totalConversations} color="text-blue-400" bg="bg-blue-500/10" />
              <StatCard icon={Zap} label="Messages envoyés" value={stats.totalMessages} color="text-[#f97316]" bg="bg-[#f97316]/10" />
              <StatCard icon={Brain} label="Tokens utilisés" value={stats.totalTokens.toLocaleString('fr-FR')} color="text-purple-400" bg="bg-purple-500/10" isString />
              <StatCard icon={TrendingUp} label="Messages / conv." value={stats.avgMessagesPerConv} color="text-green-400" bg="bg-green-500/10" />
            </div>

            {/* Insights row */}
            <div className="grid grid-cols-3 gap-3">
              <InsightCard label="Jour le plus actif" value={stats.mostActiveDay} icon={Calendar} />
              <InsightCard label="Mode favori" value={stats.topMode} icon={Brain} />
              <InsightCard label="Cette semaine" value={`${stats.thisWeekMessages} msg`} icon={TrendingUp} />
            </div>

            {/* Activity chart */}
            <div className="rounded-2xl bg-[#111113] border border-[#1e1e22] p-5">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-sm font-semibold text-[#fafafa]">Activité — 14 derniers jours</h2>
                <Clock size={14} className="text-[#52525b]" />
              </div>
              <div className="flex items-end gap-1.5 h-28">
                {activity.map((day, i) => {
                  const height = maxActivity > 0 ? (day.count / maxActivity) * 100 : 0
                  const date = new Date(day.date)
                  const isToday = day.date === new Date().toISOString().slice(0, 10)
                  const label = date.toLocaleDateString('fr-FR', { weekday: 'short' }).slice(0, 2)

                  return (
                    <div key={day.date} className="flex-1 flex flex-col items-center gap-1 group">
                      <div className="w-full flex items-end justify-center" style={{ height: '88px' }}>
                        <motion.div
                          initial={{ height: 0 }}
                          animate={{ height: `${Math.max(height, day.count > 0 ? 8 : 0)}%` }}
                          transition={{ delay: i * 0.03, duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
                          className={`w-full rounded-t-sm transition-colors ${
                            isToday ? 'bg-[#f97316]' : day.count > 0 ? 'bg-[#f97316]/40 group-hover:bg-[#f97316]/60' : 'bg-[#1e1e22]'
                          }`}
                          title={`${day.count} message${day.count !== 1 ? 's' : ''}`}
                        />
                      </div>
                      <span className={`text-[9px] ${isToday ? 'text-[#f97316]' : 'text-[#52525b]'}`}>{label}</span>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Tips */}
            <div className="rounded-2xl bg-[#111113] border border-[#1e1e22] p-5">
              <h2 className="text-sm font-semibold text-[#fafafa] mb-4">Observations de Clara</h2>
              <div className="space-y-3">
                {stats.thisWeekMessages > 0 && (
                  <p className="text-sm text-[#a1a1aa] leading-relaxed">
                    Tu as été actif cette semaine avec <span className="text-[#f97316] font-medium">{stats.thisWeekMessages} messages</span> envoyés. Continue sur cette lancée.
                  </p>
                )}
                {stats.avgMessagesPerConv > 5 && (
                  <p className="text-sm text-[#a1a1aa] leading-relaxed">
                    Tes conversations sont riches — en moyenne <span className="text-[#f97316] font-medium">{stats.avgMessagesPerConv} échanges</span> par session. Tu explores les sujets en profondeur.
                  </p>
                )}
                {stats.totalConversations > 0 && (
                  <p className="text-sm text-[#a1a1aa] leading-relaxed">
                    Ton mode préféré est <span className="text-[#f97316] font-medium">{stats.topMode}</span>, et tu es le plus actif le <span className="text-[#f97316] font-medium">{stats.mostActiveDay}</span>.
                  </p>
                )}
                {stats.totalConversations === 0 && (
                  <p className="text-sm text-[#71717a] leading-relaxed">
                    Tes statistiques apparaîtront ici après tes premières conversations avec Clara.
                  </p>
                )}
              </div>
            </div>
          </>
        ) : null}
      </div>
    </div>
  )
}

function StatCard({
  icon: Icon, label, value, color, bg, isString
}: {
  icon: any; label: string; value: number | string; color: string; bg: string; isString?: boolean
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="rounded-2xl bg-[#111113] border border-[#1e1e22] p-4"
    >
      <div className={`w-8 h-8 rounded-xl flex items-center justify-center mb-3 ${bg}`}>
        <Icon size={15} className={color} />
      </div>
      <p className={`text-2xl font-bold ${color}`}>{isString ? value : value.toLocaleString('fr-FR')}</p>
      <p className="text-xs text-[#71717a] mt-0.5">{label}</p>
    </motion.div>
  )
}

function InsightCard({ label, value, icon: Icon }: { label: string; value: string; icon: any }) {
  return (
    <div className="rounded-2xl bg-[#111113] border border-[#1e1e22] p-4 text-center">
      <Icon size={16} className="text-[#f97316] mx-auto mb-2" />
      <p className="text-sm font-semibold text-[#e4e4e7]">{value}</p>
      <p className="text-[10px] text-[#52525b] mt-0.5">{label}</p>
    </div>
  )
}
