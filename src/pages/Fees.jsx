import { useEffect, useState } from 'react'
import { collection, doc, getDoc, getDocs, orderBy, query, setDoc, where } from 'firebase/firestore'
import { db } from '../firebase'
import { useRole } from '../context/RoleContext'
import StatusStamp from '../components/StatusStamp'
import { buildFeeReminderLink } from '../utils/whatsapp'
import { currentMonthKey, lastNMonthKeys, monthLabel } from '../utils/dates'
import { SkeletonList } from '../components/Skeleton'

export default function Fees() {
  const { orgId, canEdit, profile } = useRole()
  const [students, setStudents] = useState([])
  const [payments, setPayments] = useState({})
  const [month, setMonth] = useState(currentMonthKey())
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [centerName, setCenterName] = useState('')

  async function load() {
    setLoading(true)
    const sSnap = await getDocs(query(collection(db, 'students'), where('orgId', '==', orgId), orderBy('name')))
    const studentList = sSnap.docs.map((d) => ({ id: d.id, ...d.data() })).filter((s) => s.active !== false)
    setStudents(studentList)

    const pSnap = await getDocs(query(collection(db, 'feePayments'), where('orgId', '==', orgId)))
    const byKey = {}
    pSnap.docs.forEach((d) => { const p = d.data(); byKey[`${p.studentId}_${p.month}`] = p })
    setPayments(byKey)

    if (profile?.mode === 'org' && profile?.orgId) {
      const orgSnap = await getDoc(doc(db, 'organizations', profile.orgId))
      if (orgSnap.exists()) setCenterName(orgSnap.data().name || '')
    } else {
      setCenterName(profile?.centerName || '')
    }

    setLoading(false)
  }

  useEffect(() => { if (orgId) load() }, [orgId])

  async function markPaid(student) {
    const write = setDoc(doc(db, 'feePayments', `${student.id}_${month}`), {
      orgId,
      studentId: student.id,
      month,
      status: 'paid',
      amountPaid: student.monthlyFee,
      paidDate: new Date().toISOString().slice(0, 10)
    })
    if (navigator.onLine) await write
    // Reads locally cached data even before the write reaches the server,
    // so the UI updates instantly whether online or offline.
    load()
  }

  async function markDue(student) {
    const write = setDoc(doc(db, 'feePayments', `${student.id}_${month}`), {
      orgId,
      studentId: student.id,
      month,
      status: 'due',
      amountPaid: 0
    })
    if (navigator.onLine) await write
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

  if (loading) return <div className="page"><SkeletonList rows={4} /></div>

  return (
    <div className="page">
      <div className="page__header">
        <h1>Fees</h1>
        <p className="page__sub">{monthLabel(month)}{!canEdit ? ' · view only' : ''}</p>
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
                  canEdit && <button className="btn btn--ghost btn--sm" onClick={() => markDue(student)}>Undo</button>
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
                    {canEdit && <button className="btn btn--primary btn--sm" onClick={() => markPaid(student)}>Mark paid</button>}
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
