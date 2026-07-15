import { useState } from 'react'
import { addDoc, collection, doc, getDoc, getDocs, query, setDoc, where } from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../context/AuthContext'
import { useRole } from '../context/RoleContext'
import { generateOrgCode } from '../utils/orgCode'
import { sendNotification } from '../utils/notifications'
import { Building2, Check, GraduationCap, Heart, Users } from 'lucide-react'

export default function Onboarding() {
  const { user } = useAuth()
  const { refreshProfile } = useRole()
  const [step, setStep] = useState('who') // who | head-details | teacher-mode | join-code | parent-code | done
  const [centerName, setCenterName] = useState('')
  const [joinCode, setJoinCode] = useState('')
  const [parentCode, setParentCode] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [createdCode, setCreatedCode] = useState('')

  async function becomeHead(e) {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      const code = generateOrgCode()
      const orgRef = await addDoc(collection(db, 'organizations'), {
        name: centerName,
        code,
        headUid: user.uid,
        createdAt: new Date().toISOString()
      })
      await setDoc(doc(db, 'users', user.uid), {
        role: 'head',
        mode: 'org',
        orgId: orgRef.id,
        name: name || 'Admin',
        email: user.email,
        createdAt: new Date().toISOString()
      })
      setCreatedCode(code)
      setStep('done')
    } catch (err) {
      setError('Something went wrong. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  async function becomeSoloTeacher() {
    setSaving(true)
    setError('')
    try {
      await setDoc(doc(db, 'users', user.uid), {
        role: 'teacher',
        mode: 'solo',
        orgId: user.uid, // solo teachers own their own personal data space
        name: name || 'Teacher',
        email: user.email,
        createdAt: new Date().toISOString()
      })
      await refreshProfile()
    } catch (err) {
      setError('Something went wrong. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  async function joinOrganization(e) {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      const q = query(collection(db, 'organizations'), where('code', '==', joinCode.trim().toUpperCase()))
      const snap = await getDocs(q)
      if (snap.empty) {
        setError('No organization found with that code. Double-check with your center head.')
        setSaving(false)
        return
      }
      const org = snap.docs[0]
      await setDoc(doc(db, 'users', user.uid), {
        role: 'teacher',
        mode: 'org',
        orgId: org.id,
        name: name || 'Teacher',
        email: user.email,
        createdAt: new Date().toISOString()
      })
      try {
        await sendNotification({
          orgId: org.id,
          targetUid: org.data().headUid,
          type: 'joined',
          title: 'New teacher joined',
          message: `${name || 'A teacher'} joined your organization.`,
          link: '/teachers'
        })
      } catch (err) { /* non-critical */ }
      await refreshProfile()
    } catch (err) {
      setError('Something went wrong. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  async function joinAsParent(e) {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      const codeSnap = await getDoc(doc(db, 'parentCodes', parentCode.trim().toUpperCase()))
      if (!codeSnap.exists()) {
        setError("No student found with that code. Double-check with your child's teacher.")
        setSaving(false)
        return
      }
      const { studentId, orgId: studentOrgId } = codeSnap.data()
      await setDoc(doc(db, 'users', user.uid), {
        role: 'parent',
        orgId: studentOrgId,
        linkedStudentIds: [studentId],
        name: name || 'Parent',
        email: user.email,
        createdAt: new Date().toISOString()
      })
      await refreshProfile()
    } catch (err) {
      setError('Something went wrong. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="login-screen">
      <div className="login-card" style={{ maxWidth: 440 }}>
        <img src="/icon-192.png" alt="Kaksha" className="login-card__logo" />

        {step === 'who' && (
          <>
            <h1 className="login-card__title">Welcome — who are you?</h1>
            <p className="login-card__sub">This sets up how the app works for you.</p>
            <label style={{ fontSize: 13, fontWeight: 600, color: '#444C5C', display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 16 }}>
              Your name
              <input className="search-input" style={{ margin: 0 }} value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Priya Sharma" />
            </label>
            <div className="onboard-options">
              <button className="onboard-card" onClick={() => setStep('head-details')}>
                <Building2 size={22} />
                <div>
                  <div className="onboard-card__title">I'm the Head</div>
                  <div className="onboard-card__sub">I run the coaching center and manage teachers &amp; students</div>
                </div>
              </button>
              <button className="onboard-card" onClick={() => setStep('teacher-mode')}>
                <GraduationCap size={22} />
                <div>
                  <div className="onboard-card__title">I'm a Teacher</div>
                  <div className="onboard-card__sub">I teach — solo, or as part of a coaching center</div>
                </div>
              </button>
              <button className="onboard-card" onClick={() => setStep('parent-code')}>
                <Heart size={22} />
                <div>
                  <div className="onboard-card__title">I'm a Parent</div>
                  <div className="onboard-card__sub">View my child's attendance, marks, and homework</div>
                </div>
              </button>
            </div>
          </>
        )}

        {step === 'head-details' && (
          <form onSubmit={becomeHead}>
            <h1 className="login-card__title">Your coaching center</h1>
            <p className="login-card__sub">We'll generate a join code your teachers can use to enter the app.</p>
            <label style={{ fontSize: 13, fontWeight: 600, color: '#444C5C', display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 16 }}>
              Center name
              <input className="search-input" style={{ margin: 0 }} required value={centerName} onChange={(e) => setCenterName(e.target.value)} placeholder="e.g. Sharma Tuition Classes" />
            </label>
            {error && <div className="form-error">{error}</div>}
            <div className="modal-form__actions">
              <button type="button" className="btn btn--ghost" onClick={() => setStep('who')}>Back</button>
              <button type="submit" className="btn btn--primary" disabled={saving}>{saving ? 'Setting up…' : 'Create center'}</button>
            </div>
          </form>
        )}

        {step === 'teacher-mode' && (
          <>
            <h1 className="login-card__title">How do you work?</h1>
            <p className="login-card__sub">You can switch this later from your Profile.</p>
            <div className="onboard-options">
              <button className="onboard-card" onClick={becomeSoloTeacher} disabled={saving}>
                <Users size={22} />
                <div>
                  <div className="onboard-card__title">I work alone</div>
                  <div className="onboard-card__sub">Full access — manage your own students, fees, attendance</div>
                </div>
              </button>
              <button className="onboard-card" onClick={() => setStep('join-code')}>
                <Building2 size={22} />
                <div>
                  <div className="onboard-card__title">I work at an organization</div>
                  <div className="onboard-card__sub">Join with a code from your center head</div>
                </div>
              </button>
            </div>
            {error && <div className="form-error">{error}</div>}
            <button className="btn btn--ghost" style={{ marginTop: 14 }} onClick={() => setStep('who')}>Back</button>
          </>
        )}

        {step === 'join-code' && (
          <form onSubmit={joinOrganization}>
            <h1 className="login-card__title">Enter your join code</h1>
            <p className="login-card__sub">Ask your center head for the 6-character code.</p>
            <label style={{ fontSize: 13, fontWeight: 600, color: '#444C5C', display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 16 }}>
              Join code
              <input
                className="search-input" style={{ margin: 0, textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: 'var(--font-mono)' }}
                required value={joinCode} onChange={(e) => setJoinCode(e.target.value)} placeholder="e.g. K7X9QB" maxLength={6}
              />
            </label>
            {error && <div className="form-error">{error}</div>}
            <div className="modal-form__actions">
              <button type="button" className="btn btn--ghost" onClick={() => setStep('teacher-mode')}>Back</button>
              <button type="submit" className="btn btn--primary" disabled={saving}>{saving ? 'Joining…' : 'Join'}</button>
            </div>
          </form>
        )}

        {step === 'parent-code' && (
          <form onSubmit={joinAsParent}>
            <h1 className="login-card__title">Enter your child's access code</h1>
            <p className="login-card__sub">Ask your child's teacher or coaching center for this code.</p>
            <label style={{ fontSize: 13, fontWeight: 600, color: '#444C5C', display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 16 }}>
              Access code
              <input
                className="search-input" style={{ margin: 0, textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: 'var(--font-mono)' }}
                required value={parentCode} onChange={(e) => setParentCode(e.target.value)} placeholder="e.g. K7X9QB" maxLength={6}
              />
            </label>
            {error && <div className="form-error">{error}</div>}
            <div className="modal-form__actions">
              <button type="button" className="btn btn--ghost" onClick={() => setStep('who')}>Back</button>
              <button type="submit" className="btn btn--primary" disabled={saving}>{saving ? 'Linking…' : 'Continue'}</button>
            </div>
          </form>
        )}

        {step === 'done' && (
          <>
            <h1 className="login-card__title">You're all set!</h1>
            <p className="login-card__sub">Share this code with your teachers so they can join:</p>
            <div className="join-code-display">{createdCode}</div>
            <p className="detail-card__hint" style={{ marginBottom: 16 }}>You'll always find this again in your Profile.</p>
            <button className="btn btn--primary" onClick={refreshProfile}>
              <Check size={15} style={{ verticalAlign: '-3px', marginRight: 6 }} />Go to dashboard
            </button>
          </>
        )}
      </div>
    </div>
  )
}
