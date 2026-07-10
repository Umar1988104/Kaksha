import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { collection, onSnapshot, query, updateDoc, doc, where } from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../context/AuthContext'
import { Bell, CheckCheck, MessageSquareText, Sparkles, UserPlus, X } from 'lucide-react'

const ICONS = { suggestion: MessageSquareText, resolved: CheckCheck, joined: UserPlus }

export default function NotificationBell() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [notifications, setNotifications] = useState([])
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!user) return
    // Live updates via onSnapshot — the badge count updates instantly
    // without needing a page refresh.
    const q = query(collection(db, 'notifications'), where('targetUid', '==', user.uid))
    const unsub = onSnapshot(q, (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
      list.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''))
      setNotifications(list)
    })
    return unsub
  }, [user])

  const unreadCount = notifications.filter((n) => !n.read).length

  async function handleClick(n) {
    if (!n.read) await updateDoc(doc(db, 'notifications', n.id), { read: true })
    setOpen(false)
    if (n.link) navigate(n.link)
  }

  async function markAllRead() {
    await Promise.all(notifications.filter((n) => !n.read).map((n) => updateDoc(doc(db, 'notifications', n.id), { read: true })))
  }

  return (
    <div className="notif-wrap">
      <button className="navbar__icon-link" onClick={() => setOpen((o) => !o)} title="Notifications">
        <Bell size={18} />
        {unreadCount > 0 && <span className="notif-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>}
      </button>

      {open && (
        <>
          <div className="notif-backdrop" onClick={() => setOpen(false)} />
          <div className="notif-panel">
            <div className="notif-panel__header">
              <span>Notifications</span>
              {unreadCount > 0 && <button onClick={markAllRead}>Mark all read</button>}
              <button className="notif-panel__close" onClick={() => setOpen(false)}><X size={16} /></button>
            </div>
            {notifications.length === 0 ? (
              <div className="notif-panel__empty">
                <Sparkles size={22} color="#8891A0" />
                <p>You're all caught up.</p>
              </div>
            ) : (
              <div className="notif-panel__list">
                {notifications.map((n) => {
                  const Icon = ICONS[n.type] || Sparkles
                  return (
                    <button key={n.id} className={'notif-item' + (n.read ? '' : ' notif-item--unread')} onClick={() => handleClick(n)}>
                      <span className="notif-item__icon"><Icon size={15} /></span>
                      <span className="notif-item__body">
                        <span className="notif-item__title">{n.title}</span>
                        <span className="notif-item__message">{n.message}</span>
                      </span>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
