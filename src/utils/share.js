// Opens the device's native share sheet (WhatsApp, SMS, email, anything)
// with the given text, or falls back to copying it to the clipboard on
// devices/browsers that don't support the Web Share API.
export async function shareOrCopy(text) {
  if (navigator.share) {
    try {
      await navigator.share({ text })
      return 'shared'
    } catch (err) {
      return 'cancelled' // user closed the share sheet — not an error
    }
  } else {
    await navigator.clipboard.writeText(text)
    return 'copied'
  }
}
