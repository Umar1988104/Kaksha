export default function ConfirmModal({ title, message, confirmLabel = 'Yes', cancelLabel = 'No', danger = true, onConfirm, onCancel }) {
  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal confirm-modal" onClick={(e) => e.stopPropagation()}>
        <h2>{title}</h2>
        <p className="confirm-modal__message">{message}</p>
        <div className="modal-form__actions">
          <button className="btn btn--ghost" onClick={onCancel}>{cancelLabel}</button>
          <button className={'btn ' + (danger ? 'btn--danger-solid' : 'btn--primary')} onClick={onConfirm}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  )
}
