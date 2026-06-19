'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Menu, Settings, LogOut, Search, Download, Star, Code2, FileText, BarChart2 } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useConversationStore, useUserStore } from '@/store'
import Sidebar from '@/components/layout/Sidebar'
import MessageBubble from '@/components/chat/MessageBubble'
import ChatInput from '@/components/chat/ChatInput'
import WelcomeScreen from '@/components/chat/WelcomeScreen'
import GlobalSearch from '@/components/chat/GlobalSearch'
import ExportModal from '@/components/export/ExportModal'
import ClaraLogo from '@/components/ui/ClaraLogo'
import type { Message, ChatMode } from '@/types'

export default function ChatView() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()
  const bottomRef = useRef<HTMLDivElement>(null)

  const {
    activeConversationId, conversations, messages, isStreaming,
    streamingContent, streamingReasoning, activeMode, sidebarOpen,
    setActiveConversation, setMessages, addMessage, updateMessage,
    removeMessage, setIsStreaming, setStreamingContent, setStreamingReasoning,
    setSidebarOpen, setActiveMode, addConversation,
  } = useConversationStore()

  const { profile } = useUserStore()
  const [showSearch, setShowSearch] = useState(false)
  const [showExport, setShowExport] = useState(false)
  const [showMenu, setShowMenu] = useState(false)

  const currentMessages: Message[] = activeConversationId ? (messages[activeConversationId] || []) : []
  const activeConversation = conversations.find(c => c.id === activeConversationId)

  useEffect(() => {
    const convId = searchParams.get('conv')
    if (convId) setActiveConversation(convId)
  }, [searchParams])

  useEffect(() => {
    if (!activeConversationId || (messages[activeConversationId]?.length || 0) > 0) return
    fetch(`/api/messages?conversationId=${activeConversationId}`)
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setMessages(activeConversationId, data) })
  }, [activeConversationId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [currentMessages.length, streamingContent])

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); setShowSearch(true) } }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [])

  const createConversation = useCallback(async (mode: ChatMode): Promise<string> => {
    const res = await fetch('/api/conversations', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode }),
    })
    const conv = await res.json()
    addConversation(conv)
    setActiveConversation(conv.id)
    return conv.id
  }, [addConversation, setActiveConversation])

  const handleSend = useCallback(async (content: string, attachments?: File[]) => {
    if (!content.trim() && !attachments?.length) return
    let convId: string = activeConversationId || ''
    if (!convId) convId = await createConversation(activeMode)

    const userMsgRes = await fetch('/api/messages', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ conversationId: convId, role: 'user', content }),
    })
    const userMsg: Message = await userMsgRes.json()
    addMessage(convId, userMsg)

    const contextMessages = [...(messages[convId] || []), userMsg].slice(-10).map(m => ({ role: m.role, content: m.content }))

    setIsStreaming(true)
    setStreamingContent('')
    setStreamingReasoning('')

    try {
      const response = await fetch('/api/chat', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: contextMessages, conversationId: convId, mode: activeMode }),
      })
      if (!response.ok || !response.body) throw new Error()

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let fullContent = ''
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          try {
            const data = JSON.parse(line.slice(6))
            if (data.type === 'content') { fullContent += data.content; setStreamingContent(fullContent) }
          } catch {}
        }
      }

      if (fullContent) {
        addMessage(convId, { id: crypto.randomUUID(), conversation_id: convId, role: 'assistant', content: fullContent, created_at: new Date().toISOString() })
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('Clara a répondu', { body: fullContent.slice(0, 80), icon: '/icons/clara-logo.png' })
        }
      }
    } catch {
      addMessage(convId, { id: crypto.randomUUID(), conversation_id: convId, role: 'assistant', content: 'Désolé, je rencontre une difficulté technique. Vérifie ta connexion internet et réessaie.', created_at: new Date().toISOString() })
    } finally {
      setIsStreaming(false)
      setStreamingContent('')
      setStreamingReasoning('')
    }
  }, [activeConversationId, activeMode, messages, createConversation, addMessage, setIsStreaming, setStreamingContent, setStreamingReasoning])

  const handleNewChat = () => { setActiveConversation(null); setIsStreaming(false); setStreamingContent(''); setStreamingReasoning('') }

  const handleBookmark = async (id: string) => {
    if (!activeConversationId) return
    const msg = currentMessages.find(m => m.id === id)
    if (!msg) return
    const val = !msg.is_bookmarked
    await fetch('/api/messages', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ messageId: id, is_bookmarked: val }) })
    updateMessage(activeConversationId, id, { is_bookmarked: val })
  }

  const handleDelete = async (id: string) => {
    if (!activeConversationId) return
    await fetch(`/api/messages?id=${id}`, { method: 'DELETE' })
    removeMessage(activeConversationId, id)
  }

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--bg-primary)' }}>
      <Sidebar onNewChat={handleNewChat} onSelectConversation={id => { setActiveConversation(id); setSidebarOpen(false) }} />

      <div className="flex-1 flex flex-col min-w-0 relative">
        {/* Ambient background */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-64"
            style={{ background: 'radial-gradient(ellipse 80% 100% at 50% 0%, rgba(249,115,22,0.04) 0%, transparent 70%)' }} />
        </div>

        {/* Header */}
        <header className="relative z-10 flex items-center justify-between px-3 sm:px-5 h-16 border-b flex-shrink-0"
          style={{ background: 'rgba(15,15,16,0.8)', backdropFilter: 'blur(20px)', borderColor: 'rgba(255,255,255,0.06)' }}>
          <div className="flex items-center gap-3">
            <motion.button whileTap={{ scale: 0.92 }} onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-xl text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] hover:bg-white/5 transition-all">
              <Menu size={18} />
            </motion.button>

            {activeConversation?.title ? (
              <div className="hidden sm:flex items-center gap-2 text-sm">
                <span className="text-[var(--clara-orange)]/60 text-xs">Clara</span>
                <span className="text-[var(--text-tertiary)] text-xs">/</span>
                <span className="text-[var(--text-secondary)] truncate max-w-[200px] text-xs">{activeConversation.title}</span>
              </div>
            ) : (
              <ClaraLogo size={28} showText textSize="text-base" />
            )}
          </div>

          <div className="flex items-center gap-0.5">
            <motion.button whileTap={{ scale: 0.92 }} onClick={() => setShowSearch(true)}
              className="p-2 rounded-xl text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] hover:bg-white/5 transition-all" title="Rechercher (⌘K)">
              <Search size={16} />
            </motion.button>

            {activeConversationId && currentMessages.length > 0 && (
              <motion.button whileTap={{ scale: 0.92 }} onClick={() => setShowExport(true)}
                className="p-2 rounded-xl text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] hover:bg-white/5 transition-all" title="Exporter">
                <Download size={16} />
              </motion.button>
            )}

            <div className="relative">
              <motion.button whileTap={{ scale: 0.92 }} onClick={() => setShowMenu(!showMenu)}
                className="p-2 rounded-xl text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] hover:bg-white/5 transition-all">
                <Settings size={16} />
              </motion.button>

              <AnimatePresence>
                {showMenu && (
                  <>
                    <div className="fixed inset-0 z-20" onClick={() => setShowMenu(false)} />
                    <motion.div
                      initial={{ opacity: 0, scale: 0.92, y: -8 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.92, y: -8 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 top-full mt-2 w-52 rounded-2xl border border-white/8 overflow-hidden shadow-2xl z-30 py-1.5"
                      style={{ background: 'rgba(18,18,20,0.95)', backdropFilter: 'blur(24px)' }}
                    >
                      {[
                        { label: 'Favoris', icon: Star, href: '/favorites' },
                        { label: 'Artefacts', icon: Code2, href: '/artifacts' },
                        { label: 'Documents', icon: FileText, href: '/documents' },
                        { label: 'Rapports', icon: BarChart2, href: '/reports' },
                        { label: 'Paramètres', icon: Settings, href: '/settings' },
                      ].map(item => (
                        <button key={item.href} onClick={() => { router.push(item.href); setShowMenu(false) }}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-xs text-[var(--text-secondary)] hover:bg-white/5 hover:text-white transition-all">
                          <item.icon size={14} className="text-[var(--text-tertiary)]" />
                          {item.label}
                        </button>
                      ))}
                      <div className="h-px mx-3 my-1" style={{ background: 'rgba(255,255,255,0.06)' }} />
                      <button onClick={async () => { await supabase.auth.signOut(); router.push('/') }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-xs text-red-400 hover:bg-red-500/8 transition-all">
                        <LogOut size={14} />
                        Se déconnecter
                      </button>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto relative z-0">
          {!activeConversationId ? (
            <WelcomeScreen
              userName={profile?.display_name}
              onSuggestion={handleSend}
              onModeSelect={mode => { setActiveMode(mode); const labels: Record<string, string> = { study: 'Étude', business: 'Business', project: 'Projet' }; if (labels[mode]) handleSend(`Je veux démarrer en mode ${labels[mode]}.`) }}
            />
          ) : (
            <div className="max-w-3xl mx-auto px-3 sm:px-5 py-6 space-y-6">
              {currentMessages.length === 0 && !isStreaming && (
                <div className="flex justify-center py-12">
                  <div className="flex gap-2 items-center">
                    <ClaraLogo size={20} thinking />
                    <span className="text-xs text-[var(--text-tertiary)]">Clara est prête</span>
                  </div>
                </div>
              )}

              {currentMessages.map(msg => (
                <MessageBubble key={msg.id} message={msg}
                  onDelete={handleDelete} onBookmark={handleBookmark} onRegenerate={() => {}} onEdit={() => {}} />
              ))}

              {isStreaming && (
                <MessageBubble key="streaming"
                  message={{ id: 'streaming', conversation_id: activeConversationId, role: 'assistant', content: streamingContent, reasoning: streamingReasoning, created_at: new Date().toISOString() }}
                  isStreaming streamingContent={streamingContent} streamingReasoning={streamingReasoning} />
              )}
              <div ref={bottomRef} />
            </div>
          )}
        </div>

        {/* Input */}
        <div className="relative z-10 flex-shrink-0 border-t px-3 sm:px-5 py-3 safe-bottom"
          style={{ background: 'rgba(15,15,16,0.85)', backdropFilter: 'blur(20px)', borderColor: 'rgba(255,255,255,0.06)' }}>
          <div className="max-w-3xl mx-auto">
            <ChatInput onSend={handleSend} disabled={isStreaming} mode={activeMode} onModeChange={setActiveMode} />
            <p className="text-center text-[10px] text-[var(--text-tertiary)] mt-2">
              Clara peut faire des erreurs. Vérifie les informations importantes.
            </p>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showSearch && <GlobalSearch onSelect={id => setActiveConversation(id)} onClose={() => setShowSearch(false)} />}
      </AnimatePresence>
      <AnimatePresence>
        {showExport && activeConversation && (
          <ExportModal conversation={activeConversation} messages={currentMessages} onClose={() => setShowExport(false)} />
        )}
      </AnimatePresence>
    </div>
  )
}
