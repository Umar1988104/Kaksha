import { useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { RoleProvider, useRole } from './context/RoleContext'
import ProtectedRoute from './components/ProtectedRoute'
import Navbar from './components/Navbar'
import BottomNav from './components/BottomNav'
import OfflineBanner from './components/OfflineBanner'
import BackButtonHandler from './components/BackButtonHandler'
import Splash from './components/Splash'
import Login from './pages/Login'
import Signup from './pages/Signup'
import ForgotPassword from './pages/ForgotPassword'
import Onboarding from './pages/Onboarding'
import Dashboard from './pages/Dashboard'
import Students from './pages/Students'
import StudentDetail from './pages/StudentDetail'
import ExamDetail from './pages/ExamDetail'
import Academics from './pages/Academics'
import Money from './pages/Money'
import Updates from './pages/Updates'
import Inbox from './pages/Inbox'
import Teachers from './pages/Teachers'
import Profile from './pages/Profile'
import Terms from './pages/Terms'
import ParentShell from './components/ParentShell'
import ParentDashboard from './pages/ParentDashboard'
import ParentMessages from './pages/ParentMessages'
import TourModal from './components/TourModal'
import WhatsNewModal from './components/WhatsNewModal'
import { CURRENT_VERSION } from './changelog'

function AppShell({ children }) {
  const { profile } = useRole()
  const [dismissed, setDismissed] = useState(false)
  const [whatsNewDismissed, setWhatsNewDismissed] = useState(false)
  const showTour = profile && !profile.hasSeenTour && !dismissed
  // Only show "What's New" once the tour is out of the way, and only if
  // they haven't already seen this version (brand-new users get the full
  // tour instead, which already covers everything current).
  const showWhatsNew = profile && profile.hasSeenTour && !showTour
    && profile.lastSeenVersion !== CURRENT_VERSION && !whatsNewDismissed

  return (
    <div className="app-shell">
      <BackButtonHandler />
      <OfflineBanner />
      <Navbar />
      <main className="app-main">{children}</main>
      <BottomNav />
      {showTour && <TourModal onClose={() => setDismissed(true)} />}
      {showWhatsNew && <WhatsNewModal onClose={() => setWhatsNewDismissed(true)} />}
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

// Parent-only pages — self-contained auth check (not nested inside
// ProtectedRoute, since that redirects parents to /parent already).
function ParentOnlyRoute({ children }) {
  const { user } = useAuth()
  const { profile, isParent, loading } = useRole()
  if (user === undefined || loading) return <div className="screen-loading">Loading…</div>
  if (user === null) return <Navigate to="/login" replace />
  if (profile === null) return <Navigate to="/onboarding" replace />
  if (!isParent) return <Navigate to="/" replace />
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
      <Route path="/academics" element={<ProtectedRoute><AppShell><Academics /></AppShell></ProtectedRoute>} />
      <Route path="/exams/:id" element={<ProtectedRoute><AppShell><ExamDetail /></AppShell></ProtectedRoute>} />
      <Route path="/money" element={<ProtectedRoute><AppShell><Money /></AppShell></ProtectedRoute>} />
      <Route path="/updates" element={<ProtectedRoute><AppShell><Updates /></AppShell></ProtectedRoute>} />
      <Route path="/teachers" element={<ProtectedRoute><HeadOnlyRoute><AppShell><Teachers /></AppShell></HeadOnlyRoute></ProtectedRoute>} />
      <Route path="/inbox" element={<ProtectedRoute><OrgRoute><AppShell><Inbox /></AppShell></OrgRoute></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><AppShell><Profile /></AppShell></ProtectedRoute>} />

      {/* Old bookmarked links keep working, just land on the right tab now */}
      <Route path="/attendance" element={<Navigate to="/academics?tab=attendance" replace />} />
      <Route path="/exams" element={<Navigate to="/academics?tab=exams" replace />} />
      <Route path="/homework" element={<Navigate to="/academics?tab=homework" replace />} />
      <Route path="/fees" element={<Navigate to="/money?tab=fees" replace />} />
      <Route path="/expenses" element={<Navigate to="/money?tab=expenses" replace />} />
      <Route path="/notices" element={<Navigate to="/updates?tab=notices" replace />} />
      <Route path="/calendar" element={<Navigate to="/updates?tab=calendar" replace />} />
      <Route path="/suggestions" element={<Navigate to="/inbox?tab=suggestions" replace />} />
      <Route path="/parent" element={<ParentOnlyRoute><ParentShell><ParentDashboard /></ParentShell></ParentOnlyRoute>} />
      <Route path="/parent/messages" element={<ParentOnlyRoute><ParentShell><ParentMessages /></ParentShell></ParentOnlyRoute>} />
      <Route path="/parent/profile" element={<ParentOnlyRoute><ParentShell><Profile /></ParentShell></ParentOnlyRoute>} />
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
