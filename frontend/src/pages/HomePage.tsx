import { useEffect, useState } from 'react'
import { RefreshCw, Download, AlertCircle, Plus } from 'lucide-react'
import { RallyExport } from '../types'
import { getExports, triggerExport } from '../services/api'
import ExportCard from '../components/ExportCard'
import LoadingSpinner from '../components/LoadingSpinner'

export default function HomePage() {
  const [exports, setExports] = useState<RallyExport[]>([])
  const [loading, setLoading] = useState(true)
  const [triggering, setTriggering] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadExports()
  }, [])

  async function loadExports() {
    setLoading(true)
    setError(null)
    try {
      const data = await getExports()
      setExports(data)
    } catch {
      setError('Failed to load exports. Check your API configuration.')
    } finally {
      setLoading(false)
    }
  }

  async function handleTriggerExport() {
    setTriggering(true)
    setError(null)
    try {
      const newExport = await triggerExport()
      setExports(prev => [newExport, ...prev])
    } catch {
      setError('Export failed. Please try again.')
    } finally {
      setTriggering(false)
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Download className="w-7 h-7 text-primary-700" />
            Rally Data Exports
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Daily exports run automatically at 3:00 PM EST. Trigger a manual export below.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            className="btn-outline"
            onClick={loadExports}
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            className="btn-primary"
            onClick={handleTriggerExport}
            disabled={triggering || loading}
          >
            <Plus className="w-4 h-4" />
            {triggering ? 'Exporting…' : 'Trigger New Export'}
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {loading ? (
        <LoadingSpinner message="Loading exports…" />
      ) : exports.length === 0 ? (
        <div className="card text-center py-16 text-gray-400">
          <Download className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No exports yet</p>
          <p className="text-sm mt-1">Trigger your first export using the button above.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {exports.map(item => (
            <ExportCard key={item.s3_key} item={item} />
          ))}
        </div>
      )}
    </div>
  )
}
