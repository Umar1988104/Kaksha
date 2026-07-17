import { useSearchParams } from 'react-router-dom'
import { useRole } from '../context/RoleContext'
import Fees from './Fees'
import Expenses from './Expenses'
import { IndianRupee, Wallet } from 'lucide-react'

export default function Money() {
  const { canEdit } = useRole()
  const [searchParams, setSearchParams] = useSearchParams()
  const tab = searchParams.get('tab') === 'expenses' && canEdit ? 'expenses' : 'fees'

  return (
    <div className="hub">
      <div className="tab-row">
        <button className={'tab' + (tab === 'fees' ? ' tab--active' : '')} onClick={() => setSearchParams({ tab: 'fees' })}>
          <IndianRupee size={14} />Fees
        </button>
        {canEdit && (
          <button className={'tab' + (tab === 'expenses' ? ' tab--active' : '')} onClick={() => setSearchParams({ tab: 'expenses' })}>
            <Wallet size={14} />Expenses
          </button>
        )}
      </div>
      {tab === 'fees' ? <Fees /> : <Expenses />}
    </div>
  )
}
