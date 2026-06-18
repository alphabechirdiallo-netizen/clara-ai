'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { AnimatePresence } from 'framer-motion'
import {
  Menu, Settings, LogOut, Search, Download,
  Bookmark, BarChart2, FileText, Code2, Plus
} from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useConversationStore, useUserStore } from '@/store'
import Sidebar from '@/components/layout/Sidebar'
import MessageBubble from '@/components/chat/MessageBubble'
import ChatInput from '@/components/chat/ChatInput'
import WelcomeScreen from '@/components/chat/WelcomeScreen'
import GlobalSearch from '@/components/chat/GlobalSearch'
import ExportModal from '@/components/export/ExportModal'
import { TypingIndicator } from '@/components/animations'
import ClaraLogo from '@/components/ui/ClaraLogo'
import type { Message, ChatMode, Conversation } from '@/types'

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

  const currentMessages: Message[] = activeConversationId
    ? (messages[activeConversationId] || [])
    : []

  const activeConversation = conversations.find(c => c.id === activeConversationId)

  // Handle ?conv= query param
  useEffect(() => {
    const convId = searchParams.get('conv')
    if (convId) setActiveConversation(convId)
  }, [searchParams])

  // Load messages when conversation changes
  useEffect(() => {
    if (!activeConversationId) return
    if ((messages[activeConversationId]?.length || 0) > 0) return

    fetch(`/api/messages?conversationId=${activeConversationId}`)
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) setMessages(activeConversationId, data)
      })
  }, [activeConversationId])

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [currentMessages.length, streamingContent])

  // Keyboard shortcut for search
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setShowSearch(true)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  const createConversation = useCallback(async (mode: ChatMode): Promise<string> => {
    const res = await fetch('/api/conversations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode }),
    })
    const conv = await res.json()
    addConversation(conv)
    setActiveConversation(conv.id)
    return conv.id as string
  }, [addConversation, setActiveConversation])

  const handleSend = useCallback(async (content: string, attachments?: File[]) => {
    if (!content.trim() && !attachments?.length) return

    let convId: string = activeConversationId || ''
    if (!convId) convId = await createConversation(activeMode)

    const userMsgRes = await fetch('/api/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ conversationId: convId, role: 'user', content }),
    })
    const userMsg: Message = await userMsgRes.json()
    addMessage(convId, userMsg)

    const allMessages = [...(messages[convId] || []), userMsg]
    const contextMessages = allMessages.slice(-10).map(m => ({
      role: m.role,
      content: m.content,
    }))

    setIsStreaming(true)
    setStreamingContent('')
    setStreamingReasoning('')

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: contextMessages, conversationId: convId, mode: activeMode }),
      })

      if (!response.ok || !response.body) throw new Error('Stream failed')

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
            if (data.type === 'content') {
              fullContent += data.content
              setStreamingContent(fullContent)
            }
          } catch {}
        }
      }

      if (fullContent) {
        addMessage(convId, {
          id: crypto.randomUUID(),
          conversation_id: convId,
          role: 'assistant',
          content: fullContent,
          created_at: new Date().toISOString(),
        })

        // Browser notification if enabled
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('Clara a répondu', {
            body: fullContent.slice(0, 80) + '...',
            icon: '/icons/icon-192.png',
          })
        }
      }
    } catch {
      addMessage(convId, {
        id: crypto.randomUUID(),
        conversation_id: convId,
        role: 'assistant',
        content: 'Désolé, je rencontre une difficulté technique. Vérifie ta connexion internet et réessaie dans un instant.',
        created_at: new Date().toISOString(),
      })
    } finally {
      setIsStreaming(false)
      setStreamingContent('')
      setStreamingReasoning('')
    }
  }, [activeConversationId, activeMode, messages, createConversation, addMessage, setIsStreaming, setStreamingContent, setStreamingReasoning])

  const handleNewChat = () => {
    setActiveConversation(null)
    setIsStreaming(false)
    setStreamingContent('')
    setStreamingReasoning('')
  }

  const handleDeleteMessage = async (id: string) => {
    if (!activeConversationId) return
    await fetch(`/api/messages?id=${id}`, { method: 'DELETE' })
    removeMessage(activeConversationId, id)
  }

  const handleBookmarkMessage = async (id: string) => {
    if (!activeConversationId) return
    const msg = currentMessages.find(m => m.id === id)
    if (!msg) return
    const newVal = !msg.is_bookmarked
    await fetch('/api/messages', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messageId: id, is_bookmarked: newVal }),
    })
    updateMessage(activeConversationId, id, { is_bookmarked: newVal })
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <div className="flex h-screen bg-[#0a0a0b] overflow-hidden">
      <Sidebar onNewChat={handleNewChat} onSelectConversation={(id) => { setActiveConversation(id); setSidebarOpen(false) }} />

      <div className="flex-1 flex flex-col min-w-0 relative">
        {/* Top bar */}
        <header className="flex items-center justify-between px-3 sm:px-4 h-14 border-b border-[#1e1e22] flex-shrink-0 bg-[#0a0a0b]/80 backdrop-blur-sm z-10">
          <div className="flex items-center gap-2">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 rounded-lg text-[#71717a] hover:text-[#a1a1aa] hover:bg-[#18181b] transition-colors">
              <Menu size={18} />
            </button>
            {activeConversationId && activeConversation?.title ? (
              <div className="hidden sm:flex items-center gap-2 text-sm text-[#71717a]">
                <span className="text-[#f97316]/60">Clara</span>
                <span>/</span>
                <span className="truncate max-w-[180px] text-[#a1a1aa]">{activeConversation.title}</span>
              </div>
            ) : (
              <ClaraLogo size={22} showText />
            )}
          </div>

          <div className="flex items-center gap-0.5">
            {/* Search */}
            <button
              onClick={() => setShowSearch(true)}
              className="p-2 rounded-lg text-[#71717a] hover:text-[#a1a1aa] hover:bg-[#18181b] transition-colors"
              title="Rechercher (⌘K)"
            >
              <Search size={16} />
            </button>

            {/* Export - only when conversation is active */}
            {activeConversationId && currentMessages.length > 0 && (
              <button
                onClick={() => setShowExport(true)}
                className="p-2 rounded-lg text-[#71717a] hover:text-[#a1a1aa] hover:bg-[#18181b] transition-colors"
                title="Exporter"
              >
                <Download size={16} />
              </button>
            )}

            {/* More menu */}
            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="p-2 rounded-lg text-[#71717a] hover:text-[#a1a1aa] hover:bg-[#18181b] transition-colors"
              >
                <Settings size={16} />
              </button>

              <AnimatePresence>
                {showMenu && (
                  <>
                    <div className="fixed inset-0 z-20" onClick={() => setShowMenu(false)} />
                    <div className="absolute right-0 top-full mt-1.5 w-48 bg-[#18181b] border border-[#2e2e35] rounded-xl shadow-xl z-30 overflow-hidden py-1">
                      {[
                        { label: 'Favoris', icon: Bookmark, href: '/favorites' },
                        { label: 'Artefacts', icon: Code2, href: '/artifacts' },
                        { label: 'Documents', icon: FileText, href: '/documents' },
                        { label: 'Rapports', icon: BarChart2, href: '/reports' },
                        { label: 'Paramètres', icon: Settings, href: '/settings' },
                      ].map(item => (
                        <button
                          key={item.href}
                          onClick={() => { router.push(item.href); setShowMenu(false) }}
                          className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs text-[#a1a1aa] hover:bg-[#27272c] hover:text-[#e4e4e7] transition-colors"
                        >
                          <item.icon size={13} className="text-[#71717a]" />
                          {item.label}
                        </button>
                      ))}
                      <div className="h-px bg-[#2e2e35] my-1" />
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs text-red-400 hover:bg-red-500/10 transition-colors"
                      >
                        <LogOut size={13} />
                        Se déconnecter
                      </button>
                    </div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto">
          {!activeConversationId ? (
            <WelcomeScreen
              userName={profile?.display_name}
              onSuggestion={handleSend}
              onModeSelect={(mode) => {
                setActiveMode(mode)
                const labels: Record<string, string> = { study: 'Étude', business: 'Business', project: 'Projet' }
                if (labels[mode]) handleSend(`Je veux démarrer en mode ${labels[mode]}.`)
              }}
            />
          ) : (
            <div className="max-w-3xl mx-auto px-3 sm:px-4 py-6 space-y-5">
              {currentMessages.length === 0 && !isStreaming && (
                <div className="flex justify-center py-10">
                  <TypingIndicator />
                </div>
              )}

              {currentMessages.map((message) => (
                <MessageBubble
                  key={message.id}
                  message={message}
                  onDelete={handleDeleteMessage}
                  onBookmark={handleBookmarkMessage}
                  onRegenerate={() => {}}
                  onEdit={() => {}}
                />
              ))}

              {isStreaming && (
                <MessageBubble
                  key="streaming"
                  message={{
                    id: 'streaming',
                    conversation_id: activeConversationId,
                    role: 'assistant',
                    content: streamingContent,
                    reasoning: streamingReasoning,
                    created_at: new Date().toISOString(),
                  }}
                  isStreaming
                  streamingContent={streamingContent}
                  streamingReasoning={streamingReasoning}
                />
              )}

              <div ref={bottomRef} />
            </div>
          )}
        </div>

        {/* Input */}
        <div className="flex-shrink-0 border-t border-[#1e1e22] bg-[#0a0a0b]/80 backdrop-blur-sm px-3 sm:px-4 py-3 safe-bottom">
          <div className="max-w-3xl mx-auto">
            <ChatInput
              onSend={handleSend}
              disabled={isStreaming}
              mode={activeMode}
              onModeChange={setActiveMode}
            />
            <p className="text-center text-[10px] text-[#3e3e45] mt-2">
              Clara peut faire des erreurs. Vérifie les informations importantes.
            </p>
          </div>
        </div>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {showSearch && (
          <GlobalSearch
            onSelect={(convId) => setActiveConversation(convId)}
            onClose={() => setShowSearch(false)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showExport && activeConversation && (
          <ExportModal
            conversation={activeConversation}
            messages={currentMessages}
            onClose={() => setShowExport(false)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
