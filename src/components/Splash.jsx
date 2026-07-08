import { useEffect, useState } from 'react'

export default function Splash({ onDone }) {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const t = setTimeout(() => {
      setVisible(false)
      onDone?.()
    }, 2000)
    return () => clearTimeout(t)
  }, [onDone])

  if (!visible) return null

  return (
    <div className="splash-screen">
      <img src="/icon-192.png" alt="Kaksha" className="splash-screen__logo" />
      <div className="splash-screen__name">Kaksha</div>
    </div>
  )
}
