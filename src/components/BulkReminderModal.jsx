import { useState } from 'react'
import { buildFeeReminderLink } from '../utils/whatsapp'
import { CheckCircle2, ChevronRight, X } from 'lucide-react'

export default function BulkReminderModal({ dueStudents, monthLabel, centerName, onClose }) {
  const [index, setIndex] = useState(0)
  const [sentIds, setSentIds] = useState([])

  const current = dueStudents[index]
  const isDone = index >= dueStudents.length

  function markSentAndNext() {
    setSentIds((s) => [...s, current.id])
    setIndex((i) => i + 1)
  }

  function skip() {
    setIndex((i) => i + 1)
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal confirm-modal" onClick={(e) => e.stopPropagation()}>
        <button className="sheet__close" onClick={onClose}><X size={18} /></button>
        <h2>Remind all due students</h2>

        {!isDone ? (
          <>
            <p className="confirm-modal__message">
              WhatsApp doesn't allow sending to many people in one tap, so this goes one at a time —
              tap to open each chat, hit send in WhatsApp, then come back and tap Next.
            </p>
            <div className="bulk-reminder__progress">{index + 1} of {dueStudents.length}</div>
            <div className="bulk-reminder__student">
              <div className="student-row__name">{current.name}</div>
              <div className="student-row__meta">{current.batch} · ₹{current.monthlyFee} due</div>
            </div>
            <div className="modal-form__actions" style={{ justifyContent: 'space-between' }}>
              <button className="btn btn--ghost" onClick={skip}>Skip</button>
              <a
                className="btn btn--whatsapp"
                href={buildFeeReminderLink({ parentPhone: current.parentPhone, studentName: current.name, monthLabel, dueAmount: current.monthlyFee, centerName })}
                target="_blank" rel="noreferrer"
                onClick={markSentAndNext}
              >
                Open WhatsApp <ChevronRight size={15} style={{ verticalAlign: '-3px', marginLeft: 2 }} />
              </a>
            </div>
          </>
        ) : (
          <>
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <CheckCircle2 size={40} color="var(--green)" style={{ marginBottom: 12 }} />
              <p className="confirm-modal__message">
                Done — reminded {sentIds.length} of {dueStudents.length} students.
              </p>
            </div>
            <button className="btn btn--primary" style={{ width: '100%' }} onClick={onClose}>Close</button>
          </>
        )}
      </div>
    </div>
  )
}
