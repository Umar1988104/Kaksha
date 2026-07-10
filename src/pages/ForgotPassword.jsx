import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { CheckCircle2, Mail } from 'lucide-react'

export default function ForgotPassword() {
  const { resetPassword } = useAuth()
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await resetPassword(email)
      setSent(true)
    } catch (err) {
      // Firebase intentionally doesn't reveal whether an email exists, for
      // privacy — so we show a generic success either way, except for
      // clearly malformed input.
      if (err.code === 'auth/invalid-email') {
        setError('That doesn\'t look like a valid email address.')
      } else {
        setSent(true)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-screen">
      <div className="login-card">
        <img src="/icon-192.png" alt="Kaksha" className="login-card__logo" />
        <div className="login-card__eyebrow">Kaksha</div>

        {sent ? (
          <>
            <h1 className="login-card__title">Check your email</h1>
            <p className="login-card__sub">
              If an account exists for <strong>{email}</strong>, we've sent a link to reset your password.
              It can take a minute to arrive — check your spam folder too.
            </p>
            <CheckCircle2 size={40} color="var(--green)" style={{ display: 'block', margin: '10px auto 20px' }} />
            <Link to="/login" className="btn btn--primary" style={{ width: '100%', textAlign: 'center', display: 'block' }}>
              Back to login
            </Link>
          </>
        ) : (
          <>
            <h1 className="login-card__title">Reset your password</h1>
            <p className="login-card__sub">Enter your email and we'll send you a link to reset it.</p>
            <form onSubmit={handleSubmit} className="login-form">
              <label>
                Email
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus placeholder="you@example.com" />
              </label>
              {error && <div className="form-error">{error}</div>}
              <button className="btn btn--primary" type="submit" disabled={loading}>
                {loading ? 'Sending…' : 'Send reset link'}
              </button>
            </form>
            <p className="login-card__footer">
              <Link to="/login">← Back to login</Link>
            </p>
          </>
        )}
      </div>
    </div>
  )
}
