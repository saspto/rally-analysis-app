import { useLocation, useNavigate } from 'react-router-dom'
import { ArrowLeft, Download, Users, AlertCircle } from 'lucide-react'
import { SummaryResponse, DownloadFormat } from '../types'
import { downloadAsPDF, downloadAsDOCX, downloadAsExcel } from '../services/exportUtils'
import { mockSummaryResponse } from '../services/mockData'

export default function DetailedSummaryPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const summaryData: SummaryResponse = location.state?.summaryData ?? mockSummaryResponse

  if (!summaryData.detailed_summary) {
    return (
      <div className="max-w-4xl">
        <button className="btn-outline mb-6" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
        <div className="card text-center py-12 text-gray-400">
          <AlertCircle className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p>No detailed summary available. Generate a summary first.</p>
        </div>
      </div>
    )
  }

  function handleDownload(fmt: DownloadFormat) {
    const content = summaryData.detailed_summary!
    const filename = `rally_detailed_summary_${summaryData.start_date}_${summaryData.end_date}`
    if (fmt === 'pdf') downloadAsPDF(content, filename)
    else if (fmt === 'docx') downloadAsDOCX(content, filename)
    else downloadAsExcel(content, filename)
  }

  // Split content into per-story sections for richer rendering
  const sections = summaryData.detailed_summary.split(/\n---\n/).filter(Boolean)

  return (
    <div className="max-w-4xl">
      <button className="btn-outline mb-6" onClick={() => navigate(-1)}>
        <ArrowLeft className="w-4 h-4" />
        Back to Summary
      </button>

      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Users className="w-7 h-7 text-primary-700" />
            Detailed Story Summary
          </h1>
          {summaryData.start_date && summaryData.end_date && (
            <p className="text-sm text-gray-500 mt-1">
              Period: {summaryData.start_date} — {summaryData.end_date}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-xs text-gray-400 mr-1">Download:</span>
          {(['pdf', 'docx', 'excel'] as DownloadFormat[]).map(fmt => (
            <button key={fmt} className="btn-outline" onClick={() => handleDownload(fmt)}>
              <Download className="w-3.5 h-3.5" />
              {fmt.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        {sections.map((section, i) => (
          <StoryCard key={i} content={section.trim()} />
        ))}
      </div>
    </div>
  )
}

function StoryCard({ content }: { content: string }) {
  const lines = content.split('\n')
  const titleLine = lines.find(l => l.startsWith('### '))
  const metaLine = lines.find(l => l.startsWith('**Owner:**'))
  const dateLine = lines.find(l => l.startsWith('**Created:**'))

  // Team Activity Summary table gets a distinct style
  const isTeamTable = content.includes('Team Activity Summary') || content.includes('## Team')

  if (isTeamTable) {
    return (
      <div className="card border-l-4 border-primary-400 bg-primary-50">
        <pre className="whitespace-pre-wrap font-sans text-gray-700 text-sm leading-relaxed">
          {content}
        </pre>
      </div>
    )
  }

  // Extract the narrative (everything after the date line)
  const dateLineIdx = lines.findIndex(l => l.startsWith('**Created:**'))
  const narrative = dateLineIdx >= 0
    ? lines.slice(dateLineIdx + 1).join('\n').trim()
    : content

  const stateMatch = metaLine?.match(/\*\*State:\*\*\s*([^|]+)/)
  const state = stateMatch?.[1]?.trim() ?? ''
  const stateColor = state === 'Accepted'
    ? 'bg-green-100 text-green-800'
    : state === 'In-Progress'
    ? 'bg-blue-100 text-blue-800'
    : state === 'Completed'
    ? 'bg-teal-100 text-teal-800'
    : 'bg-gray-100 text-gray-700'

  return (
    <div className="card hover:shadow-md transition-shadow">
      {titleLine && (
        <div className="flex items-start justify-between gap-3 mb-3">
          <h3 className="font-bold text-gray-800 text-base">
            {titleLine.replace('### ', '')}
          </h3>
          {state && (
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${stateColor}`}>
              {state}
            </span>
          )}
        </div>
      )}
      {(metaLine || dateLine) && (
        <div className="text-xs text-gray-500 space-y-0.5 mb-3 bg-gray-50 rounded-lg px-3 py-2">
          {metaLine && <p>{metaLine.replace(/\*\*/g, '')}</p>}
          {dateLine && <p>{dateLine.replace(/\*\*/g, '')}</p>}
        </div>
      )}
      {narrative && (
        <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
          {narrative}
        </p>
      )}
    </div>
  )
}
