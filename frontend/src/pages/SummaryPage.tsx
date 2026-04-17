import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { format, subDays, isWeekend } from 'date-fns'
import { FileText, Sparkles, AlertCircle, Download, TrendingUp, Users } from 'lucide-react'
import { SummaryRequest, SummaryResponse, DownloadFormat } from '../types'
import { generateSummary } from '../services/api'
import { downloadAsPDF, downloadAsDOCX, downloadAsExcel } from '../services/exportUtils'
import LoadingSpinner from '../components/LoadingSpinner'

function prevWeekday(date: Date): Date {
  let d = subDays(date, 1)
  while (isWeekend(d)) d = subDays(d, 1)
  return d
}

const SUMMARY_TYPES: { value: SummaryRequest['summary_type']; label: string }[] = [
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
]

export default function SummaryPage() {
  const today = new Date()
  const [startDate, setStartDate] = useState<Date>(prevWeekday(prevWeekday(today)))
  const [endDate, setEndDate] = useState<Date>(prevWeekday(today))
  const [summaryType, setSummaryType] = useState<SummaryRequest['summary_type']>('weekly')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<SummaryResponse | null>(null)
  const navigate = useNavigate()

  async function handleGenerate() {
    setLoading(true)
    setError(null)
    try {
      const data = await generateSummary({
        start_date: format(startDate, 'yyyy-MM-dd'),
        end_date: format(endDate, 'yyyy-MM-dd'),
        summary_type: summaryType,
      })
      setResult(data)
    } catch {
      setError('Failed to generate summary. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  function handleDownload(fmt: DownloadFormat) {
    if (!result) return
    const filename = `rally_summary_${format(startDate, 'yyyyMMdd')}_${format(endDate, 'yyyyMMdd')}`
    if (fmt === 'pdf') downloadAsPDF(result.summary, filename)
    else if (fmt === 'docx') downloadAsDOCX(result.summary, filename)
    else downloadAsExcel(result.summary, filename)
  }

  function handleExecutiveSummary() {
    if (!result) return
    navigate('/executive-summary', { state: { summaryData: result } })
  }

  function handleDetailedSummary() {
    if (!result) return
    navigate('/detailed-summary', { state: { summaryData: result } })
  }

  return (
    <div className="max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Sparkles className="w-7 h-7 text-primary-700" />
          Generate Rally Summary
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Uses Claude AI to generate a narrative summary of Rally activity.
        </p>
      </div>

      <div className="card mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Start Date</label>
            <DatePicker
              selected={startDate}
              onChange={d => d && setStartDate(d)}
              selectsStart
              startDate={startDate}
              endDate={endDate}
              maxDate={endDate}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              dateFormat="yyyy-MM-dd"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">End Date</label>
            <DatePicker
              selected={endDate}
              onChange={d => d && setEndDate(d)}
              selectsEnd
              startDate={startDate}
              endDate={endDate}
              minDate={startDate}
              maxDate={today}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              dateFormat="yyyy-MM-dd"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Summary Type</label>
            <select
              value={summaryType}
              onChange={e => setSummaryType(e.target.value as SummaryRequest['summary_type'])}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              {SUMMARY_TYPES.map(t => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="mt-4 flex justify-end">
          <button className="btn-primary px-6" onClick={handleGenerate} disabled={loading}>
            <Sparkles className="w-4 h-4" />
            {loading ? 'Generating…' : 'Generate Summary'}
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {loading && <LoadingSpinner message="Claude AI is analyzing Rally data…" />}

      {result && !loading && (
        <div className="space-y-4">
          {result.metrics && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              <MetricCard label="Features Done" value={result.metrics.features_completed} />
              <MetricCard label="Stories Done" value={result.metrics.stories_completed} />
              <MetricCard label="Stories WIP" value={result.metrics.stories_in_progress} />
              <MetricCard label="Tasks Done" value={result.metrics.tasks_completed} />
              <MetricCard label="Points" value={result.metrics.total_points_accepted} />
              <MetricCard label="Velocity" value={result.metrics.team_velocity} />
            </div>
          )}

          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary-700" />
                Summary
              </h2>
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
            <div className="prose prose-sm max-w-none">
              <pre className="whitespace-pre-wrap font-sans text-gray-700 text-sm leading-relaxed">
                {result.summary}
              </pre>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <button className="btn-secondary px-6" onClick={handleDetailedSummary}>
              <Users className="w-4 h-4" />
              View Detailed Story Summary
            </button>
            <button className="btn-primary px-6" onClick={handleExecutiveSummary}>
              <TrendingUp className="w-4 h-4" />
              View Executive Summary
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function MetricCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="stat-card">
      <p className="text-2xl font-bold text-primary-700">{value}</p>
      <p className="text-xs text-gray-500 mt-1">{label}</p>
    </div>
  )
}
