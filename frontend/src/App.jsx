import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import Navbar from './components/Navbar'
import ProtectedRoute from './components/ProtectedRoute'
import RoleRoute from './components/RoleRoute'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import PlayerDashboard from './pages/PlayerDashboard'
import OrganizerDashboard from './pages/OrganizerDashboard'
import UmpireDashboard from './pages/UmpireDashboard'
import AdminDashboard from './pages/AdminDashboard'

function App() {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          
          {/* Protected routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <RoleRoute allowedRoles={['PLAYER']}>
                  <PlayerDashboard />
                </RoleRoute>
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/organizer/dashboard"
            element={
              <ProtectedRoute>
                <RoleRoute allowedRoles={['ORGANIZER']}>
                  <OrganizerDashboard />
                </RoleRoute>
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/umpire/dashboard"
            element={
              <ProtectedRoute>
                <RoleRoute allowedRoles={['UMPIRE']}>
                  <UmpireDashboard />
                </RoleRoute>
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute>
                <RoleRoute allowedRoles={['ADMIN']}>
                  <AdminDashboard />
                </RoleRoute>
              </ProtectedRoute>
            }
          />
          
          {/* Catch all route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </AuthProvider>
  )
}

export default App