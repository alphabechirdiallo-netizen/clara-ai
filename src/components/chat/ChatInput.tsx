'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Send, Paperclip, Mic, MicOff, X, FileText,
  Image as ImageIcon, BookOpen, Briefcase, FolderKanban,
  MessageSquare, Sparkles
} from 'lucide-react'
import type { ChatMode } from '@/types'

interface ChatInputProps {
  onSend: (content: string, attachments?: File[]) => void
  disabled?: boolean
  mode: ChatMode
  onModeChange: (mode: ChatMode) => void
  placeholder?: string
}

const modes = [
  { value: 'default' as ChatMode, label: 'Standard', icon: MessageSquare },
  { value: 'study' as ChatMode, label: 'Étude', icon: BookOpen },
  { value: 'business' as ChatMode, label: 'Business', icon: Briefcase },
  { value: 'project' as ChatMode, label: 'Projet', icon: FolderKanban },
]

const suggestions = [
  "Explique-moi comment fonctionne",
  "Aide-moi à construire un plan pour",
  "Quels sont les meilleurs conseils pour",
  "Analyse les avantages et inconvénients de",
  "Comment démarrer dans le domaine de",
]

export default function ChatInput({ onSend, disabled, mode, onModeChange, placeholder }: ChatInputProps) {
  const [content, setContent] = useState('')
  const [attachments, setAttachments] = useState<File[]>([])
  const [recording, setRecording] = useState(false)
  const [showModes, setShowModes] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)

  // Auto-resize textarea
  useEffect(() => {
    const ta = textareaRef.current
    if (!ta) return
    ta.style.height = 'auto'
    ta.style.height = Math.min(ta.scrollHeight, 200) + 'px'
  }, [content])

  const handleSend = useCallback(() => {
    if ((!content.trim() && attachments.length === 0) || disabled) return
    onSend(content.trim(), attachments)
    setContent('')
    setAttachments([])
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
  }, [content, attachments, disabled, onSend])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    setAttachments(prev => [...prev, ...files].slice(0, 5))
    e.target.value = ''
  }

  const removeAttachment = (i: number) => {
    setAttachments(prev => prev.filter((_, idx) => idx !== i))
  }

  const toggleRecording = async () => {
    if (recording) {
      mediaRecorderRef.current?.stop()
      setRecording(false)
      return
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      const chunks: BlobPart[] = []

      mediaRecorder.ondataavailable = (e) => chunks.push(e.data)
      mediaRecorder.onstop = () => {
        // Use Web Speech API for transcription if available
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
          const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
          const recognition = new SR()
          recognition.lang = 'fr-FR'
          recognition.onresult = (event: any) => {
            const transcript = event.results[0][0].transcript
            setContent(prev => prev ? prev + ' ' + transcript : transcript)
          }
          recognition.start()
        }
        stream.getTracks().forEach(t => t.stop())
      }

      mediaRecorder.start()
      mediaRecorderRef.current = mediaRecorder
      setRecording(true)

      // Auto-stop after 60s
      setTimeout(() => {
        if (mediaRecorderRef.current?.state === 'recording') {
          mediaRecorderRef.current.stop()
          setRecording(false)
        }
      }, 60000)
    } catch {
      alert('Accès au microphone refusé.')
    }
  }

  const ActiveModeIcon = modes.find(m => m.value === mode)?.icon || MessageSquare

  return (
    <div className="w-full space-y-2">
      {/* Attachment previews */}
      <AnimatePresence>
        {attachments.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex flex-wrap gap-2 px-1"
          >
            {attachments.map((file, i) => (
              <div
                key={i}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#18181b] border border-[#2e2e35] text-xs text-[#a1a1aa]"
              >
                {file.type.startsWith('image/') ? (
                  <ImageIcon size={12} className="text-[#f97316]" />
                ) : (
                  <FileText size={12} className="text-[#f97316]" />
                )}
                <span className="max-w-[120px] truncate">{file.name}</span>
                <button onClick={() => removeAttachment(i)} className="text-[#52525b] hover:text-red-400">
                  <X size={11} />
                </button>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main input */}
      <div className="relative rounded-2xl bg-[#18181b] border border-[#2e2e35] focus-within:border-[#f97316]/40 transition-colors shadow-lg">
        {/* Mode selector row */}
        <div className="flex items-center gap-1 px-3 pt-2.5 pb-1">
          <div className="relative">
            <button
              onClick={() => setShowModes(!showModes)}
              className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs text-[#71717a] hover:text-[#a1a1aa] hover:bg-[#27272c] transition-colors"
            >
              <ActiveModeIcon size={12} />
              <span>{modes.find(m => m.value === mode)?.label}</span>
            </button>

            <AnimatePresence>
              {showModes && (
                <motion.div
                  initial={{ opacity: 0, y: 4, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 4, scale: 0.95 }}
                  className="absolute bottom-full left-0 mb-2 bg-[#1e1e22] border border-[#2e2e35] rounded-xl p-1.5 shadow-xl z-10 min-w-[140px]"
                >
                  {modes.map((m) => {
                    const Icon = m.icon
                    return (
                      <button
                        key={m.value}
                        onClick={() => { onModeChange(m.value); setShowModes(false) }}
                        className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs transition-colors ${
                          mode === m.value
                            ? 'bg-[#f97316]/10 text-[#f97316]'
                            : 'text-[#a1a1aa] hover:bg-[#27272c] hover:text-[#e4e4e7]'
                        }`}
                      >
                        <Icon size={13} />
                        {m.label}
                      </button>
                    )
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {recording && (
            <div className="flex items-center gap-1.5 ml-1">
              <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
              <span className="text-xs text-red-400">Enregistrement...</span>
            </div>
          )}
        </div>

        {/* Textarea */}
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder || "Dis-moi tout..."}
          disabled={disabled}
          rows={1}
          className="w-full px-4 pb-2 bg-transparent text-[#e4e4e7] placeholder:text-[#52525b] text-sm resize-none focus:outline-none disabled:opacity-50 max-h-48"
          style={{ minHeight: '36px' }}
        />

        {/* Bottom toolbar */}
        <div className="flex items-center justify-between px-3 pb-2.5">
          <div className="flex items-center gap-1">
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={disabled}
              className="p-1.5 rounded-lg text-[#52525b] hover:text-[#a1a1aa] hover:bg-[#27272c] transition-colors disabled:opacity-30"
              title="Joindre un fichier"
            >
              <Paperclip size={15} />
            </button>
            <button
              onClick={toggleRecording}
              disabled={disabled}
              className={`p-1.5 rounded-lg transition-colors disabled:opacity-30 ${
                recording
                  ? 'text-red-400 bg-red-500/10 hover:bg-red-500/20'
                  : 'text-[#52525b] hover:text-[#a1a1aa] hover:bg-[#27272c]'
              }`}
              title={recording ? 'Arrêter' : 'Micro'}
            >
              {recording ? <MicOff size={15} /> : <Mic size={15} />}
            </button>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] text-[#52525b] hidden sm:block">
              {content.length > 0 ? `${content.length} car.` : 'Shift+Entrée pour nouvelle ligne'}
            </span>
            <button
              onClick={handleSend}
              disabled={disabled || (!content.trim() && attachments.length === 0)}
              className="flex items-center justify-center w-8 h-8 rounded-xl bg-[#f97316] hover:bg-[#fb923c] disabled:opacity-30 disabled:cursor-not-allowed text-white transition-all active:scale-95"
            >
              <Send size={14} />
            </button>
          </div>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.zip,.png,.jpg,.jpeg,.gif,.webp,.mp4,.mov"
        className="hidden"
        onChange={handleFileSelect}
      />
    </div>
  )
}
