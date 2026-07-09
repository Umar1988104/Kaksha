import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { addDoc, collection, getDocs, orderBy, query, where } from 'firebase/firestore'
import { db } from '../firebase'
import { useRole } from '../context/RoleContext'
import { ClipboardList, Plus } from 'lucide-react'

const emptyForm = { name: '', subject: '', batch: '', date: new Date().toISOString().slice(0, 10), totalMarks: '' }

export default function Exams() {
  const { orgId, canEdit } = useRole()
  const [exams, setExams] = useState([])
  const [students, setStudents] = useState([])
  const [marksByExam, setMarksByExam] = useState({}) // examId -> count of marks entered
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(emptyForm)

  async function load() {
    setLoading(true)
    // No orderBy in the query itself — sorted client-side so this never
    // needs a Firestore composite index, however the org's data grows.
    const examSnap = await getDocs(query(collection(db, 'exams'), where('orgId', '==', orgId)))
    const examList = examSnap.docs.map((d) => ({ id: d.id, ...d.data() }))
    examList.sort((a, b) => (b.date || '').localeCompare(a.date || ''))
    setExams(examList)

    const sSnap = await getDocs(query(collection(db, 'students'), where('orgId', '==', orgId)))
    setStudents(sSnap.docs.map((d) => ({ id: d.id, ...d.data() })))

    const marksSnap = await getDocs(query(collection(db, 'examMarks'), where('orgId', '==', orgId)))
    const counts = {}
    marksSnap.docs.forEach((d) => {
      const m = d.data()
      counts[m.examId] = (counts[m.examId] || 0) + 1
    })
    setMarksByExam(counts)

    setLoading(false)
  }

  useEffect(() => { if (orgId) load() }, [orgId])

  const batches = useMemo(() => [...new Set(students.map((s) => s.batch))], [students])

  async function handleCreate(e) {
    e.preventDefault()
    await addDoc(collection(db, 'exams'), {
      orgId,
      name: form.name,
      subject: form.subject,
      batch: form.batch,
      date: form.date,
      totalMarks: Number(form.totalMarks)
    })
    setForm(emptyForm)
    setShowForm(false)
    load()
  }

  function batchSize(batch) {
    return students.filter((s) => s.batch === batch).length
  }

  if (loading) return <div className="screen-loading">Loading exams…</div>

  return (
    <div className="page">
      <div className="page__header page__header--row">
        <div>
          <h1>Exams</h1>
          <p className="page__sub">{exams.length} exam{exams.length === 1 ? '' : 's'} recorded{!canEdit ? ' · view only' : ''}</p>
        </div>
        {canEdit && <button className="btn btn--primary" onClick={() => setShowForm(true)}><Plus size={15} style={{ verticalAlign: '-3px', marginRight: 4 }} />Add exam</button>}
      </div>

      {exams.length === 0 ? (
        <div className="empty-state">
          {canEdit ? 'No exams yet. Add one to start recording marks.' : 'No exams recorded yet.'}
        </div>
      ) : (
        <div className="card-list">
          {exams.map((ex) => {
            const entered = marksByExam[ex.id] || 0
            const total = batchSize(ex.batch)
            return (
              <Link key={ex.id} to={`/exams/${ex.id}`} className="exam-row">
                <div className="exam-row__icon"><ClipboardList size={18} /></div>
                <div className="exam-row__main">
                  <div className="student-row__name">{ex.name}</div>
                  <div className="student-row__meta">{ex.subject} · {ex.batch} · {new Date(ex.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} · out of {ex.totalMarks}</div>
                </div>
                <div className="exam-row__progress">{entered}/{total} marked</div>
              </Link>
            )
          })}
        </div>
      )}

      {showForm && canEdit && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Add exam</h2>
            <form className="modal-form" onSubmit={handleCreate}>
              <label>Exam name
                <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="e.g. Unit Test 2" required autoFocus />
              </label>
              <label>Subject
                <input value={form.subject} onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))} placeholder="e.g. Mathematics" required />
              </label>
              <label>Batch
                <input value={form.batch} onChange={(e) => setForm((f) => ({ ...f, batch: e.target.value }))} placeholder="e.g. Class 10" required list="batch-options" />
                <datalist id="batch-options">
                  {batches.map((b) => <option key={b} value={b} />)}
                </datalist>
              </label>
              <label>Date
                <input type="date" value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} required />
              </label>
              <label>Total marks
                <input type="number" min="1" value={form.totalMarks} onChange={(e) => setForm((f) => ({ ...f, totalMarks: e.target.value }))} required />
              </label>
              <div className="modal-form__actions">
                <button type="button" className="btn btn--ghost" onClick={() => setShowForm(false)}>Cancel</button>
                <button type="submit" className="btn btn--primary">Create exam</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
