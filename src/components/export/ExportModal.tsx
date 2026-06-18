'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, FileText, Download, File, AlignLeft, Loader2, Check } from 'lucide-react'
import {
  exportAsMarkdown,
  exportAsText,
  exportAsPDF,
  exportAsWord,
} from '@/lib/utils/export'
import type { Conversation, Message } from '@/types'

interface ExportModalProps {
  conversation: Conversation
  messages: Message[]
  onClose: () => void
}

const formats = [
  {
    id: 'pdf',
    label: 'PDF',
    description: 'Document imprimable, idéal pour partager',
    icon: FileText,
    color: 'text-red-400',
    bg: 'bg-red-500/10 border-red-500/20 hover:border-red-500/40',
  },
  {
    id: 'word',
    label: 'Word (.docx)',
    description: 'Modifiable dans Microsoft Word',
    icon: File,
    color: 'text-blue-400',
    bg: 'bg-blue-500/10 border-blue-500/20 hover:border-blue-500/40',
  },
  {
    id: 'markdown',
    label: 'Markdown',
    description: 'Parfait pour Notion, Obsidian, GitHub',
    icon: AlignLeft,
    color: 'text-purple-400',
    bg: 'bg-purple-500/10 border-purple-500/20 hover:border-purple-500/40',
  },
  {
    id: 'text',
    label: 'Texte brut',
    description: 'Format universel, lisible partout',
    icon: AlignLeft,
    color: 'text-[#71717a]',
    bg: 'bg-[#18181b] border-[#2e2e35] hover:border-[#3e3e45]',
  },
]

export default function ExportModal({ conversation, messages, onClose }: ExportModalProps) {
  const [loading, setLoading] = useState<string | null>(null)
  const [done, setDone] = useState<string | null>(null)

  const handleExport = async (formatId: string) => {
    setLoading(formatId)
    try {
      const userMessages = messages.filter(m => m.role !== 'system')
      switch (formatId) {
        case 'pdf': await exportAsPDF(conversation, userMessages); break
        case 'word': await exportAsWord(conversation, userMessages); break
        case 'markdown': await exportAsMarkdown(conversation, userMessages); break
        case 'text': await exportAsText(conversation, userMessages); break
      }
      setDone(formatId)
      setTimeout(() => setDone(null), 2000)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(null)
    }
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 16 }}
          transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
          onClick={e => e.stopPropagation()}
          className="w-full max-w-md bg-[#111113] border border-[#1e1e22] rounded-2xl overflow-hidden shadow-2xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-[#1e1e22]">
            <div>
              <h2 className="text-sm font-semibold text-[#fafafa]">Exporter la conversation</h2>
              <p className="text-xs text-[#71717a] mt-0.5 truncate max-w-[260px]">{conversation.title}</p>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-[#52525b] hover:text-[#a1a1aa] hover:bg-[#1e1e22] transition-colors"
            >
              <X size={16} />
            </button>
          </div>

          {/* Format list */}
          <div className="p-4 space-y-2.5">
            {formats.map(fmt => {
              const Icon = fmt.icon
              const isLoading = loading === fmt.id
              const isDone = done === fmt.id

              return (
                <button
                  key={fmt.id}
                  onClick={() => handleExport(fmt.id)}
                  disabled={!!loading}
                  className={`w-full flex items-center gap-3.5 px-4 py-3.5 rounded-xl border transition-all text-left disabled:opacity-60 ${fmt.bg}`}
                >
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center bg-[#18181b] flex-shrink-0 ${fmt.color}`}>
                    {isLoading ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : isDone ? (
                      <Check size={16} className="text-green-400" />
                    ) : (
                      <Icon size={16} />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#e4e4e7]">{fmt.label}</p>
                    <p className="text-xs text-[#71717a] mt-0.5">{fmt.description}</p>
                  </div>
                  {!isLoading && !isDone && (
                    <Download size={14} className="text-[#52525b] flex-shrink-0" />
                  )}
                </button>
              )
            })}
          </div>

          <div className="px-5 pb-4">
            <p className="text-xs text-[#52525b] text-center">
              {messages.filter(m => m.role !== 'system').length} messages — Export local, aucune donnée envoyée
            </p>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
