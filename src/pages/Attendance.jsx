import { useEffect, useMemo, useState } from 'react'
import { collection, doc, getDoc, getDocs, orderBy, query, setDoc, where } from 'firebase/firestore'
import { db } from '../firebase'
import { useRole } from '../context/RoleContext'
import { todayISO } from '../utils/dates'
import { shareOrCopy } from '../utils/share'
import { buildAbsentNoticeLink } from '../utils/whatsapp'
import { MessageCircle, Send } from 'lucide-react'

export default function Attendance() {
  const { orgId, canMarkAttendance, profile } = useRole()
  const [students, setStudents] = useState([])
  const [date, setDate] = useState(todayISO())
  const [batch, setBatch] = useState('all')
  const [marks, setMarks] = useState({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [shareCopied, setShareCopied] = useState(false)
  const [centerName, setCenterName] = useState('')

  useEffect(() => {
    if (!orgId) return
    async function load() {
      const snap = await getDocs(query(collection(db, 'students'), where('orgId', '==', orgId), orderBy('name')))
      setStudents(snap.docs.map((d) => ({ id: d.id, ...d.data() })).filter((s) => s.active !== false))

      if (profile?.mode === 'org' && profile?.orgId) {
        const orgSnap = await getDoc(doc(db, 'organizations', profile.orgId))
        if (orgSnap.exists()) setCenterName(orgSnap.data().name || '')
      } else {
        setCenterName(profile?.centerName || '')
      }

      setLoading(false)
    }
    load()
  }, [orgId, profile])

  useEffect(() => {
    if (!orgId || !date) return
    async function loadMarksForDate() {
      const snap = await getDocs(query(collection(db, 'attendance'), where('orgId', '==', orgId), where('date', '==', date)))
      const m = {}
      snap.docs.forEach((d) => { const a = d.data(); m[a.studentId] = a.status })
      setMarks(m)
    }
    loadMarksForDate()
  }, [orgId, date])

  const batches = useMemo(() => {
    const set = new Set(students.map((s) => s.batch))
    return ['all', ...set]
  }, [students])

  const visibleStudents = batch === 'all' ? students : students.filter((s) => s.batch === batch)
  const absentStudents = visibleStudents.filter((s) => marks[s.id] === 'absent')
  const dateLabel = new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })

  function toggle(studentId, status) {
    if (!canMarkAttendance) return
    setMarks((m) => ({ ...m, [studentId]: status }))
  }

  async function saveAll() {
    setSaving(true)
    const writes = visibleStudents
      .filter((s) => marks[s.id])
      .map((s) =>
        setDoc(doc(db, 'attendance', `${date}_${s.id}`), {
          orgId,
          studentId: s.id,
          date,
          status: marks[s.id],
          batch: s.batch
        })
      )
    if (navigator.onLine) {
      // Online: wait for the actual save to finish, like normal.
      await Promise.all(writes)
    } else {
      // Offline: Firestore has already queued these writes locally (and
      // updated on-screen state instantly) — but the promises won't
      // resolve until connectivity returns, which could be a while. Don't
      // block the UI on that; just let the save happen in the background.
    }
    setSaving(false)
  }

  async function shareAbsentList() {
    const batchLabel = batch === 'all' ? 'All batches' : batch
    const names = absentStudents.map((s) => `- ${s.name} (${s.batch})`).join('\n')
    const text = `Absentee list — ${dateLabel}\n${batchLabel}\n\n${names}`

    const result = await shareOrCopy(text)
    if (result === 'copied') {
      setShareCopied(true)
      setTimeout(() => setShareCopied(false), 2000)
    }
  }

  if (loading) return <div className="screen-loading">Loading…</div>

  return (
    <div className="page">
      <div className="page__header page__header--row">
        <div>
          <h1>Attendance</h1>
          <p className="page__sub">{canMarkAttendance ? 'Mark present/absent, then save' : 'View only'}</p>
        </div>
        {canMarkAttendance && (
          <button className="btn btn--primary" onClick={saveAll} disabled={saving}>
            {saving ? 'Saving…' : 'Save attendance'}
          </button>
        )}
      </div>

      <div className="filter-row">
        <label>
          Date
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </label>
        <label>
          Batch
          <select value={batch} onChange={(e) => setBatch(e.target.value)}>
            {batches.map((b) => <option key={b} value={b}>{b === 'all' ? 'All batches' : b}</option>)}
          </select>
        </label>
      </div>

      {absentStudents.length > 0 && (
        <button className="btn btn--whatsapp btn--sm" style={{ marginBottom: 14 }} onClick={shareAbsentList}>
          <Send size={13} style={{ verticalAlign: '-2px', marginRight: 6 }} />
          {shareCopied ? 'Copied to clipboard!' : `Send absentee list (${absentStudents.length})`}
        </button>
      )}

      <div className="card-list">
        {visibleStudents.map((s) => (
          <div key={s.id} className="attendance-row">
            <div>
              <div className="student-row__name">{s.name}</div>
              <div className="student-row__meta">{s.batch}</div>
            </div>
            <div className="attendance-row__toggle">
              <button
                className={'chip chip--present' + (marks[s.id] === 'present' ? ' chip--active' : '')}
                onClick={() => toggle(s.id, 'present')}
                disabled={!canMarkAttendance}
              >Present</button>
              <button
                className={'chip chip--absent' + (marks[s.id] === 'absent' ? ' chip--active' : '')}
                onClick={() => toggle(s.id, 'absent')}
                disabled={!canMarkAttendance}
              >Absent</button>
              {marks[s.id] === 'absent' && s.parentPhone && (
                <a
                  className="whatsapp-icon-btn"
                  href={buildAbsentNoticeLink({ parentPhone: s.parentPhone, studentName: s.name, dateLabel, centerName })}
                  target="_blank" rel="noreferrer"
                  title="Notify parent on WhatsApp"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MessageCircle size={16} />
                </a>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
