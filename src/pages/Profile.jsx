import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { collection, doc, getDoc, getDocs, query, setDoc, where } from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../context/AuthContext'
import { useRole } from '../context/RoleContext'
import { sendNotification } from '../utils/notifications'
import ConfirmModal from '../components/ConfirmModal'
import PhotoUploader from '../components/PhotoUploader'
import DeleteAccountModal from '../components/DeleteAccountModal'
import {
  Building2, Check, Copy, HelpCircle, Info, LogOut, Mail, Pencil, RotateCcw, Trash2, User, Users
} from 'lucide-react'

const FIELD_LABELS = {
  phone: 'Mobile number',
  gender: 'Gender',
  dob: 'Date of birth',
  address: 'Address'
}

export default function Profile() {
  const { user, logout, deleteAccount } = useAuth()
  const { profile, isHead, isOrgTeacher, mode, orgId, refreshProfile } = useRole()
  const navigate = useNavigate()

  const [form, setForm] = useState({ name: '', phone: '', address: '', gender: '', dob: '', centerName: '', photo: null })
  const [isEditing, setIsEditing] = useState(false)
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(true)
  const [orgCode, setOrgCode] = useState('')
  const [copied, setCopied] = useState(false)
  const [section, setSection] = useState('profile')
  const [showDeleteModal, setShowDeleteModal] = useState(false)

  const [joinCodeInput, setJoinCodeInput] = useState('')
  const [switching, setSwitching] = useState(false)
  const [switchError, setSwitchError] = useState('')
  const [confirmingLogout, setConfirmingLogout] = useState(false)

  useEffect(() => {
    async function load() {
      if (profile) {
        setForm({
          name: profile.name || '',
          phone: profile.phone || '',
          address: profile.address || '',
          gender: profile.gender || '',
          dob: profile.dob || '',
          centerName: profile.centerName || '',
          photo: profile.photo || null
        })
        // If the profile is essentially empty, start straight in edit mode
        // with a nudge instead of an empty-looking view screen.
        if (!profile.phone && !profile.address && !profile.dob) setIsEditing(true)
      }
      if (isHead && orgId) {
        const orgSnap = await getDoc(doc(db, 'organizations', orgId))
        if (orgSnap.exists()) setOrgCode(orgSnap.data().code || '')
      }
      setLoading(false)
    }
    load()
  }, [profile, isHead, orgId])

  async function handleSave(e) {
    e.preventDefault()
    await setDoc(doc(db, 'users', user.uid), { ...form }, { merge: true })
    setSaved(true)
    setIsEditing(false)
    await refreshProfile()
    setTimeout(() => setSaved(false), 2000)
  }

  function copyCode() {
    navigator.clipboard.writeText(orgCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  async function joinOrg(e) {
    e.preventDefault()
    setSwitchError('')
    if (!confirm("Switching to an organization means you'll work in their shared space instead of your own. Your current personal data stays saved but won't be visible while you're in the organization. Continue?")) return
    setSwitching(true)
    try {
      const q = query(collection(db, 'organizations'), where('code', '==', joinCodeInput.trim().toUpperCase()))
      const snap = await getDocs(q)
      if (snap.empty) {
        setSwitchError('No organization found with that code.')
        setSwitching(false)
        return
      }
      const org = snap.docs[0]
      await setDoc(doc(db, 'users', user.uid), { mode: 'org', orgId: org.id }, { merge: true })
      try {
        await sendNotification({
          orgId: org.id,
          targetUid: org.data().headUid,
          type: 'joined',
          title: 'New teacher joined',
          message: `${form.name || 'A teacher'} joined your organization.`,
          link: '/teachers'
        })
      } catch (err) { /* non-critical */ }
      await refreshProfile()
      setJoinCodeInput('')
    } catch (err) {
      setSwitchError('Something went wrong. Please try again.')
    } finally {
      setSwitching(false)
    }
  }

  async function leaveOrg() {
    if (!confirm("Leave this organization and go back to working solo? You'll get your own private space — the organization's data stays with them, not you.")) return
    await setDoc(doc(db, 'users', user.uid), { mode: 'solo', orgId: user.uid }, { merge: true })
    await refreshProfile()
  }

  async function replayTour() {
    await setDoc(doc(db, 'users', user.uid), { hasSeenTour: false }, { merge: true })
    await refreshProfile()
    navigate('/')
  }

  if (loading) return <div className="screen-loading">Loading…</div>

  const initials = (form.name || user?.email || '?').trim().charAt(0).toUpperCase()
  const isProfileIncomplete = !form.phone && !form.address && !form.dob

  return (
    <div className="page">
      <div className="page__header">
        <h1>Profile</h1>
        <p className="page__sub">Your account, work mode, and app settings</p>
      </div>

      <div className="profile-card">
        {form.photo ? <img src={form.photo} alt="" className="profile-avatar profile-avatar--photo" /> : <div className="profile-avatar">{initials}</div>}
        <div>
          <div className="profile-card__name">{form.name || 'Add your name'}</div>
          <div className="profile-card__email"><Mail size={14} /> {user?.email}</div>
          <div className="profile-card__role">
            {isHead ? 'Center head' : mode === 'solo' ? 'Solo teacher' : 'Teacher (organization)'}
          </div>
        </div>
      </div>

      <div className="tab-row">
        <button className={'tab' + (section === 'profile' ? ' tab--active' : '')} onClick={() => setSection('profile')}><User size={14} />Profile</button>
        <button className={'tab' + (section === 'settings' ? ' tab--active' : '')} onClick={() => setSection('settings')}><Users size={14} />Work mode</button>
        <button className={'tab' + (section === 'help' ? ' tab--active' : '')} onClick={() => setSection('help')}><HelpCircle size={14} />Help</button>
        <button className={'tab' + (section === 'about' ? ' tab--active' : '')} onClick={() => setSection('about')}><Info size={14} />About</button>
      </div>

      {section === 'profile' && (
        isEditing ? (
          <form className="detail-card" onSubmit={handleSave}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
              <PhotoUploader value={form.photo} onChange={(photo) => setForm((f) => ({ ...f, photo }))} size={88} label="Profile photo" />
            </div>
            <div className="form-grid">
              <label>Full name
                <input className="search-input" style={{ margin: 0 }} value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
              </label>
              <label>Mobile number
                <input className="search-input" style={{ margin: 0 }} value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} placeholder="10-digit number" />
              </label>
              <label>Gender
                <select className="search-input" style={{ margin: 0 }} value={form.gender} onChange={(e) => setForm((f) => ({ ...f, gender: e.target.value }))}>
                  <option value="">Prefer not to say</option>
                  <option value="female">Female</option>
                  <option value="male">Male</option>
                  <option value="other">Other</option>
                </select>
              </label>
              <label>Date of birth
                <input type="date" className="search-input" style={{ margin: 0 }} value={form.dob} onChange={(e) => setForm((f) => ({ ...f, dob: e.target.value }))} />
              </label>
              <label style={{ gridColumn: '1 / -1' }}>Address
                <input className="search-input" style={{ margin: 0 }} value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} placeholder="City, area" />
              </label>
              {mode === 'solo' && (
                <label style={{ gridColumn: '1 / -1' }}>Name shown on fee reminders
                  <input className="search-input" style={{ margin: 0 }} value={form.centerName} onChange={(e) => setForm((f) => ({ ...f, centerName: e.target.value }))} placeholder="e.g. Priya's Tuition Classes" />
                </label>
              )}
            </div>
            <div className="modal-form__actions" style={{ justifyContent: 'flex-start', marginTop: 14 }}>
              <button className="btn btn--primary" type="submit">Save changes</button>
              {!isProfileIncomplete && <button type="button" className="btn btn--ghost" onClick={() => setIsEditing(false)}>Cancel</button>}
            </div>
            {saved && <p className="form-success">Saved.</p>}
          </form>
        ) : (
          <div className="detail-card">
            {isProfileIncomplete && (
              <div className="profile-nudge">Your profile isn't complete yet — add your details so they're on hand when needed.</div>
            )}
            <div className="profile-view-grid">
              {Object.entries(FIELD_LABELS).map(([key, label]) => (
                <div key={key} className="profile-view-field">
                  <div className="profile-view-field__label">{label}</div>
                  <div className={'profile-view-field__value' + (!form[key] ? ' profile-view-field__value--empty' : '')}>
                    {form[key] || 'Not added'}
                  </div>
                </div>
              ))}
            </div>
            <button className="btn btn--primary btn--sm" style={{ marginTop: 16 }} onClick={() => setIsEditing(true)}>
              <Pencil size={13} style={{ verticalAlign: '-2px', marginRight: 6 }} />Update
            </button>
          </div>
        )
      )}

      {section === 'settings' && (
        <div className="detail-card">
          {isHead && (
            <>
              <h3><Building2 size={16} style={{ verticalAlign: '-3px', marginRight: 6 }} />Your organization</h3>
              <p className="detail-card__hint" style={{ marginBottom: 12 }}>Share this code with teachers so they can join.</p>
              <div className="join-code-card">
                <div className="join-code-card__code">{orgCode}</div>
                <button className="btn btn--ghost btn--sm" onClick={copyCode}>
                  {copied ? <><Check size={14} style={{ verticalAlign: '-2px', marginRight: 4 }} />Copied</> : <><Copy size={14} style={{ verticalAlign: '-2px', marginRight: 4 }} />Copy</>}
                </button>
              </div>
            </>
          )}

          {mode === 'solo' && (
            <>
              <h3><Users size={16} style={{ verticalAlign: '-3px', marginRight: 6 }} />Join an organization</h3>
              <p className="detail-card__hint" style={{ marginBottom: 12 }}>Have a code from a coaching center? Enter it here.</p>
              <form onSubmit={joinOrg} style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <input
                  className="search-input" style={{ margin: 0, flex: 1, minWidth: 160, textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}
                  value={joinCodeInput} onChange={(e) => setJoinCodeInput(e.target.value)} placeholder="e.g. K7X9QB" maxLength={6} required
                />
                <button className="btn btn--primary" type="submit" disabled={switching}>{switching ? 'Joining…' : 'Join'}</button>
              </form>
              {switchError && <p className="form-error">{switchError}</p>}
            </>
          )}

          {isOrgTeacher && (
            <>
              <h3><Users size={16} style={{ verticalAlign: '-3px', marginRight: 6 }} />Organization membership</h3>
              <p className="detail-card__hint" style={{ marginBottom: 12 }}>
                You're currently viewing this organization's data. Leaving gives you back your own private space.
              </p>
              <button className="btn btn--ghost btn--danger" onClick={leaveOrg}>Leave organization</button>
            </>
          )}
        </div>
      )}

      {section === 'help' && (
        <div className="detail-card">
          <h3>Getting help</h3>
          <p className="detail-card__hint">
            For issues with the app, reach out to whoever set up your account (your center head, or if
            you're working solo — the person who built this for you). Common things to check first:
          </p>
          <ul className="help-list">
            <li>Not seeing your students? Make sure you're in the right work mode under the "Work mode" tab.</li>
            <li>WhatsApp reminder not opening? Make sure WhatsApp is installed on this device.</li>
            <li>Data not saving? Check your internet connection — changes need to sync to the cloud.</li>
          </ul>
          <button className="btn btn--ghost btn--sm" style={{ marginTop: 14 }} onClick={replayTour}>
            <RotateCcw size={13} style={{ verticalAlign: '-2px', marginRight: 6 }} />Replay app tour
          </button>
        </div>
      )}

      {section === 'about' && (
        <div className="detail-card">
          <h3>About Kaksha</h3>
          <p className="detail-card__hint">
            Kaksha helps tuition and coaching centers manage students, attendance, fees, and test
            scores in one place — replacing scattered notebooks and manual WhatsApp reminders.
          </p>
          <p className="detail-card__hint" style={{ marginTop: 8 }}>Version 1.0</p>
          <p className="detail-card__hint" style={{ marginTop: 8 }}><a href="/terms" style={{ color: 'var(--indigo)', fontWeight: 600 }}>Terms & Conditions</a></p>
        </div>
      )}

      <button className="btn btn--ghost btn--danger" style={{ marginTop: 20 }} onClick={() => setConfirmingLogout(true)}>
        <LogOut size={15} style={{ verticalAlign: '-3px', marginRight: 6 }} />Log out
      </button>

      <div className="danger-zone">
        <div className="danger-zone__title">Danger zone</div>
        <p className="danger-zone__hint">
          Permanently delete your account and login. {isHead ? "Your organization's data isn't deleted with it — talk to us first if you're the only head." : "This doesn't affect your organization's shared data."}
        </p>
        <button className="btn btn--ghost btn--danger" onClick={() => setShowDeleteModal(true)}>
          <Trash2 size={14} style={{ verticalAlign: '-2px', marginRight: 6 }} />Delete account
        </button>
      </div>

      {confirmingLogout && (
        <ConfirmModal
          title="Log out?"
          message="You'll need to log in again to access your data."
          confirmLabel="Log out"
          onConfirm={logout}
          onCancel={() => setConfirmingLogout(false)}
        />
      )}

      {showDeleteModal && (
        <DeleteAccountModal
          onConfirm={deleteAccount}
          onCancel={() => setShowDeleteModal(false)}
        />
      )}
    </div>
  )
}
