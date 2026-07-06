// The "signature" visual element: a rubber-stamp style badge,
// echoing the physical fee-register stamps coaching centers actually use.
export default function StatusStamp({ status }) {
  // status: 'paid' | 'due' | 'present' | 'absent'
  const map = {
    paid: { label: 'PAID', className: 'stamp stamp--paid' },
    due: { label: 'DUE', className: 'stamp stamp--due' },
    present: { label: 'PRESENT', className: 'stamp stamp--paid' },
    absent: { label: 'ABSENT', className: 'stamp stamp--due' }
  }
  const s = map[status] || map.due
  return <span className={s.className}>{s.label}</span>
}
