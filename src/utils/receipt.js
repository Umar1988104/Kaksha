export function buildReceiptText({ centerName, studentName, batch, monthLabel, amount, paidDate }) {
  const dateLabel = paidDate ? new Date(paidDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : ''
  return (
    `🧾 Fee Receipt\n` +
    `${centerName || 'Coaching Center'}\n\n` +
    `Student: ${studentName}${batch ? ` (${batch})` : ''}\n` +
    `Month: ${monthLabel}\n` +
    `Amount paid: ₹${amount}\n` +
    `Date: ${dateLabel}\n\n` +
    `Thank you!`
  )
}
