import { useEffect, useState } from 'react'
import { collection, doc, getDoc, onSnapshot, query, updateDoc, where } from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../context/AuthContext'
import { useRole } from '../context/RoleContext'
import { sendMessage } from '../utils/messages'
import MessageThread from '../components/MessageThread'

export default function ParentMessages() {
  const { user } = useAuth()
  const { orgId, profile, linkedStudentIds } = useRole()
  const [messages, setMessages] = useState([])
  const [headUid, setHeadUid] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadHead() {
      const orgSnap = await getDoc(doc(db, 'organizations', orgId))
      if (orgSnap.exists()) setHeadUid(orgSnap.data().headUid)
    }
    if (orgId) loadHead()
  }, [orgId])

  useEffect(() => {
    if (!user) return
    const q = query(collection(db, 'messages'), where('parentUid', '==', user.uid))
    const unsub = onSnapshot(q, (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
      list.sort((a, b) => (a.createdAt || '').localeCompare(b.createdAt || ''))
      setMessages(list)
      setLoading(false)
      // Mark head's messages as read now that the parent has opened the thread.
      list.filter((m) => m.senderRole === 'head' && !m.read).forEach((m) => {
        updateDoc(doc(db, 'messages', m.id), { read: true }).catch(() => {})
      })
    })
    return unsub
  }, [user])

  async function handleSend(text) {
    if (!headUid) return
    await sendMessage({
      orgId,
      parentUid: user.uid,
      parentName: profile?.name || 'Parent',
      headUid,
      studentId: linkedStudentIds[0],
      senderRole: 'parent',
      text
    })
  }

  if (loading) return <div className="screen-loading">Loading…</div>

  return (
    <div className="page" style={{ paddingBottom: 0 }}>
      <div className="page__header">
        <h1>Messages</h1>
        <p className="page__sub">Direct line to your center head</p>
      </div>
      <MessageThread messages={messages} myRole="parent" onSend={handleSend} placeholder="Ask something…" />
    </div>
  )
}
