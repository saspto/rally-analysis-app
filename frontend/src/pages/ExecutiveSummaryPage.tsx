import { useLocation, useNavigate } from 'react-router-dom'
import { ArrowLeft, Download, TrendingUp, AlertCircle } from 'lucide-react'
import { SummaryResponse, DownloadFormat } from '../types'
import { downloadAsPDF, downloadAsDOCX, downloadAsExcel } from '../services/exportUtils'
import { mockSummaryResponse } from '../services/mockData'

export default function ExecutiveSummaryPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const summaryData: SummaryResponse = location.state?.summaryData ?? mockSummaryResponse

  if (!summaryData.executive_summary) {
    return (
      <div className="max-w-3xl">
        <button className="btn-outline mb-6" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
        <div className="card text-center py-12 text-gray-400">
          <AlertCircle className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p>No executive summary available. Generate a summary first.</p>
        </div>
      </div>
    )
  }

  function handleDownload(fmt: DownloadFormat) {
    const content = summaryData.executive_summary!
    const filename = `rally_executive_summary_${summaryData.start_date}_${summaryData.end_date}`
    if (fmt === 'pdf') downloadAsPDF(content, filename)
    else if (fmt === 'docx') downloadAsDOCX(content, filename)
    else downloadAsExcel(content, filename)
  }

  return (
    <div className="max-w-3xl">
      <button className="btn-outline mb-6" onClick={() => navigate(-1)}>
        <ArrowLeft className="w-4 h-4" />
        Back to Summary
      </button>

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <TrendingUp className="w-7 h-7 text-primary-700" />
          Executive Summary
        </h1>
        {summaryData.start_date && summaryData.end_date && (
          <p className="text-sm text-gray-500 mt-1">
            Period: {summaryData.start_date} — {summaryData.end_date}
          </p>
        )}
      </div>

      {summaryData.metrics && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
          <MetricCard label="Features Completed" value={summaryData.metrics.features_completed} color="blue" />
          <MetricCard label="Stories Completed" value={summaryData.metrics.stories_completed} color="green" />
          <MetricCard label="Stories In Progress" value={summaryData.metrics.stories_in_progress} color="yellow" />
          <MetricCard label="Tasks Completed" value={summaryData.metrics.tasks_completed} color="blue" />
          <MetricCard label="Points Accepted" value={summaryData.metrics.total_points_accepted} color="green" />
          <MetricCard label="Team Velocity" value={summaryData.metrics.team_velocity} color="purple" />
        </div>
      )}

      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-800">Executive Summary</h2>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400 mr-1">Download:</span>
            {(['pdf', 'docx', 'excel'] as DownloadFormat[]).map(fmt => (
              <button key={fmt} className="btn-outline" onClick={() => handleDownload(fmt)}>
                <Download className="w-3.5 h-3.5" />
                {fmt.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
        <div className="bg-primary-50 border border-primary-100 rounded-lg p-5">
          <pre className="whitespace-pre-wrap font-sans text-gray-700 text-sm leading-relaxed">
            {summaryData.executive_summary}
          </pre>
        </div>
      </div>
    </div>
  )
}

const colorMap = {
  blue: 'text-blue-700',
  green: 'text-green-700',
  yellow: 'text-yellow-700',
  purple: 'text-purple-700',
}

function MetricCard({ label, value, color }: { label: string; value: number; color: keyof typeof colorMap }) {
  return (
    <div className="stat-card border-l-4 border-primary-300">
      <p className={`text-3xl font-bold ${colorMap[color]}`}>{value}</p>
      <p className="text-xs text-gray-500 mt-1">{label}</p>
    </div>
  )
}
