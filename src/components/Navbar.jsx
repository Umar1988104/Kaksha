import { NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useRole } from '../context/RoleContext'
import { CalendarCheck, ClipboardList, IndianRupee, LayoutDashboard, LogOut, MessageSquareText, User, UserCog, Users } from 'lucide-react'

export default function Navbar() {
  const { logout } = useAuth()
  const { isHead, isOrgTeacher } = useRole()

  const links = [
    { to: '/', label: 'Dashboard', end: true, icon: LayoutDashboard },
    { to: '/students', label: 'Students', icon: Users },
    { to: '/attendance', label: 'Attendance', icon: CalendarCheck },
    { to: '/fees', label: 'Fees', icon: IndianRupee },
    { to: '/exams', label: 'Exams', icon: ClipboardList }
  ]

  if (isHead) {
    links.push({ to: '/teachers', label: 'Teachers', icon: UserCog })
    links.push({ to: '/suggestions', label: 'Suggestions', icon: MessageSquareText })
  } else if (isOrgTeacher) {
    links.push({ to: '/suggestions', label: 'Suggestions', icon: MessageSquareText })
  }

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
        <NavLink to="/profile" className={({ isActive }) => 'navbar__icon-link' + (isActive ? ' navbar__link--active' : '')} title="Profile">
          <User size={18} />
        </NavLink>
        <button className="btn btn--ghost" onClick={logout}>
          <LogOut size={15} style={{ verticalAlign: '-3px', marginRight: 6 }} />Log out
        </button>
      </div>
    </nav>
  )
}
