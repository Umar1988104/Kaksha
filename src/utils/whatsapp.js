// Builds a wa.me deep link that opens WhatsApp with a pre-filled message.
// This does NOT require the paid WhatsApp Business API — it just opens
// the chat with the text ready, and the admin taps send themselves.

function normalizePhone(rawPhone) {
  const digitsOnly = (rawPhone || '').replace(/\D/g, '')
  // Assume Indian numbers if no country code was entered (10 digits)
  return digitsOnly.length === 10 ? `91${digitsOnly}` : digitsOnly
}

// Opens a direct WhatsApp chat with someone — no pre-filled message, just
// gets you into the conversation (used for the WhatsApp icon on student
// and teacher profiles).
export function buildWhatsAppChatLink(phone) {
  return `https://wa.me/${normalizePhone(phone)}`
}

export function buildFeeReminderLink({ parentPhone, studentName, monthLabel, dueAmount, centerName }) {
  const phone = normalizePhone(parentPhone)

  const message =
    `Hello, this is a fee reminder from ${centerName || 'the coaching center'}.\n` +
    `${studentName}'s fee of ₹${dueAmount} for ${monthLabel} is pending.\n` +
    `Please pay at your earliest convenience. Thank you!`

  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`
}

export function buildAbsentNoticeLink({ parentPhone, studentName, dateLabel, centerName }) {
  const phone = normalizePhone(parentPhone)

  const message =
    `Hello, this is a message from ${centerName || 'the coaching center'}.\n` +
    `${studentName} was marked absent today (${dateLabel}).\n` +
    `Please let us know if there's anything we should be aware of. Thank you!`

  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`
}
