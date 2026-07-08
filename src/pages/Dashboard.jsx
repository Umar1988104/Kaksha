import { useEffect, useState } from 'react'
import { collection, getDocs, query, where } from 'firebase/firestore'
import { db } from '../firebase'
import { useRole } from '../context/RoleContext'
import { currentMonthKey, monthLabel, todayISO } from '../utils/dates'

export default function Dashboard() {
  const { orgId, isOrgTeacher } = useRole()
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

  return (
    <div className="page">
      <div className="page__header">
        <h1>Dashboard</h1>
        <p className="page__sub">{monthLabel(currentMonthKey())}{isOrgTeacher ? ' · view only' : ''}</p>
      </div>

      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-card__label">Active students</div>
          <div className="stat-card__value">{stats.totalStudents}</div>
        </div>
        <div className="stat-card stat-card--accent">
          <div className="stat-card__label">Collected this month</div>
          <div className="stat-card__value">₹{stats.collected.toLocaleString('en-IN')}</div>
        </div>
        <div className="stat-card stat-card--danger">
          <div className="stat-card__label">Pending this month</div>
          <div className="stat-card__value">₹{stats.due.toLocaleString('en-IN')}</div>
          <div className="stat-card__hint">{stats.dueCount} student(s)</div>
        </div>
        <div className="stat-card">
          <div className="stat-card__label">Present today</div>
          <div className="stat-card__value">{stats.presentToday}</div>
        </div>
      </div>
    </div>
  )
}
