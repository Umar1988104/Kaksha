import { ResponsiveContainer, LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts'

export default function TrendCharts({ feeTrend, attendanceTrend }) {
  return (
    <div className="trend-charts">
      <div className="trend-card">
        <div className="trend-card__title">Fee collection — last 6 months</div>
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={feeTrend}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E1E5EC" vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#8891A0' }} axisLine={false} tickLine={false} />
            <YAxis hide />
            <Tooltip formatter={(v) => [`₹${v.toLocaleString('en-IN')}`, 'Collected']} contentStyle={{ fontSize: 12, borderRadius: 8 }} />
            <Bar dataKey="value" fill="#3D8361" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="trend-card">
        <div className="trend-card__title">Attendance % — last 6 months</div>
        <ResponsiveContainer width="100%" height={160}>
          <LineChart data={attendanceTrend}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E1E5EC" vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#8891A0' }} axisLine={false} tickLine={false} />
            <YAxis hide domain={[0, 100]} />
            <Tooltip formatter={(v) => [`${v}%`, 'Attendance']} contentStyle={{ fontSize: 12, borderRadius: 8 }} />
            <Line type="monotone" dataKey="value" stroke="#1E2A4A" strokeWidth={2.5} dot={{ r: 3 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
