'use client'

import { useState, useEffect } from 'react'
import { Copy, Check, Download, Maximize2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface CodeBlockProps {
  code: string
  language?: string
}

export default function CodeBlock({ code, language = 'text' }: CodeBlockProps) {
  const [copied, setCopied] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const [highlighted, setHighlighted] = useState('')

  useEffect(() => {
    // Dynamic import highlight.js
    import('highlight.js').then((hljs) => {
      try {
        const lang = hljs.default.getLanguage(language) ? language : 'plaintext'
        const result = hljs.default.highlight(code, { language: lang })
        setHighlighted(result.value)
      } catch {
        setHighlighted(code)
      }
    })
  }, [code, language])

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDownload = () => {
    const extensions: Record<string, string> = {
      javascript: 'js', typescript: 'ts', python: 'py', sql: 'sql',
      html: 'html', css: 'css', jsx: 'jsx', tsx: 'tsx',
      rust: 'rs', go: 'go', java: 'java', cpp: 'cpp', c: 'c',
    }
    const ext = extensions[language] || 'txt'
    const blob = new Blob([code], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `code.${ext}`
    a.click()
    URL.revokeObjectURL(url)
  }

  const langLabel: Record<string, string> = {
    javascript: 'JavaScript', typescript: 'TypeScript', python: 'Python',
    sql: 'SQL', html: 'HTML', css: 'CSS', jsx: 'React JSX', tsx: 'React TSX',
    rust: 'Rust', go: 'Go', java: 'Java', cpp: 'C++', c: 'C',
    bash: 'Bash', shell: 'Shell', json: 'JSON', markdown: 'Markdown',
  }

  const displayLang = langLabel[language] || language.toUpperCase()

  return (
    <div className="rounded-xl overflow-hidden border border-[#2e2e35] my-3 group">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-[#18181b] border-b border-[#2e2e35]">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]" />
            <div className="w-2.5 h-2.5 rounded-full bg-[#febc2e]" />
            <div className="w-2.5 h-2.5 rounded-full bg-[#28c840]" />
          </div>
          <span className="text-xs font-medium text-[#71717a] ml-1">{displayLang}</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setExpanded(!expanded)}
            className="p-1.5 rounded-lg text-[#52525b] hover:text-[#a1a1aa] hover:bg-[#27272c] transition-colors"
            title="Agrandir"
          >
            <Maximize2 size={13} />
          </button>
          <button
            onClick={handleDownload}
            className="p-1.5 rounded-lg text-[#52525b] hover:text-[#a1a1aa] hover:bg-[#27272c] transition-colors"
            title="Télécharger"
          >
            <Download size={13} />
          </button>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all hover:bg-[#27272c]"
          >
            {copied ? (
              <>
                <Check size={12} className="text-green-400" />
                <span className="text-green-400">Copié</span>
              </>
            ) : (
              <>
                <Copy size={12} className="text-[#71717a]" />
                <span className="text-[#71717a]">Copier</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Code */}
      <div
        className={`bg-[#0f0f11] overflow-x-auto transition-all duration-300 ${expanded ? 'max-h-none' : 'max-h-96'}`}
      >
        {highlighted ? (
          <pre className="p-4 text-[0.8125rem] leading-relaxed">
            <code
              className={`language-${language} hljs`}
              dangerouslySetInnerHTML={{ __html: highlighted }}
            />
          </pre>
        ) : (
          <pre className="p-4 text-[0.8125rem] leading-relaxed text-[#e4e4e7] font-mono">
            <code>{code}</code>
          </pre>
        )}
      </div>

      {/* Expanded modal */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setExpanded(false)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-4xl max-h-[90vh] rounded-xl border border-[#2e2e35] overflow-hidden flex flex-col"
            >
              <div className="flex items-center justify-between px-4 py-2.5 bg-[#18181b] border-b border-[#2e2e35] flex-shrink-0">
                <span className="text-xs font-medium text-[#71717a]">{displayLang}</span>
                <div className="flex gap-2">
                  <button onClick={handleCopy} className="text-xs text-[#71717a] hover:text-[#a1a1aa] px-2 py-1 rounded hover:bg-[#27272c] transition-colors">
                    {copied ? 'Copié' : 'Copier'}
                  </button>
                  <button onClick={() => setExpanded(false)} className="text-xs text-[#71717a] hover:text-[#a1a1aa] px-2 py-1 rounded hover:bg-[#27272c] transition-colors">
                    Fermer
                  </button>
                </div>
              </div>
              <div className="overflow-auto bg-[#0f0f11] flex-1">
                <pre className="p-4 text-[0.8125rem] leading-relaxed">
                  <code
                    className={`language-${language} hljs`}
                    dangerouslySetInnerHTML={{ __html: highlighted || code }}
                  />
                </pre>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
