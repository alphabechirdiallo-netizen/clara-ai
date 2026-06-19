'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, Paperclip, Mic, MicOff, X, FileText, Image as ImageIcon, BookOpen, Briefcase, FolderKanban, MessageSquare, ChevronUp } from 'lucide-react'
import type { ChatMode } from '@/types'

interface ChatInputProps {
  onSend: (content: string, attachments?: File[]) => void
  disabled?: boolean
  mode: ChatMode
  onModeChange: (mode: ChatMode) => void
}

const modes = [
  { value: 'default' as ChatMode, label: 'Standard', icon: MessageSquare },
  { value: 'study' as ChatMode, label: 'Étude', icon: BookOpen },
  { value: 'business' as ChatMode, label: 'Business', icon: Briefcase },
  { value: 'project' as ChatMode, label: 'Projet', icon: FolderKanban },
]

export default function ChatInput({ onSend, disabled, mode, onModeChange }: ChatInputProps) {
  const [content, setContent] = useState('')
  const [attachments, setAttachments] = useState<File[]>([])
  const [recording, setRecording] = useState(false)
  const [showModes, setShowModes] = useState(false)
  const [focused, setFocused] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)

  useEffect(() => {
    const ta = textareaRef.current
    if (!ta) return
    ta.style.height = 'auto'
    ta.style.height = Math.min(ta.scrollHeight, 180) + 'px'
  }, [content])

  const handleSend = useCallback(() => {
    if ((!content.trim() && attachments.length === 0) || disabled) return
    onSend(content.trim(), attachments)
    setContent('')
    setAttachments([])
    if (textareaRef.current) textareaRef.current.style.height = 'auto'
  }, [content, attachments, disabled, onSend])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
  }

  const toggleRecording = async () => {
    if (recording) { mediaRecorderRef.current?.stop(); setRecording(false); return }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mr = new MediaRecorder(stream)
      mr.onstop = () => {
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
          const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
          const r = new SR()
          r.lang = 'fr-FR'
          r.onresult = (ev: any) => {
            const t = ev.results[0][0].transcript
            setContent(p => p ? p + ' ' + t : t)
          }
          r.start()
        }
        stream.getTracks().forEach(t => t.stop())
      }
      mr.start()
      mediaRecorderRef.current = mr
      setRecording(true)
      setTimeout(() => { if (mediaRecorderRef.current?.state === 'recording') { mediaRecorderRef.current.stop(); setRecording(false) } }, 60000)
    } catch { alert('Accès au microphone refusé.') }
  }

  const ActiveIcon = modes.find(m => m.value === mode)?.icon || MessageSquare

  return (
    <div className="w-full space-y-2">
      {/* Attachments */}
      <AnimatePresence>
        {attachments.length > 0 && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            className="flex flex-wrap gap-2 px-1">
            {attachments.map((f, i) => (
              <div key={i} className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/8 text-xs text-[var(--text-secondary)]"
                style={{ background: 'rgba(26,26,29,0.8)' }}>
                {f.type.startsWith('image/') ? <ImageIcon size={11} className="text-[var(--clara-orange)]" /> : <FileText size={11} className="text-[var(--clara-orange)]" />}
                <span className="max-w-[100px] truncate">{f.name}</span>
                <button onClick={() => setAttachments(p => p.filter((_, j) => j !== i))} className="text-[var(--text-tertiary)] hover:text-red-400">
                  <X size={10} />
                </button>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main input container */}
      <motion.div
        animate={{ boxShadow: focused ? '0 0 0 1px rgba(249,115,22,0.3), 0 8px 32px rgba(0,0,0,0.4)' : '0 4px 16px rgba(0,0,0,0.3)' }}
        transition={{ duration: 0.2 }}
        className="relative rounded-3xl border transition-colors"
        style={{
          background: 'rgba(26,26,29,0.85)',
          backdropFilter: 'blur(20px)',
          borderColor: focused ? 'rgba(249,115,22,0.25)' : 'rgba(255,255,255,0.08)',
        }}
      >
        {/* Mode + recording indicator */}
        <div className="flex items-center gap-2 px-4 pt-3 pb-1">
          <div className="relative">
            <button
              onClick={() => setShowModes(!showModes)}
              className="flex items-center gap-1.5 text-xs text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors py-1 px-2 rounded-xl hover:bg-white/5"
            >
              <ActiveIcon size={12} />
              <span>{modes.find(m => m.value === mode)?.label}</span>
              <ChevronUp size={10} className={`transition-transform ${showModes ? '' : 'rotate-180'}`} />
            </button>

            <AnimatePresence>
              {showModes && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowModes(false)} />
                  <motion.div
                    initial={{ opacity: 0, y: 6, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 6, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute bottom-full left-0 mb-2 rounded-2xl border border-white/8 p-1.5 shadow-2xl z-20 min-w-[150px]"
                    style={{ background: 'rgba(22,22,25,0.95)', backdropFilter: 'blur(20px)' }}
                  >
                    {modes.map(m => {
                      const Icon = m.icon
                      return (
                        <button
                          key={m.value}
                          onClick={() => { onModeChange(m.value); setShowModes(false) }}
                          className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs transition-all ${
                            mode === m.value
                              ? 'bg-[var(--clara-orange-dim)] text-[var(--clara-orange)]'
                              : 'text-[var(--text-secondary)] hover:bg-white/5 hover:text-white'
                          }`}
                        >
                          <Icon size={13} />
                          {m.label}
                        </button>
                      )
                    })}
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>

          {recording && (
            <div className="flex items-center gap-1.5 ml-1">
              <motion.div animate={{ scale: [1, 1.4, 1] }} transition={{ duration: 1, repeat: Infinity }}
                className="w-1.5 h-1.5 rounded-full bg-red-500" />
              <span className="text-xs text-red-400">Enregistrement</span>
            </div>
          )}
        </div>

        {/* Textarea */}
        <textarea
          ref={textareaRef}
          value={content}
          onChange={e => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder="Dis-moi tout..."
          disabled={disabled}
          rows={1}
          className="w-full px-4 pb-2 bg-transparent text-white placeholder:text-[var(--text-tertiary)] text-sm resize-none focus:outline-none disabled:opacity-40"
          style={{ minHeight: '36px', maxHeight: '180px', fontFamily: 'var(--font-body)' }}
        />

        {/* Bottom bar */}
        <div className="flex items-center justify-between px-3 pb-3 pt-1">
          <div className="flex items-center gap-0.5">
            <button onClick={() => fileInputRef.current?.click()} disabled={disabled}
              className="p-2 rounded-xl text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] hover:bg-white/5 transition-all disabled:opacity-30" title="Joindre">
              <Paperclip size={16} />
            </button>
            <button onClick={toggleRecording} disabled={disabled}
              className={`p-2 rounded-xl transition-all disabled:opacity-30 ${recording ? 'text-red-400 bg-red-500/10' : 'text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] hover:bg-white/5'}`} title="Micro">
              {recording ? <MicOff size={16} /> : <Mic size={16} />}
            </button>
          </div>

          <div className="flex items-center gap-2.5">
            <span className="text-[10px] text-[var(--text-tertiary)] hidden sm:block">
              {content.length > 0 ? `${content.length}` : 'Shift+↵ nouvelle ligne'}
            </span>
            <motion.button
              onClick={handleSend}
              disabled={disabled || (!content.trim() && attachments.length === 0)}
              whileTap={{ scale: 0.88 }}
              className="w-9 h-9 rounded-2xl flex items-center justify-center text-white transition-all disabled:opacity-25"
              style={{ background: content.trim() || attachments.length > 0 ? 'var(--clara-orange)' : 'rgba(255,255,255,0.08)' }}
            >
              <Send size={15} />
            </motion.button>
          </div>
        </div>
      </motion.div>

      <input ref={fileInputRef} type="file" multiple
        accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.zip,.png,.jpg,.jpeg,.gif,.webp,.mp4,.mov"
        className="hidden" onChange={e => { setAttachments(p => [...p, ...Array.from(e.target.files || [])].slice(0, 5)); e.target.value = '' }} />
    </div>
  )
}
