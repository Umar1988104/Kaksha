import { NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useRole } from '../context/RoleContext'
import { ClipboardList, LogOut, MessageSquareText, User, UserCog, X } from 'lucide-react'

export default function MoreSheet({ onClose }) {
  const { logout } = useAuth()
  const { isHead, isOrgTeacher } = useRole()

  const items = [{ to: '/exams', label: 'Exams', icon: ClipboardList }]
  if (isHead) items.push({ to: '/teachers', label: 'Teachers', icon: UserCog })
  if (isHead || isOrgTeacher) items.push({ to: '/suggestions', label: 'Suggestions', icon: MessageSquareText })
  items.push({ to: '/profile', label: 'Profile', icon: User })

  return (
    <div className="sheet-overlay" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet__handle" />
        <button className="sheet__close" onClick={onClose}><X size={18} /></button>
        <div className="sheet__grid">
          {items.map((item) => {
            const Icon = item.icon
            return (
              <NavLink key={item.to} to={item.to} className="sheet__item" onClick={onClose}>
                <span className="sheet__icon"><Icon size={20} /></span>
                {item.label}
              </NavLink>
            )
          })}
        </div>
        <button className="sheet__logout" onClick={logout}>
          <LogOut size={16} style={{ verticalAlign: '-3px', marginRight: 8 }} />Log out
        </button>
      </div>
    </div>
  )
}
