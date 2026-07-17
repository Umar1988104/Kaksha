import { useSearchParams } from 'react-router-dom'
import Notices from './Notices'
import CalendarPage from './CalendarPage'
import { CalendarDays, Megaphone } from 'lucide-react'

export default function Updates() {
  const [searchParams, setSearchParams] = useSearchParams()
  const tab = searchParams.get('tab') === 'calendar' ? 'calendar' : 'notices'

  return (
    <div className="hub">
      <div className="tab-row">
        <button className={'tab' + (tab === 'notices' ? ' tab--active' : '')} onClick={() => setSearchParams({ tab: 'notices' })}>
          <Megaphone size={14} />Notices
        </button>
        <button className={'tab' + (tab === 'calendar' ? ' tab--active' : '')} onClick={() => setSearchParams({ tab: 'calendar' })}>
          <CalendarDays size={14} />Calendar
        </button>
      </div>
      {tab === 'notices' ? <Notices /> : <CalendarPage />}
    </div>
  )
}
