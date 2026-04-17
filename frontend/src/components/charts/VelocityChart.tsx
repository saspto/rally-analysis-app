import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, ReferenceLine,
} from 'recharts'
import { SprintData } from '../../types'

interface VelocityChartProps {
  sprints: SprintData[]
}

export default function VelocityChart({ sprints }: VelocityChartProps) {
  const avgVelocity = sprints.length
    ? Math.round(sprints.reduce((s, sp) => s + sp.velocity, 0) / sprints.length)
    : 0

  const data = sprints.map(sp => ({
    name: sp.name,
    Planned: sp.planned_points,
    Completed: sp.completed_points,
    'Carry-over': sp.carry_over_points,
    velocity: sp.velocity,
  }))

  return (
    <div>
      <div className="flex items-center gap-6 mb-4">
        <div className="text-center">
          <p className="text-2xl font-bold text-primary-700">{avgVelocity}</p>
          <p className="text-xs text-gray-500">Avg Velocity (pts)</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-green-700">
            {sprints.reduce((s, sp) => s + sp.completed_points, 0)}
          </p>
          <p className="text-xs text-gray-500">Total Accepted</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-orange-600">
            {sprints[sprints.length - 1]?.carry_over_points ?? 0}
          </p>
          <p className="text-xs text-gray-500">Current Carry-over</p>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={280}>
        <ComposedChart data={data} margin={{ top: 4, right: 20, left: 0, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="name" tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 11 }} unit=" pts" />
          <Tooltip formatter={(value: number, name: string) => [`${value} pts`, name]} />
          <Legend />
          <ReferenceLine y={avgVelocity} stroke="#f97316" strokeDasharray="4 4"
            label={{ value: `Avg ${avgVelocity}`, position: 'right', fontSize: 11, fill: '#f97316' }} />
          <Bar dataKey="Planned" fill="#c7d7f0" radius={[3, 3, 0, 0]} />
          <Bar dataKey="Completed" fill="#1e3a5f" radius={[3, 3, 0, 0]} />
          <Bar dataKey="Carry-over" fill="#fb923c" radius={[3, 3, 0, 0]} />
          <Line type="monotone" dataKey="velocity" stroke="#16a34a" strokeWidth={2.5} dot={{ r: 4 }} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}
