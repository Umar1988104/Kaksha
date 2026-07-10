import { useEffect, useState } from 'react'
import { addDoc, collection, deleteDoc, doc, getDocs, query, where } from 'firebase/firestore'
import { db } from '../firebase'
import { useRole } from '../context/RoleContext'
import EmptyState from '../components/EmptyState'
import { SkeletonList } from '../components/Skeleton'
import { Megaphone, Plus, Trash2 } from 'lucide-react'

const emptyForm = { title: '', message: '', batch: 'all', eventDate: '' }

export default function Notices() {
  const { orgId, canEdit } = useRole()
  const [notices, setNotices] = useState([])
  const [batches, setBatches] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(emptyForm)

  async function load() {
    setLoading(true)
    const snap = await getDocs(query(collection(db, 'notices'), where('orgId', '==', orgId)))
    const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
    list.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''))
    setNotices(list)

    const sSnap = await getDocs(query(collection(db, 'students'), where('orgId', '==', orgId)))
    setBatches([...new Set(sSnap.docs.map((d) => d.data().batch))])

    setLoading(false)
  }

  useEffect(() => { if (orgId) load() }, [orgId])

  async function handleCreate(e) {
    e.preventDefault()
    await addDoc(collection(db, 'notices'), {
      orgId,
      title: form.title,
      message: form.message,
      batch: form.batch,
      eventDate: form.eventDate || null,
      createdAt: new Date().toISOString()
    })
    setForm(emptyForm)
    setShowForm(false)
    load()
  }

  async function handleDelete(id) {
    if (!confirm('Delete this notice?')) return
    await deleteDoc(doc(db, 'notices', id))
    load()
  }

  if (loading) return <div className="page"><SkeletonList rows={3} /></div>

  return (
    <div className="page">
      <div className="page__header page__header--row">
        <div>
          <h1>Notices</h1>
          <p className="page__sub">Homework, announcements, and updates{!canEdit ? ' · view only' : ''}</p>
        </div>
        {canEdit && <button className="btn btn--primary" onClick={() => setShowForm(true)}><Plus size={15} style={{ verticalAlign: '-3px', marginRight: 4 }} />Post notice</button>}
      </div>

      {notices.length === 0 ? (
        <EmptyState
          icon={Megaphone}
          title="No notices yet"
          message={canEdit ? 'Post homework, holidays, or announcements here for your teachers and students.' : "Your center head hasn't posted anything yet."}
        />
      ) : (
        <div className="card-list">
          {notices.map((n) => (
            <div key={n.id} className="notice-card">
              <div className="notice-card__icon"><Megaphone size={16} /></div>
              <div className="notice-card__body">
                <div className="notice-card__title">{n.title}</div>
                <p className="notice-card__message">{n.message}</p>
                <div className="notice-card__meta">
                  {n.batch === 'all' ? 'All batches' : n.batch}
                  {n.eventDate && ` · ${new Date(n.eventDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`}
                </div>
              </div>
              {canEdit && <button className="notice-card__delete" onClick={() => handleDelete(n.id)}><Trash2 size={14} /></button>}
            </div>
          ))}
        </div>
      )}

      {showForm && canEdit && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Post a notice</h2>
            <form className="modal-form" onSubmit={handleCreate}>
              <label>Title
                <input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="e.g. Holiday on 15th" required autoFocus />
              </label>
              <label>Message
                <textarea
                  value={form.message} onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
                  placeholder="Details…" required style={{ minHeight: 80, resize: 'vertical', fontFamily: 'inherit', border: '1px solid var(--paper-line)', borderRadius: 8, padding: '9px 12px' }}
                />
              </label>
              <label>Batch
                <select value={form.batch} onChange={(e) => setForm((f) => ({ ...f, batch: e.target.value }))}>
                  <option value="all">All batches</option>
                  {batches.map((b) => <option key={b} value={b}>{b}</option>)}
                </select>
              </label>
              <label>Date (optional — shows on the calendar)
                <input type="date" value={form.eventDate} onChange={(e) => setForm((f) => ({ ...f, eventDate: e.target.value }))} />
              </label>
              <div className="modal-form__actions">
                <button type="button" className="btn btn--ghost" onClick={() => setShowForm(false)}>Cancel</button>
                <button type="submit" className="btn btn--primary">Post</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
