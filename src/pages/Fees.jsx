import { useEffect, useState } from 'react'
import { collection, doc, getDoc, getDocs, orderBy, query, setDoc } from 'firebase/firestore'
import { db } from '../firebase'
import StatusStamp from '../components/StatusStamp'
import { buildFeeReminderLink } from '../utils/whatsapp'
import { currentMonthKey, lastNMonthKeys, monthLabel } from '../utils/dates'

export default function Fees() {
  const [students, setStudents] = useState([])
  const [payments, setPayments] = useState({})
  const [month, setMonth] = useState(currentMonthKey())
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all') // all | due | paid
  const [centerName, setCenterName] = useState('')

  async function load() {
    setLoading(true)
    const sSnap = await getDocs(query(collection(db, 'students'), orderBy('name')))
    const studentList = sSnap.docs.map((d) => ({ id: d.id, ...d.data() })).filter((s) => s.active !== false)
    setStudents(studentList)

    const pSnap = await getDocs(collection(db, 'feePayments'))
    const byKey = {}
    pSnap.docs.forEach((d) => { const p = d.data(); byKey[`${p.studentId}_${p.month}`] = p })
    setPayments(byKey)

    const settingsSnap = await getDoc(doc(db, 'settings', 'center'))
    if (settingsSnap.exists()) setCenterName(settingsSnap.data().name || '')

    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function markPaid(student) {
    await setDoc(doc(db, 'feePayments', `${student.id}_${month}`), {
      studentId: student.id,
      month,
      status: 'paid',
      amountPaid: student.monthlyFee,
      paidDate: new Date().toISOString().slice(0, 10)
    })
    load()
  }

  async function markDue(student) {
    await setDoc(doc(db, 'feePayments', `${student.id}_${month}`), {
      studentId: student.id,
      month,
      status: 'due',
      amountPaid: 0
    })
    load()
  }

  const rows = students
    .map((s) => ({ student: s, payment: payments[`${s.id}_${month}`] }))
    .filter((r) => {
      const isPaid = r.payment && r.payment.status === 'paid'
      if (filter === 'paid') return isPaid
      if (filter === 'due') return !isPaid
      return true
    })

  if (loading) return <div className="screen-loading">Loading fees…</div>

  return (
    <div className="page">
      <div className="page__header">
        <h1>Fees</h1>
        <p className="page__sub">{monthLabel(month)}</p>
      </div>

      <div className="filter-row">
        <label>
          Month
          <select value={month} onChange={(e) => setMonth(e.target.value)}>
            {lastNMonthKeys(12).map((m) => <option key={m} value={m}>{monthLabel(m)}</option>)}
          </select>
        </label>
        <label>
          Show
          <select value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="all">All students</option>
            <option value="due">Due only</option>
            <option value="paid">Paid only</option>
          </select>
        </label>
      </div>

      <div className="card-list">
        {rows.map(({ student, payment }) => {
          const isPaid = payment && payment.status === 'paid'
          return (
            <div key={student.id} className="fee-row">
              <div>
                <div className="student-row__name">{student.name}</div>
                <div className="student-row__meta">{student.batch} · ₹{student.monthlyFee}</div>
              </div>
              <StatusStamp status={isPaid ? 'paid' : 'due'} />
              <div className="fee-row__actions">
                {isPaid ? (
                  <button className="btn btn--ghost btn--sm" onClick={() => markDue(student)}>Undo</button>
                ) : (
                  <>
                    <a
                      className="btn btn--sm btn--whatsapp"
                      target="_blank" rel="noreferrer"
                      href={buildFeeReminderLink({
                        parentPhone: student.parentPhone,
                        studentName: student.name,
                        monthLabel: monthLabel(month),
                        dueAmount: student.monthlyFee,
                        centerName
                      })}
                    >
                      Remind on WhatsApp
                    </a>
                    <button className="btn btn--primary btn--sm" onClick={() => markPaid(student)}>Mark paid</button>
                  </>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
