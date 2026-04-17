import {
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, Cell,
} from 'recharts'
import { CycleTimeData } from '../../types'

interface CycleTimeChartProps {
  data: CycleTimeData
}

export default function CycleTimeChart({ data }: CycleTimeChartProps) {
  const chartData = data.stories.map((s, i) => ({
    x: i + 1,
    y: s.cycle_days,
    id: s.id,
    name: s.name,
    owner: s.owner,
    state: s.state,
    is_outlier: s.is_outlier,
    points: s.points,
  }))

  const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: { payload: typeof chartData[0] }[] }) => {
    if (!active || !payload?.length) return null
    const d = payload[0].payload
    return (
      <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 text-xs max-w-xs">
        <p className="font-semibold text-gray-800 mb-1">{d.id} — {d.name}</p>
        <p className="text-gray-600">Owner: {d.owner}</p>
        <p className="text-gray-600">State: {d.state}</p>
        <p className="text-gray-600">Points: {d.points}</p>
        <p className={`font-medium mt-1 ${d.is_outlier ? 'text-red-600' : 'text-green-700'}`}>
          Cycle time: {d.y} days {d.is_outlier ? '⚠ Outlier' : ''}
        </p>
      </div>
    )
  }

  return (
    <div>
      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        <CycleStat label="Average" value={`${data.avg_days}d`} color="text-primary-700" />
        <CycleStat label="Median" value={`${data.median_days}d`} color="text-gray-700" />
        <CycleStat label="75th pct" value={`${data.p75_days}d`} color="text-orange-600" />
        <CycleStat label="Outliers" value={String(data.stories.filter(s => s.is_outlier).length)} color="text-red-600" />
      </div>

      <ResponsiveContainer width="100%" height={260}>
        <ScatterChart margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="x" type="number" name="Story #" tick={{ fontSize: 11 }}
            label={{ value: 'Stories (sorted by cycle time)', position: 'insideBottom', offset: -5, fontSize: 11 }} />
          <YAxis dataKey="y" type="number" name="Days" unit="d" tick={{ fontSize: 11 }} />
          <Tooltip content={<CustomTooltip />} />
          <ReferenceLine y={data.avg_days} stroke="#3b72b5" strokeDasharray="4 4"
            label={{ value: `Avg ${data.avg_days}d`, position: 'right', fontSize: 10, fill: '#3b72b5' }} />
          <ReferenceLine y={data.outlier_threshold} stroke="#ef4444" strokeDasharray="4 4"
            label={{ value: 'Outlier threshold', position: 'right', fontSize: 10, fill: '#ef4444' }} />
          <Scatter data={chartData} name="Stories">
            {chartData.map((entry, i) => (
              <Cell key={i} fill={entry.is_outlier ? '#ef4444' : '#1e3a5f'} opacity={0.8} />
            ))}
          </Scatter>
        </ScatterChart>
      </ResponsiveContainer>

      {/* Outlier table */}
      {data.stories.filter(s => s.is_outlier).length > 0 && (
        <div className="mt-4">
          <p className="text-xs font-semibold text-red-600 mb-2">Outliers (above {data.outlier_threshold} days)</p>
          <div className="space-y-1">
            {data.stories.filter(s => s.is_outlier).slice(0, 5).map(s => (
              <div key={s.id} className="flex items-center justify-between bg-red-50 border border-red-100 rounded-lg px-3 py-1.5 text-xs">
                <span className="font-medium text-gray-800">{s.id} — {s.name.length > 40 ? s.name.slice(0, 40) + '…' : s.name}</span>
                <span className="text-gray-500">{s.owner}</span>
                <span className="font-bold text-red-600">{s.cycle_days}d</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function CycleStat({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="bg-gray-50 rounded-lg px-3 py-2 text-center">
      <p className={`text-xl font-bold ${color}`}>{value}</p>
      <p className="text-xs text-gray-500">{label}</p>
    </div>
  )
}
