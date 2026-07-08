import { useEffect, useState } from 'react'
import { addDoc, collection, doc, getDocs, orderBy, query, updateDoc, where } from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../context/AuthContext'
import { useRole } from '../context/RoleContext'
import { CheckCircle2, Circle, MessageSquareText } from 'lucide-react'

export default function Suggestions() {
  const { user } = useAuth()
  const { orgId, isHead, profile } = useRole()
  const [suggestions, setSuggestions] = useState([])
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [filter, setFilter] = useState('open')

  async function load() {
    setLoading(true)
    const snap = await getDocs(query(collection(db, 'suggestions'), where('orgId', '==', orgId), orderBy('createdAt', 'desc')))
    setSuggestions(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    setLoading(false)
  }

  useEffect(() => { if (orgId) load() }, [orgId])

  async function submit(e) {
    e.preventDefault()
    if (!message.trim()) return
    setSending(true)
    await addDoc(collection(db, 'suggestions'), {
      orgId,
      teacherId: user.uid,
      teacherName: profile?.name || 'Teacher',
      message: message.trim(),
      status: 'open',
      createdAt: new Date().toISOString()
    })
    setMessage('')
    setSending(false)
    load()
  }

  async function resolve(id) {
    await updateDoc(doc(db, 'suggestions', id), { status: 'resolved' })
    load()
  }

  const visible = suggestions.filter((s) => filter === 'all' || s.status === filter)

  if (loading) return <div className="screen-loading">Loading…</div>

  return (
    <div className="page">
      <div className="page__header">
        <h1>Suggestions</h1>
        <p className="page__sub">
          {isHead ? 'Notes and update requests from your teachers' : 'Send a note to your center head'}
        </p>
      </div>

      {!isHead && (
        <form className="detail-card" onSubmit={submit} style={{ marginBottom: 20 }}>
          <h3><MessageSquareText size={16} style={{ verticalAlign: '-3px', marginRight: 6 }} />New suggestion</h3>
          <textarea
            className="search-input"
            style={{ margin: '10px 0', minHeight: 90, resize: 'vertical', fontFamily: 'inherit' }}
            placeholder="e.g. Could we add a holiday on the 15th for Class 10 batch?"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
          <button className="btn btn--primary" type="submit" disabled={sending || !message.trim()}>
            {sending ? 'Sending…' : 'Send to head'}
          </button>
        </form>
      )}

      {isHead && (
        <div className="filter-row">
          <label>
            Show
            <select value={filter} onChange={(e) => setFilter(e.target.value)}>
              <option value="open">Open</option>
              <option value="resolved">Resolved</option>
              <option value="all">All</option>
            </select>
          </label>
        </div>
      )}

      {visible.length === 0 ? (
        <div className="empty-state">
          {isHead ? 'No suggestions here yet.' : "You haven't sent any suggestions yet."}
        </div>
      ) : (
        <div className="card-list">
          {visible.map((s) => (
            <div key={s.id} className="suggestion-row">
              <div className="suggestion-row__icon">
                {s.status === 'resolved' ? <CheckCircle2 size={18} color="var(--green)" /> : <Circle size={18} color="var(--amber-deep)" />}
              </div>
              <div className="suggestion-row__body">
                <div className="suggestion-row__message">{s.message}</div>
                <div className="suggestion-row__meta">
                  {isHead ? s.teacherName : 'You'} · {new Date(s.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                </div>
              </div>
              {isHead && s.status !== 'resolved' && (
                <button className="btn btn--ghost btn--sm" onClick={() => resolve(s.id)}>Mark resolved</button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
