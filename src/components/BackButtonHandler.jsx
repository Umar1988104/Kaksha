import { useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Capacitor } from '@capacitor/core'
import { App as CapacitorApp } from '@capacitor/app'

export default function BackButtonHandler() {
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return // no-op on the regular website

    const listenerPromise = CapacitorApp.addListener('backButton', () => {
      if (location.pathname === '/') {
        CapacitorApp.exitApp()
      } else {
        navigate(-1)
      }
    })

    return () => {
      listenerPromise.then((listener) => listener.remove())
    }
  }, [location, navigate])

  return null
}
