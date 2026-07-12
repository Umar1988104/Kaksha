import { useState } from 'react'
import { addDoc, collection } from 'firebase/firestore'
import { db } from '../firebase'
import { ArrowDownCircle, ArrowUpCircle, X } from 'lucide-react'

const DEDUCTED_CATEGORIES = ['Rent', 'Repairs & Maintenance', 'Utilities', 'Stationery & Supplies', 'Marketing', 'Other']
const RECEIVED_CATEGORIES = ['Donation', 'Admission fee', 'Other income']

export default function AddTransactionModal({ orgId, onClose, onSaved }) {
  const [type, setType] = useState(null) // null | 'received' | 'deducted'
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState('')
  const [description, setDescription] = useState('')
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    try {
      await addDoc(collection(db, 'transactions'), {
        orgId,
        type,
        amount: Number(amount),
        category: category || (type === 'received' ? 'Other income' : 'Other'),
        description: description.trim(),
        date,
        createdAt: new Date().toISOString()
      })
      onSaved()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <button className="sheet__close" onClick={onClose}><X size={18} /></button>
        <h2>Add entry</h2>

        {!type ? (
          <div className="onboard-options">
            <button className="onboard-card" onClick={() => setType('received')}>
              <ArrowDownCircle size={24} color="var(--green)" />
              <div>
                <div className="onboard-card__title">Money received</div>
                <div className="onboard-card__sub">Donations, admission fees, or other income</div>
              </div>
            </button>
            <button className="onboard-card" onClick={() => setType('deducted')}>
              <ArrowUpCircle size={24} color="var(--red)" />
              <div>
                <div className="onboard-card__title">Money deducted</div>
                <div className="onboard-card__sub">Rent, repairs, utilities, or other expenses</div>
              </div>
            </button>
          </div>
        ) : (
          <form className="modal-form" onSubmit={handleSubmit}>
            <label>Amount (₹)
              <input type="number" min="1" value={amount} onChange={(e) => setAmount(e.target.value)} required autoFocus />
            </label>
            <label>Category
              <select value={category} onChange={(e) => setCategory(e.target.value)}>
                <option value="">Select…</option>
                {(type === 'received' ? RECEIVED_CATEGORIES : DEDUCTED_CATEGORIES).map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </label>
            <label>Description
              <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder={type === 'received' ? 'e.g. Donation from parent committee' : 'e.g. Classroom AC repair'} />
            </label>
            <label>Date
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
            </label>
            <div className="modal-form__actions">
              <button type="button" className="btn btn--ghost" onClick={() => setType(null)}>Back</button>
              <button type="submit" className="btn btn--primary" disabled={saving}>{saving ? 'Saving…' : 'Add entry'}</button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
