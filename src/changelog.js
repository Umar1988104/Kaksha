// Bump CURRENT_VERSION and add a new entry at the top of CHANGELOG every
// time you want returning users to see a "What's New" notice. It compares
// against each user's last-seen version (stored on their profile) — nothing
// else needs to change, and it costs nothing if you skip a release.

export const CURRENT_VERSION = '1.1.0'

export const CHANGELOG = [
  {
    version: '1.1.0',
    date: '2026-07-11',
    title: "What's new",
    items: [
      'WhatsApp icon on student and teacher profiles — message them directly, no typing needed.',
      'Share exam and notice details straight to WhatsApp in one tap.',
      'The app now updates itself automatically — no more reinstalling for every change.'
    ]
  }
]
