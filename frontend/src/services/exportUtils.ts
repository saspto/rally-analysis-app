import { jsPDF } from 'jspdf'
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from 'docx'
import * as XLSX from 'xlsx'

function parseMarkdownToLines(markdown: string): string[] {
  return markdown
    .replace(/#{1,3} /g, '')
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\|.+\|/g, (line) => line.replace(/\|/g, '  ').trim())
    .split('\n')
    .map(l => l.trim())
    .filter(Boolean)
}

export function downloadAsPDF(content: string, filename: string): void {
  const doc = new jsPDF({ unit: 'pt', format: 'letter' })
  const lines = parseMarkdownToLines(content)
  const margin = 50
  const pageWidth = doc.internal.pageSize.getWidth() - margin * 2
  let y = 60

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(16)
  doc.text('Rally Analysis Report', margin, y)
  y += 30

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)

  for (const line of lines) {
    if (y > doc.internal.pageSize.getHeight() - 60) {
      doc.addPage()
      y = 60
    }
    if (line.startsWith('##')) {
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(12)
      doc.text(line.replace(/^#+\s*/, ''), margin, y)
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(10)
      y += 18
    } else {
      const wrapped = doc.splitTextToSize(line, pageWidth)
      doc.text(wrapped, margin, y)
      y += wrapped.length * 14
    }
  }

  doc.save(`${filename}.pdf`)
}

export async function downloadAsDOCX(content: string, filename: string): Promise<void> {
  const lines = content.split('\n')
  const children: Paragraph[] = []

  for (const line of lines) {
    if (!line.trim()) {
      children.push(new Paragraph({ text: '' }))
      continue
    }
    if (line.startsWith('### ')) {
      children.push(new Paragraph({ text: line.replace('### ', ''), heading: HeadingLevel.HEADING_3 }))
    } else if (line.startsWith('## ')) {
      children.push(new Paragraph({ text: line.replace('## ', ''), heading: HeadingLevel.HEADING_2 }))
    } else if (line.startsWith('# ')) {
      children.push(new Paragraph({ text: line.replace('# ', ''), heading: HeadingLevel.HEADING_1 }))
    } else if (line.startsWith('- ')) {
      children.push(new Paragraph({ text: line.replace('- ', ''), bullet: { level: 0 } }))
    } else {
      const cleanLine = line.replace(/\*\*(.+?)\*\*/g, '$1')
      children.push(new Paragraph({ children: [new TextRun(cleanLine)] }))
    }
  }

  const doc = new Document({ sections: [{ properties: {}, children }] })
  const blob = await Packer.toBlob(doc)
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${filename}.docx`
  a.click()
  URL.revokeObjectURL(url)
}

export function downloadAsExcel(content: string, filename: string): void {
  const lines = parseMarkdownToLines(content)
  const rows = lines.map(line => [line])
  const ws = XLSX.utils.aoa_to_sheet([['Rally Analysis Report'], [], ...rows])
  ws['!cols'] = [{ wch: 100 }]
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Summary')
  XLSX.writeFile(wb, `${filename}.xlsx`)
}
