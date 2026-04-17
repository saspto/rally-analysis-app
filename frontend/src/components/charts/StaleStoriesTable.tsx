import { AlertTriangle, Clock } from 'lucide-react'
import { StaleStory } from '../../types'
import { formatDistanceToNow } from 'date-fns'

interface StaleStoriesTableProps {
  stories: StaleStory[]
}

const STATE_COLORS: Record<string, string> = {
  'Defined':     'bg-gray-100 text-gray-700',
  'In-Progress': 'bg-blue-100 text-blue-800',
  'Completed':   'bg-teal-100 text-teal-700',
  'Accepted':    'bg-green-100 text-green-800',
}

export default function StaleStoriesTable({ stories }: StaleStoriesTableProps) {
  if (stories.length === 0) {
    return (
      <div className="text-center py-10 text-gray-400">
        <Clock className="w-10 h-10 mx-auto mb-2 opacity-30" />
        <p className="font-medium">No stale stories</p>
        <p className="text-sm">All active stories have been updated within the last 7 days.</p>
      </div>
    )
  }

  const critical = stories.filter(s => s.severity === 'critical')

  return (
    <div className="space-y-3">
      {critical.length > 0 && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-lg px-3 py-2 text-sm">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          <span><strong>{critical.length}</strong> stories have had no activity for 14+ days — may be blocked.</span>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-left text-gray-500 border-b border-gray-200">
              <th className="pb-2 pr-4 font-semibold">Story</th>
              <th className="pb-2 pr-4 font-semibold">Owner</th>
              <th className="pb-2 pr-4 font-semibold">Feature</th>
              <th className="pb-2 pr-4 font-semibold">State</th>
              <th className="pb-2 pr-4 font-semibold">Last Updated</th>
              <th className="pb-2 font-semibold text-right">Days Stale</th>
            </tr>
          </thead>
          <tbody>
            {stories.map(s => (
              <tr key={s.id} className={`border-b border-gray-100 hover:bg-gray-50 ${s.severity === 'critical' ? 'bg-red-50/40' : 'bg-yellow-50/40'}`}>
                <td className="py-2 pr-4">
                  <p className="font-semibold text-gray-800">{s.id}</p>
                  <p className="text-gray-600 max-w-[180px] truncate">{s.name}</p>
                </td>
                <td className="py-2 pr-4">
                  <p className="font-medium text-gray-700">{s.owner}</p>
                  <p className="text-gray-400">{s.owner_email}</p>
                </td>
                <td className="py-2 pr-4 text-gray-600">{s.feature}</td>
                <td className="py-2 pr-4">
                  <span className={`inline-block px-2 py-0.5 rounded-full font-semibold ${STATE_COLORS[s.state] ?? 'bg-gray-100 text-gray-700'}`}>
                    {s.state}
                  </span>
                </td>
                <td className="py-2 pr-4 text-gray-600">
                  <p>{s.last_updated}</p>
                  <p className="text-gray-400">{formatDistanceToNow(new Date(s.last_updated), { addSuffix: true })}</p>
                </td>
                <td className="py-2 text-right">
                  <span className={`font-bold text-sm ${s.severity === 'critical' ? 'text-red-600' : 'text-orange-500'}`}>
                    {s.days_stale}d
                  </span>
                  {s.severity === 'critical' && (
                    <AlertTriangle className="w-3.5 h-3.5 text-red-500 inline ml-1" />
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
