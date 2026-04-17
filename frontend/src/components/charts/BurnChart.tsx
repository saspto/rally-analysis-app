import { useState } from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, ReferenceLine,
} from 'recharts'
import { SprintData } from '../../types'

interface BurnChartProps {
  sprints: SprintData[]
}

export default function BurnChart({ sprints }: BurnChartProps) {
  const [selected, setSelected] = useState(0)
  const sprint = sprints[selected]

  // Subsample daily burn to max 15 points for readability
  const burn = sprint.daily_burn
  const step = Math.max(1, Math.floor(burn.length / 15))
  const chartData = burn.filter((_, i) => i % step === 0 || i === burn.length - 1)
    .map(d => ({ ...d, label: `Day ${d.day}` }))

  return (
    <div>
      {/* Sprint tabs */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {sprints.map((s, i) => (
          <button
            key={s.name}
            onClick={() => setSelected(i)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              i === selected
                ? 'bg-primary-700 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {s.name}
          </button>
        ))}
      </div>

      {/* Sprint stats bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        <SprintStat label="Planned" value={`${sprint.planned_points} pts`} color="text-gray-700" />
        <SprintStat label="Completed" value={`${sprint.completed_points} pts`} color="text-green-700" />
        <SprintStat label="Carry-over" value={`${sprint.carry_over_points} pts`} color="text-orange-600" />
        <SprintStat
          label="Completion"
          value={`${sprint.planned_points > 0 ? Math.round(sprint.completed_points / sprint.planned_points * 100) : 0}%`}
          color={sprint.completed_points >= sprint.planned_points * 0.8 ? 'text-green-700' : 'text-red-600'}
        />
      </div>

      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={chartData} margin={{ top: 4, right: 20, left: 0, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="label" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} unit=" pts" />
          <Tooltip
            formatter={(value: number, name: string) => [
              `${value} pts`,
              name === 'remaining' ? 'Actual Remaining' : 'Ideal Burndown',
            ]}
            labelFormatter={label => label}
          />
          <Legend
            formatter={val => val === 'remaining' ? 'Actual Remaining' : 'Ideal Burndown'}
          />
          <ReferenceLine y={0} stroke="#6b7280" />
          <Line
            type="monotone"
            dataKey="ideal"
            stroke="#94a3b8"
            strokeDasharray="5 5"
            dot={false}
            strokeWidth={2}
          />
          <Line
            type="monotone"
            dataKey="remaining"
            stroke="#1e3a5f"
            dot={false}
            strokeWidth={2.5}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

function SprintStat({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="bg-gray-50 rounded-lg px-3 py-2 text-center">
      <p className={`text-lg font-bold ${color}`}>{value}</p>
      <p className="text-xs text-gray-500">{label}</p>
    </div>
  )
}
