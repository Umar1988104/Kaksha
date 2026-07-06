import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import Navbar from './components/Navbar'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Students from './pages/Students'
import StudentDetail from './pages/StudentDetail'
import Attendance from './pages/Attendance'
import Fees from './pages/Fees'
import TestScores from './pages/TestScores'
import Profile from './pages/Profile'

function AppShell({ children }) {
  return (
    <div className="app-shell">
      <Navbar />
      <main className="app-main">{children}</main>
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<ProtectedRoute><AppShell><Dashboard /></AppShell></ProtectedRoute>} />
          <Route path="/students" element={<ProtectedRoute><AppShell><Students /></AppShell></ProtectedRoute>} />
          <Route path="/students/:id" element={<ProtectedRoute><AppShell><StudentDetail /></AppShell></ProtectedRoute>} />
          <Route path="/attendance" element={<ProtectedRoute><AppShell><Attendance /></AppShell></ProtectedRoute>} />
          <Route path="/fees" element={<ProtectedRoute><AppShell><Fees /></AppShell></ProtectedRoute>} />
          <Route path="/scores" element={<ProtectedRoute><AppShell><TestScores /></AppShell></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><AppShell><Profile /></AppShell></ProtectedRoute>} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
