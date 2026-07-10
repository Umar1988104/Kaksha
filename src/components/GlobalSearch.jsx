import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { collection, getDocs, query, where } from 'firebase/firestore'
import { db } from '../firebase'
import { useRole } from '../context/RoleContext'
import { ClipboardList, Search, User, X } from 'lucide-react'

export default function GlobalSearch({ onClose }) {
  const { orgId } = useRole()
  const navigate = useNavigate()
  const [term, setTerm] = useState('')
  const [students, setStudents] = useState([])
  const [exams, setExams] = useState([])
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    async function load() {
      const [sSnap, eSnap] = await Promise.all([
        getDocs(query(collection(db, 'students'), where('orgId', '==', orgId))),
        getDocs(query(collection(db, 'exams'), where('orgId', '==', orgId)))
      ])
      setStudents(sSnap.docs.map((d) => ({ id: d.id, ...d.data() })))
      setExams(eSnap.docs.map((d) => ({ id: d.id, ...d.data() })))
      setLoaded(true)
    }
    if (orgId) load()
  }, [orgId])

  const t = term.trim().toLowerCase()
  const studentResults = t ? students.filter((s) => (s.name + s.batch + s.subject).toLowerCase().includes(t)).slice(0, 8) : []
  const examResults = t ? exams.filter((e) => (e.name + e.subject + e.batch).toLowerCase().includes(t)).slice(0, 5) : []

  function go(path) {
    onClose()
    navigate(path)
  }

  return (
    <div className="search-overlay" onClick={onClose}>
      <div className="search-modal" onClick={(e) => e.stopPropagation()}>
        <div className="search-modal__input-row">
          <Search size={18} color="#8891A0" />
          <input
            autoFocus
            placeholder="Search students, exams…"
            value={term}
            onChange={(e) => setTerm(e.target.value)}
          />
          <button onClick={onClose}><X size={18} /></button>
        </div>

        {!t ? (
          <p className="search-modal__hint">Start typing a student name, batch, or exam name.</p>
        ) : !loaded ? (
          <p className="search-modal__hint">Loading…</p>
        ) : studentResults.length === 0 && examResults.length === 0 ? (
          <p className="search-modal__hint">No matches for "{term}".</p>
        ) : (
          <div className="search-modal__results">
            {studentResults.length > 0 && (
              <>
                <div className="search-modal__group-label">Students</div>
                {studentResults.map((s) => (
                  <button key={s.id} className="search-result" onClick={() => go(`/students/${s.id}`)}>
                    <span className="search-result__icon"><User size={15} /></span>
                    <span>
                      <span className="search-result__title">{s.name}</span>
                      <span className="search-result__sub">{s.batch} · {s.subject}</span>
                    </span>
                  </button>
                ))}
              </>
            )}
            {examResults.length > 0 && (
              <>
                <div className="search-modal__group-label">Exams</div>
                {examResults.map((e) => (
                  <button key={e.id} className="search-result" onClick={() => go(`/exams/${e.id}`)}>
                    <span className="search-result__icon"><ClipboardList size={15} /></span>
                    <span>
                      <span className="search-result__title">{e.name}</span>
                      <span className="search-result__sub">{e.subject} · {e.batch}</span>
                    </span>
                  </button>
                ))}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
