import { useState } from 'react'
import PhotoUploader from './PhotoUploader'

const empty = { name: '', phone: '', parentPhone: '', batch: '', subject: '', monthlyFee: '', photo: null }

export default function StudentForm({ initial, onSave, onCancel }) {
  const [form, setForm] = useState(initial || empty)

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  function handleSubmit(e) {
    e.preventDefault()
    onSave({ ...form, monthlyFee: Number(form.monthlyFee) || 0 })
  }

  return (
    <form className="modal-form" onSubmit={handleSubmit}>
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 4 }}>
        <PhotoUploader value={form.photo} onChange={(photo) => update('photo', photo)} size={76} />
      </div>
      <label>
        Student name
        <input value={form.name} onChange={(e) => update('name', e.target.value)} required autoFocus />
      </label>
      <label>
        Student phone (optional)
        <input value={form.phone} onChange={(e) => update('phone', e.target.value)} placeholder="10-digit number" />
      </label>
      <label>
        Parent's WhatsApp number
        <input value={form.parentPhone} onChange={(e) => update('parentPhone', e.target.value)} placeholder="10-digit number" required />
      </label>
      <label>
        Batch / Class
        <input value={form.batch} onChange={(e) => update('batch', e.target.value)} placeholder="e.g. Class 10" required />
      </label>
      <label>
        Subject
        <input value={form.subject} onChange={(e) => update('subject', e.target.value)} placeholder="e.g. Physics" required />
      </label>
      <label>
        Monthly fee (₹)
        <input type="number" value={form.monthlyFee} onChange={(e) => update('monthlyFee', e.target.value)} required min="0" />
      </label>
      <div className="modal-form__actions">
        <button type="button" className="btn btn--ghost" onClick={onCancel}>Cancel</button>
        <button type="submit" className="btn btn--primary">Save</button>
      </div>
    </form>
  )
}
