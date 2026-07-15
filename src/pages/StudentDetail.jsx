import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { collection, doc, getDoc, getDocs, query, setDoc, where } from 'firebase/firestore'
import { db } from '../firebase'
import { useRole } from '../context/RoleContext'
import StatusStamp from '../components/StatusStamp'
import { buildFeeReminderLink, buildWhatsAppChatLink } from '../utils/whatsapp'
import { generateOrgCode } from '../utils/orgCode'
import { lastNMonthKeys, monthLabel } from '../utils/dates'
import { Check, Copy, MessageCircle, Send } from 'lucide-react'
import { shareOrCopy } from '../utils/share'

export default function StudentDetail() {
  const { id } = useParams()
  const { profile, orgId, canEdit } = useRole()
  const [student, setStudent] = useState(null)
  const [payments, setPayments] = useState({})
  const [attendanceStats, setAttendanceStats] = useState({ present: 0, total: 0 })
  const [examResults, setExamResults] = useState([])
  const [loading, setLoading] = useState(true)
  const [centerName, setCenterName] = useState('')
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    async function load() {
      try {
        setError('')
        const sSnap = await getDoc(doc(db, 'students', id))
        if (sSnap.exists()) setStudent({ id: sSnap.id, ...sSnap.data() })

        if (profile?.mode === 'org' && profile?.orgId) {
          const orgSnap = await getDoc(doc(db, 'organizations', profile.orgId))
          if (orgSnap.exists()) setCenterName(orgSnap.data().name || '')
        } else {
          setCenterName(profile?.centerName || '')
        }

        // Every query includes orgId (not just studentId) — Firestore rules
        // check orgId, and list queries must filter on every field the rule
        // checks or the whole request gets denied, even for valid data.
        const paySnap = await getDocs(query(collection(db, 'feePayments'), where('orgId', '==', orgId), where('studentId', '==', id)))
        const byMonth = {}
        paySnap.docs.forEach((d) => { const p = d.data(); byMonth[p.month] = p })
        setPayments(byMonth)

        const attSnap = await getDocs(query(collection(db, 'attendance'), where('orgId', '==', orgId), where('studentId', '==', id)))
        const total = attSnap.size
        const present = attSnap.docs.filter((d) => d.data().status === 'present').length
        setAttendanceStats({ present, total })

        const marksSnap = await getDocs(query(collection(db, 'examMarks'), where('orgId', '==', orgId), where('studentId', '==', id)))
        const results = marksSnap.docs.map((d) => ({ id: d.id, ...d.data() }))
        results.sort((a, b) => (b.date || '').localeCompare(a.date || ''))
        setExamResults(results)
      } catch (err) {
        console.error('StudentDetail load failed:', err)
        setError(err.message || 'Something went wrong loading this student.')
      } finally {
        setLoading(false)
      }
    }
    if (profile && orgId) load()
  }, [id, profile, orgId])

  async function generateAccessCode() {
    const code = generateOrgCode()
    await setDoc(doc(db, 'students', id), { parentAccessCode: code }, { merge: true })
    // Separate lookup doc — lets a brand-new parent (no profile yet) find
    // this student by code without needing broad read access to students.
    await setDoc(doc(db, 'parentCodes', code), { studentId: id, orgId, createdAt: new Date().toISOString() })
    setStudent((s) => ({ ...s, parentAccessCode: code }))
  }

  async function shareAccessCode() {
    const text = `Hi! You can view ${student.name}'s attendance, marks, and homework in the Kaksha app.\n\nDownload the app and choose "I'm a Parent", then enter this code:\n\n${student.parentAccessCode}`
    await shareOrCopy(text)
  }

  function copyCode() {
    navigator.clipboard.writeText(student.parentAccessCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  if (loading) return <div className="screen-loading">Loading…</div>
  if (error) return <div className="empty-state">{error}</div>
  if (!student) return <div className="empty-state">Student not found.</div>

  const months = lastNMonthKeys(6)
  const attendancePct = attendanceStats.total ? Math.round((attendanceStats.present / attendanceStats.total) * 100) : null
  const examAvgPct = examResults.length
    ? Math.round((examResults.reduce((sum, r) => sum + (r.marksObtained / r.totalMarks), 0) / examResults.length) * 100)
    : null

  return (
    <div className="page">
      <Link to="/students" className="back-link">← Back to students</Link>
      <div className="page__header student-detail-header">
        {student.photo ? <img src={student.photo} alt="" className="student-detail-header__avatar" /> : <div className="student-detail-header__avatar student-detail-header__avatar--fallback">{student.name.charAt(0).toUpperCase()}</div>}
        <div style={{ flex: 1 }}>
          <h1>{student.name}</h1>
          <p className="page__sub">{student.batch} · {student.subject} · ₹{student.monthlyFee}/mo</p>
        </div>
        {student.parentPhone && (
          <a
            className="whatsapp-icon-btn"
            href={buildWhatsAppChatLink(student.parentPhone)}
            target="_blank" rel="noreferrer"
            title="Message parent on WhatsApp"
          >
            <MessageCircle size={20} />
          </a>
        )}
      </div>

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
          <h3>Report card — exam history</h3>
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

        {canEdit && (
          <section className="detail-card detail-card--wide">
            <h3>Parent access</h3>
            <p className="detail-card__hint" style={{ marginBottom: 12 }}>
              Share this code with {student.name}'s parent — they can use it to view attendance, marks, and homework in their own login.
            </p>
            {student.parentAccessCode ? (
              <div className="join-code-card">
                <div className="join-code-card__code">{student.parentAccessCode}</div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn btn--ghost btn--sm" onClick={copyCode}>
                    {copied ? <><Check size={14} style={{ verticalAlign: '-2px', marginRight: 4 }} />Copied</> : <><Copy size={14} style={{ verticalAlign: '-2px', marginRight: 4 }} />Copy</>}
                  </button>
                  {student.parentPhone && (
                    <button className="btn btn--whatsapp btn--sm" onClick={shareAccessCode}>
                      <Send size={13} style={{ verticalAlign: '-2px', marginRight: 4 }} />Share
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <button className="btn btn--primary btn--sm" onClick={generateAccessCode}>Generate access code</button>
            )}
          </section>
        )}
      </div>
    </div>
  )
}
