import { useState } from 'react'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns'
import {
  TrendingUp, BarChart2, Clock, Users, AlertTriangle,
  RefreshCw, AlertCircle, ChevronDown, ChevronUp,
} from 'lucide-react'
import { AnalyticsResponse } from '../types'
import { getAnalytics } from '../services/api'
import LoadingSpinner from '../components/LoadingSpinner'
import BurnChart from '../components/charts/BurnChart'
import VelocityChart from '../components/charts/VelocityChart'
import CycleTimeChart from '../components/charts/CycleTimeChart'
import ResourceChart from '../components/charts/ResourceChart'
import StaleStoriesTable from '../components/charts/StaleStoriesTable'

interface SectionProps {
  title: string
  icon: React.ReactNode
  badge?: { label: string; color: string }
  children: React.ReactNode
  defaultOpen?: boolean
}

function Section({ title, icon, badge, children, defaultOpen = true }: SectionProps) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="card">
      <button
        className="w-full flex items-center justify-between mb-0 group"
        onClick={() => setOpen(o => !o)}
      >
        <h2 className="text-base font-semibold text-gray-800 flex items-center gap-2">
          {icon}
          {title}
          {badge && (
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${badge.color}`}>
              {badge.label}
            </span>
          )}
        </h2>
        {open
          ? <ChevronUp className="w-4 h-4 text-gray-400 group-hover:text-gray-600" />
          : <ChevronDown className="w-4 h-4 text-gray-400 group-hover:text-gray-600" />
        }
      </button>
      {open && <div className="mt-4">{children}</div>}
    </div>
  )
}

export default function AnalyticsPage() {
  const defaultEnd = endOfMonth(subMonths(new Date(), 0))
  const defaultStart = startOfMonth(subMonths(new Date(), 2))

  const [startDate, setStartDate] = useState<Date>(defaultStart)
  const [endDate, setEndDate] = useState<Date>(defaultEnd)
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<AnalyticsResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleLoad() {
    setLoading(true)
    setError(null)
    try {
      const result = await getAnalytics(
        format(startDate, 'yyyy-MM-dd'),
        format(endDate, 'yyyy-MM-dd'),
      )
      setData(result)
    } catch {
      setError('Failed to load analytics. Check your API configuration.')
    } finally {
      setLoading(false)
    }
  }

  const stats = data?.summary_stats

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <BarChart2 className="w-7 h-7 text-primary-700" />
          Sprint Analytics
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Burn charts, velocity, cycle time, resource allocation, and stale story detection.
          Sprints run monthly (1st – last day of each month).
        </p>
      </div>

      {/* Date range + Load */}
      <div className="card mb-6">
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">From</label>
            <DatePicker
              selected={startDate}
              onChange={d => d && setStartDate(d)}
              selectsStart
              startDate={startDate}
              endDate={endDate}
              maxDate={endDate}
              className="w-44 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              dateFormat="MMM yyyy"
              showMonthYearPicker
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">To</label>
            <DatePicker
              selected={endDate}
              onChange={d => d && setEndDate(d)}
              selectsEnd
              startDate={startDate}
              endDate={endDate}
              minDate={startDate}
              className="w-44 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              dateFormat="MMM yyyy"
              showMonthYearPicker
            />
          </div>
          <button
            className="btn-primary h-[38px] px-5"
            onClick={handleLoad}
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Loading…' : data ? 'Refresh' : 'Load Analytics'}
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {loading && <LoadingSpinner message="Computing analytics…" />}

      {!data && !loading && (
        <div className="card text-center py-16 text-gray-400">
          <BarChart2 className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">Select a date range and click Load Analytics</p>
        </div>
      )}

      {data && !loading && (
        <div className="space-y-4">
          {/* Summary KPIs */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <KPI label="Total Stories" value={stats!.total_stories} />
            <KPI label="Total Points" value={stats!.total_points} />
            <KPI label="Avg Velocity" value={`${stats!.avg_velocity} pts`} />
            <KPI label="Avg Cycle Time" value={`${stats!.avg_cycle_days}d`} />
            <KPI label="Outliers" value={stats!.outlier_count}
              color={stats!.outlier_count > 0 ? 'text-orange-600' : 'text-green-700'} />
            <KPI label="Stale Stories" value={stats!.stale_count}
              color={stats!.stale_count > 0 ? 'text-red-600' : 'text-green-700'} />
          </div>

          {/* Sprint Burndown */}
          <Section
            title="Sprint Burndown"
            icon={<TrendingUp className="w-5 h-5 text-primary-700" />}
            badge={{ label: `${data.sprints.length} sprints`, color: 'bg-primary-100 text-primary-700' }}
          >
            <BurnChart sprints={data.sprints} />
          </Section>

          {/* Sprint Velocity */}
          <Section
            title="Sprint Velocity"
            icon={<BarChart2 className="w-5 h-5 text-green-700" />}
          >
            <VelocityChart sprints={data.sprints} />
          </Section>

          {/* Cycle Time */}
          <Section
            title="Cycle Time Analysis"
            icon={<Clock className="w-5 h-5 text-orange-600" />}
            badge={data.cycle_time.stories.filter(s => s.is_outlier).length > 0
              ? { label: `${data.cycle_time.stories.filter(s => s.is_outlier).length} outliers`, color: 'bg-red-100 text-red-700' }
              : undefined
            }
          >
            <CycleTimeChart data={data.cycle_time} />
          </Section>

          {/* Resource Allocation */}
          <Section
            title="Resource Allocation"
            icon={<Users className="w-5 h-5 text-primary-700" />}
            badge={{ label: `${data.resource_allocation.length} members`, color: 'bg-gray-100 text-gray-700' }}
          >
            <ResourceChart data={data.resource_allocation} />
          </Section>

          {/* Stale / Blocked Stories */}
          <Section
            title="Stale & Potentially Blocked Stories"
            icon={<AlertTriangle className="w-5 h-5 text-red-600" />}
            badge={data.stale_stories.length > 0
              ? { label: `${data.stale_stories.length} stories`, color: 'bg-red-100 text-red-700' }
              : { label: 'All clear', color: 'bg-green-100 text-green-700' }
            }
            defaultOpen={data.stale_stories.length > 0}
          >
            <StaleStoriesTable stories={data.stale_stories} />
          </Section>
        </div>
      )}
    </div>
  )
}

function KPI({ label, value, color = 'text-primary-700' }: { label: string; value: number | string; color?: string }) {
  return (
    <div className="stat-card">
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
      <p className="text-xs text-gray-500 mt-0.5">{label}</p>
    </div>
  )
}
