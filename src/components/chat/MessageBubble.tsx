'use client'

import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Copy, Check, RefreshCw, Trash2, Edit2, Bookmark, BookmarkCheck, ChevronDown, ChevronUp } from 'lucide-react'
import CodeBlock from '@/components/code/CodeBlock'
import ClaraLogo from '@/components/ui/ClaraLogo'
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
  message, isStreaming, streamingContent, streamingReasoning,
  onDelete, onEdit, onRegenerate, onBookmark,
}: MessageBubbleProps) {
  const [showActions, setShowActions] = useState(false)
  const [copied, setCopied] = useState(false)
  const [showReasoning, setShowReasoning] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [editContent, setEditContent] = useState(message.content)

  const isUser = message.role === 'user'
  const content = isStreaming ? (streamingContent || '') : message.content
  const reasoning = isStreaming ? streamingReasoning : message.reasoning

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [content])

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
      className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'} group`}
    >
      {/* Avatar */}
      {!isUser && (
        <div className="flex-shrink-0 mt-0.5">
          <ClaraLogo size={26} thinking={!!isStreaming} />
        </div>
      )}

      <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} max-w-[85%] md:max-w-[80%]`}>
        {/* Reasoning */}
        <AnimatePresence>
          {reasoning && !isUser && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="w-full mb-2"
            >
              <button
                onClick={e => { e.stopPropagation(); setShowReasoning(!showReasoning) }}
                className="flex items-center gap-2 text-xs text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors py-1"
              >
                <motion.div
                  animate={isStreaming ? { scale: [1, 1.3, 1] } : {}}
                  transition={{ duration: 1.2, repeat: Infinity }}
                  className="w-2.5 h-2.5 rounded-full bg-[var(--clara-orange)]/40 border border-[var(--clara-orange)]/60"
                />
                <span style={{ fontFamily: 'var(--font-body)' }}>Réflexion de Clara</span>
                {showReasoning ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
              </button>
              <AnimatePresence>
                {showReasoning && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="mt-1 p-3 rounded-2xl border-l-2 border-[var(--clara-orange)]/30 text-xs text-[var(--text-tertiary)] leading-relaxed italic"
                      style={{ background: 'rgba(249,115,22,0.04)', borderLeft: '2px solid rgba(249,115,22,0.25)' }}>
                      {reasoning}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Bubble */}
        <div
          onClick={() => !isStreaming && setShowActions(!showActions)}
          className={`relative px-4 py-3.5 rounded-2xl cursor-pointer transition-all ${
            isUser
              ? 'text-white rounded-tr-sm'
              : 'text-[var(--text-primary)] rounded-tl-sm border border-white/6 hover:border-white/10'
          }`}
          style={isUser
            ? { background: 'var(--clara-orange)', boxShadow: '0 2px 12px rgba(249,115,22,0.2)' }
            : { background: 'rgba(26,26,29,0.7)', backdropFilter: 'blur(12px)' }
          }
        >
          {editMode ? (
            <div className="space-y-2" onClick={e => e.stopPropagation()}>
              <textarea
                value={editContent}
                onChange={e => setEditContent(e.target.value)}
                className="w-full bg-white/8 text-white text-sm rounded-xl p-2.5 resize-none focus:outline-none focus:ring-1 focus:ring-[var(--clara-orange)]/40 min-h-[60px]"
                rows={3}
              />
              <div className="flex gap-2 justify-end">
                <button onClick={() => setEditMode(false)} className="text-xs text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] px-2 py-1">Annuler</button>
                <button
                  onClick={() => { if (editContent.trim() && onEdit) { onEdit(message.id, editContent.trim()); setEditMode(false) } }}
                  className="text-xs bg-[var(--clara-orange)] text-white px-3 py-1.5 rounded-xl hover:bg-[var(--clara-orange-bright)]"
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
                  code({ className, children, ...props }: any) {
                    const match = /language-(\w+)/.exec(className || '')
                    const isBlock = !props.inline
                    if (isBlock && match) {
                      return <CodeBlock code={String(children).replace(/\n$/, '')} language={match[1]} />
                    }
                    return (
                      <code className={`px-1.5 py-0.5 rounded-md text-[0.85em] font-mono ${isUser ? 'bg-white/20 text-white' : 'bg-white/8 text-[var(--clara-orange)] border border-white/8'}`} {...props}>
                        {children}
                      </code>
                    )
                  },
                  pre({ children }) { return <>{children}</> },
                }}
              >
                {content}
              </ReactMarkdown>

              {isStreaming && content && <span className="cursor-blink" />}

              {isStreaming && !content && (
                <div className="flex items-center gap-1.5 py-1">
                  <div className="w-2 h-2 rounded-full bg-[var(--text-tertiary)] dot-1" />
                  <div className="w-2 h-2 rounded-full bg-[var(--text-tertiary)] dot-2" />
                  <div className="w-2 h-2 rounded-full bg-[var(--text-tertiary)] dot-3" />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Actions */}
        <AnimatePresence>
          {showActions && !isStreaming && !editMode && (
            <motion.div
              initial={{ opacity: 0, y: -4, scale: 0.94 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -4, scale: 0.94 }}
              transition={{ duration: 0.15 }}
              className={`flex items-center gap-0.5 mt-2 px-1.5 py-1.5 rounded-2xl border border-white/8 shadow-xl ${isUser ? 'flex-row-reverse' : ''}`}
              style={{ background: 'rgba(26,26,29,0.9)', backdropFilter: 'blur(16px)' }}
              onClick={e => e.stopPropagation()}
            >
              {[
                { icon: copied ? Check : Copy, label: 'Copier', onClick: handleCopy, activeColor: copied ? 'text-emerald-400' : undefined },
                isUser && onEdit ? { icon: Edit2, label: 'Modifier', onClick: () => { setEditMode(true); setShowActions(false) } } : null,
                !isUser && onRegenerate ? { icon: RefreshCw, label: 'Régénérer', onClick: () => onRegenerate(message.id) } : null,
                onBookmark ? { icon: message.is_bookmarked ? BookmarkCheck : Bookmark, label: 'Favori', onClick: () => onBookmark(message.id), activeColor: message.is_bookmarked ? 'text-[var(--clara-orange)]' : undefined } : null,
                onDelete ? { icon: Trash2, label: 'Supprimer', onClick: () => onDelete(message.id), danger: true } : null,
              ].filter(Boolean).map((action: any, i) => (
                <button
                  key={i}
                  onClick={action.onClick}
                  title={action.label}
                  className={`p-2 rounded-xl transition-all ${
                    action.danger
                      ? 'text-[var(--text-tertiary)] hover:text-red-400 hover:bg-red-500/8'
                      : `${action.activeColor || 'text-[var(--text-tertiary)]'} hover:text-[var(--text-primary)] hover:bg-white/6`
                  }`}
                >
                  <action.icon size={13} />
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        <span className="text-[10px] text-[var(--text-tertiary)] mt-1.5 px-1">
          {!isStreaming && new Date(message.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
    </motion.div>
  )
}
