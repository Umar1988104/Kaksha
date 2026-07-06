export function todayISO() {
  return new Date().toISOString().slice(0, 10) // YYYY-MM-DD
}

export function currentMonthKey() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}` // YYYY-MM
}

export function monthLabel(monthKey) {
  const [y, m] = monthKey.split('-')
  const d = new Date(Number(y), Number(m) - 1, 1)
  return d.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
}

export function lastNMonthKeys(n = 6) {
  const out = []
  const d = new Date()
  for (let i = 0; i < n; i++) {
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    out.push(key)
    d.setMonth(d.getMonth() - 1)
  }
  return out
}
