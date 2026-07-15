// Bump CURRENT_VERSION and add a new entry at the top of CHANGELOG every
// time you want returning users to see a "What's New" notice. It compares
// against each user's last-seen version (stored on their profile) — nothing
// else needs to change, and it costs nothing if you skip a release.

export const CURRENT_VERSION = '4.0.0'

export const CHANGELOG = [
  {
    version: '4.0.0',
    date: '2026-07-13',
    title: "What's new",
    items: [
      'Parent portal — parents get their own login to see their child\'s attendance, marks, report card, fee status, and homework.',
      'A generated access code (from each student\'s profile page) is how parents link their account — one parent can link multiple children.',
      'Parents can message the center head directly, and the head gets a Parent Messages inbox to reply.',
      'Note: messages don\'t auto-delete for now — that would need a paid Firebase upgrade we\'re holding off on.'
    ]
  },
  {
    version: '3.0.0',
    date: '2026-07-13',
    title: "What's new",
    items: [
      'New Homework section — post assignments with a subject, batch, and due date, instead of typing it out on WhatsApp every time.',
      'Homework with a due date now shows up on the Calendar too.',
      'Overdue homework is flagged in red so nothing slips through.'
    ]
  },
  {
    version: '2.1.0',
    date: '2026-07-13',
    title: "What's new",
    items: [
      'Remind all due students on WhatsApp in one flow, instead of one at a time.',
      'Import students in bulk from a CSV file — no more adding them one by one.',
      'Attendance alerts on the Dashboard flag students with frequent recent absences.',
      'Share a fee receipt on WhatsApp the moment a payment is marked paid.',
      'Trend charts on the Dashboard — see fee collection and attendance over the last 6 months.',
      'Export your students, fees, and expense ledger as CSV files anytime.'
    ]
  },
  {
    version: '1.3.0',
    date: '2026-07-12',
    title: "What's new",
    items: [
      'New "Getting started" checklist on the Dashboard for new organizations — shows what to set up first.',
      'Mark a student absent and instantly notify their parent on WhatsApp, right from the Attendance page.',
      'Teachers in an organization can now mark attendance directly, not just suggest it.',
      'Replay the app tour anytime from Profile → Help.'
    ]
  },
  {
    version: '1.2.0',
    date: '2026-07-12',
    title: "What's new",
    items: [
      'New Expenses section — automatically tracks fee income and teacher salaries, plus lets you log rent, repairs, and other income/expenses. Shows your net profit or loss at a glance.'
    ]
  },
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
