import { useEffect, useMemo, useState } from 'react'
import { collection, onSnapshot, query, updateDoc, doc, where } from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../context/AuthContext'
import { useRole } from '../context/RoleContext'
import { sendMessage } from '../utils/messages'
import MessageThread from '../components/MessageThread'
import EmptyState from '../components/EmptyState'
import { ArrowLeft, MessageCircle } from 'lucide-react'

export default function ParentInbox() {
  const { user } = useAuth()
  const { orgId } = useRole()
  const [allMessages, setAllMessages] = useState([])
  const [activeParentUid, setActiveParentUid] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    const q = query(collection(db, 'messages'), where('headUid', '==', user.uid))
    const unsub = onSnapshot(q, (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
      list.sort((a, b) => (a.createdAt || '').localeCompare(b.createdAt || ''))
      setAllMessages(list)
      setLoading(false)
    })
    return unsub
  }, [user])

  const conversations = useMemo(() => {
    const byParent = {}
    allMessages.forEach((m) => {
      if (!byParent[m.parentUid]) byParent[m.parentUid] = []
      byParent[m.parentUid].push(m)
    })
    return Object.entries(byParent).map(([parentUid, msgs]) => {
      const last = msgs[msgs.length - 1]
      const unread = msgs.filter((m) => m.senderRole === 'parent' && !m.read).length
      return { parentUid, parentName: last.parentName, studentName: last.studentName, lastText: last.text, lastDate: last.createdAt, unread, messages: msgs }
    }).sort((a, b) => (b.lastDate || '').localeCompare(a.lastDate || ''))
  }, [allMessages])

  const active = conversations.find((c) => c.parentUid === activeParentUid)

  useEffect(() => {
    if (!active) return
    active.messages.filter((m) => m.senderRole === 'parent' && !m.read).forEach((m) => {
      updateDoc(doc(db, 'messages', m.id), { read: true }).catch(() => {})
    })
  }, [active])

  async function handleSend(text) {
    if (!active) return
    await sendMessage({
      orgId,
      parentUid: active.parentUid,
      parentName: active.parentName,
      headUid: user.uid,
      studentId: active.messages[0]?.studentId,
      studentName: active.studentName,
      senderRole: 'head',
      text
    })
  }

  if (loading) return <div className="screen-loading">Loading…</div>

  if (active) {
    return (
      <div className="page" style={{ paddingBottom: 0 }}>
        <button className="back-link" style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none' }} onClick={() => setActiveParentUid(null)}>
          <ArrowLeft size={15} /> Back to conversations
        </button>
        <div className="page__header">
          <h1>{active.parentName}</h1>
          <p className="page__sub">Parent of {active.studentName || 'a student'}</p>
        </div>
        <MessageThread messages={active.messages} myRole="head" onSend={handleSend} placeholder="Reply…" />
      </div>
    )
  }

  return (
    <div className="page">
      <div className="page__header">
        <h1>Parent Messages</h1>
        <p className="page__sub">Conversations with parents</p>
      </div>

      {conversations.length === 0 ? (
        <EmptyState icon={MessageCircle} title="No messages yet" message="When a parent reaches out, their conversation will show up here." />
      ) : (
        <div className="card-list">
          {conversations.map((c) => (
            <button key={c.parentUid} className="inbox-row" onClick={() => setActiveParentUid(c.parentUid)}>
              <div className="inbox-row__avatar">{(c.parentName || '?').charAt(0).toUpperCase()}</div>
              <div className="inbox-row__body">
                <div className="inbox-row__top">
                  <span className="inbox-row__name">{c.parentName}</span>
                  {c.unread > 0 && <span className="inbox-row__badge">{c.unread}</span>}
                </div>
                <div className="inbox-row__preview">{c.lastText}</div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
