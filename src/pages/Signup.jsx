import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Signup() {
  const { signup } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (password.length < 6) {
      setError('Password should be at least 6 characters.')
      return
    }
    setLoading(true)
    try {
      await signup(email, password)
      navigate('/') // ProtectedRoute will send them to onboarding automatically
    } catch (err) {
      if (err.code === 'auth/email-already-in-use') {
        setError('An account already exists with that email — try logging in instead.')
      } else {
        setError('Could not create account. Please check your details and try again.')
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
        <h1 className="login-card__title">Create your account</h1>
        <p className="login-card__sub">Whether you run the center or teach at one, start here.</p>

        <form onSubmit={handleSubmit} className="login-form">
          <label>
            Email
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus />
          </label>
          <label>
            Password
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
          </label>
          {error && <div className="form-error">{error}</div>}
          <button className="btn btn--primary" type="submit" disabled={loading}>
            {loading ? 'Creating account…' : 'Create account'}
          </button>
        </form>

        <p className="login-card__footer">
          Already have an account? <Link to="/login">Log in</Link>
        </p>
      </div>
    </div>
  )
}
