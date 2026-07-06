import { useEffect, useState } from 'react'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../context/AuthContext'
import { Building2, LogOut, Mail, User } from 'lucide-react'

export default function Profile() {
  const { user, logout } = useAuth()
  const [centerName, setCenterName] = useState('')
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const snap = await getDoc(doc(db, 'settings', 'center'))
      if (snap.exists()) setCenterName(snap.data().name || '')
      setLoading(false)
    }
    load()
  }, [])

  async function handleSave(e) {
    e.preventDefault()
    await setDoc(doc(db, 'settings', 'center'), { name: centerName })
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  if (loading) return <div className="screen-loading">Loading…</div>

  return (
    <div className="page">
      <div className="page__header">
        <h1>Profile</h1>
        <p className="page__sub">Your admin account and center details</p>
      </div>

      <div className="profile-card">
        <div className="profile-avatar"><User size={28} /></div>
        <div>
          <div className="profile-card__name">Admin</div>
          <div className="profile-card__email"><Mail size={14} /> {user?.email}</div>
        </div>
      </div>

      <form className="detail-card" onSubmit={handleSave} style={{ marginTop: 16 }}>
        <h3><Building2 size={16} style={{ verticalAlign: '-3px', marginRight: 6 }} />Center name</h3>
        <p className="detail-card__hint" style={{ marginBottom: 12 }}>
          Shown on WhatsApp fee reminders sent to parents.
        </p>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <input
            className="search-input"
            style={{ margin: 0, flex: 1, minWidth: 200 }}
            value={centerName}
            onChange={(e) => setCenterName(e.target.value)}
            placeholder="e.g. Sharma Tuition Classes"
          />
          <button className="btn btn--primary" type="submit">Save</button>
        </div>
        {saved && <p className="form-success">Saved.</p>}
      </form>

      <button className="btn btn--ghost btn--danger" style={{ marginTop: 20 }} onClick={logout}>
        <LogOut size={15} style={{ verticalAlign: '-3px', marginRight: 6 }} />Log out
      </button>
    </div>
  )
}
