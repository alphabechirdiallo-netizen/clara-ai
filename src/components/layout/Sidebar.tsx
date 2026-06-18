'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus, Search, X, Archive, Bookmark, Trash2,
  Edit2, Check, BookOpen, Briefcase, FolderKanban,
  MessageSquare, BarChart2, FileText, Code2, Star, ChevronDown
} from 'lucide-react'
import { isToday, isYesterday, isThisWeek, isThisMonth } from 'date-fns'
import { useConversationStore } from '@/store'
import type { Conversation } from '@/types'
import ClaraLogo from '@/components/ui/ClaraLogo'

interface SidebarProps {
  onNewChat: () => void
  onSelectConversation: (id: string) => void
}

const modeIcons: Record<string, any> = {
  default: MessageSquare,
  study: BookOpen,
  business: Briefcase,
  project: FolderKanban,
}

function groupConversations(conversations: Conversation[]) {
  const groups: Record<string, Conversation[]> = {
    "Aujourd'hui": [], 'Hier': [], 'Cette semaine': [], 'Ce mois-ci': [], 'Archivé': [],
  }
  conversations.forEach((conv) => {
    const date = new Date(conv.updated_at)
    if (conv.archived) { groups['Archivé'].push(conv); return }
    if (isToday(date)) groups["Aujourd'hui"].push(conv)
    else if (isYesterday(date)) groups['Hier'].push(conv)
    else if (isThisWeek(date)) groups['Cette semaine'].push(conv)
    else groups['Ce mois-ci'].push(conv)
  })
  return groups
}

export default function Sidebar({ onNewChat, onSelectConversation }: SidebarProps) {
  const router = useRouter()
  const { conversations, activeConversationId, sidebarOpen, searchQuery, setConversations, setSidebarOpen, setSearchQuery, removeConversation, updateConversation } = useConversationStore()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [loading, setLoading] = useState(true)
  const [showArchived, setShowArchived] = useState(false)

  const fetchConversations = useCallback(async () => {
    try {
      const [activeRes, archivedRes] = await Promise.all([
        fetch('/api/conversations'),
        fetch('/api/conversations?archived=true'),
      ])
      const active = await activeRes.json()
      const archived = await archivedRes.json()
      setConversations([
        ...(Array.isArray(active) ? active : []),
        ...(Array.isArray(archived) ? archived.map((c: Conversation) => ({ ...c, archived: true })) : []),
      ])
    } finally {
      setLoading(false)
    }
  }, [setConversations])

  useEffect(() => { fetchConversations() }, [fetchConversations])

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!confirm('Supprimer cette conversation ?')) return
    await fetch(`/api/conversations/${id}`, { method: 'DELETE' })
    removeConversation(id)
  }

  const handleArchive = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    await fetch(`/api/conversations/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ archived: true }) })
    updateConversation(id, { archived: true })
  }

  const handleUnarchive = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    await fetch(`/api/conversations/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ archived: false }) })
    updateConversation(id, { archived: false })
  }

  const saveEdit = async (id: string) => {
    if (!editTitle.trim()) return
    await fetch(`/api/conversations/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: editTitle.trim() }) })
    updateConversation(id, { title: editTitle.trim() })
    setEditingId(null)
  }

  const filtered = conversations.filter(c => !searchQuery || c.title.toLowerCase().includes(searchQuery.toLowerCase()))
  const groups = groupConversations(filtered)
  const archivedConvs = groups['Archivé'] || []

  const navItems = [
    { label: 'Favoris', icon: Star, href: '/favorites' },
    { label: 'Artefacts', icon: Code2, href: '/artifacts' },
    { label: 'Documents', icon: FileText, href: '/documents' },
    { label: 'Rapports', icon: BarChart2, href: '/reports' },
  ]

  return (
    <>
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-sm" />
        )}
      </AnimatePresence>

      <motion.aside
        initial={false}
        animate={{ x: sidebarOpen ? 0 : '-100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        className="fixed top-0 left-0 bottom-0 w-72 z-50 md:relative md:translate-x-0 md:flex md:flex-col bg-[#111113] border-r border-[#1e1e22] flex flex-col"
      >
        <div className="flex items-center justify-between px-4 h-14 border-b border-[#1e1e22] flex-shrink-0">
          <ClaraLogo size={28} showText />
          <button onClick={() => setSidebarOpen(false)} className="md:hidden p-1.5 rounded-lg text-[#52525b] hover:text-[#a1a1aa] hover:bg-[#1e1e22] transition-colors"><X size={16} /></button>
        </div>

        <div className="px-3 pt-3 pb-2 flex-shrink-0">
          <button onClick={() => { onNewChat(); setSidebarOpen(false) }}
            className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-[#f97316] hover:bg-[#fb923c] text-white font-medium text-sm transition-all active:scale-[0.98]">
            <Plus size={16} />Nouvelle discussion
          </button>
        </div>

        <div className="px-3 pb-2 flex-shrink-0">
          <div className="relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#52525b]" />
            <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Rechercher..."
              className="w-full pl-8 pr-3 py-2 rounded-lg bg-[#18181b] border border-[#2e2e35] text-[#e4e4e7] placeholder:text-[#52525b] text-xs focus:outline-none focus:border-[#f97316]/40 transition-colors" />
            {searchQuery && <button onClick={() => setSearchQuery('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#52525b] hover:text-[#a1a1aa]"><X size={12} /></button>}
          </div>
        </div>

        <div className="px-3 pb-2 flex-shrink-0">
          <div className="grid grid-cols-4 gap-1">
            {navItems.map(item => (
              <button key={item.href} onClick={() => { router.push(item.href); setSidebarOpen(false) }}
                className="flex flex-col items-center gap-1 py-2 rounded-lg text-[#52525b] hover:text-[#a1a1aa] hover:bg-[#18181b] transition-colors" title={item.label}>
                <item.icon size={14} />
                <span className="text-[9px]">{item.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="h-px bg-[#1e1e22] mx-3 mb-2 flex-shrink-0" />

        <div className="flex-1 overflow-y-auto px-2 pb-4">
          {loading ? (
            <div className="space-y-1.5 px-1 mt-2">
              {[...Array(6)].map((_, i) => <div key={i} className="h-9 rounded-lg bg-[#18181b] animate-pulse" />)}
            </div>
          ) : (
            <>
              {Object.entries(groups).filter(([k]) => k !== 'Archivé').map(([group, convs]) => {
                if (convs.length === 0) return null
                return (
                  <div key={group} className="mb-3">
                    <p className="px-2 py-1 text-[10px] font-semibold text-[#52525b] uppercase tracking-widest">{group}</p>
                    <div className="space-y-0.5">
                      {convs.map((conv) => {
                        const ModeIcon = modeIcons[conv.mode] || MessageSquare
                        const isActive = conv.id === activeConversationId
                        return (
                          <div key={conv.id} onClick={() => { onSelectConversation(conv.id); setSidebarOpen(false) }}
                            className={`group relative flex items-center gap-2.5 px-2.5 py-2 rounded-lg cursor-pointer transition-colors ${isActive ? 'bg-[#1e1e22] text-[#fafafa]' : 'text-[#a1a1aa] hover:bg-[#18181b] hover:text-[#e4e4e7]'}`}>
                            <ModeIcon size={13} className={`flex-shrink-0 ${isActive ? 'text-[#f97316]' : 'text-[#52525b]'}`} />
                            {editingId === conv.id ? (
                              <input value={editTitle} onChange={(e) => setEditTitle(e.target.value)}
                                onKeyDown={(e) => { if (e.key === 'Enter') saveEdit(conv.id); if (e.key === 'Escape') setEditingId(null) }}
                                onClick={(e) => e.stopPropagation()} autoFocus
                                className="flex-1 bg-[#27272c] text-[#e4e4e7] text-xs px-2 py-0.5 rounded border border-[#f97316]/40 focus:outline-none" />
                            ) : <span className="flex-1 text-xs truncate">{conv.title}</span>}
                            {conv.bookmarked && <Star size={10} className="text-[#f97316] flex-shrink-0" />}
                            {editingId === conv.id ? (
                              <button onClick={(e) => { e.stopPropagation(); saveEdit(conv.id) }} className="text-[#f97316]"><Check size={12} /></button>
                            ) : (
                              <div className="hidden group-hover:flex items-center gap-0.5">
                                <button onClick={(e) => { e.stopPropagation(); setEditingId(conv.id); setEditTitle(conv.title) }} className="p-1 rounded hover:bg-[#27272c] text-[#52525b] hover:text-[#a1a1aa]"><Edit2 size={11} /></button>
                                <button onClick={(e) => handleArchive(conv.id, e)} className="p-1 rounded hover:bg-[#27272c] text-[#52525b] hover:text-[#a1a1aa]"><Archive size={11} /></button>
                                <button onClick={(e) => handleDelete(conv.id, e)} className="p-1 rounded hover:bg-[#27272c] text-[#52525b] hover:text-red-400"><Trash2 size={11} /></button>
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })}

              {archivedConvs.length > 0 && (
                <div className="mt-3">
                  <button onClick={() => setShowArchived(!showArchived)}
                    className="w-full flex items-center justify-between px-2 py-1 text-[10px] font-semibold text-[#52525b] uppercase tracking-widest hover:text-[#71717a] transition-colors">
                    <span>Archivé ({archivedConvs.length})</span>
                    <ChevronDown size={10} className={`transition-transform ${showArchived ? 'rotate-180' : ''}`} />
                  </button>
                  <AnimatePresence>
                    {showArchived && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="space-y-0.5 mt-0.5">
                        {archivedConvs.map(conv => (
                          <div key={conv.id} onClick={() => { onSelectConversation(conv.id); setSidebarOpen(false) }}
                            className="group flex items-center gap-2.5 px-2.5 py-2 rounded-lg cursor-pointer text-[#52525b] hover:bg-[#18181b] hover:text-[#71717a] transition-colors">
                            <Archive size={11} className="flex-shrink-0" />
                            <span className="flex-1 text-xs truncate italic">{conv.title}</span>
                            <button onClick={(e) => handleUnarchive(conv.id, e)} className="hidden group-hover:block text-[9px] text-[#71717a] hover:text-[#a1a1aa] px-1">Restaurer</button>
                          </div>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}

              {filtered.filter(c => !c.archived).length === 0 && !loading && (
                <div className="flex flex-col items-center justify-center h-24 text-center px-4">
                  <MessageSquare size={20} className="text-[#2e2e35] mb-2" />
                  <p className="text-xs text-[#52525b]">{searchQuery ? 'Aucun résultat' : 'Aucune conversation'}</p>
                </div>
              )}
            </>
          )}
        </div>
      </motion.aside>
    </>
  )
}
