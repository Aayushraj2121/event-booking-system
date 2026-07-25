import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { useAuth } from './context/auth'
import AuthPage from './pages/AuthPage'
import Dashboard from './pages/Dashboard'
import HomePage from './pages/HomePage'
import EventDetailPage from './pages/EventDetailPage'
import BookingPage from './pages/BookingPage'
import BookingConfirmationPage from './pages/BookingConfirmationPage'
import AdminPage from './pages/AdminPage'
import OrganizerPanel from './pages/OrganizerPanel'
import ReportsPage from './pages/ReportsPage'
import ProfilePage from './pages/ProfilePage'
import './App.css'

function ProtectedRoute({ children }) {
  const { user, isLoading } = useAuth()
  if (isLoading) return <div className="page-loader">Loading your space…</div>
  return user ? children : <Navigate to="/login" replace />
}

function AdminRoute({ children }) {
  const { user, isLoading } = useAuth()
  if (isLoading) return <div className="page-loader">Loading…</div>
  if (!user) return <Navigate to="/login" replace />
  if (user.role !== 'admin') return <Navigate to="/dashboard" replace />
  return children
}

function OrganizerRoute({ children }) {
  const { user, isLoading } = useAuth()
  if (isLoading) return <div className="page-loader">Loading…</div>
  if (!user) return <Navigate to="/login" replace />
  if (!['organizer', 'admin'].includes(user.role)) return <Navigate to="/dashboard" replace />
  return children
}

import NotificationToast from './components/NotificationToast'
import AiEventAssistant from './components/AiEventAssistant'

export default function App() {
  return (
    <AuthProvider>
      <NotificationToast />
      <BrowserRouter>
        <AiEventAssistant />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<AuthPage mode="login" />} />
          <Route path="/register" element={<AuthPage mode="register" />} />
          <Route path="/events/:id" element={<EventDetailPage />} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
          <Route path="/book/:eventId" element={<ProtectedRoute><BookingPage /></ProtectedRoute>} />
          <Route path="/booking/:id/confirmation" element={<ProtectedRoute><BookingConfirmationPage /></ProtectedRoute>} />
          <Route path="/organizer" element={<OrganizerRoute><OrganizerPanel /></OrganizerRoute>} />
          <Route path="/admin" element={<AdminRoute><AdminPage /></AdminRoute>} />
          <Route path="/admin/reports" element={<AdminRoute><ReportsPage /></AdminRoute>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
