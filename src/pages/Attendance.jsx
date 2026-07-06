import { useEffect, useMemo, useState } from 'react'
import { collection, doc, getDocs, orderBy, query, setDoc, where } from 'firebase/firestore'
import { db } from '../firebase'
import { todayISO } from '../utils/dates'

export default function Attendance() {
  const [students, setStudents] = useState([])
  const [date, setDate] = useState(todayISO())
  const [batch, setBatch] = useState('all')
  const [marks, setMarks] = useState({}) // studentId -> 'present' | 'absent'
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    async function load() {
      const snap = await getDocs(query(collection(db, 'students'), orderBy('name')))
      setStudents(snap.docs.map((d) => ({ id: d.id, ...d.data() })).filter((s) => s.active !== false))
      setLoading(false)
    }
    load()
  }, [])

  useEffect(() => {
    async function loadMarksForDate() {
      const snap = await getDocs(query(collection(db, 'attendance'), where('date', '==', date)))
      const m = {}
      snap.docs.forEach((d) => { const a = d.data(); m[a.studentId] = a.status })
      setMarks(m)
    }
    if (date) loadMarksForDate()
  }, [date])

  const batches = useMemo(() => {
    const set = new Set(students.map((s) => s.batch))
    return ['all', ...set]
  }, [students])

  const visibleStudents = batch === 'all' ? students : students.filter((s) => s.batch === batch)

  function toggle(studentId, status) {
    setMarks((m) => ({ ...m, [studentId]: status }))
  }

  async function saveAll() {
    setSaving(true)
    await Promise.all(
      visibleStudents
        .filter((s) => marks[s.id])
        .map((s) =>
          setDoc(doc(db, 'attendance', `${date}_${s.id}`), {
            studentId: s.id,
            date,
            status: marks[s.id],
            batch: s.batch
          })
        )
    )
    setSaving(false)
  }

  if (loading) return <div className="screen-loading">Loading…</div>

  return (
    <div className="page">
      <div className="page__header page__header--row">
        <div>
          <h1>Attendance</h1>
          <p className="page__sub">Mark present/absent, then save</p>
        </div>
        <button className="btn btn--primary" onClick={saveAll} disabled={saving}>
          {saving ? 'Saving…' : 'Save attendance'}
        </button>
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
              >Present</button>
              <button
                className={'chip chip--absent' + (marks[s.id] === 'absent' ? ' chip--active' : '')}
                onClick={() => toggle(s.id, 'absent')}
              >Absent</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
