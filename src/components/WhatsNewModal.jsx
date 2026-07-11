import { doc, setDoc } from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../context/AuthContext'
import { useRole } from '../context/RoleContext'
import { CURRENT_VERSION, CHANGELOG } from '../changelog'
import { Sparkles, X } from 'lucide-react'

export default function WhatsNewModal({ onClose }) {
  const { user } = useAuth()
  const { refreshProfile } = useRole()
  const entry = CHANGELOG[0] // most recent entry — matches CURRENT_VERSION

  async function dismiss() {
    try {
      await setDoc(doc(db, 'users', user.uid), { lastSeenVersion: CURRENT_VERSION }, { merge: true })
      await refreshProfile()
    } catch (err) { /* non-critical — worst case it shows again next time */ }
    onClose()
  }

  return (
    <div className="modal-overlay">
      <div className="modal tour-modal">
        <button className="tour-modal__close" onClick={dismiss}><X size={18} /></button>
        <div className="tour-modal__icon"><Sparkles size={26} /></div>
        <div className="tour-modal__eyebrow">What's new</div>
        <h2>{entry.title}</h2>
        <ul className="whats-new-list">
          {entry.items.map((item, i) => <li key={i}>{item}</li>)}
        </ul>
        <button className="btn btn--primary" style={{ width: '100%' }} onClick={dismiss}>Got it</button>
      </div>
    </div>
  )
}
