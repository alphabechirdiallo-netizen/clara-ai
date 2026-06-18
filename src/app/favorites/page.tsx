'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { ArrowLeft, Bookmark, MessageSquare, Copy, Check, Trash2, ExternalLink } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { SlideUp, Skeleton } from '@/components/animations'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface BookmarkedMessage {
  id: string
  content: string
  role: string
  created_at: string
  conversation_id: string
  conversation_title?: string
}

export default function FavoritesPage() {
  const router = useRouter()
  const [messages, setMessages] = useState<BookmarkedMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  useEffect(() => {
    const supabase = createClient()

    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return

      const { data } = await supabase
        .from('messages')
        .select(`
          id, content, role, created_at, conversation_id,
          conversations(title)
        `)
        .eq('conversations.user_id', user.id)
        .eq('is_bookmarked', true)
        .order('created_at', { ascending: false })

      if (data) {
        setMessages(data.map((m: any) => ({
          ...m,
          conversation_title: m.conversations?.title || 'Conversation',
        })))
      }
      setLoading(false)
    })
  }, [])

  const handleCopy = async (id: string, content: string) => {
    await navigator.clipboard.writeText(content)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const handleRemove = async (id: string) => {
    const supabase = createClient()
    await supabase.from('messages').update({ is_bookmarked: false }).eq('id', id)
    setMessages(prev => prev.filter(m => m.id !== id))
  }

  const handleOpenConversation = (conversationId: string) => {
    router.push(`/chat?conv=${conversationId}`)
  }

  return (
    <div className="min-h-screen bg-[#0a0a0b] text-[#e4e4e7]">
      <header className="sticky top-0 z-10 flex items-center gap-3 px-4 h-14 border-b border-[#1e1e22] bg-[#0a0a0b]/80 backdrop-blur-sm">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-lg text-[#71717a] hover:text-[#a1a1aa] hover:bg-[#18181b] transition-colors"
        >
          <ArrowLeft size={18} />
        </button>
        <Bookmark size={16} className="text-[#f97316]" />
        <h1 className="text-sm font-semibold text-[#fafafa]">Favoris</h1>
        {!loading && (
          <span className="ml-auto text-xs text-[#52525b]">{messages.length} message{messages.length !== 1 ? 's' : ''}</span>
        )}
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-full bg-[#18181b] border border-[#2e2e35] flex items-center justify-center mb-4">
              <Bookmark size={24} className="text-[#2e2e35]" />
            </div>
            <h3 className="text-sm font-medium text-[#71717a] mb-1">Aucun message en favori</h3>
            <p className="text-xs text-[#52525b]">
              Clique sur un message dans une conversation pour le mettre en favori
            </p>
          </div>
        ) : (
          messages.map((msg, i) => (
            <SlideUp key={msg.id} delay={i * 0.04}>
              <div className="rounded-2xl bg-[#111113] border border-[#1e1e22] overflow-hidden">
                {/* Card header */}
                <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#1e1e22]">
                  <button
                    onClick={() => handleOpenConversation(msg.conversation_id)}
                    className="flex items-center gap-2 text-xs text-[#71717a] hover:text-[#a1a1aa] transition-colors"
                  >
                    <MessageSquare size={12} className="text-[#f97316]" />
                    <span className="truncate max-w-[200px]">{msg.conversation_title}</span>
                    <ExternalLink size={10} />
                  </button>
                  <span className="text-[10px] text-[#52525b]">
                    {new Date(msg.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                </div>

                {/* Content */}
                <div className="px-4 py-3">
                  <div className={`text-xs font-semibold mb-2 ${msg.role === 'assistant' ? 'text-[#f97316]' : 'text-[#71717a]'}`}>
                    {msg.role === 'assistant' ? 'Clara' : 'Toi'}
                  </div>
                  <div className="message-content text-sm text-[#e4e4e7] leading-relaxed line-clamp-6">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {msg.content.slice(0, 400) + (msg.content.length > 400 ? '...' : '')}
                    </ReactMarkdown>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 px-4 py-2.5 border-t border-[#1e1e22]">
                  <button
                    onClick={() => handleCopy(msg.id, msg.content)}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs text-[#71717a] hover:text-[#a1a1aa] hover:bg-[#18181b] transition-colors"
                  >
                    {copiedId === msg.id ? <Check size={12} className="text-green-400" /> : <Copy size={12} />}
                    {copiedId === msg.id ? 'Copié' : 'Copier'}
                  </button>
                  <button
                    onClick={() => handleOpenConversation(msg.conversation_id)}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs text-[#71717a] hover:text-[#a1a1aa] hover:bg-[#18181b] transition-colors"
                  >
                    <ExternalLink size={12} />
                    Ouvrir
                  </button>
                  <button
                    onClick={() => handleRemove(msg.id)}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs text-[#52525b] hover:text-red-400 hover:bg-red-500/10 transition-colors ml-auto"
                  >
                    <Trash2 size={12} />
                    Retirer
                  </button>
                </div>
              </div>
            </SlideUp>
          ))
        )}
      </div>
    </div>
  )
}
