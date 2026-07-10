import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { collection, getDocs, query, where } from 'firebase/firestore'
import { db } from '../firebase'
import { useRole } from '../context/RoleContext'
import { currentMonthKey, todayISO } from '../utils/dates'
import {
  CalendarCheck, ClipboardList, IndianRupee, Plus, Users, Wallet,
  UserPlus, MessageSquareText
} from 'lucide-react'
import { SkeletonStatGrid } from '../components/Skeleton'

export default function Dashboard() {
  const { orgId, isOrgTeacher, canEdit, profile } = useRole()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({ totalStudents: 0, collectedToday: 0, attendancePct: null, examCount: 0 })
  const [activity, setActivity] = useState([])

  useEffect(() => {
    if (!orgId) return
    async function load() {
      const today = todayISO()
      const monthKey = currentMonthKey()

      const studentsSnap = await getDocs(query(collection(db, 'students'), where('orgId', '==', orgId)))
      const students = studentsSnap.docs.map((d) => ({ id: d.id, ...d.data() })).filter((s) => s.active !== false)

      const paymentsSnap = await getDocs(query(collection(db, 'feePayments'), where('orgId', '==', orgId), where('month', '==', monthKey)))
      const payments = paymentsSnap.docs.map((d) => d.data())
      const collectedToday = payments.filter((p) => p.status === 'paid' && p.paidDate === today).reduce((s, p) => s + Number(p.amountPaid || 0), 0)

      const attendanceTodaySnap = await getDocs(query(collection(db, 'attendance'), where('orgId', '==', orgId), where('date', '==', today)))
      const attDocs = attendanceTodaySnap.docs.map((d) => d.data())
      const presentToday = attDocs.filter((a) => a.status === 'present').length
      const attendancePct = attDocs.length ? Math.round((presentToday / attDocs.length) * 100) : null

      const examsSnap = await getDocs(query(collection(db, 'exams'), where('orgId', '==', orgId)))
      const exams = examsSnap.docs.map((d) => ({ id: d.id, ...d.data() }))
      const upcomingExams = exams.filter((e) => e.date >= today).length

      setStats({ totalStudents: students.length, collectedToday, attendancePct, examCount: upcomingExams })

      // Recent activity — built from real records (paid fees, today's
      // attendance, newest exam), not placeholder data.
      const feed = []
      payments
        .filter((p) => p.status === 'paid' && p.paidDate)
        .sort((a, b) => (b.paidDate || '').localeCompare(a.paidDate || ''))
        .slice(0, 2)
        .forEach((p) => {
          const student = students.find((s) => s.id === p.studentId)
          feed.push({ type: 'fee', text: `${student?.name || 'A student'} paid fee of ₹${p.amountPaid}`, date: p.paidDate })
        })
      if (presentToday > 0) {
        feed.push({ type: 'attendance', text: `${presentToday} student${presentToday === 1 ? '' : 's'} marked present today`, date: today })
      }
      exams.sort((a, b) => (b.date || '').localeCompare(a.date || ''))
      if (exams[0]) {
        feed.push({ type: 'exam', text: `"${exams[0].name}" exam added for ${exams[0].batch}`, date: exams[0].date })
      }
      feed.sort((a, b) => (b.date || '').localeCompare(a.date || ''))
      setActivity(feed.slice(0, 4))

      setLoading(false)
    }
    load()
  }, [orgId])

  if (loading) return <div className="page"><div className="skeleton" style={{ height: 22, width: 140, marginBottom: 20 }} /><SkeletonStatGrid /></div>

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  const initials = (profile?.name || '?').trim().charAt(0).toUpperCase()

  const quickActions = [
    { to: '/students', label: 'Add Student', icon: UserPlus },
    { to: '/attendance', label: 'Take Attendance', icon: CalendarCheck },
    { to: '/fees', label: 'Collect Fees', icon: IndianRupee },
    { to: '/exams', label: 'Add Exam', icon: ClipboardList }
  ]
  const viewActions = [
    { to: '/students', label: 'View Students', icon: Users },
    { to: '/fees', label: 'View Fees', icon: IndianRupee },
    { to: '/suggestions', label: 'Send Suggestion', icon: MessageSquareText }
  ]

  return (
    <div className="page">
      <div className="dash-hero">
        <div>
          <div className="dash-hero__greeting-line">{greeting}{profile?.name ? `, ${profile.name.split(' ')[0]}` : ''} 👋</div>
          <p className="dash-hero__sub">Here's what's happening today.</p>
        </div>
        <Link to="/profile" className="dash-hero__avatar">
          {profile?.photo ? <img src={profile.photo} alt="" /> : initials}
        </Link>
      </div>

      <div className="overview-card">
        <div className="overview-card__header">
          <span>Today Overview</span>
          <span className="overview-card__date">{new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
        </div>
        <div className="overview-card__grid">
          <div className="overview-stat">
            <div className="overview-stat__icon overview-stat__icon--blue"><Users size={18} /></div>
            <div>
              <div className="overview-stat__value">{stats.totalStudents}</div>
              <div className="overview-stat__label">Total students</div>
            </div>
          </div>
          <div className="overview-stat">
            <div className="overview-stat__icon overview-stat__icon--green"><Wallet size={18} /></div>
            <div>
              <div className="overview-stat__value">₹{stats.collectedToday.toLocaleString('en-IN')}</div>
              <div className="overview-stat__label">Collected today</div>
            </div>
          </div>
          <div className="overview-stat">
            <div className="overview-stat__icon overview-stat__icon--purple"><CalendarCheck size={18} /></div>
            <div>
              <div className="overview-stat__value">{stats.attendancePct !== null ? `${stats.attendancePct}%` : '—'}</div>
              <div className="overview-stat__label">Today's attendance</div>
            </div>
          </div>
          <div className="overview-stat">
            <div className="overview-stat__icon overview-stat__icon--amber"><ClipboardList size={18} /></div>
            <div>
              <div className="overview-stat__value">{stats.examCount}</div>
              <div className="overview-stat__label">Upcoming exams</div>
            </div>
          </div>
        </div>
      </div>

      <h3 className="section-title">Quick Actions</h3>
      <div className="quick-actions">
        {(canEdit ? quickActions : viewActions).map((a) => {
          const Icon = a.icon
          return (
            <Link key={a.label} to={a.to} className="quick-action">
              <span className="quick-action__icon"><Icon size={20} /></span>
              {a.label}
            </Link>
          )
        })}
      </div>

      {activity.length > 0 && (
        <>
          <h3 className="section-title">Recent Activity</h3>
          <div className="card-list">
            {activity.map((a, i) => (
              <div key={i} className="activity-row">
                <span className={'activity-row__icon activity-row__icon--' + a.type}>
                  {a.type === 'fee' ? <Wallet size={16} /> : a.type === 'attendance' ? <CalendarCheck size={16} /> : <ClipboardList size={16} />}
                </span>
                <div className="activity-row__body">
                  <div className="activity-row__text">{a.text}</div>
                  <div className="activity-row__date">{new Date(a.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
