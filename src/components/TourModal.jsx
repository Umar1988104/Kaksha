import { useState } from 'react'
import { doc, setDoc } from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../context/AuthContext'
import { useRole } from '../context/RoleContext'
import { CURRENT_VERSION } from '../changelog'
import {
  Bell, BookOpen, CalendarCheck, CalendarDays, ClipboardList, IndianRupee, LayoutDashboard,
  Megaphone, MessageSquareText, Search, Sparkles, UserCog, Users, X
} from 'lucide-react'

const BASE_STEPS = [
  { icon: LayoutDashboard, title: 'Dashboard', body: "Your center's at-a-glance view — students, fees collected and pending, today's attendance, and quick shortcuts to the things you do most." },
  { icon: Users, title: 'Students', body: 'Add students (with a photo!) and they group automatically into batch folders. Tap any student for their full profile — attendance %, exam average, and fee history. Student leaving? "Mark as left" keeps their history safe instead of deleting it.' },
  { icon: CalendarCheck, title: 'Attendance', body: 'Pick a date and batch, mark present/absent, and save — works even with no signal, it\u2019ll sync once you\u2019re back online. After marking, you can share the absentee list straight to WhatsApp in one tap.' },
  { icon: IndianRupee, title: 'Fees', body: 'See who\u2019s paid and who\u2019s due each month. One tap opens WhatsApp with a reminder message ready to send to the parent.' },
  { icon: ClipboardList, title: 'Exams', body: 'Create an exam once (name, subject, batch, total marks), then enter every student\u2019s marks in one place. Marks automatically build each student\u2019s report card.' },
  { icon: Megaphone, title: 'Notices', body: 'Post holidays and announcements — optionally pinned to a date so they also show up on the Calendar.' },
  { icon: BookOpen, title: 'Homework', body: 'Post assignments with a subject, batch, and due date — instead of typing it out on WhatsApp every time.' },
  { icon: CalendarDays, title: 'Calendar', body: 'See every exam and dated notice on one month view — tap any day to see what\u2019s scheduled.' },
  { icon: Search, title: 'Search', body: 'The search icon at the top finds any student or exam instantly by name, batch, or subject.' },
  { icon: Bell, title: 'Notifications', body: 'The bell icon keeps you posted — suggestions from teachers, resolutions from your head, and new teachers joining, all in real time.' }
]

const HEAD_STEPS = [
  { icon: UserCog, title: 'Teachers', body: 'Manage every teacher who joins your organization — set their salary, assigned batches, and timings, and mark salary paid each month. Your join code lives here too, ready to share.' },
  { icon: MessageSquareText, title: 'Suggestions', body: 'Teachers can send you notes and update requests here. Mark them resolved once handled.' }
]

const ORG_TEACHER_STEPS = [
  { icon: MessageSquareText, title: 'Suggestions', body: "You're viewing your organization's data read-only. Got an update to request? Send a note to your center head here." }
]

export default function TourModal({ onClose }) {
  const { user } = useAuth()
  const { isHead, isOrgTeacher, refreshProfile } = useRole()
  const [step, setStep] = useState(0)

  const steps = [
    ...BASE_STEPS,
    ...(isHead ? HEAD_STEPS : isOrgTeacher ? ORG_TEACHER_STEPS : [])
  ]

  const isLast = step === steps.length - 1
  const current = steps[step]
  const Icon = current.icon

  async function finish() {
    try {
      await setDoc(doc(db, 'users', user.uid), { hasSeenTour: true, lastSeenVersion: CURRENT_VERSION }, { merge: true })
      await refreshProfile()
    } catch (e) {
      // non-critical — worst case the tour shows again next time
    }
    onClose()
  }

  return (
    <div className="modal-overlay">
      <div className="modal tour-modal">
        <button className="tour-modal__close" onClick={finish}><X size={18} /></button>
        <div className="tour-modal__icon"><Icon size={26} /></div>
        <div className="tour-modal__eyebrow"><Sparkles size={12} style={{ verticalAlign: '-1px', marginRight: 4 }} />Quick tour · {step + 1} of {steps.length}</div>
        <h2>{current.title}</h2>
        <p className="tour-modal__body">{current.body}</p>

        <div className="tour-modal__dots">
          {steps.map((_, i) => <span key={i} className={'tour-modal__dot' + (i === step ? ' tour-modal__dot--active' : '')} />)}
        </div>

        <div className="modal-form__actions" style={{ justifyContent: 'space-between' }}>
          <button className="btn btn--ghost btn--sm" onClick={finish}>Skip</button>
          {isLast ? (
            <button className="btn btn--primary" onClick={finish}>Got it</button>
          ) : (
            <button className="btn btn--primary" onClick={() => setStep((s) => s + 1)}>Next</button>
          )}
        </div>
      </div>
    </div>
  )
}
