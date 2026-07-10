export function SkeletonRow() {
  return (
    <div className="skeleton-row">
      <div className="skeleton skeleton--circle" />
      <div style={{ flex: 1 }}>
        <div className="skeleton skeleton--line" style={{ width: '55%' }} />
        <div className="skeleton skeleton--line" style={{ width: '35%', marginTop: 8 }} />
      </div>
    </div>
  )
}

export function SkeletonList({ rows = 4 }) {
  return (
    <div className="card-list">
      {Array.from({ length: rows }).map((_, i) => <SkeletonRow key={i} />)}
    </div>
  )
}

export function SkeletonStatGrid() {
  return (
    <div className="stat-grid">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="stat-card">
          <div className="skeleton skeleton--icon" />
          <div className="skeleton skeleton--line" style={{ width: '60%', marginTop: 10 }} />
          <div className="skeleton skeleton--line skeleton--big" style={{ width: '45%', marginTop: 8 }} />
        </div>
      ))}
    </div>
  )
}
