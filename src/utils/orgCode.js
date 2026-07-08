// Excludes visually confusing characters (0/O, 1/I/L) so codes are easy
// to read aloud or type from a WhatsApp message.
const CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'

export function generateOrgCode(length = 6) {
  let code = ''
  for (let i = 0; i < length; i++) {
    code += CHARS[Math.floor(Math.random() * CHARS.length)]
  }
  return code
}
