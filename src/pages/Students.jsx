import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { addDoc, collection, deleteDoc, doc, getDocs, orderBy, query, updateDoc, where } from 'firebase/firestore'
import { db } from '../firebase'
import StudentForm from '../components/StudentForm'
import { useRole } from '../context/RoleContext'
import { ChevronDown, ChevronRight, Download, FolderOpen, MessageCircle, RotateCcw, Trash2, Upload, UserMinus, Users } from 'lucide-react'
import EmptyState from '../components/EmptyState'
import { SkeletonList } from '../components/Skeleton'
import ConfirmModal from '../components/ConfirmModal'
import ImportStudentsModal from '../components/ImportStudentsModal'
import { buildWhatsAppChatLink } from '../utils/whatsapp'
import { downloadCSV } from '../utils/csv'

export default function Students() {
  const { orgId, canEdit } = useRole()
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [showImport, setShowImport] = useState(false)
  const [editing, setEditing] = useState(null)
  const [search, setSearch] = useState('')
  const [collapsed, setCollapsed] = useState({})
  const [view, setView] = useState('active') // 'active' | 'left'
  const [confirmAction, setConfirmAction] = useState(null) // { type: 'markLeft'|'delete', student }

  function exportCSV() {
    downloadCSV('students.csv', students.map((s) => ({
      Name: s.name, Batch: s.batch, Subject: s.subject, 'Monthly Fee': s.monthlyFee,
      'Parent Phone': s.parentPhone, Phone: s.phone || '', Status: s.active !== false ? 'Active' : 'Left'
    })))
  }

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

  async function markAsLeft(student) {
    await updateDoc(doc(db, 'students', student.id), { active: false, leftDate: new Date().toISOString().slice(0, 10) })
    setConfirmAction(null)
    load()
  }

  async function restoreStudent(student) {
    await updateDoc(doc(db, 'students', student.id), { active: true, leftDate: null })
    load()
  }

  async function deleteForever(student) {
    await deleteDoc(doc(db, 'students', student.id))
    setConfirmAction(null)
    load()
  }

  const activeStudents = students.filter((s) => s.active !== false)
  const leftStudents = students.filter((s) => s.active === false)
  const pool = view === 'active' ? activeStudents : leftStudents

  const filtered = pool.filter((s) =>
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
          <p className="page__sub">{activeStudents.length} active{leftStudents.length > 0 ? ` · ${leftStudents.length} left` : ''}{!canEdit ? ' · view only' : ''}</p>
        </div>
        {canEdit && view === 'active' && (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button className="btn btn--ghost btn--sm" onClick={() => setShowImport(true)}>
              <Upload size={14} style={{ verticalAlign: '-2px', marginRight: 4 }} />Import CSV
            </button>
            <button className="btn btn--ghost btn--sm" onClick={exportCSV}>
              <Download size={14} style={{ verticalAlign: '-2px', marginRight: 4 }} />Export
            </button>
            <button className="btn btn--primary" onClick={() => { setEditing(null); setShowForm(true) }}>+ Add student</button>
          </div>
        )}
      </div>

      <div className="tab-row">
        <button className={'tab' + (view === 'active' ? ' tab--active' : '')} onClick={() => setView('active')}>Active</button>
        <button className={'tab' + (view === 'left' ? ' tab--active' : '')} onClick={() => setView('left')}>
          Left {leftStudents.length > 0 ? `(${leftStudents.length})` : ''}
        </button>
      </div>

      <input
        className="search-input"
        placeholder="Search by name, batch, or subject…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {loading ? (
        <SkeletonList rows={4} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={view === 'active' ? Users : UserMinus}
          title={view === 'active' ? 'No students yet' : 'No students have left'}
          message={view === 'active'
            ? (canEdit ? 'Add your first student to start tracking attendance, fees, and exams.' : 'Your center head hasn\'t added any students yet.')
            : 'Students you mark as "left" show up here, and can be restored anytime.'}
          actionLabel={view === 'active' && canEdit ? '+ Add student' : undefined}
          onAction={view === 'active' && canEdit ? () => { setEditing(null); setShowForm(true) } : undefined}
        />
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
                        <Link to={`/students/${s.id}`} className="student-row__main student-row__main--with-avatar">
                          {s.photo ? <img src={s.photo} alt="" className="row-avatar" /> : <div className="row-avatar row-avatar--fallback">{s.name.charAt(0).toUpperCase()}</div>}
                          <div>
                            <div className="student-row__name">{s.name}</div>
                            <div className="student-row__meta">
                              {s.subject} · ₹{s.monthlyFee}/mo
                              {view === 'left' && s.leftDate && ` · left ${new Date(s.leftDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`}
                            </div>
                          </div>
                        </Link>
                        <div className="student-row__actions">
                          {s.parentPhone && (
                            <a
                              className="whatsapp-icon-btn"
                              href={buildWhatsAppChatLink(s.parentPhone)}
                              target="_blank" rel="noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              title="Message parent on WhatsApp"
                            >
                              <MessageCircle size={17} />
                            </a>
                          )}
                          {canEdit && (
                            view === 'active' ? (
                              <>
                                <button className="btn btn--ghost btn--sm" onClick={() => { setEditing(s); setShowForm(true) }}>Edit</button>
                                <button className="btn btn--ghost btn--sm btn--danger" onClick={() => setConfirmAction({ type: 'markLeft', student: s })}>Mark as left</button>
                              </>
                            ) : (
                              <>
                                <button className="btn btn--ghost btn--sm" onClick={() => restoreStudent(s)}>
                                  <RotateCcw size={13} style={{ verticalAlign: '-2px', marginRight: 4 }} />Restore
                                </button>
                                <button className="btn btn--ghost btn--sm btn--danger" onClick={() => setConfirmAction({ type: 'delete', student: s })}>
                                  <Trash2 size={13} style={{ verticalAlign: '-2px', marginRight: 4 }} />Delete forever
                                </button>
                              </>
                            )
                          )}
                        </div>
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

      {showImport && (
        <ImportStudentsModal
          orgId={orgId}
          onClose={() => setShowImport(false)}
          onImported={() => { setShowImport(false); load() }}
        />
      )}

      {confirmAction?.type === 'markLeft' && (
        <ConfirmModal
          title="Mark as left?"
          message={`${confirmAction.student.name} will move to the "Left" list. Their attendance, fees, and exam history stay safe — you can restore them anytime.`}
          confirmLabel="Mark as left"
          onConfirm={() => markAsLeft(confirmAction.student)}
          onCancel={() => setConfirmAction(null)}
        />
      )}
      {confirmAction?.type === 'delete' && (
        <ConfirmModal
          title="Delete forever?"
          message={`This permanently deletes ${confirmAction.student.name} and cannot be undone. Their attendance, fee, and exam records will remain but won't be linked to a visible student anymore. Consider keeping them in "Left" instead.`}
          confirmLabel="Delete forever"
          onConfirm={() => deleteForever(confirmAction.student)}
          onCancel={() => setConfirmAction(null)}
        />
      )}
    </div>
  )
}
