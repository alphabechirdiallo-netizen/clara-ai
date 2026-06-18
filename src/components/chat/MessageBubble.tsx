'use client'

import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import {
  Copy, Check, RefreshCw, Trash2, Edit2, Bookmark, BookmarkCheck,
  ChevronDown, ChevronUp
} from 'lucide-react'
import CodeBlock from '@/components/code/CodeBlock'
import type { Message } from '@/types'

interface MessageBubbleProps {
  message: Message
  isStreaming?: boolean
  streamingContent?: string
  streamingReasoning?: string
  onDelete?: (id: string) => void
  onEdit?: (id: string, content: string) => void
  onRegenerate?: (id: string) => void
  onBookmark?: (id: string) => void
}

export default function MessageBubble({
  message,
  isStreaming,
  streamingContent,
  streamingReasoning,
  onDelete,
  onEdit,
  onRegenerate,
  onBookmark,
}: MessageBubbleProps) {
  const [showActions, setShowActions] = useState(false)
  const [copied, setCopied] = useState(false)
  const [showReasoning, setShowReasoning] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [editContent, setEditContent] = useState(message.content)

  const isUser = message.role === 'user'
  const content = isStreaming ? streamingContent || '' : message.content
  const reasoning = isStreaming ? streamingReasoning : message.reasoning

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [content])

  const handleEdit = () => {
    setEditContent(message.content)
    setEditMode(true)
    setShowActions(false)
  }

  const handleSaveEdit = () => {
    if (editContent.trim() && onEdit) {
      onEdit(message.id, editContent.trim())
    }
    setEditMode(false)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'} group`}
    >
      {/* Avatar */}
      {!isUser && (
        <div className="flex-shrink-0 w-7 h-7 rounded-full bg-[#f97316]/10 border border-[#f97316]/20 flex items-center justify-center mt-0.5">
          <span className="text-[10px] font-bold text-[#f97316]">C</span>
        </div>
      )}

      {/* Message content */}
      <div
        className={`flex flex-col max-w-[85%] md:max-w-[78%] ${isUser ? 'items-end' : 'items-start'}`}
        onClick={() => !isStreaming && setShowActions(!showActions)}
      >
        {/* Reasoning block */}
        <AnimatePresence>
          {reasoning && !isUser && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="w-full mb-2"
            >
              <button
                onClick={(e) => { e.stopPropagation(); setShowReasoning(!showReasoning) }}
                className="flex items-center gap-2 text-xs text-[#71717a] hover:text-[#a1a1aa] transition-colors py-1"
              >
                <div className="w-3 h-3 rounded-full border border-[#f97316]/40 flex items-center justify-center">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#f97316]/60" />
                </div>
                <span>Réflexion de Clara</span>
                {showReasoning ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              </button>

              <AnimatePresence>
                {showReasoning && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="mt-1 p-3 rounded-lg bg-[#18181b] border border-[#f97316]/10 text-xs text-[#71717a] leading-relaxed italic border-l-2 border-l-[#f97316]/30">
                      {reasoning}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main bubble */}
        <div
          className={`relative px-4 py-3 rounded-2xl cursor-pointer transition-colors ${
            isUser
              ? 'bg-[#f97316] text-white rounded-tr-sm'
              : 'bg-[#18181b] border border-[#2e2e35] text-[#e4e4e7] rounded-tl-sm hover:border-[#3e3e45]'
          }`}
        >
          {editMode ? (
            <div className="space-y-2" onClick={(e) => e.stopPropagation()}>
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="w-full bg-[#27272c] text-[#e4e4e7] text-sm rounded-lg p-2 resize-none focus:outline-none focus:ring-1 focus:ring-[#f97316]/40 min-h-[60px]"
                rows={3}
              />
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => setEditMode(false)}
                  className="text-xs text-[#71717a] hover:text-[#a1a1aa] px-2 py-1"
                >
                  Annuler
                </button>
                <button
                  onClick={handleSaveEdit}
                  className="text-xs bg-[#f97316] text-white px-3 py-1 rounded-lg hover:bg-[#fb923c]"
                >
                  Enregistrer
                </button>
              </div>
            </div>
          ) : (
            <div className={`message-content ${isUser ? 'text-white' : ''}`}>
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  code({ node, className, children, ...props }: any) {
                    const match = /language-(\w+)/.exec(className || '')
                    const isBlock = !props.inline
                    if (isBlock && match) {
                      return (
                        <CodeBlock
                          code={String(children).replace(/\n$/, '')}
                          language={match[1]}
                        />
                      )
                    }
                    return (
                      <code
                        className={`px-1.5 py-0.5 rounded text-sm font-mono ${
                          isUser
                            ? 'bg-white/20 text-white'
                            : 'bg-[#27272c] text-[#f97316] border border-[#3e3e45]'
                        }`}
                        {...props}
                      >
                        {children}
                      </code>
                    )
                  },
                  pre({ children }) {
                    return <>{children}</>
                  },
                }}
              >
                {content}
              </ReactMarkdown>

              {/* Streaming cursor */}
              {isStreaming && content && (
                <span className="inline-block w-0.5 h-4 bg-[#f97316] ml-0.5 animate-pulse" />
              )}

              {/* Streaming dots when empty */}
              {isStreaming && !content && (
                <div className="flex items-center gap-1 py-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#71717a] streaming-dot" />
                  <div className="w-1.5 h-1.5 rounded-full bg-[#71717a] streaming-dot" />
                  <div className="w-1.5 h-1.5 rounded-full bg-[#71717a] streaming-dot" />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Actions */}
        <AnimatePresence>
          {showActions && !isStreaming && !editMode && (
            <motion.div
              initial={{ opacity: 0, y: -4, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -4, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className={`flex items-center gap-0.5 mt-1.5 px-1 py-1 rounded-xl bg-[#18181b] border border-[#2e2e35] shadow-xl ${
                isUser ? 'flex-row-reverse' : ''
              }`}
              onClick={(e) => e.stopPropagation()}
            >
              <ActionBtn onClick={handleCopy} title="Copier">
                {copied ? <Check size={13} className="text-green-400" /> : <Copy size={13} />}
              </ActionBtn>

              {isUser && onEdit && (
                <ActionBtn onClick={handleEdit} title="Modifier">
                  <Edit2 size={13} />
                </ActionBtn>
              )}

              {!isUser && onRegenerate && (
                <ActionBtn onClick={() => onRegenerate(message.id)} title="Régénérer">
                  <RefreshCw size={13} />
                </ActionBtn>
              )}

              {onBookmark && (
                <ActionBtn onClick={() => onBookmark(message.id)} title="Favori">
                  {message.is_bookmarked
                    ? <BookmarkCheck size={13} className="text-[#f97316]" />
                    : <Bookmark size={13} />
                  }
                </ActionBtn>
              )}

              {onDelete && (
                <ActionBtn onClick={() => onDelete(message.id)} title="Supprimer" danger>
                  <Trash2 size={13} />
                </ActionBtn>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Timestamp */}
        {!isStreaming && (
          <span className="text-[10px] text-[#52525b] mt-1 px-1">
            {new Date(message.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
          </span>
        )}
      </div>
    </motion.div>
  )
}

function ActionBtn({
  children,
  onClick,
  title,
  danger,
}: {
  children: React.ReactNode
  onClick: () => void
  title: string
  danger?: boolean
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`p-1.5 rounded-lg transition-colors ${
        danger
          ? 'text-[#52525b] hover:text-red-400 hover:bg-red-500/10'
          : 'text-[#52525b] hover:text-[#a1a1aa] hover:bg-[#27272c]'
      }`}
    >
      {children}
    </button>
  )
}
