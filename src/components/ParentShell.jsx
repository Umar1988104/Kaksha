import { useEffect, useState } from 'react'
import { NavLink } from 'react-router-dom'
import { collection, onSnapshot, query, where } from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../context/AuthContext'
import ConfirmModal from './ConfirmModal'
import { LayoutDashboard, LogOut, MessageCircle, User } from 'lucide-react'

export default function ParentShell({ children }) {
  const { user, logout } = useAuth()
  const [confirmingLogout, setConfirmingLogout] = useState(false)
  const [unread, setUnread] = useState(0)

  useEffect(() => {
    if (!user) return
    const q = query(collection(db, 'messages'), where('parentUid', '==', user.uid))
    const unsub = onSnapshot(q, (snap) => {
      const count = snap.docs.filter((d) => d.data().senderRole === 'head' && !d.data().read).length
      setUnread(count)
    })
    return unsub
  }, [user])

  return (
    <div className="app-shell">
      <nav className="navbar">
        <div className="navbar__brand">
          <img src="/icon-192.png" alt="" className="navbar__logo" />
          Kaksha
        </div>
        <div className="navbar__links">
          <NavLink to="/parent" end className={({ isActive }) => 'navbar__link' + (isActive ? ' navbar__link--active' : '')}>
            <LayoutDashboard size={16} />Home
          </NavLink>
          <NavLink to="/parent/messages" className={({ isActive }) => 'navbar__link' + (isActive ? ' navbar__link--active' : '')}>
            <MessageCircle size={16} />Messages
            {unread > 0 && <span className="notif-badge" style={{ position: 'static', marginLeft: 4 }}>{unread}</span>}
          </NavLink>
          <NavLink to="/parent/profile" className={({ isActive }) => 'navbar__link' + (isActive ? ' navbar__link--active' : '')}>
            <User size={16} />Profile
          </NavLink>
        </div>
        <div className="navbar__right">
          <button className="navbar__icon-link" onClick={() => setConfirmingLogout(true)} title="Log out">
            <LogOut size={17} />
          </button>
        </div>
      </nav>
      <main className="app-main">{children}</main>

      {confirmingLogout && (
        <ConfirmModal
          title="Log out?"
          message="You'll need to log in again to view your child's information."
          confirmLabel="Log out"
          onConfirm={logout}
          onCancel={() => setConfirmingLogout(false)}
        />
      )}
    </div>
  )
}
