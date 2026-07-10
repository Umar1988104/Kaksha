export default function EmptyState({ icon: Icon, title, message, actionLabel, onAction }) {
  return (
    <div className="empty-state-v2">
      {Icon && <div className="empty-state-v2__icon"><Icon size={26} /></div>}
      <div className="empty-state-v2__title">{title}</div>
      {message && <p className="empty-state-v2__message">{message}</p>}
      {actionLabel && onAction && (
        <button className="btn btn--primary btn--sm" onClick={onAction} style={{ marginTop: 10 }}>{actionLabel}</button>
      )}
    </div>
  )
}
