import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { addDoc, collection, deleteDoc, doc, getDocs, orderBy, query, updateDoc, where } from 'firebase/firestore'
import { db } from '../firebase'
import StudentForm from '../components/StudentForm'
import { useRole } from '../context/RoleContext'
import { ChevronDown, ChevronRight, FolderOpen } from 'lucide-react'

export default function Students() {
  const { orgId, canEdit } = useRole()
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState(null)
  const [search, setSearch] = useState('')
  const [collapsed, setCollapsed] = useState({})

  async function load() {
    setLoading(true)
    const snap = await getDocs(query(collection(db, 'students'), where('orgId', '==', orgId), orderBy('name')))
    setStudents(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    setLoading(false)
  }

  useEffect(() => { if (orgId) load() }, [orgId])

  async function handleSave(data) {
    if (editing) {
      await updateDoc(doc(db, 'students', editing.id), data)
    } else {
      await addDoc(collection(db, 'students'), { ...data, orgId, active: true, joinDate: new Date().toISOString().slice(0, 10) })
    }
    setShowForm(false)
    setEditing(null)
    load()
  }

  async function handleDelete(id) {
    if (!confirm('Remove this student? This cannot be undone.')) return
    await deleteDoc(doc(db, 'students', id))
    load()
  }

  const filtered = students.filter((s) =>
    (s.name + s.batch + s.subject).toLowerCase().includes(search.toLowerCase())
  )

  const grouped = useMemo(() => {
    const map = {}
    filtered.forEach((s) => {
      const key = s.batch || 'Unassigned'
      if (!map[key]) map[key] = []
      map[key].push(s)
    })
    return Object.entries(map).sort(([a], [b]) => a.localeCompare(b))
  }, [filtered])

  function toggleBatch(batch) {
    setCollapsed((c) => ({ ...c, [batch]: !c[batch] }))
  }

  return (
    <div className="page">
      <div className="page__header page__header--row">
        <div>
          <h1>Students</h1>
          <p className="page__sub">{students.length} total across {grouped.length} batch{grouped.length === 1 ? '' : 'es'}{!canEdit ? ' · view only' : ''}</p>
        </div>
        {canEdit && <button className="btn btn--primary" onClick={() => { setEditing(null); setShowForm(true) }}>+ Add student</button>}
      </div>

      <input
        className="search-input"
        placeholder="Search by name, batch, or subject…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {loading ? (
        <div className="screen-loading">Loading students…</div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">No students yet{canEdit ? '. Add your first one to get started.' : '.'}</div>
      ) : (
        <div className="batch-list">
          {grouped.map(([batch, list]) => {
            const isCollapsed = collapsed[batch]
            return (
              <div key={batch} className="batch-folder">
                <button className="batch-folder__header" onClick={() => toggleBatch(batch)}>
                  {isCollapsed ? <ChevronRight size={16} /> : <ChevronDown size={16} />}
                  <FolderOpen size={16} className="batch-folder__icon" />
                  <span className="batch-folder__name">{batch}</span>
                  <span className="batch-folder__count">{list.length}</span>
                </button>
                {!isCollapsed && (
                  <div className="card-list batch-folder__body">
                    {list.map((s) => (
                      <div key={s.id} className="student-row">
                        <Link to={`/students/${s.id}`} className="student-row__main">
                          <div className="student-row__name">{s.name}</div>
                          <div className="student-row__meta">{s.subject} · ₹{s.monthlyFee}/mo</div>
                        </Link>
                        {canEdit && (
                          <div className="student-row__actions">
                            <button className="btn btn--ghost btn--sm" onClick={() => { setEditing(s); setShowForm(true) }}>Edit</button>
                            <button className="btn btn--ghost btn--sm btn--danger" onClick={() => handleDelete(s.id)}>Remove</button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {showForm && canEdit && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>{editing ? 'Edit student' : 'Add student'}</h2>
            <StudentForm
              initial={editing}
              onSave={handleSave}
              onCancel={() => { setShowForm(false); setEditing(null) }}
            />
          </div>
        </div>
      )}
    </div>
  )
}
