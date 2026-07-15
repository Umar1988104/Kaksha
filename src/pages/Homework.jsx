import { useEffect, useState } from 'react'
import { addDoc, collection, deleteDoc, doc, getDocs, query, where } from 'firebase/firestore'
import { db } from '../firebase'
import { useRole } from '../context/RoleContext'
import EmptyState from '../components/EmptyState'
import { SkeletonList } from '../components/Skeleton'
import { shareOrCopy } from '../utils/share'
import { BookOpen, Plus, Send, Trash2 } from 'lucide-react'

const emptyForm = { title: '', subject: '', batch: '', description: '', dueDate: '' }

export default function Homework() {
  const { orgId, canEdit } = useRole()
  const [items, setItems] = useState([])
  const [batches, setBatches] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [filterBatch, setFilterBatch] = useState('all')
  const [copiedId, setCopiedId] = useState(null)

  async function load() {
    setLoading(true)
    const snap = await getDocs(query(collection(db, 'homework'), where('orgId', '==', orgId)))
    const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
    list.sort((a, b) => (b.dueDate || b.createdAt || '').localeCompare(a.dueDate || a.createdAt || ''))
    setItems(list)

    const sSnap = await getDocs(query(collection(db, 'students'), where('orgId', '==', orgId)))
    setBatches([...new Set(sSnap.docs.map((d) => d.data().batch))])

    setLoading(false)
  }

  useEffect(() => { if (orgId) load() }, [orgId])

  async function handleCreate(e) {
    e.preventDefault()
    await addDoc(collection(db, 'homework'), {
      orgId,
      title: form.title,
      subject: form.subject,
      batch: form.batch,
      description: form.description,
      dueDate: form.dueDate || null,
      createdAt: new Date().toISOString()
    })
    setForm(emptyForm)
    setShowForm(false)
    load()
  }

  async function handleDelete(id) {
    if (!confirm('Delete this homework?')) return
    await deleteDoc(doc(db, 'homework', id))
    load()
  }

  const visible = filterBatch === 'all' ? items : items.filter((h) => h.batch === filterBatch)
  const today = new Date().toISOString().slice(0, 10)

  if (loading) return <div className="page"><SkeletonList rows={3} /></div>

  return (
    <div className="page">
      <div className="page__header page__header--row">
        <div>
          <h1>Homework</h1>
          <p className="page__sub">Assignments and tasks{!canEdit ? ' · view only' : ''}</p>
        </div>
        {canEdit && <button className="btn btn--primary" onClick={() => setShowForm(true)}><Plus size={15} style={{ verticalAlign: '-3px', marginRight: 4 }} />Add homework</button>}
      </div>

      <div className="filter-row">
        <label>
          Batch
          <select value={filterBatch} onChange={(e) => setFilterBatch(e.target.value)}>
            <option value="all">All batches</option>
            {batches.map((b) => <option key={b} value={b}>{b}</option>)}
          </select>
        </label>
      </div>

      {visible.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="No homework posted yet"
          message={canEdit ? 'Post an assignment here instead of typing it out on WhatsApp each time.' : "Nothing's been assigned yet."}
        />
      ) : (
        <div className="card-list">
          {visible.map((h) => {
            const isOverdue = h.dueDate && h.dueDate < today
            return (
              <div key={h.id} className="notice-card">
                <div className="notice-card__icon"><BookOpen size={16} /></div>
                <div className="notice-card__body">
                  <div className="notice-card__title">{h.title}</div>
                  <p className="notice-card__message">{h.description}</p>
                  <div className="notice-card__meta">
                    {h.subject} · {h.batch}
                    {h.dueDate && (
                      <span className={isOverdue ? 'homework-due homework-due--overdue' : 'homework-due'}>
                        {' '}· Due {new Date(h.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                      </span>
                    )}
                  </div>
                </div>
                {copiedId === h.id && <span className="copied-hint">Copied!</span>}
                <button
                  className="whatsapp-icon-btn"
                  title="Share homework"
                  onClick={async () => {
                    const text = `📚 ${h.title}\n\n${h.description}\n\n${h.subject} · ${h.batch}${h.dueDate ? `\nDue: ${new Date(h.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long' })}` : ''}`
                    const result = await shareOrCopy(text)
                    if (result === 'copied') { setCopiedId(h.id); setTimeout(() => setCopiedId(null), 2000) }
                  }}
                >
                  <Send size={15} />
                </button>
                {canEdit && <button className="notice-card__delete" onClick={() => handleDelete(h.id)}><Trash2 size={14} /></button>}
              </div>
            )
          })}
        </div>
      )}

      {showForm && canEdit && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Add homework</h2>
            <form className="modal-form" onSubmit={handleCreate}>
              <label>Title
                <input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="e.g. Chapter 5 exercises" required autoFocus />
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
              <label>Description
                <textarea
                  value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="What needs to be done…" required
                  style={{ minHeight: 80, resize: 'vertical', fontFamily: 'inherit', border: '1px solid var(--paper-line)', borderRadius: 8, padding: '9px 12px' }}
                />
              </label>
              <label>Due date (optional)
                <input type="date" value={form.dueDate} onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))} />
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
