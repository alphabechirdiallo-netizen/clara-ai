'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft, Code2, FileText, BarChart2, Table2,
  Globe, Copy, Check, Download, ExternalLink, Maximize2, X
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Skeleton } from '@/components/animations'
import CodeBlock from '@/components/code/CodeBlock'

interface Artifact {
  id: string
  messageId: string
  conversationId: string
  conversationTitle: string
  type: 'code' | 'html' | 'markdown' | 'table' | 'chart'
  language?: string
  content: string
  title: string
  createdAt: string
}

function detectArtifacts(messages: any[]): Artifact[] {
  const artifacts: Artifact[] = []

  for (const msg of messages) {
    if (msg.role !== 'assistant') continue
    const content: string = msg.content

    // Code blocks
    const codeRegex = /```(\w+)?\n([\s\S]*?)```/g
    let match
    while ((match = codeRegex.exec(content)) !== null) {
      const lang = match[1] || 'text'
      const code = match[2].trim()
      if (code.length < 30) continue

      artifacts.push({
        id: `${msg.id}-code-${artifacts.length}`,
        messageId: msg.id,
        conversationId: msg.conversation_id,
        conversationTitle: msg.conversation_title || 'Conversation',
        type: lang === 'html' ? 'html' : 'code',
        language: lang,
        content: code,
        title: lang === 'html' ? 'Page HTML' : `Code ${lang.toUpperCase()}`,
        createdAt: msg.created_at,
      })
    }

    // Tables in markdown
    if (content.includes('|') && content.includes('---')) {
      const tableMatch = content.match(/(\|.+\|\n\|[-|: ]+\|\n(?:\|.+\|\n?)+)/)
      if (tableMatch) {
        artifacts.push({
          id: `${msg.id}-table`,
          messageId: msg.id,
          conversationId: msg.conversation_id,
          conversationTitle: msg.conversation_title || 'Conversation',
          type: 'table',
          content: tableMatch[1],
          title: 'Tableau',
          createdAt: msg.created_at,
        })
      }
    }
  }

  return artifacts
}

const typeConfig = {
  code: { icon: Code2, label: 'Code', color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20' },
  html: { icon: Globe, label: 'HTML', color: 'text-green-400', bg: 'bg-green-500/10 border-green-500/20' },
  markdown: { icon: FileText, label: 'Document', color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/20' },
  table: { icon: Table2, label: 'Tableau', color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/20' },
  chart: { icon: BarChart2, label: 'Graphique', color: 'text-[#f97316]', bg: 'bg-[#f97316]/10 border-[#f97316]/20' },
}

export default function ArtifactsPage() {
  const router = useRouter()
  const [artifacts, setArtifacts] = useState<Artifact[]>([])
  const [loading, setLoading] = useState(true)
  const [preview, setPreview] = useState<Artifact | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [filter, setFilter] = useState<string>('all')

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return

      const { data } = await supabase
        .from('messages')
        .select('id, content, role, created_at, conversation_id, conversations(title)')
        .eq('role', 'assistant')
        .order('created_at', { ascending: false })
        .limit(200)

      if (data) {
        const msgs = data.map((m: any) => ({
          ...m,
          conversation_title: m.conversations?.title,
        }))
        setArtifacts(detectArtifacts(msgs))
      }
      setLoading(false)
    })
  }, [])

  const handleCopy = async (id: string, content: string) => {
    await navigator.clipboard.writeText(content)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const filteredArtifacts = filter === 'all'
    ? artifacts
    : artifacts.filter(a => a.type === filter)

  const types = ['all', ...Array.from(new Set(artifacts.map(a => a.type)))]

  return (
    <div className="min-h-screen bg-[#0a0a0b]">
      {/* Header */}
      <header className="sticky top-0 z-10 flex items-center gap-3 px-4 h-14 border-b border-[#1e1e22] bg-[#0a0a0b]/80 backdrop-blur-sm">
        <button onClick={() => router.back()} className="p-2 rounded-lg text-[#71717a] hover:text-[#a1a1aa] hover:bg-[#18181b] transition-colors">
          <ArrowLeft size={18} />
        </button>
        <Code2 size={16} className="text-[#f97316]" />
        <h1 className="text-sm font-semibold text-[#fafafa]">Artefacts</h1>
        {!loading && <span className="ml-auto text-xs text-[#52525b]">{filteredArtifacts.length} élément{filteredArtifacts.length !== 1 ? 's' : ''}</span>}
      </header>

      <div className="max-w-5xl mx-auto px-4 py-6">
        {/* Filter tabs */}
        {!loading && types.length > 1 && (
          <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
            {types.map(t => {
              const cfg = t === 'all' ? null : typeConfig[t as keyof typeof typeConfig]
              return (
                <button
                  key={t}
                  onClick={() => setFilter(t)}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${
                    filter === t
                      ? 'bg-[#f97316] text-white'
                      : 'bg-[#18181b] border border-[#2e2e35] text-[#71717a] hover:text-[#a1a1aa]'
                  }`}
                >
                  {cfg && <cfg.icon size={12} />}
                  {t === 'all' ? 'Tous' : cfg?.label}
                </button>
              )
            })}
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-52" />)}
          </div>
        ) : filteredArtifacts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-full bg-[#18181b] border border-[#2e2e35] flex items-center justify-center mb-4">
              <Code2 size={24} className="text-[#2e2e35]" />
            </div>
            <h3 className="text-sm font-medium text-[#71717a] mb-1">Aucun artefact</h3>
            <p className="text-xs text-[#52525b]">Les blocs de code et tableaux générés par Clara apparaîtront ici</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredArtifacts.map((artifact, i) => {
              const cfg = typeConfig[artifact.type] || typeConfig.code
              const Icon = cfg.icon

              return (
                <motion.div
                  key={artifact.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04, duration: 0.3 }}
                  className="rounded-2xl bg-[#111113] border border-[#1e1e22] overflow-hidden hover:border-[#2e2e35] transition-colors"
                >
                  {/* Card header */}
                  <div className="flex items-center justify-between px-4 py-3 border-b border-[#1e1e22]">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center border ${cfg.bg}`}>
                        <Icon size={13} className={cfg.color} />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-[#e4e4e7]">{artifact.title}</p>
                        <p className="text-[10px] text-[#52525b] truncate max-w-[160px]">{artifact.conversationTitle}</p>
                      </div>
                    </div>
                    <span className="text-[10px] text-[#52525b]">
                      {new Date(artifact.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                    </span>
                  </div>

                  {/* Preview */}
                  <div className="h-36 overflow-hidden relative bg-[#0f0f11]">
                    {artifact.type === 'html' ? (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Globe size={32} className="text-[#2e2e35]" />
                        <span className="absolute text-xs text-[#52525b] mt-12">Aperçu HTML</span>
                      </div>
                    ) : (
                      <pre className="p-3 text-[0.7rem] text-[#71717a] leading-relaxed overflow-hidden font-mono">
                        {artifact.content.slice(0, 300)}
                        {artifact.content.length > 300 && '...'}
                      </pre>
                    )}
                    <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-[#0f0f11] to-transparent" />
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 px-3 py-2.5 border-t border-[#1e1e22]">
                    <button
                      onClick={() => setPreview(artifact)}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs text-[#71717a] hover:text-[#a1a1aa] hover:bg-[#18181b] transition-colors"
                    >
                      <Maximize2 size={12} />
                      Voir
                    </button>
                    <button
                      onClick={() => handleCopy(artifact.id, artifact.content)}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs text-[#71717a] hover:text-[#a1a1aa] hover:bg-[#18181b] transition-colors"
                    >
                      {copiedId === artifact.id ? <Check size={12} className="text-green-400" /> : <Copy size={12} />}
                      {copiedId === artifact.id ? 'Copié' : 'Copier'}
                    </button>
                    <button
                      onClick={() => router.push(`/chat?conv=${artifact.conversationId}`)}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs text-[#71717a] hover:text-[#a1a1aa] hover:bg-[#18181b] transition-colors ml-auto"
                    >
                      <ExternalLink size={12} />
                      Conversation
                    </button>
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}
      </div>

      {/* Preview modal */}
      <AnimatePresence>
        {preview && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setPreview(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-4xl max-h-[90vh] rounded-2xl bg-[#111113] border border-[#2e2e35] overflow-hidden flex flex-col"
            >
              <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#1e1e22] flex-shrink-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-[#fafafa]">{preview.title}</span>
                  {preview.language && (
                    <span className="text-xs text-[#71717a] bg-[#18181b] border border-[#2e2e35] px-2 py-0.5 rounded-full">
                      {preview.language}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleCopy(preview.id, preview.content)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-[#71717a] hover:text-[#a1a1aa] hover:bg-[#18181b] transition-colors"
                  >
                    {copiedId === preview.id ? <Check size={12} className="text-green-400" /> : <Copy size={12} />}
                    Copier
                  </button>
                  <button onClick={() => setPreview(null)} className="p-1.5 rounded-lg text-[#52525b] hover:text-[#a1a1aa] hover:bg-[#18181b]">
                    <X size={16} />
                  </button>
                </div>
              </div>
              <div className="flex-1 overflow-auto">
                {preview.type === 'html' ? (
                  <iframe
                    srcDoc={preview.content}
                    className="w-full h-full min-h-[500px] border-0"
                    sandbox="allow-scripts"
                    title="HTML Preview"
                  />
                ) : (
                  <CodeBlock code={preview.content} language={preview.language || 'text'} />
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
