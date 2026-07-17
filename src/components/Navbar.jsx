import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useRole } from '../context/RoleContext'
import { BookOpen, CalendarDays, IndianRupee, LayoutDashboard, LogOut, MessageSquareText, Search, User, UserCog, Users } from 'lucide-react'
import ConfirmModal from './ConfirmModal'
import NotificationBell from './NotificationBell'
import GlobalSearch from './GlobalSearch'

export default function Navbar() {
  const { logout } = useAuth()
  const { isHead, isOrgTeacher } = useRole()
  const [confirmingLogout, setConfirmingLogout] = useState(false)
  const [showSearch, setShowSearch] = useState(false)

  const links = [
    { to: '/', label: 'Dashboard', end: true, icon: LayoutDashboard },
    { to: '/students', label: 'Students', icon: Users },
    { to: '/academics', label: 'Academics', icon: BookOpen },
    { to: '/money', label: 'Money', icon: IndianRupee },
    { to: '/updates', label: 'Updates', icon: CalendarDays }
  ]

  if (isHead) links.push({ to: '/teachers', label: 'Teachers', icon: UserCog })
  if (isHead || isOrgTeacher) links.push({ to: '/inbox', label: 'Inbox', icon: MessageSquareText })
  links.push({ to: '/profile', label: 'Profile', icon: User })

  return (
    <nav className="navbar">
      <div className="navbar__brand">
        <img src="/icon-192.png" alt="" className="navbar__logo" />
        Kaksha
      </div>
      <div className="navbar__links">
        {links.map((l) => {
          const Icon = l.icon
          return (
            <NavLink key={l.to} to={l.to} end={l.end} className={({ isActive }) => 'navbar__link' + (isActive ? ' navbar__link--active' : '')}>
              <Icon size={16} />
              {l.label}
            </NavLink>
          )
        })}
      </div>
      {isOrgTeacher && <span className="navbar__badge">View only</span>}
      <div className="navbar__right">
        <button className="navbar__icon-link" onClick={() => setShowSearch(true)} title="Search">
          <Search size={18} />
        </button>
        <NotificationBell />
        <button className="navbar__icon-link" onClick={() => setConfirmingLogout(true)} title="Log out">
          <LogOut size={17} />
        </button>
      </div>

      {showSearch && <GlobalSearch onClose={() => setShowSearch(false)} />}

      {confirmingLogout && (
        <ConfirmModal
          title="Log out?"
          message="You'll need to log in again to access your data."
          confirmLabel="Log out"
          onConfirm={logout}
          onCancel={() => setConfirmingLogout(false)}
        />
      )}
    </nav>
  )
}
