'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { ArrowLeft, FileText, FileSpreadsheet, File, Image, Download, ExternalLink, Upload, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Skeleton } from '@/components/animations'

interface Document {
  id: string
  file_name: string
  file_type: string
  file_size: number
  file_url: string
  created_at: string
  conversation_id: string
  conversation_title?: string
}

function getFileIcon(type: string) {
  if (type.includes('pdf')) return { icon: FileText, color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20' }
  if (type.includes('sheet') || type.includes('excel') || type.includes('csv')) return { icon: FileSpreadsheet, color: 'text-green-400', bg: 'bg-green-500/10 border-green-500/20' }
  if (type.startsWith('image/')) return { icon: Image, color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/20' }
  return { icon: File, color: 'text-[#71717a]', bg: 'bg-[#18181b] border-[#2e2e35]' }
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} o`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`
}

export default function DocumentsPage() {
  const router = useRouter()
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return

      const { data } = await supabase
        .from('attachments')
        .select(`
          id, file_name, file_type, file_size, file_url, created_at,
          messages(conversation_id, conversations(title))
        `)
        .order('created_at', { ascending: false })

      if (data) {
        setDocuments(data.map((d: any) => ({
          ...d,
          conversation_id: d.messages?.conversation_id,
          conversation_title: d.messages?.conversations?.title,
        })))
      }
      setLoading(false)
    })
  }, [])

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const path = `${user.id}/${Date.now()}-${file.name}`
    const { data, error } = await supabase.storage.from('documents').upload(path, file)

    if (!error && data) {
      const { data: urlData } = supabase.storage.from('documents').getPublicUrl(path)
      // Could save to attachments table here if tied to a message
    }
    setUploading(false)
    e.target.value = ''
  }

  const groupedByDate = documents.reduce<Record<string, Document[]>>((acc, doc) => {
    const date = new Date(doc.created_at).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
    if (!acc[date]) acc[date] = []
    acc[date].push(doc)
    return acc
  }, {})

  return (
    <div className="min-h-screen bg-[#0a0a0b]">
      <header className="sticky top-0 z-10 flex items-center gap-3 px-4 h-14 border-b border-[#1e1e22] bg-[#0a0a0b]/80 backdrop-blur-sm">
        <button onClick={() => router.back()} className="p-2 rounded-lg text-[#71717a] hover:text-[#a1a1aa] hover:bg-[#18181b] transition-colors">
          <ArrowLeft size={18} />
        </button>
        <FileText size={16} className="text-[#f97316]" />
        <h1 className="text-sm font-semibold text-[#fafafa]">Documents</h1>
        <div className="ml-auto">
          <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#f97316] hover:bg-[#fb923c] text-white text-xs font-medium cursor-pointer transition-colors">
            {uploading ? <Loader2 size={12} className="animate-spin" /> : <Upload size={12} />}
            Importer
            <input type="file" className="hidden" onChange={handleUpload} accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.zip,.png,.jpg,.jpeg" />
          </label>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-6">
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16" />)}
          </div>
        ) : documents.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-full bg-[#18181b] border border-[#2e2e35] flex items-center justify-center mb-4">
              <FileText size={24} className="text-[#2e2e35]" />
            </div>
            <h3 className="text-sm font-medium text-[#71717a] mb-1">Aucun document</h3>
            <p className="text-xs text-[#52525b] mb-4">Les fichiers joints à tes conversations apparaîtront ici</p>
            <label className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#18181b] border border-[#2e2e35] hover:border-[#f97316]/40 text-sm text-[#a1a1aa] cursor-pointer transition-colors">
              <Upload size={14} className="text-[#f97316]" />
              Importer un document
              <input type="file" className="hidden" onChange={handleUpload} accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.zip,.png,.jpg,.jpeg" />
            </label>
          </div>
        ) : (
          Object.entries(groupedByDate).map(([month, docs]) => (
            <div key={month} className="mb-6">
              <p className="text-xs text-[#52525b] uppercase tracking-widest font-medium mb-3">{month}</p>
              <div className="space-y-2">
                {docs.map((doc, i) => {
                  const { icon: Icon, color, bg } = getFileIcon(doc.file_type)
                  return (
                    <motion.div
                      key={doc.id}
                      initial={{ opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.03 }}
                      className="flex items-center gap-3.5 px-4 py-3 rounded-xl bg-[#111113] border border-[#1e1e22] hover:border-[#2e2e35] transition-colors"
                    >
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center border flex-shrink-0 ${bg}`}>
                        <Icon size={16} className={color} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[#e4e4e7] truncate">{doc.file_name}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] text-[#52525b]">{formatSize(doc.file_size)}</span>
                          {doc.conversation_title && (
                            <>
                              <span className="text-[#3e3e45]">·</span>
                              <span className="text-[10px] text-[#52525b] truncate max-w-[140px]">{doc.conversation_title}</span>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        {doc.file_url && (
                          <a
                            href={doc.file_url}
                            download={doc.file_name}
                            className="p-1.5 rounded-lg text-[#52525b] hover:text-[#a1a1aa] hover:bg-[#18181b] transition-colors"
                            title="Télécharger"
                          >
                            <Download size={14} />
                          </a>
                        )}
                        {doc.conversation_id && (
                          <button
                            onClick={() => router.push(`/chat?conv=${doc.conversation_id}`)}
                            className="p-1.5 rounded-lg text-[#52525b] hover:text-[#a1a1aa] hover:bg-[#18181b] transition-colors"
                            title="Voir la conversation"
                          >
                            <ExternalLink size={14} />
                          </button>
                        )}
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
