import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { NotificationProvider } from './contexts/NotificationContext'
import { Toaster } from 'react-hot-toast'
import Navbar from './components/Navbar'
import ProfileCompletionModal from './components/ProfileCompletionModal'
import ImpersonationBanner from './components/ImpersonationBanner'
import ProtectedRoute from './components/ProtectedRoute'
import RoleRoute from './components/RoleRoute'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import ProfilePage from './pages/ProfilePage'
import WalletPage from './pages/WalletPage'
import Wallet from './pages/Wallet'
import Credits from './pages/Credits'
import TournamentsPage from './pages/TournamentsPage'
import TournamentDetailPage from './pages/TournamentDetailPage'
import TournamentDiscoveryPage from './pages/TournamentDiscoveryPage'
import CreateTournament from './pages/CreateTournament'
import EditTournament from './pages/EditTournament'
import ViewDrawsPage from './pages/ViewDrawsPage'
import DrawPage from './pages/DrawPage'
import TournamentRegistrationPage from './pages/TournamentRegistrationPage'
import MyRegistrationsPage from './pages/MyRegistrationsPage'
import PartnerConfirmationPage from './pages/PartnerConfirmationPage'
import OrganizerDashboardPage from './pages/OrganizerDashboardPage'
import TournamentManagementPage from './pages/TournamentManagementPage'
import ManageCategoriesPage from './pages/ManageCategoriesPage'
import PlayerDashboard from './pages/PlayerDashboard'
import OrganizerDashboard from './pages/OrganizerDashboard'
import UmpireDashboard from './pages/UmpireDashboard'
import UmpireScoring from './pages/UmpireScoring'
import MatchScoringPage from './pages/MatchScoringPage'
import AdminDashboard from './pages/AdminDashboard'
import Leaderboard from './pages/Leaderboard'
import MyPoints from './pages/MyPoints'
import ScoringConsolePage from './pages/ScoringConsolePage'
import MatchListPage from './pages/MatchListPage'
import SpectatorViewPage from './pages/SpectatorViewPage'
import ConductMatchPage from './pages/ConductMatchPage'
import LiveTournamentDashboard from './pages/LiveTournamentDashboard'
import LiveMatches from './pages/LiveMatches'
import LiveMatchDetail from './pages/LiveMatchDetail'
import OrganizerTournamentHistory from './pages/OrganizerTournamentHistory'
import TournamentCategoryDetails from './pages/TournamentCategoryDetails'
import AdminInvites from './pages/AdminInvites'
import AcceptInvite from './pages/AcceptInvite'
import NotificationsPage from './pages/NotificationsPage'
import AdminLayout from './pages/admin/AdminLayout'
import AdminDashboardPage from './pages/admin/AdminDashboardPage'
import UserManagementPage from './pages/admin/UserManagementPage'
import BracketDemo from './pages/BracketDemo'
import InviteManagementPage from './pages/admin/InviteManagementPage'
import AuditLogsPage from './pages/admin/AuditLogsPage'
import AcademyApprovalsPage from './pages/admin/AcademyApprovalsPage'
import CancellationRequestPage from './pages/CancellationRequestPage'
import NotificationDetailPage from './pages/NotificationDetailPage'
import RefundIssuePage from './pages/RefundIssuePage'
import SearchAcademiesPage from './pages/SearchAcademiesPage'
import AddAcademyPage from './pages/AddAcademyPage'

// Payment System Pages
import PaymentVerificationPage from './pages/admin/PaymentVerificationPage'
import TournamentPaymentsPage from './pages/admin/TournamentPaymentsPage'
import OrganizerPayoutsPage from './pages/admin/OrganizerPayoutsPage'
import RevenueDashboardPage from './pages/admin/RevenueDashboardPage'
import QRSettingsPage from './pages/admin/QRSettingsPage'

import KYCSubmission from './pages/organizer/KYCSubmission'
import VideoCallPage from './pages/organizer/VideoCallPage'
import AdminKYCDashboard from './pages/admin/AdminKYCDashboard'

// Inner component that can access AuthContext
function AppContent() {
  const { user, showProfileCompletion, completeProfile } = useAuth();
  const location = useLocation();
  
  // Check if impersonating
  const isImpersonating = () => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return !!payload.isImpersonating;
      }
    } catch (error) {
      return false;
    }
    return false;
  };

  // Hide Navbar for admin dashboard (it has its own header)
  const shouldShowNavbar = !location.pathname.startsWith('/admin-dashboard');

  return (
    <div className="min-h-screen bg-gray-50">
      <ImpersonationBanner />
      <div className={isImpersonating() ? 'pt-[60px]' : ''}> {/* Add padding only when impersonating */}
        {shouldShowNavbar && <Navbar />}
      </div>
      
      {/* Profile Completion Modal - shows when user has incomplete profile */}
      {showProfileCompletion && user && (
        <ProfileCompletionModal
          user={user}
          onComplete={completeProfile}
        />
      )}
      
      <Routes>
            {/* Public routes */}
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/tournaments" element={<TournamentDiscoveryPage />} />
          <Route path="/academies" element={<SearchAcademiesPage />} />
          <Route path="/academies/add" element={<AddAcademyPage />} />
          <Route path="/tournaments/:id" element={<TournamentDetailPage />} />
          <Route path="/tournaments/:tournamentId/draws/:categoryId?" element={<DrawPage />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
          
          {/* Invite acceptance (public) */}
          <Route path="/invite/accept/:token" element={<AcceptInvite />} />
          
          {/* Bracket Demo */}
          <Route path="/bracket-demo" element={<BracketDemo />} />
          
          {/* Scoring routes */}
          <Route path="/matches" element={<MatchListPage />} />
          <Route path="/matches/live" element={<LiveMatches />} />
          <Route path="/matches/:matchId/live" element={<LiveMatchDetail />} />
          <Route path="/watch/:matchId" element={<SpectatorViewPage />} />
          <Route path="/tournament/:tournamentId/live" element={<LiveTournamentDashboard />} />
          <Route path="/scoring/:matchId" element={
            <ProtectedRoute>
              <RoleRoute allowedRoles={['UMPIRE', 'ORGANIZER']} blockAdmin={true}>
                <ScoringConsolePage />
              </RoleRoute>
            </ProtectedRoute>
          } />
          
          {/* Conduct Match Page - for organizers to assign umpire and start match */}
          <Route path="/match/:matchId/conduct" element={
            <ProtectedRoute>
              <RoleRoute allowedRoles={['ORGANIZER']} blockAdmin={true}>
                <ConductMatchPage />
              </RoleRoute>
            </ProtectedRoute>
          } />
          
          {/* Partner confirmation (public) */}
          <Route path="/partner/confirm/:token" element={<PartnerConfirmationPage />} />
          
          {/* Registration routes */}
          <Route
            path="/tournaments/:id/register"
            element={
              <ProtectedRoute>
                <RoleRoute allowedRoles={['PLAYER', 'ORGANIZER', 'UMPIRE']} blockAdmin={true}>
                  <TournamentRegistrationPage />
                </RoleRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/registrations"
            element={
              <ProtectedRoute>
                <RoleRoute allowedRoles={['PLAYER', 'ORGANIZER', 'UMPIRE']} blockAdmin={true}>
                  <MyRegistrationsPage />
                </RoleRoute>
              </ProtectedRoute>
            }
          />
          
          {/* Protected routes */}
          <Route
            path="/tournaments/create"
            element={
              <ProtectedRoute>
                <RoleRoute allowedRoles={['ORGANIZER']} blockAdmin={true}>
                  <CreateTournament />
                </RoleRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/tournaments/:id/categories"
            element={
              <ProtectedRoute>
                <RoleRoute allowedRoles={['ORGANIZER']} blockAdmin={true}>
                  <ManageCategoriesPage />
                </RoleRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/tournaments/:id/edit"
            element={
              <ProtectedRoute>
                <RoleRoute allowedRoles={['ORGANIZER']} blockAdmin={true}>
                  <EditTournament />
                </RoleRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/tournaments/:id/draws"
            element={<ViewDrawsPage />}
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/wallet"
            element={
              <ProtectedRoute>
                <Wallet />
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/credits"
            element={
              <ProtectedRoute>
                <Credits />
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/notifications"
            element={
              <ProtectedRoute>
                <NotificationsPage />
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/notifications/:notificationId"
            element={
              <ProtectedRoute>
                <NotificationDetailPage />
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/refund-issue/:registrationId"
            element={
              <ProtectedRoute>
                <RefundIssuePage />
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/my-points"
            element={
              <ProtectedRoute>
                <RoleRoute allowedRoles={['PLAYER', 'ORGANIZER', 'UMPIRE']} blockAdmin={true}>
                  <MyPoints />
                </RoleRoute>
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <RoleRoute allowedRoles={['PLAYER']} blockAdmin={true}>
                  <PlayerDashboard />
                </RoleRoute>
              </ProtectedRoute>
            }
          />
          
          {/* Organizer KYC Routes */}
          <Route
            path="/organizer/kyc/submit"
            element={
              <ProtectedRoute>
                <RoleRoute allowedRoles={['ORGANIZER']} blockAdmin={true}>
                  <KYCSubmission />
                </RoleRoute>
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/organizer/kyc/video-call"
            element={
              <ProtectedRoute>
                <RoleRoute allowedRoles={['ORGANIZER']} blockAdmin={true}>
                  <VideoCallPage />
                </RoleRoute>
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/organizer/dashboard"
            element={
              <ProtectedRoute>
                <RoleRoute allowedRoles={['ORGANIZER']} blockAdmin={true}>
                  <OrganizerDashboard />
                </RoleRoute>
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/organizer/history"
            element={
              <ProtectedRoute>
                <RoleRoute allowedRoles={['ORGANIZER']} blockAdmin={true}>
                  <OrganizerTournamentHistory />
                </RoleRoute>
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/organizer/categories/:categoryId"
            element={
              <ProtectedRoute>
                <RoleRoute allowedRoles={['ORGANIZER']} blockAdmin={true}>
                  <TournamentCategoryDetails />
                </RoleRoute>
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/organizer/tournaments/:id"
            element={
              <ProtectedRoute>
                <RoleRoute allowedRoles={['ORGANIZER']} blockAdmin={true}>
                  <TournamentManagementPage />
                </RoleRoute>
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/organizer/cancellation/:registrationId"
            element={
              <ProtectedRoute>
                <RoleRoute allowedRoles={['ORGANIZER']} blockAdmin={true}>
                  <CancellationRequestPage />
                </RoleRoute>
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/umpire/dashboard"
            element={
              <ProtectedRoute>
                <RoleRoute allowedRoles={['UMPIRE']} blockAdmin={true}>
                  <UmpireDashboard />
                </RoleRoute>
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/umpire/scoring/:matchId"
            element={
              <ProtectedRoute>
                <RoleRoute allowedRoles={['UMPIRE']} blockAdmin={true}>
                  <UmpireScoring />
                </RoleRoute>
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/match/:matchId/score"
            element={
              <ProtectedRoute>
                <RoleRoute allowedRoles={['UMPIRE', 'ORGANIZER']} blockAdmin={true}>
                  <MatchScoringPage />
                </RoleRoute>
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/admin-dashboard"
            element={
              <ProtectedRoute>
                <RoleRoute allowedRoles={['ADMIN']}>
                  <AdminDashboard />
                </RoleRoute>
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/admin/dashboard"
            element={<Navigate to="/admin-dashboard" replace />}
          />
          
          <Route
            path="/admin/invites"
            element={
              <ProtectedRoute>
                <RoleRoute allowedRoles={['ADMIN']}>
                  <AdminInvites />
                </RoleRoute>
              </ProtectedRoute>
            }
          />
          
          {/* New Admin Panel Routes */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route path="users" element={<UserManagementPage />} />
            <Route path="invites" element={<InviteManagementPage />} />
            <Route path="audit-logs" element={<AuditLogsPage />} />
            <Route path="academies" element={<AcademyApprovalsPage />} />
            <Route path="kyc" element={<AdminKYCDashboard />} />
            
            {/* Payment System Routes */}
            <Route path="payment-verifications" element={<PaymentVerificationPage />} />
            <Route path="tournament-payments" element={<TournamentPaymentsPage />} />
            <Route path="organizer-payouts" element={<OrganizerPayoutsPage />} />
            <Route path="revenue" element={<RevenueDashboardPage />} />
            <Route path="qr-settings" element={<QRSettingsPage />} />
          </Route>
          
          {/* Catch all route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: {
              background: '#1e293b',
              color: '#fff',
              border: '1px solid #334155',
            },
            success: {
              iconTheme: {
                primary: '#14b8a6',
                secondary: '#fff',
              },
            },
            error: {
              iconTheme: {
                primary: '#ef4444',
                secondary: '#fff',
              },
            },
          }}
        />
        <AppContent />
      </NotificationProvider>
    </AuthProvider>
  );
}

export default App