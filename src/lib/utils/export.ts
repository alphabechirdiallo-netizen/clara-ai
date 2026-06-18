import type { Message, Conversation } from '@/types'

export async function exportAsMarkdown(conversation: Conversation, messages: Message[]): Promise<void> {
  const lines: string[] = [
    `# ${conversation.title}`,
    ``,
    `> Conversation avec Clara — ${new Date(conversation.created_at).toLocaleDateString('fr-FR', { dateStyle: 'long' })}`,
    ``,
    `---`,
    ``,
  ]

  for (const msg of messages) {
    if (msg.role === 'system') continue
    const role = msg.role === 'user' ? '**Toi**' : '**Clara**'
    const time = new Date(msg.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    lines.push(`### ${role} — ${time}`)
    lines.push(``)
    lines.push(msg.content)
    lines.push(``)
    lines.push(`---`)
    lines.push(``)
  }

  const content = lines.join('\n')
  downloadFile(content, `clara-${slugify(conversation.title)}.md`, 'text/markdown')
}

export async function exportAsText(conversation: Conversation, messages: Message[]): Promise<void> {
  const lines: string[] = [
    `${conversation.title.toUpperCase()}`,
    `Conversation avec Clara — ${new Date(conversation.created_at).toLocaleDateString('fr-FR')}`,
    `${'─'.repeat(60)}`,
    ``,
  ]

  for (const msg of messages) {
    if (msg.role === 'system') continue
    const role = msg.role === 'user' ? 'Toi' : 'Clara'
    const time = new Date(msg.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    lines.push(`[${time}] ${role}:`)
    lines.push(msg.content)
    lines.push(``)
  }

  downloadFile(lines.join('\n'), `clara-${slugify(conversation.title)}.txt`, 'text/plain')
}

export async function exportAsPDF(conversation: Conversation, messages: Message[]): Promise<void> {
  // Dynamic import to avoid SSR issues
  const jsPDF = (await import('jspdf')).default

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const pageW = doc.internal.pageSize.getWidth()
  const pageH = doc.internal.pageSize.getHeight()
  const margin = 20
  const maxWidth = pageW - margin * 2
  let y = margin

  // Header
  doc.setFillColor(10, 10, 11)
  doc.rect(0, 0, pageW, 22, 'F')
  doc.setTextColor(249, 115, 22)
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text('Clara', margin, 14)
  doc.setTextColor(180, 180, 180)
  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.text(new Date(conversation.created_at).toLocaleDateString('fr-FR', { dateStyle: 'long' }), pageW - margin, 14, { align: 'right' })

  y = 32

  // Title
  doc.setTextColor(250, 250, 250)
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  const titleLines = doc.splitTextToSize(conversation.title, maxWidth)
  doc.text(titleLines, margin, y)
  y += titleLines.length * 7 + 8

  // Divider
  doc.setDrawColor(46, 46, 53)
  doc.line(margin, y, pageW - margin, y)
  y += 8

  for (const msg of messages) {
    if (msg.role === 'system') continue

    const isUser = msg.role === 'user'
    const role = isUser ? 'Toi' : 'Clara'
    const time = new Date(msg.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })

    // Check page break
    if (y > pageH - 30) {
      doc.addPage()
      y = margin
    }

    // Role label
    if (isUser) {
      doc.setTextColor(249, 115, 22)
    } else {
      doc.setTextColor(161, 161, 170)
    }
    doc.setFontSize(9)
    doc.setFont('helvetica', 'bold')
    doc.text(`${role}  ·  ${time}`, margin, y)
    y += 6

    // Content
    doc.setTextColor(228, 228, 231)
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')

    // Strip markdown for PDF
    const cleanContent = msg.content
      .replace(/```[\s\S]*?```/g, '[bloc de code]')
      .replace(/`([^`]+)`/g, '$1')
      .replace(/\*\*([^*]+)\*\*/g, '$1')
      .replace(/\*([^*]+)\*/g, '$1')
      .replace(/#{1,6}\s/g, '')
      .replace(/>\s/g, '')

    const contentLines = doc.splitTextToSize(cleanContent, maxWidth)
    for (const line of contentLines) {
      if (y > pageH - 20) {
        doc.addPage()
        y = margin
      }
      doc.text(line, margin, y)
      y += 5.5
    }

    y += 8

    // Separator
    doc.setDrawColor(30, 30, 34)
    doc.line(margin, y - 4, pageW - margin, y - 4)
  }

  // Footer on each page
  const pageCount = doc.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setTextColor(82, 82, 91)
    doc.setFontSize(8)
    doc.text(`Clara AI — Page ${i} / ${pageCount}`, pageW / 2, pageH - 10, { align: 'center' })
  }

  doc.save(`clara-${slugify(conversation.title)}.pdf`)
}

export async function exportAsWord(conversation: Conversation, messages: Message[]): Promise<void> {
  const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } = await import('docx')
  const { saveAs } = await import('file-saver')

  const children: any[] = [
    new Paragraph({
      text: conversation.title,
      heading: HeadingLevel.HEADING_1,
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: `Conversation avec Clara — ${new Date(conversation.created_at).toLocaleDateString('fr-FR', { dateStyle: 'long' })}`,
          italics: true,
          color: '71717a',
          size: 20,
        }),
      ],
    }),
    new Paragraph({ text: '' }),
  ]

  for (const msg of messages) {
    if (msg.role === 'system') continue

    const isUser = msg.role === 'user'
    const role = isUser ? 'Toi' : 'Clara'
    const time = new Date(msg.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })

    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: `${role} — ${time}`,
            bold: true,
            color: isUser ? 'f97316' : 'a1a1aa',
            size: 22,
          }),
        ],
      })
    )

    // Split content into paragraphs
    const paragraphs = msg.content.split('\n\n')
    for (const para of paragraphs) {
      if (!para.trim()) continue
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: para.replace(/\*\*([^*]+)\*\*/g, '$1').replace(/\*([^*]+)\*/g, '$1').replace(/#{1,6}\s/g, ''),
              size: 22,
            }),
          ],
          spacing: { after: 120 },
        })
      )
    }

    children.push(new Paragraph({ text: '' }))
  }

  const doc = new Document({
    sections: [{ properties: {}, children }],
  })

  const buffer = await Packer.toBlob(doc)
  saveAs(buffer, `clara-${slugify(conversation.title)}.docx`)
}

function slugify(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 50) || 'conversation'
}

function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
