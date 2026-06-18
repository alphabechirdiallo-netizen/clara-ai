'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, X, MessageSquare, FileText, Clock, ArrowRight } from 'lucide-react'
import { useConversationStore } from '@/store'

interface SearchResult {
  type: 'conversation' | 'message'
  id: string
  conversationId: string
  title: string
  snippet: string
  date: string
}

interface GlobalSearchProps {
  onSelect: (conversationId: string) => void
  onClose: () => void
}

export default function GlobalSearch({ onSelect, onClose }: GlobalSearchProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const { conversations, messages } = useConversationStore()

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  // Local search across cached conversations and messages
  const search = useCallback((q: string) => {
    if (!q.trim()) { setResults([]); return }
    setLoading(true)

    const lower = q.toLowerCase()
    const found: SearchResult[] = []

    // Search conversations
    for (const conv of conversations) {
      if (conv.title.toLowerCase().includes(lower)) {
        found.push({
          type: 'conversation',
          id: conv.id,
          conversationId: conv.id,
          title: conv.title,
          snippet: conv.last_message?.slice(0, 100) || 'Conversation vide',
          date: conv.updated_at,
        })
      }
    }

    // Search messages
    for (const [convId, msgs] of Object.entries(messages)) {
      const conv = conversations.find(c => c.id === convId)
      if (!conv) continue
      for (const msg of msgs) {
        if (msg.role === 'system') continue
        if (msg.content.toLowerCase().includes(lower)) {
          const idx = msg.content.toLowerCase().indexOf(lower)
          const start = Math.max(0, idx - 40)
          const end = Math.min(msg.content.length, idx + 80)
          const snippet = (start > 0 ? '...' : '') + msg.content.slice(start, end) + (end < msg.content.length ? '...' : '')

          found.push({
            type: 'message',
            id: msg.id,
            conversationId: convId,
            title: conv.title,
            snippet,
            date: msg.created_at,
          })
        }
      }
    }

    setResults(found.slice(0, 12))
    setActiveIndex(0)
    setLoading(false)
  }, [conversations, messages])

  useEffect(() => {
    const t = setTimeout(() => search(query), 200)
    return () => clearTimeout(t)
  }, [query, search])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex(i => Math.min(i + 1, results.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex(i => Math.max(i - 1, 0))
    } else if (e.key === 'Enter' && results[activeIndex]) {
      onSelect(results[activeIndex].conversationId)
      onClose()
    } else if (e.key === 'Escape') {
      onClose()
    }
  }

  const highlight = (text: string, q: string) => {
    if (!q.trim()) return text
    const regex = new RegExp(`(${q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')
    const parts = text.split(regex)
    return parts.map((part, i) =>
      regex.test(part)
        ? <mark key={i} className="bg-[#f97316]/30 text-[#f97316] rounded px-0.5 not-italic">{part}</mark>
        : part
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-start justify-center pt-[10vh] px-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, y: -20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20, scale: 0.95 }}
        transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
        onClick={e => e.stopPropagation()}
        className="w-full max-w-2xl bg-[#111113] border border-[#2e2e35] rounded-2xl shadow-2xl overflow-hidden"
      >
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-[#1e1e22]">
          <Search size={16} className="text-[#71717a] flex-shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Rechercher dans toutes les conversations..."
            className="flex-1 bg-transparent text-[#e4e4e7] placeholder:text-[#52525b] text-sm focus:outline-none"
          />
          {query && (
            <button onClick={() => setQuery('')} className="text-[#52525b] hover:text-[#a1a1aa]">
              <X size={14} />
            </button>
          )}
          <kbd className="hidden sm:block text-xs text-[#52525b] bg-[#18181b] border border-[#2e2e35] px-1.5 py-0.5 rounded">
            Esc
          </kbd>
        </div>

        {/* Results */}
        <div className="max-h-[60vh] overflow-y-auto">
          {!query && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Search size={28} className="text-[#2e2e35] mb-3" />
              <p className="text-sm text-[#52525b]">Tape pour chercher dans tes conversations</p>
            </div>
          )}

          {query && !loading && results.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-sm text-[#52525b]">Aucun résultat pour <span className="text-[#a1a1aa]">"{query}"</span></p>
            </div>
          )}

          {results.length > 0 && (
            <div className="py-1.5">
              {results.map((result, i) => (
                <button
                  key={`${result.type}-${result.id}`}
                  onClick={() => { onSelect(result.conversationId); onClose() }}
                  onMouseEnter={() => setActiveIndex(i)}
                  className={`w-full flex items-start gap-3 px-4 py-3 text-left transition-colors ${
                    i === activeIndex ? 'bg-[#1e1e22]' : 'hover:bg-[#18181b]'
                  }`}
                >
                  <div className="flex-shrink-0 mt-0.5">
                    {result.type === 'conversation'
                      ? <MessageSquare size={14} className="text-[#f97316]" />
                      : <FileText size={14} className="text-[#71717a]" />
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#e4e4e7] truncate">
                      {highlight(result.title, query)}
                    </p>
                    <p className="text-xs text-[#71717a] mt-0.5 line-clamp-2 leading-relaxed">
                      {highlight(result.snippet, query)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                    <span className="text-[10px] text-[#52525b]">
                      {new Date(result.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                    </span>
                    {i === activeIndex && <ArrowRight size={12} className="text-[#f97316]" />}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-2.5 border-t border-[#1e1e22]">
          <div className="flex items-center gap-3 text-[10px] text-[#52525b]">
            <span className="flex items-center gap-1"><kbd className="bg-[#18181b] border border-[#2e2e35] px-1 rounded">↑↓</kbd> Naviguer</span>
            <span className="flex items-center gap-1"><kbd className="bg-[#18181b] border border-[#2e2e35] px-1 rounded">↵</kbd> Ouvrir</span>
          </div>
          {results.length > 0 && (
            <span className="text-[10px] text-[#52525b]">{results.length} résultat{results.length > 1 ? 's' : ''}</span>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}
