import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { collection, doc, getDocs, limit, query, setDoc, where } from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../context/AuthContext'
import { useRole } from '../context/RoleContext'
import { currentMonthKey, lastNMonthKeys, monthLabel, todayISO } from '../utils/dates'
import {
  CalendarCheck, ClipboardList, IndianRupee, Plus, Users, Wallet,
  UserPlus, MessageSquareText
} from 'lucide-react'
import { SkeletonStatGrid } from '../components/Skeleton'
import GettingStartedChecklist from '../components/GettingStartedChecklist'
import AttendanceAlerts from '../components/AttendanceAlerts'
import TrendCharts from '../components/TrendCharts'

export default function Dashboard() {
  const { user } = useAuth()
  const { orgId, isOrgTeacher, canEdit, isHead, profile, refreshProfile } = useRole()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({ totalStudents: 0, collectedToday: 0, attendancePct: null, examCount: 0 })
  const [activity, setActivity] = useState([])
  const [checklist, setChecklist] = useState(null)
  const [checklistDismissed, setChecklistDismissed] = useState(false)
  const [attendanceAlerts, setAttendanceAlerts] = useState([])
  const [feeTrend, setFeeTrend] = useState([])
  const [attendanceTrend, setAttendanceTrend] = useState([])

  useEffect(() => {
    if (!orgId) return
    async function load() {
      const today = todayISO()
      const monthKey = currentMonthKey()

      const studentsSnap = await getDocs(query(collection(db, 'students'), where('orgId', '==', orgId)))
      const students = studentsSnap.docs.map((d) => ({ id: d.id, ...d.data() })).filter((s) => s.active !== false)
      const studentNames = {}
      students.forEach((s) => { studentNames[s.id] = s.name })

      // Fetch all-time fee payments and attendance once — reused for
      // today's stats, the getting-started checklist, low-attendance
      // alerts, and the 6-month trend charts, instead of separate fetches.
      const [allPaymentsSnap, allAttendanceSnap, examsSnap] = await Promise.all([
        getDocs(query(collection(db, 'feePayments'), where('orgId', '==', orgId))),
        getDocs(query(collection(db, 'attendance'), where('orgId', '==', orgId))),
        getDocs(query(collection(db, 'exams'), where('orgId', '==', orgId)))
      ])
      const allPayments = allPaymentsSnap.docs.map((d) => d.data())
      const allAttendance = allAttendanceSnap.docs.map((d) => d.data())
      const exams = examsSnap.docs.map((d) => ({ id: d.id, ...d.data() }))
      const upcomingExams = exams.filter((e) => e.date >= today).length

      const thisMonthPayments = allPayments.filter((p) => p.month === monthKey)
      const collectedToday = thisMonthPayments.filter((p) => p.status === 'paid' && p.paidDate === today).reduce((s, p) => s + Number(p.amountPaid || 0), 0)

      const attDocsToday = allAttendance.filter((a) => a.date === today)
      const presentToday = attDocsToday.filter((a) => a.status === 'present').length
      const attendancePct = attDocsToday.length ? Math.round((presentToday / attDocsToday.length) * 100) : null

      setStats({ totalStudents: students.length, collectedToday, attendancePct, examCount: upcomingExams })

      // Getting-started checklist
      if (canEdit && !profile?.dismissedChecklist) {
        const items = [
          { label: 'Add your first student', done: students.length > 0, link: '/students' },
          { label: 'Mark attendance for a batch', done: allAttendance.length > 0, link: '/attendance' },
          { label: 'Create your first exam', done: exams.length > 0, link: '/exams' }
        ]
        if (isHead) {
          const anyTeacherSnap = await getDocs(query(collection(db, 'users'), where('orgId', '==', orgId), where('role', '==', 'teacher'), limit(1)))
          items.push({ label: 'Invite a teacher with your join code', done: anyTeacherSnap.size > 0, link: '/teachers' })
        }
        setChecklist(items)
      }

      // Low-attendance alerts — 3+ absences in the last 14 days
      if (canEdit) {
        const cutoff = new Date()
        cutoff.setDate(cutoff.getDate() - 14)
        const cutoffStr = cutoff.toISOString().slice(0, 10)
        const recentAbsences = {}
        allAttendance.forEach((a) => {
          if (a.status === 'absent' && a.date >= cutoffStr) {
            recentAbsences[a.studentId] = (recentAbsences[a.studentId] || 0) + 1
          }
        })
        const alerts = Object.entries(recentAbsences)
          .filter(([, count]) => count >= 3)
          .map(([studentId, count]) => ({ studentId, count, name: studentNames[studentId] || 'A student' }))
          .sort((a, b) => b.count - a.count)
        setAttendanceAlerts(alerts)
      }

      // 6-month trend charts
      if (canEdit) {
        const months = lastNMonthKeys(6).reverse()
        const feeByMonth = months.map((m) => ({
          label: monthLabel(m).split(' ')[0].slice(0, 3),
          value: allPayments.filter((p) => p.month === m && p.status === 'paid').reduce((s, p) => s + Number(p.amountPaid || 0), 0)
        }))
        const attByMonth = months.map((m) => {
          const recs = allAttendance.filter((a) => a.date && a.date.startsWith(m))
          const present = recs.filter((a) => a.status === 'present').length
          return { label: monthLabel(m).split(' ')[0].slice(0, 3), value: recs.length ? Math.round((present / recs.length) * 100) : 0 }
        })
        setFeeTrend(feeByMonth)
        setAttendanceTrend(attByMonth)
      }

      // Recent activity — built from real records (paid fees, today's
      // attendance, newest exam), not placeholder data.
      const feed = []
      thisMonthPayments
        .filter((p) => p.status === 'paid' && p.paidDate)
        .sort((a, b) => (b.paidDate || '').localeCompare(a.paidDate || ''))
        .slice(0, 2)
        .forEach((p) => {
          feed.push({ type: 'fee', text: `${studentNames[p.studentId] || 'A student'} paid fee of ₹${p.amountPaid}`, date: p.paidDate })
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

  async function dismissChecklist() {
    setChecklistDismissed(true)
    try {
      await setDoc(doc(db, 'users', user.uid), { dismissedChecklist: true }, { merge: true })
      await refreshProfile()
    } catch (err) { /* non-critical */ }
  }

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

      {checklist && !checklistDismissed && checklist.some((i) => !i.done) && (
        <GettingStartedChecklist items={checklist} onDismiss={dismissChecklist} />
      )}

      <AttendanceAlerts alerts={attendanceAlerts} />

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

      {canEdit && feeTrend.length > 0 && (
        <>
          <h3 className="section-title">Trends</h3>
          <TrendCharts feeTrend={feeTrend} attendanceTrend={attendanceTrend} />
        </>
      )}

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
