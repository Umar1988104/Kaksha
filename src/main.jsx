import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import { Capacitor } from '@capacitor/core'
import { StatusBar, Style } from '@capacitor/status-bar'

// Only applies when running as the native Android app (via Capacitor) — has
// no effect on the regular website, so this is safe either way. Without
// this, the app's content draws underneath the phone's status bar instead
// of below it.
if (Capacitor.isNativePlatform()) {
  StatusBar.setOverlaysWebView({ overlay: false })
  StatusBar.setBackgroundColor({ color: '#1E2A4A' }) // matches navbar indigo
  StatusBar.setStyle({ style: Style.Light }) // light (white) status bar text/icons, for the dark navbar
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
