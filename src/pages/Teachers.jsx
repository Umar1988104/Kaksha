import { useEffect, useState } from 'react'
import { collection, doc, getDoc, getDocs, query, setDoc, where } from 'firebase/firestore'
import { db } from '../firebase'
import { useRole } from '../context/RoleContext'
import { currentMonthKey, lastNMonthKeys, monthLabel } from '../utils/dates'
import StatusStamp from '../components/StatusStamp'
import { Copy, Check } from 'lucide-react'

export default function Teachers() {
  const { orgId, profile } = useRole()
  const [teachers, setTeachers] = useState([])
  const [teacherMeta, setTeacherMeta] = useState({}) // uid -> { monthlySalary, assignedBatches, timings }
  const [payments, setPayments] = useState({}) // `${uid}_${month}` -> payment
  const [month, setMonth] = useState(currentMonthKey())
  const [orgCode, setOrgCode] = useState('')
  const [copied, setCopied] = useState(false)
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState(null)
  const [editForm, setEditForm] = useState({ monthlySalary: '', assignedBatches: '', timings: '' })

  async function load() {
    setLoading(true)

    if (profile?.orgId) {
      const orgSnap = await getDoc(doc(db, 'organizations', profile.orgId))
      if (orgSnap.exists()) setOrgCode(orgSnap.data().code || '')
    }

    const usersSnap = await getDocs(
      query(collection(db, 'users'), where('orgId', '==', orgId), where('role', '==', 'teacher'))
    )
    const teacherList = usersSnap.docs.map((d) => ({ id: d.id, ...d.data() }))
    setTeachers(teacherList)

    const metaSnap = await getDocs(query(collection(db, 'teachers'), where('orgId', '==', orgId)))
    const metaMap = {}
    metaSnap.docs.forEach((d) => { metaMap[d.id] = d.data() })
    setTeacherMeta(metaMap)

    const paySnap = await getDocs(query(collection(db, 'salaryPayments'), where('orgId', '==', orgId)))
    const payMap = {}
    paySnap.docs.forEach((d) => { const p = d.data(); payMap[`${p.teacherId}_${p.month}`] = p })
    setPayments(payMap)

    setLoading(false)
  }

  useEffect(() => { if (orgId) load() }, [orgId])

  function startEdit(t) {
    const meta = teacherMeta[t.id] || {}
    setEditForm({
      monthlySalary: meta.monthlySalary || '',
      assignedBatches: meta.assignedBatches || '',
      timings: meta.timings || ''
    })
    setEditingId(t.id)
  }

  async function saveMeta(teacherId) {
    await setDoc(doc(db, 'teachers', teacherId), {
      orgId,
      uid: teacherId,
      monthlySalary: Number(editForm.monthlySalary) || 0,
      assignedBatches: editForm.assignedBatches,
      timings: editForm.timings
    })
    setEditingId(null)
    load()
  }

  async function markSalary(teacherId, status, amount) {
    await setDoc(doc(db, 'salaryPayments', `${teacherId}_${month}`), {
      orgId,
      teacherId,
      month,
      status,
      amountPaid: status === 'paid' ? amount : 0,
      paidDate: status === 'paid' ? new Date().toISOString().slice(0, 10) : null
    })
    load()
  }

  function copyCode() {
    navigator.clipboard.writeText(orgCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  if (loading) return <div className="screen-loading">Loading teachers…</div>

  return (
    <div className="page">
      <div className="page__header">
        <h1>Teachers</h1>
        <p className="page__sub">{teachers.length} teacher{teachers.length === 1 ? '' : 's'} in your organization</p>
      </div>

      <div className="join-code-card">
        <div>
          <div className="join-code-card__label">Your organization's join code</div>
          <div className="join-code-card__code">{orgCode}</div>
        </div>
        <button className="btn btn--ghost btn--sm" onClick={copyCode}>
          {copied ? <><Check size={14} style={{ verticalAlign: '-2px', marginRight: 4 }} />Copied</> : <><Copy size={14} style={{ verticalAlign: '-2px', marginRight: 4 }} />Copy</>}
        </button>
      </div>

      {teachers.length === 0 ? (
        <div className="empty-state">No teachers have joined yet. Share your join code above — they can enter it when they sign up.</div>
      ) : (
        <>
          <div className="filter-row">
            <label>
              Salary month
              <select value={month} onChange={(e) => setMonth(e.target.value)}>
                {lastNMonthKeys(12).map((m) => <option key={m} value={m}>{monthLabel(m)}</option>)}
              </select>
            </label>
          </div>

          <div className="card-list">
            {teachers.map((t) => {
              const meta = teacherMeta[t.id] || {}
              const payment = payments[`${t.id}_${month}`]
              const isPaid = payment && payment.status === 'paid'
              const isEditing = editingId === t.id

              return (
                <div key={t.id} className="teacher-card">
                  <div className="teacher-card__top">
                    <div>
                      <div className="student-row__name">{t.name}</div>
                      <div className="student-row__meta">{t.email}</div>
                    </div>
                    <StatusStamp status={isPaid ? 'paid' : 'due'} />
                  </div>

                  {isEditing ? (
                    <div className="teacher-card__edit">
                      <label>Monthly salary (₹)
                        <input type="number" className="search-input" style={{ margin: 0 }} value={editForm.monthlySalary} onChange={(e) => setEditForm((f) => ({ ...f, monthlySalary: e.target.value }))} />
                      </label>
                      <label>Assigned batches
                        <input className="search-input" style={{ margin: 0 }} value={editForm.assignedBatches} onChange={(e) => setEditForm((f) => ({ ...f, assignedBatches: e.target.value }))} placeholder="e.g. Class 9, Class 10" />
                      </label>
                      <label>Timings
                        <input className="search-input" style={{ margin: 0 }} value={editForm.timings} onChange={(e) => setEditForm((f) => ({ ...f, timings: e.target.value }))} placeholder="e.g. Mon-Fri 4-6 PM" />
                      </label>
                      <div className="modal-form__actions">
                        <button className="btn btn--ghost btn--sm" onClick={() => setEditingId(null)}>Cancel</button>
                        <button className="btn btn--primary btn--sm" onClick={() => saveMeta(t.id)}>Save</button>
                      </div>
                    </div>
                  ) : (
                    <div className="teacher-card__meta">
                      <div><span>Salary</span> ₹{meta.monthlySalary || 0}/mo</div>
                      <div><span>Batches</span> {meta.assignedBatches || '—'}</div>
                      <div><span>Timings</span> {meta.timings || '—'}</div>
                    </div>
                  )}

                  <div className="teacher-card__actions">
                    {!isEditing && <button className="btn btn--ghost btn--sm" onClick={() => startEdit(t)}>Edit details</button>}
                    {isPaid ? (
                      <button className="btn btn--ghost btn--sm" onClick={() => markSalary(t.id, 'due', 0)}>Undo paid</button>
                    ) : (
                      <button className="btn btn--primary btn--sm" onClick={() => markSalary(t.id, 'paid', meta.monthlySalary || 0)}>Mark salary paid</button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
