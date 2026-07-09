import { Link } from 'react-router-dom'

export default function Terms() {
  return (
    <div className="terms-page">
      <div className="terms-page__inner">
        <Link to="/login" className="back-link">← Back</Link>
        <h1>Terms & Conditions</h1>
        <p className="page__sub">Last updated: {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>

        <section>
          <h3>1. What Kaksha is</h3>
          <p>Kaksha is a tool for tuition and coaching centers to manage students, attendance, fees, and exam records. It is provided as-is, for use by the center or teacher who sets up an account.</p>
        </section>

        <section>
          <h3>2. Your data</h3>
          <p>Student and organization data you enter is stored to provide the app's features (records, reminders, reports). You are responsible for the accuracy of data you enter and for having appropriate consent from students/parents to store their contact details for fee reminders.</p>
        </section>

        <section>
          <h3>3. Organizations and roles</h3>
          <p>A "Head" account creates an organization and controls who has access via a join code. Teachers who join an organization can view data shared by the Head but cannot alter it, aside from submitting suggestions. The Head is responsible for managing who has access to their join code.</p>
        </section>

        <section>
          <h3>4. WhatsApp reminders</h3>
          <p>Fee reminder links open WhatsApp with a pre-filled message for you to review and send yourself. Messages are not sent automatically, and Kaksha is not affiliated with WhatsApp/Meta.</p>
        </section>

        <section>
          <h3>5. No warranty</h3>
          <p>This app is provided without warranty of any kind. The people behind it are not liable for data loss, missed payments, or other damages arising from its use. Keep your own backups of critical records where possible.</p>
        </section>

        <section>
          <h3>6. Changes</h3>
          <p>These terms may be updated as the app evolves. Continued use after changes means you accept the updated terms.</p>
        </section>

        <p className="detail-card__hint" style={{ marginTop: 24 }}>
          This is placeholder text and not legal advice — have it reviewed by a professional before public launch.
        </p>
      </div>
    </div>
  )
}
