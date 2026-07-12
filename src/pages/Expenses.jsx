import { useEffect, useState } from 'react'
import { collection, getDocs, query, where } from 'firebase/firestore'
import { db } from '../firebase'
import { useRole } from '../context/RoleContext'
import { currentMonthKey, lastNMonthKeys, monthLabel } from '../utils/dates'
import AddTransactionModal from '../components/AddTransactionModal'
import EmptyState from '../components/EmptyState'
import { SkeletonList } from '../components/Skeleton'
import { ArrowDownCircle, ArrowUpCircle, Plus, Wallet, Receipt } from 'lucide-react'

export default function Expenses() {
  const { orgId } = useRole()
  const [month, setMonth] = useState(currentMonthKey())
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [ledger, setLedger] = useState([])
  const [totals, setTotals] = useState({ income: 0, teacherPaid: 0, otherExpenses: 0 })

  async function load() {
    setLoading(true)

    const [studentsSnap, teachersSnap, feeSnap, salarySnap, txnSnap] = await Promise.all([
      getDocs(query(collection(db, 'students'), where('orgId', '==', orgId))),
      getDocs(query(collection(db, 'users'), where('orgId', '==', orgId), where('role', '==', 'teacher'))),
      getDocs(query(collection(db, 'feePayments'), where('orgId', '==', orgId), where('month', '==', month))),
      getDocs(query(collection(db, 'salaryPayments'), where('orgId', '==', orgId), where('month', '==', month))),
      getDocs(query(collection(db, 'transactions'), where('orgId', '==', orgId)))
    ])

    const studentNames = {}
    studentsSnap.docs.forEach((d) => { studentNames[d.id] = d.data().name })
    const teacherNames = {}
    teachersSnap.docs.forEach((d) => { teacherNames[d.id] = d.data().name })

    const entries = []
    let income = 0, teacherPaid = 0, otherExpenses = 0

    feeSnap.docs.forEach((d) => {
      const p = d.data()
      if (p.status !== 'paid') return
      income += Number(p.amountPaid || 0)
      entries.push({
        id: d.id, type: 'received', amount: Number(p.amountPaid || 0),
        label: `Fee from ${studentNames[p.studentId] || 'a student'}`,
        date: p.paidDate || `${month}-01`, source: 'fee'
      })
    })

    salarySnap.docs.forEach((d) => {
      const p = d.data()
      if (p.status !== 'paid') return
      teacherPaid += Number(p.amountPaid || 0)
      entries.push({
        id: d.id, type: 'deducted', amount: Number(p.amountPaid || 0),
        label: `Salary to ${teacherNames[p.teacherId] || 'a teacher'}`,
        date: p.paidDate || `${month}-01`, source: 'salary'
      })
    })

    txnSnap.docs.forEach((d) => {
      const t = d.data()
      if (!t.date || !t.date.startsWith(month)) return
      if (t.type === 'received') income += Number(t.amount || 0)
      else otherExpenses += Number(t.amount || 0)
      entries.push({
        id: d.id, type: t.type, amount: Number(t.amount || 0),
        label: t.description || t.category, category: t.category,
        date: t.date, source: 'manual'
      })
    })

    entries.sort((a, b) => (b.date || '').localeCompare(a.date || ''))
    setLedger(entries)
    setTotals({ income, teacherPaid, otherExpenses })
    setLoading(false)
  }

  useEffect(() => { if (orgId) load() }, [orgId, month])

  const net = totals.income - totals.teacherPaid - totals.otherExpenses

  if (loading) return <div className="page"><SkeletonList rows={4} /></div>

  return (
    <div className="page">
      <div className="page__header page__header--row">
        <div>
          <h1>Expenses</h1>
          <p className="page__sub">{monthLabel(month)}</p>
        </div>
        <button className="btn btn--primary" onClick={() => setShowAdd(true)}>
          <Plus size={15} style={{ verticalAlign: '-3px', marginRight: 4 }} />Add entry
        </button>
      </div>

      <div className="filter-row">
        <label>
          Month
          <select value={month} onChange={(e) => setMonth(e.target.value)}>
            {lastNMonthKeys(12).map((m) => <option key={m} value={m}>{monthLabel(m)}</option>)}
          </select>
        </label>
      </div>

      <div className={'net-banner ' + (net >= 0 ? 'net-banner--positive' : 'net-banner--negative')}>
        <div className="net-banner__label">{net >= 0 ? 'Net profit this month' : 'Net loss this month'}</div>
        <div className="net-banner__value">₹{Math.abs(net).toLocaleString('en-IN')}</div>
      </div>

      <div className="stat-grid" style={{ marginBottom: 24 }}>
        <div className="stat-card stat-card--accent">
          <div className="stat-card__icon stat-card__icon--accent"><ArrowDownCircle size={18} /></div>
          <div className="stat-card__label">Income</div>
          <div className="stat-card__value">₹{totals.income.toLocaleString('en-IN')}</div>
        </div>
        <div className="stat-card stat-card--danger">
          <div className="stat-card__icon stat-card__icon--danger"><ArrowUpCircle size={18} /></div>
          <div className="stat-card__label">Paid to teachers</div>
          <div className="stat-card__value">₹{totals.teacherPaid.toLocaleString('en-IN')}</div>
        </div>
        <div className="stat-card">
          <div className="stat-card__icon"><Receipt size={18} /></div>
          <div className="stat-card__label">Other expenses</div>
          <div className="stat-card__value">₹{totals.otherExpenses.toLocaleString('en-IN')}</div>
        </div>
      </div>

      <h3 className="section-title">All transactions</h3>
      {ledger.length === 0 ? (
        <EmptyState
          icon={Wallet}
          title="Nothing recorded this month"
          message="Fees and salary payments show up here automatically. Add rent, repairs, or other income manually with the button above."
        />
      ) : (
        <div className="card-list">
          {ledger.map((e) => (
            <div key={e.source + e.id} className="ledger-row">
              <span className={'ledger-row__icon ' + (e.type === 'received' ? 'ledger-row__icon--in' : 'ledger-row__icon--out')}>
                {e.type === 'received' ? <ArrowDownCircle size={16} /> : <ArrowUpCircle size={16} />}
              </span>
              <div className="ledger-row__body">
                <div className="ledger-row__label">{e.label}</div>
                <div className="ledger-row__meta">
                  {new Date(e.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                  {e.category ? ` · ${e.category}` : ''}
                </div>
              </div>
              <div className={'ledger-row__amount ' + (e.type === 'received' ? 'ledger-row__amount--in' : 'ledger-row__amount--out')}>
                {e.type === 'received' ? '+' : '-'}₹{e.amount.toLocaleString('en-IN')}
              </div>
            </div>
          ))}
        </div>
      )}

      {showAdd && (
        <AddTransactionModal
          orgId={orgId}
          onClose={() => setShowAdd(false)}
          onSaved={() => { setShowAdd(false); load() }}
        />
      )}
    </div>
  )
}
