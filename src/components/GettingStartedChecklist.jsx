import { Link } from 'react-router-dom'
import { CheckCircle2, Circle, X } from 'lucide-react'

export default function GettingStartedChecklist({ items, onDismiss }) {
  const remaining = items.filter((i) => !i.done).length

  return (
    <div className="getting-started">
      <div className="getting-started__header">
        <div>
          <div className="getting-started__title">Getting started</div>
          <div className="getting-started__sub">{remaining === 0 ? "You're all set!" : `${remaining} step${remaining === 1 ? '' : 's'} left`}</div>
        </div>
        <button className="getting-started__close" onClick={onDismiss}><X size={16} /></button>
      </div>
      <div className="getting-started__list">
        {items.map((item) => (
          <Link key={item.label} to={item.link} className={'getting-started__item' + (item.done ? ' getting-started__item--done' : '')}>
            {item.done ? <CheckCircle2 size={18} color="var(--green)" /> : <Circle size={18} color="var(--paper-line)" />}
            <span>{item.label}</span>
          </Link>
        ))}
      </div>
    </div>
  )
}
