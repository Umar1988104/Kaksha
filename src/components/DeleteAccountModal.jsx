import { useState } from 'react'

export default function DeleteAccountModal({ onConfirm, onCancel }) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await onConfirm(password)
    } catch (err) {
      setError(err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential'
        ? 'That password is incorrect.'
        : 'Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal confirm-modal" onClick={(e) => e.stopPropagation()}>
        <h2>Delete your account?</h2>
        <p className="confirm-modal__message">
          This permanently deletes your login and profile. This cannot be undone. Enter your password to confirm.
        </p>
        <form onSubmit={handleSubmit} className="login-form">
          <label>
            Password
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required autoFocus />
          </label>
          {error && <div className="form-error">{error}</div>}
          <div className="modal-form__actions">
            <button type="button" className="btn btn--ghost" onClick={onCancel}>Cancel</button>
            <button type="submit" className="btn btn--danger-solid" disabled={loading}>
              {loading ? 'Deleting…' : 'Delete permanently'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
