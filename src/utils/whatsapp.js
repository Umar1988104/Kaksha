// Builds a wa.me deep link that opens WhatsApp with a pre-filled message.
// This does NOT require the paid WhatsApp Business API — it just opens
// the chat with the text ready, and the admin taps send themselves.

export function buildFeeReminderLink({ parentPhone, studentName, monthLabel, dueAmount, centerName }) {
  const digitsOnly = (parentPhone || '').replace(/\D/g, '')
  // Assume Indian numbers if no country code was entered (10 digits)
  const phone = digitsOnly.length === 10 ? `91${digitsOnly}` : digitsOnly

  const message =
    `Hello, this is a fee reminder from ${centerName || 'the coaching center'}.\n` +
    `${studentName}'s fee of ₹${dueAmount} for ${monthLabel} is pending.\n` +
    `Please pay at your earliest convenience. Thank you!`

  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`
}
