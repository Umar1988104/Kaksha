import { Link } from 'react-router-dom'
import { AlertTriangle } from 'lucide-react'

export default function AttendanceAlerts({ alerts }) {
  if (!alerts || alerts.length === 0) return null

  return (
    <div className="attendance-alert">
      <div className="attendance-alert__header">
        <AlertTriangle size={16} />
        <span>Needs attention — frequent absences in the last 14 days</span>
      </div>
      <div className="attendance-alert__list">
        {alerts.map((a) => (
          <Link key={a.studentId} to={`/students/${a.studentId}`} className="attendance-alert__item">
            <span>{a.name}</span>
            <span className="attendance-alert__count">{a.count} absences</span>
          </Link>
        ))}
      </div>
    </div>
  )
}
