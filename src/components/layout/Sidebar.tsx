'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus, Search, X, Archive, Trash2, Edit2, Check,
  BookOpen, Briefcase, FolderKanban, MessageSquare,
  BarChart2, FileText, Code2, Star, ChevronDown
} from 'lucide-react'
import { isToday, isYesterday, isThisWeek } from 'date-fns'
import { useConversationStore } from '@/store'
import type { Conversation } from '@/types'
import ClaraLogo from '@/components/ui/ClaraLogo'

const modeIcons: Record<string, any> = {
  default: MessageSquare, study: BookOpen, business: Briefcase, project: FolderKanban,
}

function group(convs: Conversation[]) {
  const g: Record<string, Conversation[]> = { "Aujourd'hui": [], 'Hier': [], 'Cette semaine': [], 'Avant': [], 'Archivé': [] }
  convs.forEach(c => {
    const d = new Date(c.updated_at)
    if (c.archived) { g['Archivé'].push(c); return }
    if (isToday(d)) g["Aujourd'hui"].push(c)
    else if (isYesterday(d)) g['Hier'].push(c)
    else if (isThisWeek(d)) g['Cette semaine'].push(c)
    else g['Avant'].push(c)
  })
  return g
}

export default function Sidebar({ onNewChat, onSelectConversation }: { onNewChat: () => void; onSelectConversation: (id: string) => void }) {
  const router = useRouter()
  const { conversations, activeConversationId, sidebarOpen, searchQuery, setConversations, setSidebarOpen, setSearchQuery, removeConversation, updateConversation } = useConversationStore()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [loading, setLoading] = useState(true)
  const [showArchived, setShowArchived] = useState(false)

  const load = useCallback(async () => {
    try {
      const [r1, r2] = await Promise.all([fetch('/api/conversations'), fetch('/api/conversations?archived=true')])
      const [a, b] = await Promise.all([r1.json(), r2.json()])
      setConversations([...(Array.isArray(a) ? a : []), ...(Array.isArray(b) ? b.map((c: Conversation) => ({ ...c, archived: true })) : [])])
    } finally { setLoading(false) }
  }, [setConversations])

  useEffect(() => { load() }, [load])

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!confirm('Supprimer cette conversation ?')) return
    await fetch(`/api/conversations/${id}`, { method: 'DELETE' })
    removeConversation(id)
  }

  const handleArchive = async (id: string, archived: boolean, e: React.MouseEvent) => {
    e.stopPropagation()
    await fetch(`/api/conversations/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ archived }) })
    updateConversation(id, { archived })
  }

  const saveEdit = async (id: string) => {
    if (!editTitle.trim()) return
    await fetch(`/api/conversations/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: editTitle.trim() }) })
    updateConversation(id, { title: editTitle.trim() })
    setEditingId(null)
  }

  const filtered = conversations.filter(c => !searchQuery || c.title.toLowerCase().includes(searchQuery.toLowerCase()))
  const groups = group(filtered)
  const archived = groups['Archivé'] || []

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
            className="fixed inset-0 z-40 md:hidden"
            style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }} />
        )}
      </AnimatePresence>

      <motion.aside
        initial={false}
        animate={{ x: sidebarOpen ? 0 : '-100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 280 }}
        className="fixed top-0 left-0 bottom-0 w-72 z-50 md:relative md:translate-x-0 md:flex md:flex-col flex flex-col border-r"
        style={{ background: 'rgba(15,15,16,0.95)', backdropFilter: 'blur(24px)', borderColor: 'rgba(255,255,255,0.06)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 h-16 border-b flex-shrink-0" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
          <ClaraLogo size={30} showText textSize="text-lg" />
          <button onClick={() => setSidebarOpen(false)} className="md:hidden p-2 rounded-xl text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] hover:bg-white/5 transition-all">
            <X size={16} />
          </button>
        </div>

        {/* New chat */}
        <div className="px-3 pt-3 pb-2 flex-shrink-0">
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => { onNewChat(); setSidebarOpen(false) }}
            className="w-full flex items-center gap-2.5 px-4 py-3 rounded-2xl text-white font-medium text-sm transition-all"
            style={{ background: 'var(--clara-orange)', boxShadow: '0 2px 12px rgba(249,115,22,0.25)' }}
          >
            <Plus size={16} />
            Nouvelle discussion
          </motion.button>
        </div>

        {/* Search */}
        <div className="px-3 pb-2 flex-shrink-0">
          <div className="relative">
            <Search size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]" />
            <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Rechercher..."
              className="w-full pl-9 pr-3 py-2.5 rounded-2xl text-xs text-white placeholder:text-[var(--text-tertiary)] focus:outline-none transition-colors"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.07)' }}
              onFocus={e => e.target.style.borderColor = 'rgba(249,115,22,0.3)'}
              onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.07)'}
            />
            {searchQuery && <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"><X size={11} /></button>}
          </div>
        </div>

        {/* Quick nav */}
        <div className="px-3 pb-2 flex-shrink-0">
          <div className="grid grid-cols-4 gap-1">
            {navItems.map(item => (
              <button key={item.href} onClick={() => { router.push(item.href); setSidebarOpen(false) }}
                className="flex flex-col items-center gap-1 py-2.5 rounded-xl text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] hover:bg-white/5 transition-all" title={item.label}>
                <item.icon size={15} />
                <span className="text-[9px] font-medium">{item.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="h-px mx-3 mb-2 flex-shrink-0" style={{ background: 'rgba(255,255,255,0.05)' }} />

        {/* List */}
        <div className="flex-1 overflow-y-auto px-2 pb-4">
          {loading ? (
            <div className="space-y-1 px-1 mt-2">
              {[...Array(7)].map((_, i) => (
                <div key={i} className="shimmer h-10 rounded-2xl" style={{ opacity: 1 - i * 0.1 }} />
              ))}
            </div>
          ) : (
            <>
              {Object.entries(groups).filter(([k]) => k !== 'Archivé').map(([label, convs]) => {
                if (!convs.length) return null
                return (
                  <div key={label} className="mb-4">
                    <p className="px-3 py-1 text-[10px] font-semibold uppercase tracking-widest text-[var(--text-tertiary)]">{label}</p>
                    <div className="space-y-0.5">
                      {convs.map(conv => {
                        const Icon = modeIcons[conv.mode] || MessageSquare
                        const isActive = conv.id === activeConversationId
                        return (
                          <div
                            key={conv.id}
                            onClick={() => { onSelectConversation(conv.id); setSidebarOpen(false) }}
                            className={`group relative flex items-center gap-2.5 px-3 py-2.5 rounded-2xl cursor-pointer transition-all ${isActive ? 'text-white' : 'text-[var(--text-secondary)] hover:text-white'}`}
                            style={{ background: isActive ? 'rgba(249,115,22,0.12)' : 'transparent' }}
                            onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)' }}
                            onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = 'transparent' }}
                          >
                            <Icon size={13} className={`flex-shrink-0 ${isActive ? 'text-[var(--clara-orange)]' : 'text-[var(--text-tertiary)]'}`} />
                            {editingId === conv.id ? (
                              <input value={editTitle} onChange={e => setEditTitle(e.target.value)}
                                onKeyDown={e => { if (e.key === 'Enter') saveEdit(conv.id); if (e.key === 'Escape') setEditingId(null) }}
                                onClick={e => e.stopPropagation()} autoFocus
                                className="flex-1 bg-white/8 text-white text-xs px-2 py-1 rounded-xl border border-[var(--clara-orange)]/30 focus:outline-none" />
                            ) : <span className="flex-1 text-xs truncate">{conv.title}</span>}
                            {conv.bookmarked && <Star size={9} className="text-[var(--clara-orange)] flex-shrink-0" />}
                            {editingId === conv.id ? (
                              <button onClick={e => { e.stopPropagation(); saveEdit(conv.id) }} className="text-[var(--clara-orange)]"><Check size={12} /></button>
                            ) : (
                              <div className="hidden group-hover:flex items-center gap-0.5">
                                <button onClick={e => { e.stopPropagation(); setEditingId(conv.id); setEditTitle(conv.title) }} className="p-1.5 rounded-lg text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] hover:bg-white/8"><Edit2 size={10} /></button>
                                <button onClick={e => handleArchive(conv.id, true, e)} className="p-1.5 rounded-lg text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] hover:bg-white/8"><Archive size={10} /></button>
                                <button onClick={e => handleDelete(conv.id, e)} className="p-1.5 rounded-lg text-[var(--text-tertiary)] hover:text-red-400 hover:bg-red-500/8"><Trash2 size={10} /></button>
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })}

              {archived.length > 0 && (
                <div className="mt-2">
                  <button onClick={() => setShowArchived(!showArchived)}
                    className="w-full flex items-center justify-between px-3 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors rounded-xl hover:bg-white/4">
                    <span>Archivé ({archived.length})</span>
                    <ChevronDown size={10} className={`transition-transform ${showArchived ? 'rotate-180' : ''}`} />
                  </button>
                  <AnimatePresence>
                    {showArchived && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="space-y-0.5 mt-1">
                        {archived.map(conv => (
                          <div key={conv.id} onClick={() => { onSelectConversation(conv.id); setSidebarOpen(false) }}
                            className="group flex items-center gap-2.5 px-3 py-2.5 rounded-2xl cursor-pointer text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-all hover:bg-white/4">
                            <Archive size={11} className="flex-shrink-0" />
                            <span className="flex-1 text-xs truncate italic">{conv.title}</span>
                            <button onClick={e => handleArchive(conv.id, false, e)} className="hidden group-hover:block text-[9px] text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] border border-white/10 px-2 py-0.5 rounded-full">Restaurer</button>
                          </div>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}

              {!loading && filtered.filter(c => !c.archived).length === 0 && (
                <div className="flex flex-col items-center justify-center h-28 text-center px-4 gap-2">
                  <MessageSquare size={22} className="text-[var(--text-tertiary)]" />
                  <p className="text-xs text-[var(--text-tertiary)]">{searchQuery ? 'Aucun résultat' : 'Aucune conversation'}</p>
                </div>
              )}
            </>
          )}
        </div>
      </motion.aside>
    </>
  )
}
