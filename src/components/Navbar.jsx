import { NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { CalendarCheck, IndianRupee, LayoutDashboard, LogOut, Notebook, User, Users } from 'lucide-react'

export default function Navbar() {
  const { logout } = useAuth()

  const links = [
    { to: '/', label: 'Dashboard', end: true, icon: LayoutDashboard },
    { to: '/students', label: 'Students', icon: Users },
    { to: '/attendance', label: 'Attendance', icon: CalendarCheck },
    { to: '/fees', label: 'Fees', icon: IndianRupee },
    { to: '/scores', label: 'Scores', icon: Notebook }
  ]

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
