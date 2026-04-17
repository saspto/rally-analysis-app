import { format } from 'date-fns'
import { Download, FileSpreadsheet, Layers, BookOpen, CheckSquare } from 'lucide-react'
import { RallyExport } from '../types'
import { getDownloadUrl } from '../services/api'
import { useState } from 'react'

interface ExportCardProps {
  item: RallyExport
}

export default function ExportCard({ item }: ExportCardProps) {
  const [downloading, setDownloading] = useState(false)

  async function handleDownload() {
    setDownloading(true)
    try {
      const url = await getDownloadUrl(item.s3_key)
      if (url && url !== '#') {
        const a = document.createElement('a')
        a.href = url
        a.download = item.filename
        a.click()
      } else {
        alert('Download URL not available in mock mode.')
      }
    } finally {
      setDownloading(false)
    }
  }

  return (
    <div className="card hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 min-w-0">
          <FileSpreadsheet className="w-8 h-8 text-primary-700 flex-shrink-0 mt-0.5" />
          <div className="min-w-0">
            <p className="font-semibold text-gray-800 truncate">{item.filename}</p>
            <p className="text-sm text-gray-500 mt-0.5">
              {format(new Date(item.created_at), 'MMM d, yyyy h:mm a')}
            </p>
            <div className="flex items-center gap-4 mt-2">
              <Stat icon={<Layers className="w-3.5 h-3.5" />} label="Features" value={item.counts.features} />
              <Stat icon={<BookOpen className="w-3.5 h-3.5" />} label="Stories" value={item.counts.user_stories} />
              <Stat icon={<CheckSquare className="w-3.5 h-3.5" />} label="Tasks" value={item.counts.tasks} />
            </div>
          </div>
        </div>
        <button className="btn-primary flex-shrink-0" onClick={handleDownload} disabled={downloading}>
          <Download className="w-4 h-4" />
          {downloading ? 'Downloading…' : 'Download'}
        </button>
      </div>
    </div>
  )
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <span className="flex items-center gap-1 text-xs text-gray-500">
      {icon}
      <span className="font-medium text-gray-700">{value}</span> {label}
    </span>
  )
}
