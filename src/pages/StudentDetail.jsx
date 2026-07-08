import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { collection, doc, getDoc, getDocs, orderBy, query, where } from 'firebase/firestore'
import { db } from '../firebase'
import { useRole } from '../context/RoleContext'
import StatusStamp from '../components/StatusStamp'
import { buildFeeReminderLink } from '../utils/whatsapp'
import { lastNMonthKeys, monthLabel } from '../utils/dates'

export default function StudentDetail() {
  const { id } = useParams()
  const { profile } = useRole()
  const [student, setStudent] = useState(null)
  const [payments, setPayments] = useState({})
  const [attendanceStats, setAttendanceStats] = useState({ present: 0, total: 0 })
  const [scores, setScores] = useState([])
  const [loading, setLoading] = useState(true)
  const [centerName, setCenterName] = useState('')

  useEffect(() => {
    async function load() {
      const sSnap = await getDoc(doc(db, 'students', id))
      if (sSnap.exists()) setStudent({ id: sSnap.id, ...sSnap.data() })

      if (profile?.mode === 'org' && profile?.orgId) {
        const orgSnap = await getDoc(doc(db, 'organizations', profile.orgId))
        if (orgSnap.exists()) setCenterName(orgSnap.data().name || '')
      } else {
        setCenterName(profile?.centerName || '')
      }

      const paySnap = await getDocs(query(collection(db, 'feePayments'), where('studentId', '==', id)))
      const byMonth = {}
      paySnap.docs.forEach((d) => { const p = d.data(); byMonth[p.month] = p })
      setPayments(byMonth)

      const attSnap = await getDocs(query(collection(db, 'attendance'), where('studentId', '==', id)))
      const total = attSnap.size
      const present = attSnap.docs.filter((d) => d.data().status === 'present').length
      setAttendanceStats({ present, total })

      const scoreSnap = await getDocs(query(collection(db, 'testScores'), where('studentId', '==', id), orderBy('date', 'desc')))
      setScores(scoreSnap.docs.map((d) => ({ id: d.id, ...d.data() })))

      setLoading(false)
    }
    if (profile) load()
  }, [id, profile])

  if (loading) return <div className="screen-loading">Loading…</div>
  if (!student) return <div className="empty-state">Student not found.</div>

  const months = lastNMonthKeys(6)
  const attendancePct = attendanceStats.total ? Math.round((attendanceStats.present / attendanceStats.total) * 100) : null

  return (
    <div className="page">
      <Link to="/students" className="back-link">← Back to students</Link>
      <div className="page__header">
        <h1>{student.name}</h1>
        <p className="page__sub">{student.batch} · {student.subject} · ₹{student.monthlyFee}/mo</p>
      </div>

      <div className="detail-grid">
        <section className="detail-card">
          <h3>Attendance</h3>
          <div className="detail-card__big">{attendancePct !== null ? `${attendancePct}%` : '—'}</div>
          <p className="detail-card__hint">{attendanceStats.present} present / {attendanceStats.total} marked days</p>
        </section>

        <section className="detail-card">
          <h3>Fee history (last 6 months)</h3>
          <div className="fee-history">
            {months.map((m) => {
              const p = payments[m]
              const isPaid = p && p.status === 'paid'
              return (
                <div key={m} className="fee-history__row">
                  <span>{monthLabel(m)}</span>
                  <StatusStamp status={isPaid ? 'paid' : 'due'} />
                  {!isPaid && (
                    <a
                      className="btn btn--sm btn--whatsapp"
                      target="_blank" rel="noreferrer"
                      href={buildFeeReminderLink({
                        parentPhone: student.parentPhone,
                        studentName: student.name,
                        monthLabel: monthLabel(m),
                        dueAmount: student.monthlyFee,
                        centerName
                      })}
                    >
                      Send reminder
                    </a>
                  )}
                </div>
              )
            })}
          </div>
        </section>

        <section className="detail-card detail-card--wide">
          <h3>Test scores</h3>
          {scores.length === 0 ? (
            <p className="detail-card__hint">No test scores recorded yet.</p>
          ) : (
            <table className="simple-table">
              <thead><tr><th>Date</th><th>Test</th><th>Marks</th></tr></thead>
              <tbody>
                {scores.map((s) => (
                  <tr key={s.id}>
                    <td>{s.date}</td>
                    <td>{s.testName}</td>
                    <td>{s.marksObtained} / {s.totalMarks}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      </div>
    </div>
  )
}
