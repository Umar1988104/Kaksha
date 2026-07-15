import { useEffect, useState } from 'react'
import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore'
import { db } from '../firebase'
import { useRole } from '../context/RoleContext'
import StatusStamp from '../components/StatusStamp'
import { SkeletonList } from '../components/Skeleton'
import EmptyState from '../components/EmptyState'
import { lastNMonthKeys, monthLabel } from '../utils/dates'
import { BookOpen } from 'lucide-react'

export default function ParentDashboard() {
  const { linkedStudentIds, orgId } = useRole()
  const [children, setChildren] = useState([])
  const [selectedId, setSelectedId] = useState(linkedStudentIds[0])
  const [loading, setLoading] = useState(true)
  const [attendanceStats, setAttendanceStats] = useState({ present: 0, total: 0 })
  const [payments, setPayments] = useState({})
  const [examResults, setExamResults] = useState([])
  const [homework, setHomework] = useState([])

  useEffect(() => {
    async function loadChildren() {
      const list = await Promise.all(linkedStudentIds.map(async (id) => {
        const snap = await getDoc(doc(db, 'students', id))
        return snap.exists() ? { id: snap.id, ...snap.data() } : null
      }))
      const valid = list.filter(Boolean)
      setChildren(valid)
      if (valid.length && !valid.find((c) => c.id === selectedId)) setSelectedId(valid[0].id)
    }
    if (linkedStudentIds.length) loadChildren()
  }, [linkedStudentIds])

  useEffect(() => {
    if (!selectedId || !orgId) return
    async function load() {
      setLoading(true)
      const [attSnap, paySnap, marksSnap, hwSnap] = await Promise.all([
        getDocs(query(collection(db, 'attendance'), where('orgId', '==', orgId), where('studentId', '==', selectedId))),
        getDocs(query(collection(db, 'feePayments'), where('orgId', '==', orgId), where('studentId', '==', selectedId))),
        getDocs(query(collection(db, 'examMarks'), where('orgId', '==', orgId), where('studentId', '==', selectedId))),
        getDocs(query(collection(db, 'homework'), where('orgId', '==', orgId)))
      ])

      const total = attSnap.size
      const present = attSnap.docs.filter((d) => d.data().status === 'present').length
      setAttendanceStats({ present, total })

      const byMonth = {}
      paySnap.docs.forEach((d) => { const p = d.data(); byMonth[p.month] = p })
      setPayments(byMonth)

      const results = marksSnap.docs.map((d) => ({ id: d.id, ...d.data() }))
      results.sort((a, b) => (b.date || '').localeCompare(a.date || ''))
      setExamResults(results)

      const child = children.find((c) => c.id === selectedId)
      const hw = hwSnap.docs.map((d) => ({ id: d.id, ...d.data() })).filter((h) => !child || h.batch === child.batch)
      hw.sort((a, b) => (b.dueDate || b.createdAt || '').localeCompare(a.dueDate || a.createdAt || ''))
      setHomework(hw.slice(0, 5))

      setLoading(false)
    }
    load()
  }, [selectedId, orgId, children])

  const student = children.find((c) => c.id === selectedId)
  const months = lastNMonthKeys(6)
  const attendancePct = attendanceStats.total ? Math.round((attendanceStats.present / attendanceStats.total) * 100) : null
  const examAvgPct = examResults.length
    ? Math.round((examResults.reduce((sum, r) => sum + (r.marksObtained / r.totalMarks), 0) / examResults.length) * 100)
    : null

  if (children.length === 0) return <div className="page"><SkeletonList rows={2} /></div>

  return (
    <div className="page">
      {children.length > 1 && (
        <div className="tab-row">
          {children.map((c) => (
            <button key={c.id} className={'tab' + (c.id === selectedId ? ' tab--active' : '')} onClick={() => setSelectedId(c.id)}>
              {c.name}
            </button>
          ))}
        </div>
      )}

      {student && (
        <div className="student-detail-header" style={{ marginBottom: 20 }}>
          {student.photo ? <img src={student.photo} alt="" className="student-detail-header__avatar" /> : <div className="student-detail-header__avatar student-detail-header__avatar--fallback">{student.name.charAt(0).toUpperCase()}</div>}
          <div>
            <h1>{student.name}</h1>
            <p className="page__sub">{student.batch} · {student.subject}</p>
          </div>
        </div>
      )}

      {loading ? <SkeletonList rows={3} /> : (
        <>
          <div className="detail-grid">
            <section className="detail-card">
              <h3>Attendance</h3>
              <div className="detail-card__big">{attendancePct !== null ? `${attendancePct}%` : '—'}</div>
              <p className="detail-card__hint">{attendanceStats.present} present / {attendanceStats.total} marked days</p>
            </section>

            <section className="detail-card">
              <h3>Exam average</h3>
              <div className="detail-card__big">{examAvgPct !== null ? `${examAvgPct}%` : '—'}</div>
              <p className="detail-card__hint">Across {examResults.length} exam{examResults.length === 1 ? '' : 's'}</p>
            </section>

            <section className="detail-card detail-card--wide">
              <h3>Fee status (last 6 months)</h3>
              <div className="fee-history">
                {months.map((m) => {
                  const p = payments[m]
                  const isPaid = p && p.status === 'paid'
                  return (
                    <div key={m} className="fee-history__row">
                      <span>{monthLabel(m)}</span>
                      <StatusStamp status={isPaid ? 'paid' : 'due'} />
                    </div>
                  )
                })}
              </div>
            </section>

            <section className="detail-card detail-card--wide">
              <h3>Report card</h3>
              {examResults.length === 0 ? (
                <p className="detail-card__hint">No exam marks recorded yet.</p>
              ) : (
                <table className="simple-table">
                  <thead><tr><th>Date</th><th>Exam</th><th>Subject</th><th>Marks</th><th>%</th></tr></thead>
                  <tbody>
                    {examResults.map((r) => (
                      <tr key={r.id}>
                        <td>{r.date}</td>
                        <td>{r.examName}</td>
                        <td>{r.subject}</td>
                        <td>{r.marksObtained} / {r.totalMarks}</td>
                        <td>{Math.round((r.marksObtained / r.totalMarks) * 100)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </section>
          </div>

          <h3 className="section-title" style={{ marginTop: 20 }}>Recent homework</h3>
          {homework.length === 0 ? (
            <EmptyState icon={BookOpen} title="No homework posted yet" />
          ) : (
            <div className="card-list">
              {homework.map((h) => (
                <div key={h.id} className="notice-card">
                  <div className="notice-card__icon"><BookOpen size={16} /></div>
                  <div className="notice-card__body">
                    <div className="notice-card__title">{h.title}</div>
                    <p className="notice-card__message">{h.description}</p>
                    <div className="notice-card__meta">
                      {h.subject}{h.dueDate && ` · Due ${new Date(h.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
