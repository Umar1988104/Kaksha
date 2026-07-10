import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { collection, doc, getDoc, getDocs, query, setDoc, where } from 'firebase/firestore'
import { db } from '../firebase'
import { useRole } from '../context/RoleContext'

export default function ExamDetail() {
  const { id } = useParams()
  const { orgId, canEdit } = useRole()
  const [exam, setExam] = useState(null)
  const [students, setStudents] = useState([])
  const [marks, setMarks] = useState({}) // studentId -> marksObtained (string while editing)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    async function load() {
      setError('')
      let examData
      try {
        const examSnap = await getDoc(doc(db, 'exams', id))
        if (!examSnap.exists()) { setLoading(false); return }
        examData = { id: examSnap.id, ...examSnap.data() }
        setExam(examData)
      } catch (err) {
        console.error('Failed reading the exam doc:', err)
        setError(`Step 1 (reading exam) failed: ${err.message}`)
        setLoading(false)
        return
      }

      try {
        const sSnap = await getDocs(query(collection(db, 'students'), where('orgId', '==', orgId), where('batch', '==', examData.batch)))
        const studentList = sSnap.docs.map((d) => ({ id: d.id, ...d.data() })).filter((s) => s.active !== false)
        studentList.sort((a, b) => a.name.localeCompare(b.name))
        setStudents(studentList)
      } catch (err) {
        console.error('Failed reading students for this batch:', err)
        setError(`Step 2 (reading students) failed: ${err.message}`)
        setLoading(false)
        return
      }

      try {
        const marksSnap = await getDocs(query(collection(db, 'examMarks'), where('orgId', '==', orgId), where('examId', '==', id)))
        const m = {}
        marksSnap.docs.forEach((d) => { const mk = d.data(); m[mk.studentId] = mk.marksObtained })
        setMarks(m)
      } catch (err) {
        console.error('Failed reading exam marks:', err)
        setError(`Step 3 (reading marks) failed: ${err.message}`)
        setLoading(false)
        return
      }

      setLoading(false)
    }
    if (orgId) load()
  }, [id, orgId])

  function updateMark(studentId, value) {
    setMarks((m) => ({ ...m, [studentId]: value }))
  }

  async function saveAll() {
    setSaving(true)
    const writes = students
      .filter((s) => marks[s.id] !== undefined && marks[s.id] !== '')
      .map((s) =>
        setDoc(doc(db, 'examMarks', `${id}_${s.id}`), {
          orgId,
          examId: id,
          studentId: s.id,
          marksObtained: Number(marks[s.id]),
          totalMarks: exam.totalMarks,
          examName: exam.name,
          subject: exam.subject,
          date: exam.date
        })
      )
    if (navigator.onLine) await Promise.all(writes)
    setSaving(false)
  }

  if (loading) return <div className="screen-loading">Loading…</div>
  if (error) return <div className="empty-state">{error}</div>
  if (!exam) return <div className="empty-state">Exam not found.</div>

  return (
    <div className="page">
      <Link to="/exams" className="back-link">← Back to exams</Link>
      <div className="page__header page__header--row">
        <div>
          <h1>{exam.name}</h1>
          <p className="page__sub">{exam.subject} · {exam.batch} · out of {exam.totalMarks}</p>
        </div>
        {canEdit && <button className="btn btn--primary" onClick={saveAll} disabled={saving}>{saving ? 'Saving…' : 'Save marks'}</button>}
      </div>

      {students.length === 0 ? (
        <div className="empty-state">No students in the "{exam.batch}" batch.</div>
      ) : (
        <div className="card-list">
          {students.map((s) => (
            <div key={s.id} className="mark-row">
              <div className="student-row__name">{s.name}</div>
              <div className="mark-row__input">
                <input
                  type="number"
                  min="0"
                  max={exam.totalMarks}
                  value={marks[s.id] ?? ''}
                  onChange={(e) => updateMark(s.id, e.target.value)}
                  disabled={!canEdit}
                  placeholder="—"
                />
                <span>/ {exam.totalMarks}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
