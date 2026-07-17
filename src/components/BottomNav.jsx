import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { BookOpen, IndianRupee, LayoutDashboard, MoreHorizontal, Users } from 'lucide-react'
import MoreSheet from './MoreSheet'

export default function BottomNav() {
  const [showMore, setShowMore] = useState(false)

  const items = [
    { to: '/', label: 'Home', end: true, icon: LayoutDashboard },
    { to: '/students', label: 'Students', icon: Users },
    { to: '/academics', label: 'Academics', icon: BookOpen },
    { to: '/money', label: 'Money', icon: IndianRupee }
  ]

  return (
    <>
      <nav className="bottom-nav">
        {items.map((item) => {
          const Icon = item.icon
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => 'bottom-nav__item' + (isActive ? ' bottom-nav__item--active' : '')}
            >
              <Icon size={21} />
              <span>{item.label}</span>
            </NavLink>
          )
        })}
        <button className="bottom-nav__item" onClick={() => setShowMore(true)}>
          <MoreHorizontal size={21} />
          <span>More</span>
        </button>
      </nav>
      {showMore && <MoreSheet onClose={() => setShowMore(false)} />}
    </>
  )
}
