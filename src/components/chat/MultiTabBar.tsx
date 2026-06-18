'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, X } from 'lucide-react'
import { useConversationStore } from '@/store'

interface Tab {
  id: string
  conversationId: string | null
  title: string
}

interface MultiTabBarProps {
  onSelectTab: (conversationId: string | null) => void
  onNewTab: () => void
}

export default function MultiTabBar({ onSelectTab, onNewTab }: MultiTabBarProps) {
  const { conversations, activeConversationId } = useConversationStore()
  const [tabs, setTabs] = useState<Tab[]>([
    { id: '1', conversationId: null, title: 'Nouveau' }
  ])
  const [activeTab, setActiveTab] = useState('1')

  const addTab = () => {
    const newTab: Tab = {
      id: crypto.randomUUID(),
      conversationId: null,
      title: 'Nouveau',
    }
    setTabs(prev => [...prev, newTab])
    setActiveTab(newTab.id)
    onSelectTab(null)
    onNewTab()
  }

  const closeTab = (tabId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (tabs.length === 1) return

    const idx = tabs.findIndex(t => t.id === tabId)
    const newTabs = tabs.filter(t => t.id !== tabId)
    setTabs(newTabs)

    if (activeTab === tabId) {
      const nextTab = newTabs[Math.max(0, idx - 1)]
      setActiveTab(nextTab.id)
      onSelectTab(nextTab.conversationId)
    }
  }

  const selectTab = (tab: Tab) => {
    setActiveTab(tab.id)
    onSelectTab(tab.conversationId)
  }

  // Update tab title when conversation is selected
  const updateTabConversation = (tabId: string, conversationId: string) => {
    const conv = conversations.find(c => c.id === conversationId)
    setTabs(prev => prev.map(t =>
      t.id === tabId
        ? { ...t, conversationId, title: conv?.title?.slice(0, 20) || 'Conversation' }
        : t
    ))
  }

  if (tabs.length <= 1) return null

  return (
    <div className="flex items-center gap-0.5 px-2 overflow-x-auto border-b border-[#1e1e22] bg-[#0a0a0b]">
      <AnimatePresence>
        {tabs.map(tab => (
          <motion.div
            key={tab.id}
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: 'auto' }}
            exit={{ opacity: 0, width: 0 }}
            className="flex-shrink-0"
          >
            <button
              onClick={() => selectTab(tab)}
              className={`group flex items-center gap-2 px-3 py-2 text-xs transition-colors border-b-2 ${
                activeTab === tab.id
                  ? 'border-[#f97316] text-[#e4e4e7]'
                  : 'border-transparent text-[#71717a] hover:text-[#a1a1aa]'
              }`}
            >
              <span className="truncate max-w-[100px]">{tab.title}</span>
              {tabs.length > 1 && (
                <span
                  onClick={(e) => closeTab(tab.id, e)}
                  className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-[#2e2e35] transition-all"
                >
                  <X size={10} />
                </span>
              )}
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
      <button
        onClick={addTab}
        className="flex-shrink-0 p-1.5 rounded text-[#52525b] hover:text-[#a1a1aa] hover:bg-[#18181b] transition-colors ml-1"
        title="Nouvel onglet"
      >
        <Plus size={14} />
      </button>
    </div>
  )
}
