import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer, Cell,
} from 'recharts'
import { ResourceAllocation } from '../../types'

interface ResourceChartProps {
  data: ResourceAllocation[]
}

const COLORS = ['#1e3a5f', '#3b72b5', '#5987c0', '#779ccb', '#9eb9db', '#c5d5ea']

export default function ResourceChart({ data }: ResourceChartProps) {
  const [view, setView] = React.useState<'points' | 'hours'>('points')

  const chartData = data.map(r => ({
    name: r.owner.split(' ')[0],  // first name only for axis
    fullName: r.owner,
    Points: r.total_points,
    'Hours Est.': r.hours_estimated,
    'Hours Actual': r.hours_actual,
    'Hours Remaining': r.hours_remaining,
    'Completion %': r.completion_rate,
  }))

  const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: { name: string; value: number; color: string }[]; label?: string }) => {
    if (!active || !payload?.length) return null
    const resource = data.find(r => r.owner.startsWith(label ?? ''))
    return (
      <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 text-xs min-w-[180px]">
        <p className="font-semibold text-gray-800 mb-2">{resource?.owner}</p>
        <p className="text-gray-500 mb-1">{resource?.email}</p>
        {payload.map(p => (
          <div key={p.name} className="flex justify-between gap-4">
            <span style={{ color: p.color }}>{p.name}</span>
            <span className="font-medium">{p.value}{p.name === 'Completion %' ? '%' : p.name.includes('Pt') ? ' pts' : 'h'}</span>
          </div>
        ))}
        <div className="mt-1 pt-1 border-t border-gray-100 flex justify-between">
          <span className="text-gray-500">Stories</span>
          <span className="font-medium">{resource?.stories_completed}/{resource?.stories_count}</span>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex gap-2 mb-4">
        {(['points', 'hours'] as const).map(v => (
          <button
            key={v}
            onClick={() => setView(v)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors capitalize ${
              view === v ? 'bg-primary-700 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {v === 'points' ? 'Story Points' : 'Hours'}
          </button>
        ))}
      </div>

      <ResponsiveContainer width="100%" height={280}>
        {view === 'points' ? (
          <BarChart data={chartData} margin={{ top: 4, right: 20, left: 0, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 11 }} unit=" pts" />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Bar dataKey="Points" radius={[4, 4, 0, 0]}>
              {chartData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
            </Bar>
          </BarChart>
        ) : (
          <BarChart data={chartData} margin={{ top: 4, right: 20, left: 0, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 11 }} unit="h" />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Bar dataKey="Hours Est." fill="#c7d7f0" radius={[4, 4, 0, 0]} />
            <Bar dataKey="Hours Actual" fill="#1e3a5f" radius={[4, 4, 0, 0]} />
            <Bar dataKey="Hours Remaining" fill="#fb923c" radius={[4, 4, 0, 0]} />
          </BarChart>
        )}
      </ResponsiveContainer>

      {/* Resource table */}
      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-left text-gray-500 border-b border-gray-200">
              <th className="pb-2 pr-4 font-semibold">Owner</th>
              <th className="pb-2 pr-4 font-semibold text-right">Stories</th>
              <th className="pb-2 pr-4 font-semibold text-right">Points</th>
              <th className="pb-2 pr-4 font-semibold text-right">Est h</th>
              <th className="pb-2 pr-4 font-semibold text-right">Actual h</th>
              <th className="pb-2 font-semibold text-right">Done %</th>
            </tr>
          </thead>
          <tbody>
            {data.map(r => (
              <tr key={r.owner} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="py-1.5 pr-4">
                  <p className="font-medium text-gray-800">{r.owner}</p>
                  <p className="text-gray-400">{r.email}</p>
                </td>
                <td className="py-1.5 pr-4 text-right text-gray-700">{r.stories_completed}/{r.stories_count}</td>
                <td className="py-1.5 pr-4 text-right font-medium text-primary-700">{r.total_points}</td>
                <td className="py-1.5 pr-4 text-right text-gray-600">{r.hours_estimated}</td>
                <td className="py-1.5 pr-4 text-right text-gray-600">{r.hours_actual}</td>
                <td className="py-1.5 text-right">
                  <span className={`font-semibold ${r.completion_rate === 100 ? 'text-green-700' : r.completion_rate >= 50 ? 'text-orange-600' : 'text-red-600'}`}>
                    {r.completion_rate}%
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// React import needed for useState inside this component
import React from 'react'
