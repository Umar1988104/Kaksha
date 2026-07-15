import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { collection, getDocs, query, where } from 'firebase/firestore'
import { db } from '../firebase'
import { useRole } from '../context/RoleContext'
import { ChevronLeft, ChevronRight, ClipboardList, Megaphone, BookOpen } from 'lucide-react'

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

function toKey(d) { return d.toISOString().slice(0, 10) }

export default function CalendarPage() {
  const { orgId } = useRole()
  const [cursor, setCursor] = useState(new Date())
  const [eventsByDate, setEventsByDate] = useState({})
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(toKey(new Date()))

  useEffect(() => {
    async function load() {
      setLoading(true)
      const [examSnap, noticeSnap, homeworkSnap] = await Promise.all([
        getDocs(query(collection(db, 'exams'), where('orgId', '==', orgId))),
        getDocs(query(collection(db, 'notices'), where('orgId', '==', orgId))),
        getDocs(query(collection(db, 'homework'), where('orgId', '==', orgId)))
      ])
      const map = {}
      examSnap.docs.forEach((d) => {
        const e = d.data()
        if (!e.date) return
        if (!map[e.date]) map[e.date] = []
        map[e.date].push({ type: 'exam', title: e.name, sub: `${e.subject} · ${e.batch}`, link: `/exams/${d.id}` })
      })
      noticeSnap.docs.forEach((d) => {
        const n = d.data()
        if (!n.eventDate) return
        if (!map[n.eventDate]) map[n.eventDate] = []
        map[n.eventDate].push({ type: 'notice', title: n.title, sub: n.batch === 'all' ? 'All batches' : n.batch, link: '/notices' })
      })
      homeworkSnap.docs.forEach((d) => {
        const h = d.data()
        if (!h.dueDate) return
        if (!map[h.dueDate]) map[h.dueDate] = []
        map[h.dueDate].push({ type: 'homework', title: h.title, sub: `${h.subject} · ${h.batch}`, link: '/homework' })
      })
      setEventsByDate(map)
      setLoading(false)
    }
    if (orgId) load()
  }, [orgId])

  const monthGrid = useMemo(() => {
    const year = cursor.getFullYear()
    const month = cursor.getMonth()
    const firstDay = new Date(year, month, 1)
    const startOffset = firstDay.getDay()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const cells = []
    for (let i = 0; i < startOffset; i++) cells.push(null)
    for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d))
    return cells
  }, [cursor])

  const monthLabel = cursor.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
  const todayKey = toKey(new Date())
  const selectedEvents = eventsByDate[selected] || []

  function changeMonth(delta) {
    setCursor((c) => new Date(c.getFullYear(), c.getMonth() + delta, 1))
  }

  if (loading) return <div className="screen-loading">Loading calendar…</div>

  return (
    <div className="page">
      <div className="page__header">
        <h1>Calendar</h1>
        <p className="page__sub">Exams and events at a glance</p>
      </div>

      <div className="cal-card">
        <div className="cal-card__header">
          <button onClick={() => changeMonth(-1)}><ChevronLeft size={18} /></button>
          <span>{monthLabel}</span>
          <button onClick={() => changeMonth(1)}><ChevronRight size={18} /></button>
        </div>
        <div className="cal-grid cal-grid--labels">
          {WEEKDAYS.map((w, i) => <div key={i}>{w}</div>)}
        </div>
        <div className="cal-grid">
          {monthGrid.map((date, i) => {
            if (!date) return <div key={i} />
            const key = toKey(date)
            const hasEvents = eventsByDate[key]?.length > 0
            return (
              <button
                key={i}
                className={'cal-day' + (key === todayKey ? ' cal-day--today' : '') + (key === selected ? ' cal-day--selected' : '')}
                onClick={() => setSelected(key)}
              >
                {date.getDate()}
                {hasEvents && <span className="cal-day__dot" />}
              </button>
            )
          })}
        </div>
      </div>

      <h3 className="section-title">
        {new Date(selected).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
      </h3>
      {selectedEvents.length === 0 ? (
        <div className="empty-state">Nothing scheduled for this day.</div>
      ) : (
        <div className="card-list">
          {selectedEvents.map((ev, i) => (
            <Link key={i} to={ev.link} className="exam-row">
              <div className="exam-row__icon">{ev.type === 'exam' ? <ClipboardList size={18} /> : ev.type === 'homework' ? <BookOpen size={18} /> : <Megaphone size={18} />}</div>
              <div className="exam-row__main">
                <div className="student-row__name">{ev.title}</div>
                <div className="student-row__meta">{ev.sub}</div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
