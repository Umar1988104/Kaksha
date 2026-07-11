import { useEffect, useMemo, useState } from 'react'
import { collection, doc, getDocs, orderBy, query, setDoc, where } from 'firebase/firestore'
import { db } from '../firebase'
import { useRole } from '../context/RoleContext'
import { todayISO } from '../utils/dates'
import { shareOrCopy } from '../utils/share'
import { Send } from 'lucide-react'

export default function Attendance() {
  const { orgId, canEdit } = useRole()
  const [students, setStudents] = useState([])
  const [date, setDate] = useState(todayISO())
  const [batch, setBatch] = useState('all')
  const [marks, setMarks] = useState({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [shareCopied, setShareCopied] = useState(false)

  useEffect(() => {
    if (!orgId) return
    async function load() {
      const snap = await getDocs(query(collection(db, 'students'), where('orgId', '==', orgId), orderBy('name')))
      setStudents(snap.docs.map((d) => ({ id: d.id, ...d.data() })).filter((s) => s.active !== false))
      setLoading(false)
    }
    load()
  }, [orgId])

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

  function toggle(studentId, status) {
    if (!canEdit) return
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
    const dateLabel = new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
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
          <p className="page__sub">{canEdit ? 'Mark present/absent, then save' : 'View only'}</p>
        </div>
        {canEdit && (
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
                disabled={!canEdit}
              >Present</button>
              <button
                className={'chip chip--absent' + (marks[s.id] === 'absent' ? ' chip--active' : '')}
                onClick={() => toggle(s.id, 'absent')}
                disabled={!canEdit}
              >Absent</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
