import { useSearchParams } from 'react-router-dom'
import Attendance from './Attendance'
import Exams from './Exams'
import Homework from './Homework'
import { BookOpen, CalendarCheck, ClipboardList } from 'lucide-react'

const TABS = [
  { key: 'attendance', label: 'Attendance', icon: CalendarCheck },
  { key: 'exams', label: 'Exams', icon: ClipboardList },
  { key: 'homework', label: 'Homework', icon: BookOpen }
]

export default function Academics() {
  const [searchParams, setSearchParams] = useSearchParams()
  const tab = searchParams.get('tab') || 'attendance'

  return (
    <div className="hub">
      <div className="tab-row">
        {TABS.map((t) => {
          const Icon = t.icon
          return (
            <button key={t.key} className={'tab' + (tab === t.key ? ' tab--active' : '')} onClick={() => setSearchParams({ tab: t.key })}>
              <Icon size={14} />{t.label}
            </button>
          )
        })}
      </div>
      {tab === 'attendance' && <Attendance />}
      {tab === 'exams' && <Exams />}
      {tab === 'homework' && <Homework />}
    </div>
  )
}
