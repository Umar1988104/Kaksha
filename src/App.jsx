import { useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { RoleProvider, useRole } from './context/RoleContext'
import ProtectedRoute from './components/ProtectedRoute'
import Navbar from './components/Navbar'
import BottomNav from './components/BottomNav'
import OfflineBanner from './components/OfflineBanner'
import Splash from './components/Splash'
import Login from './pages/Login'
import Signup from './pages/Signup'
import ForgotPassword from './pages/ForgotPassword'
import Onboarding from './pages/Onboarding'
import Dashboard from './pages/Dashboard'
import Students from './pages/Students'
import StudentDetail from './pages/StudentDetail'
import Attendance from './pages/Attendance'
import Fees from './pages/Fees'
import Exams from './pages/Exams'
import ExamDetail from './pages/ExamDetail'
import Teachers from './pages/Teachers'
import Suggestions from './pages/Suggestions'
import Notices from './pages/Notices'
import CalendarPage from './pages/CalendarPage'
import Profile from './pages/Profile'
import Terms from './pages/Terms'
import TourModal from './components/TourModal'

function AppShell({ children }) {
  const { profile } = useRole()
  const [dismissed, setDismissed] = useState(false)
  const showTour = profile && !profile.hasSeenTour && !dismissed

  return (
    <div className="app-shell">
      <OfflineBanner />
      <Navbar />
      <main className="app-main">{children}</main>
      <BottomNav />
      {showTour && <TourModal onClose={() => setDismissed(true)} />}
    </div>
  )
}

// Onboarding needs a signed-in user but should redirect away once they
// already have a profile (role/org already set up).
function OnboardingRoute({ children }) {
  const { user } = useAuth()
  const { profile, loading } = useRole()
  if (user === undefined || loading) return <div className="screen-loading">Loading…</div>
  if (user === null) return <Navigate to="/login" replace />
  if (profile) return <Navigate to="/" replace />
  return children
}

function HeadOnlyRoute({ children }) {
  const { isHead, loading } = useRole()
  if (loading) return <div className="screen-loading">Loading…</div>
  if (!isHead) return <Navigate to="/" replace />
  return children
}

// Suggestions is used by BOTH the head (to view/resolve) and org teachers
// (to submit notes) — solo teachers have no org, so they're excluded.
function OrgRoute({ children }) {
  const { isHead, isOrgTeacher, loading } = useRole()
  if (loading) return <div className="screen-loading">Loading…</div>
  if (!isHead && !isOrgTeacher) return <Navigate to="/" replace />
  return children
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/terms" element={<Terms />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/onboarding" element={<OnboardingRoute><Onboarding /></OnboardingRoute>} />
      <Route path="/" element={<ProtectedRoute><AppShell><Dashboard /></AppShell></ProtectedRoute>} />
      <Route path="/students" element={<ProtectedRoute><AppShell><Students /></AppShell></ProtectedRoute>} />
      <Route path="/students/:id" element={<ProtectedRoute><AppShell><StudentDetail /></AppShell></ProtectedRoute>} />
      <Route path="/attendance" element={<ProtectedRoute><AppShell><Attendance /></AppShell></ProtectedRoute>} />
      <Route path="/fees" element={<ProtectedRoute><AppShell><Fees /></AppShell></ProtectedRoute>} />
      <Route path="/exams" element={<ProtectedRoute><AppShell><Exams /></AppShell></ProtectedRoute>} />
      <Route path="/exams/:id" element={<ProtectedRoute><AppShell><ExamDetail /></AppShell></ProtectedRoute>} />
      <Route path="/teachers" element={<ProtectedRoute><HeadOnlyRoute><AppShell><Teachers /></AppShell></HeadOnlyRoute></ProtectedRoute>} />
      <Route path="/suggestions" element={<ProtectedRoute><OrgRoute><AppShell><Suggestions /></AppShell></OrgRoute></ProtectedRoute>} />
      <Route path="/notices" element={<ProtectedRoute><AppShell><Notices /></AppShell></ProtectedRoute>} />
      <Route path="/calendar" element={<ProtectedRoute><AppShell><CalendarPage /></AppShell></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><AppShell><Profile /></AppShell></ProtectedRoute>} />
    </Routes>
  )
}

export default function App() {
  const [showSplash, setShowSplash] = useState(true)

  if (showSplash) {
    return <Splash onDone={() => setShowSplash(false)} />
  }

  return (
    <AuthProvider>
      <RoleProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </RoleProvider>
    </AuthProvider>
  )
}
