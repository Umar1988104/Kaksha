import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { collection, getDocs, query, where } from 'firebase/firestore'
import { db } from '../firebase'
import { useRole } from '../context/RoleContext'
import { currentMonthKey, monthLabel, todayISO } from '../utils/dates'
import { CalendarCheck, IndianRupee, Plus, Users, Wallet } from 'lucide-react'

export default function Dashboard() {
  const { orgId, isOrgTeacher, profile } = useRole()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalStudents: 0,
    collected: 0,
    due: 0,
    dueCount: 0,
    presentToday: 0
  })

  useEffect(() => {
    if (!orgId) return
    async function load() {
      const monthKey = currentMonthKey()
      const today = todayISO()

      const studentsSnap = await getDocs(query(collection(db, 'students'), where('orgId', '==', orgId)))
      const students = studentsSnap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .filter((s) => s.active !== false)

      const paymentsSnap = await getDocs(
        query(collection(db, 'feePayments'), where('orgId', '==', orgId), where('month', '==', monthKey))
      )
      const paymentsByStudent = {}
      paymentsSnap.docs.forEach((d) => {
        const p = d.data()
        paymentsByStudent[p.studentId] = p
      })

      let collected = 0
      let due = 0
      let dueCount = 0
      students.forEach((s) => {
        const payment = paymentsByStudent[s.id]
        if (payment && payment.status === 'paid') {
          collected += Number(payment.amountPaid || s.monthlyFee || 0)
        } else {
          due += Number(s.monthlyFee || 0)
          dueCount += 1
        }
      })

      const attendanceSnap = await getDocs(
        query(collection(db, 'attendance'), where('orgId', '==', orgId), where('date', '==', today), where('status', '==', 'present'))
      )

      setStats({
        totalStudents: students.length,
        collected,
        due,
        dueCount,
        presentToday: attendanceSnap.size
      })
      setLoading(false)
    }
    load()
  }, [orgId])

  if (loading) return <div className="screen-loading">Loading dashboard…</div>

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  return (
    <div className="page">
      <div className="dash-hero">
        <div>
          <div className="dash-hero__greeting">{greeting}{profile?.name ? `, ${profile.name.split(' ')[0]}` : ''}</div>
          <h1 className="dash-hero__title">{monthLabel(currentMonthKey())}</h1>
        </div>
        {!isOrgTeacher && (
          <div className="dash-hero__actions">
            <Link to="/students" className="btn btn--primary btn--sm"><Plus size={14} style={{ verticalAlign: '-2px', marginRight: 4 }} />Add student</Link>
            <Link to="/attendance" className="btn btn--ghost btn--sm">Mark attendance</Link>
          </div>
        )}
      </div>

      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-card__icon"><Users size={18} /></div>
          <div className="stat-card__label">Active students</div>
          <div className="stat-card__value">{stats.totalStudents}</div>
        </div>
        <div className="stat-card stat-card--accent">
          <div className="stat-card__icon stat-card__icon--accent"><Wallet size={18} /></div>
          <div className="stat-card__label">Collected this month</div>
          <div className="stat-card__value">₹{stats.collected.toLocaleString('en-IN')}</div>
        </div>
        <div className="stat-card stat-card--danger">
          <div className="stat-card__icon stat-card__icon--danger"><IndianRupee size={18} /></div>
          <div className="stat-card__label">Pending this month</div>
          <div className="stat-card__value">₹{stats.due.toLocaleString('en-IN')}</div>
          <div className="stat-card__hint">{stats.dueCount} student(s)</div>
        </div>
        <div className="stat-card">
          <div className="stat-card__icon"><CalendarCheck size={18} /></div>
          <div className="stat-card__label">Present today</div>
          <div className="stat-card__value">{stats.presentToday}</div>
        </div>
      </div>

      {stats.dueCount > 0 && !isOrgTeacher && (
        <Link to="/fees" className="dash-callout">
          <span>{stats.dueCount} student{stats.dueCount === 1 ? '' : 's'} have pending fees this month</span>
          <span className="dash-callout__link">Review →</span>
        </Link>
      )}
    </div>
  )
}
