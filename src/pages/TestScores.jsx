import { useEffect, useState } from 'react'
import { addDoc, collection, getDocs, orderBy, query, where } from 'firebase/firestore'
import { db } from '../firebase'
import { useRole } from '../context/RoleContext'

const emptyForm = { studentId: '', testName: '', marksObtained: '', totalMarks: '', date: new Date().toISOString().slice(0, 10) }

export default function TestScores() {
  const { orgId, canEdit } = useRole()
  const [students, setStudents] = useState([])
  const [scores, setScores] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [loading, setLoading] = useState(true)

  async function load() {
    setLoading(true)
    const sSnap = await getDocs(query(collection(db, 'students'), where('orgId', '==', orgId), orderBy('name')))
    setStudents(sSnap.docs.map((d) => ({ id: d.id, ...d.data() })))

    const scoreSnap = await getDocs(query(collection(db, 'testScores'), where('orgId', '==', orgId), orderBy('date', 'desc')))
    setScores(scoreSnap.docs.map((d) => ({ id: d.id, ...d.data() })))
    setLoading(false)
  }

  useEffect(() => { if (orgId) load() }, [orgId])

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.studentId) return
    await addDoc(collection(db, 'testScores'), {
      ...form,
      orgId,
      marksObtained: Number(form.marksObtained),
      totalMarks: Number(form.totalMarks)
    })
    setForm(emptyForm)
    load()
  }

  const studentName = (id) => students.find((s) => s.id === id)?.name || 'Unknown'

  if (loading) return <div className="screen-loading">Loading…</div>

  return (
    <div className="page">
      <div className="page__header">
        <h1>Test scores</h1>
        <p className="page__sub">{canEdit ? 'Record and track exam performance' : 'View only'}</p>
      </div>

      {canEdit && (
        <form className="inline-form" onSubmit={handleSubmit}>
          <select value={form.studentId} onChange={(e) => setForm((f) => ({ ...f, studentId: e.target.value }))} required>
            <option value="">Select student…</option>
            {students.map((s) => <option key={s.id} value={s.id}>{s.name} ({s.batch})</option>)}
          </select>
          <input placeholder="Test name" value={form.testName} onChange={(e) => setForm((f) => ({ ...f, testName: e.target.value }))} required />
          <input type="number" placeholder="Marks obtained" value={form.marksObtained} onChange={(e) => setForm((f) => ({ ...f, marksObtained: e.target.value }))} required min="0" />
          <input type="number" placeholder="Total marks" value={form.totalMarks} onChange={(e) => setForm((f) => ({ ...f, totalMarks: e.target.value }))} required min="1" />
          <input type="date" value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} required />
          <button className="btn btn--primary" type="submit">Add score</button>
        </form>
      )}

      {scores.length === 0 ? (
        <div className="empty-state">No test scores recorded yet.</div>
      ) : (
        <table className="simple-table">
          <thead><tr><th>Date</th><th>Student</th><th>Test</th><th>Marks</th></tr></thead>
          <tbody>
            {scores.map((s) => (
              <tr key={s.id}>
                <td>{s.date}</td>
                <td>{studentName(s.studentId)}</td>
                <td>{s.testName}</td>
                <td>{s.marksObtained} / {s.totalMarks}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
