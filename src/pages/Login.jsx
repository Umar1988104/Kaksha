import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(email, password)
      navigate('/')
    } catch (err) {
      setError('Login failed. Check your email and password.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-screen">
      <div className="login-card">
        <img src="/icon-192.png" alt="Kaksha" className="login-card__logo" />
        <div className="login-card__eyebrow">Kaksha</div>
        <h1 className="login-card__title">Coaching center, sorted.</h1>
        <p className="login-card__sub">Students, attendance, fees and scores in one register.</p>

        <form onSubmit={handleSubmit} className="login-form">
          <label>
            Email
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus />
          </label>
          <label>
            Password
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </label>
          {error && <div className="form-error">{error}</div>}
          <button className="btn btn--primary" type="submit" disabled={loading}>
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p className="login-card__footer">
          New here? <Link to="/signup">Create an account</Link>
        </p>
        <p className="login-card__legal">
          By continuing you agree to our <Link to="/terms">Terms & Conditions</Link>
        </p>
      </div>
    </div>
  )
}
