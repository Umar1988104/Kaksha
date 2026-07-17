import { useSearchParams } from 'react-router-dom'
import { useRole } from '../context/RoleContext'
import Suggestions from './Suggestions'
import ParentInbox from './ParentInbox'
import { MessageCircle, MessageSquareText } from 'lucide-react'

export default function Inbox() {
  const { isHead } = useRole()
  const [searchParams, setSearchParams] = useSearchParams()
  const tab = searchParams.get('tab') === 'parents' && isHead ? 'parents' : 'suggestions'

  // Org teachers only ever have Suggestions — no tab bar needed for them.
  if (!isHead) return <Suggestions />

  return (
    <div className="hub">
      <div className="tab-row">
        <button className={'tab' + (tab === 'suggestions' ? ' tab--active' : '')} onClick={() => setSearchParams({ tab: 'suggestions' })}>
          <MessageSquareText size={14} />Suggestions
        </button>
        <button className={'tab' + (tab === 'parents' ? ' tab--active' : '')} onClick={() => setSearchParams({ tab: 'parents' })}>
          <MessageCircle size={14} />Parent Messages
        </button>
      </div>
      {tab === 'suggestions' ? <Suggestions /> : <ParentInbox />}
    </div>
  )
}
