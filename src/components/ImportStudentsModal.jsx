import { useState } from 'react'
import { collection, writeBatch, doc } from 'firebase/firestore'
import { db } from '../firebase'
import { parseCSV, downloadCSV } from '../utils/csv'
import { AlertCircle, CheckCircle2, Upload, X } from 'lucide-react'

const REQUIRED = ['name', 'batch', 'subject', 'monthlyfee', 'parentphone']

export default function ImportStudentsModal({ orgId, onClose, onImported }) {
  const [rows, setRows] = useState(null)
  const [fileName, setFileName] = useState('')
  const [importing, setImporting] = useState(false)
  const [done, setDone] = useState(null)

  function downloadTemplate() {
    downloadCSV('student-import-template.csv', [
      { name: 'Aarav Sharma', batch: 'Class 10', subject: 'Physics', monthlyFee: 1200, parentPhone: '9876543210', phone: '' }
    ])
  }

  async function handleFile(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setFileName(file.name)
    const result = await parseCSV(file)
    const parsed = result.data.map((row) => {
      const missing = REQUIRED.filter((k) => !row[k] || String(row[k]).trim() === '')
      return { ...row, _missing: missing }
    })
    setRows(parsed)
  }

  const validRows = rows ? rows.filter((r) => r._missing.length === 0) : []
  const invalidRows = rows ? rows.filter((r) => r._missing.length > 0) : []

  async function handleImport() {
    setImporting(true)
    const chunks = []
    for (let i = 0; i < validRows.length; i += 400) chunks.push(validRows.slice(i, i + 400))

    for (const chunk of chunks) {
      const batch = writeBatch(db)
      chunk.forEach((row) => {
        const ref = doc(collection(db, 'students'))
        batch.set(ref, {
          orgId,
          name: row.name.trim(),
          batch: row.batch.trim(),
          subject: row.subject.trim(),
          monthlyFee: Number(row.monthlyfee) || 0,
          parentPhone: String(row.parentphone).trim(),
          phone: row.phone ? String(row.phone).trim() : '',
          active: true,
          joinDate: new Date().toISOString().slice(0, 10)
        })
      })
      await batch.commit()
    }

    setDone(validRows.length)
    setImporting(false)
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <button className="sheet__close" onClick={onClose}><X size={18} /></button>
        <h2>Import students</h2>

        {done !== null ? (
          <div style={{ textAlign: 'center', padding: '16px 0' }}>
            <CheckCircle2 size={40} color="var(--green)" style={{ marginBottom: 12 }} />
            <p className="confirm-modal__message">Imported {done} student{done === 1 ? '' : 's'} successfully.</p>
            <button className="btn btn--primary" style={{ width: '100%', marginTop: 12 }} onClick={onImported}>Done</button>
          </div>
        ) : !rows ? (
          <>
            <p className="confirm-modal__message" style={{ marginBottom: 14 }}>
              Upload a CSV with columns: <strong>name, batch, subject, monthlyFee, parentPhone</strong> (phone is optional).
            </p>
            <button className="btn btn--ghost btn--sm" onClick={downloadTemplate} style={{ marginBottom: 16 }}>
              Download template CSV
            </button>
            <label className="csv-drop">
              <Upload size={22} color="#8891A0" />
              <span>Choose a CSV file</span>
              <input type="file" accept=".csv" onChange={handleFile} style={{ display: 'none' }} />
            </label>
          </>
        ) : (
          <>
            <p className="confirm-modal__message" style={{ marginBottom: 12 }}>
              {fileName} — <strong>{validRows.length} ready to import</strong>
              {invalidRows.length > 0 && `, ${invalidRows.length} skipped (missing required fields)`}
            </p>

            <div className="csv-preview">
              {rows.slice(0, 8).map((r, i) => (
                <div key={i} className={'csv-preview__row' + (r._missing.length ? ' csv-preview__row--invalid' : '')}>
                  {r._missing.length ? <AlertCircle size={14} color="var(--red)" /> : <CheckCircle2 size={14} color="var(--green)" />}
                  <span>{r.name || '(no name)'} — {r.batch || '?'}</span>
                  {r._missing.length > 0 && <span className="csv-preview__missing">missing: {r._missing.join(', ')}</span>}
                </div>
              ))}
              {rows.length > 8 && <div className="csv-preview__more">+ {rows.length - 8} more rows</div>}
            </div>

            <div className="modal-form__actions">
              <button className="btn btn--ghost" onClick={() => { setRows(null); setFileName('') }}>Choose different file</button>
              <button className="btn btn--primary" onClick={handleImport} disabled={importing || validRows.length === 0}>
                {importing ? 'Importing…' : `Import ${validRows.length} student${validRows.length === 1 ? '' : 's'}`}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
