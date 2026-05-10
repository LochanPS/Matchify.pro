// Matchify.pro - Premier Badminton Tournament Platform
// Version: 1.0.4 - Brand theme + animated background
// Last Updated: May 9, 2026
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import AnimatedBackground from './components/AnimatedBackground'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { NotificationProvider } from './contexts/NotificationContext'
import { Toaster } from 'react-hot-toast'
import Navbar from './components/Navbar'
import ScrollToTop from './components/ScrollToTop'
import ProfileCompletionModal from './components/ProfileCompletionModal'
import MandatoryProfilePhotoModal from './components/MandatoryProfilePhotoModal'
import ImpersonationBanner from './components/ImpersonationBanner'
import ProtectedRoute from './components/ProtectedRoute'
import RoleRoute from './components/RoleRoute'
import HomePage from './pages/HomePageMobile'
import LoginPage from './pages/LoginPageMobile'
import RegisterPage from './pages/RegisterPageMobile'
import ProfilePage from './pages/ProfilePage'
import Wallet from './pages/Wallet'
import TournamentsPage from './pages/TournamentsPage'
import TournamentDetailPage from './pages/TournamentDetailPage'
import TournamentDiscoveryPage from './pages/TournamentDiscoveryPage'
import CreateTournament from './pages/CreateTournament'
import EditTournament from './pages/EditTournament'
import ViewDrawsPage from './pages/ViewDrawsPage'
import PlayerViewDrawsPage from './pages/PlayerViewDrawsPage'
import DrawPage from './pages/DrawPage'
import TournamentRegistrationPage from './pages/TournamentRegistrationPage'
import MyRegistrationsPage from './pages/MyRegistrationsPage'
import PartnerConfirmationPage from './pages/PartnerConfirmationPage'
import TournamentManagementPage from './pages/TournamentManagementPage'
import ManageCategoriesPage from './pages/ManageCategoriesPage'
import PlayerDashboard from './pages/PlayerDashboard'
import OrganizerDashboard from './pages/OrganizerDashboard'
import OrganizerProfilePage from './pages/OrganizerProfilePage'
import UmpireDashboard from './pages/UmpireDashboard'
import UnifiedDashboard from './pages/UnifiedDashboardMobile'
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
import NotificationsPage from './pages/NotificationsPage'
import AdminLayout from './pages/admin/AdminLayout'
import AdminDashboardPage from './pages/admin/AdminDashboardPage'
import UserManagementPage from './pages/admin/UserManagementPage'
import InviteManagementPage from './pages/admin/InviteManagementPage'
import AuditLogsPage from './pages/admin/AuditLogsPage'
import AcademyApprovalsPage from './pages/admin/AcademyApprovalsPage'
import CancellationRequestPage from './pages/CancellationRequestPage'
import NotificationDetailPage from './pages/NotificationDetailPage'
import RefundIssuePage from './pages/RefundIssuePage'
import SearchAcademiesPage from './pages/SearchAcademiesPage'
import AddAcademyPage from './pages/AddAcademyPage'
import TermsOfService from './pages/TermsOfService'
import PrivacyPolicy from './pages/PrivacyPolicy'

// Payment System Pages
import PaymentVerificationPage from './pages/admin/PaymentVerificationPage'
import RefundRequestsPage from './pages/admin/RefundRequestsPage'
import TournamentPaymentsPage from './pages/admin/TournamentPaymentsPage'
import OrganizerPayoutsPage from './pages/admin/OrganizerPayoutsPage'
import RevenueDashboardPage from './pages/admin/RevenueDashboardPage'
import QRSettingsPage from './pages/admin/QRSettingsPage'

// KYC features disabled
// import KYCSubmission from './pages/organizer/KYCSubmission'
// import VideoCallPage from './pages/organizer/VideoCallPage'
// import AdminKYCDashboard from './pages/admin/AdminKYCDashboard'

// Inner component that can access AuthContext
function AppContent() {
  const { user, showProfileCompletion, showProfilePhotoModal, completeProfile } = useAuth();
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

  // Hide Navbar for admin dashboard only (unified dashboard shows navbar)
  const shouldShowNavbar = !location.pathname.startsWith('/admin-dashboard');

  // Admin routes need full-width desktop layout — all other pages constrained
  // to 480px mobile-app width so they look identical on any phone or tablet.
  const isAdminRoute = location.pathname.startsWith('/admin-dashboard') ||
                       location.pathname.startsWith('/admin/')  ||
                       location.pathname === '/admin' ||
                       user?.isAdmin;

  return (
    <div className="min-h-screen" style={{ background: '#07071a' }}>
      {/* Global animated background — stars + glowing orbs + floating balloons, fixed behind every page */}
      <AnimatedBackground />
      <ScrollToTop />
      <ImpersonationBanner />
      <div className={isImpersonating() ? 'pt-[60px]' : ''}> {/* Add padding only when impersonating */}
        {shouldShowNavbar && <Navbar />}
      </div>
      
      {/* Mandatory Profile Photo Modal - CANNOT BE CLOSED */}
      {showProfilePhotoModal && user && !user.isAdmin && (
        <MandatoryProfilePhotoModal isOpen={showProfilePhotoModal} />
      )}
      
      {/* Profile Completion Modal - shows when user has incomplete profile */}
      {showProfileCompletion && user && (
        <ProfileCompletionModal
          user={user}
          onComplete={completeProfile}
        />
      )}
      
      {/* Page content — constrained to 480px on tablets/wide screens so the
          app looks identical on every phone. On phones ≤480px this wrapper
          is just 100% width — zero visual change for mobile users.
          Admin dashboard excluded (it has its own full-width sidebar layout). */}
      <div style={!isAdminRoute ? { maxWidth: '480px', margin: '0 auto', position: 'relative' } : {}}>
      <Routes>
            {/* Public routes */}
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/terms" element={<TermsOfService />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/tournaments" element={<TournamentDiscoveryPage />} />
          <Route path="/academies" element={<SearchAcademiesPage />} />
          <Route path="/academies/add" element={<AddAcademyPage />} />
          <Route path="/tournaments/:id" element={<TournamentDetailPage />} />
          <Route path="/tournaments/:tournamentId/draws/:categoryId?" element={<DrawPage />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
          
          {/* Notification routes */}
          <Route path="/notifications" element={
            <ProtectedRoute>
              <NotificationsPage />
            </ProtectedRoute>
          } />
          <Route path="/notifications/:id" element={
            <ProtectedRoute>
              <NotificationDetailPage />
            </ProtectedRoute>
          } />
          
          {/* Scoring routes */}
          <Route path="/matches" element={<MatchListPage />} />
          <Route path="/matches/live" element={<LiveMatches />} />
          <Route path="/matches/:matchId/live" element={<LiveMatchDetail />} />
          <Route path="/watch/:matchId" element={<SpectatorViewPage />} />
          <Route path="/tournament/:tournamentId/live" element={<LiveTournamentDashboard />} />
          <Route path="/scoring/:matchId" element={
            <ProtectedRoute>
              <RoleRoute allowedRoles={['UMPIRE', 'ORGANIZER']}>
                <ScoringConsolePage />
              </RoleRoute>
            </ProtectedRoute>
          } />
          
          {/* Conduct Match Page - for organizers to assign umpire and umpires to review settings before starting */}
          <Route path="/match/:matchId/conduct" element={
            <ProtectedRoute>
              <RoleRoute allowedRoles={['ORGANIZER', 'UMPIRE']}>
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
                <RoleRoute allowedRoles={['PLAYER', 'ORGANIZER', 'UMPIRE']}>
                  <TournamentRegistrationPage />
                </RoleRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/registrations"
            element={
              <ProtectedRoute>
                <RoleRoute allowedRoles={['PLAYER', 'ORGANIZER', 'UMPIRE']}>
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
                <RoleRoute allowedRoles={['ORGANIZER']}>
                  <CreateTournament />
                </RoleRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/tournaments/:id/categories"
            element={
              <ProtectedRoute>
                <RoleRoute allowedRoles={['ORGANIZER']}>
                  <ManageCategoriesPage />
                </RoleRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/tournaments/:id/edit"
            element={
              <ProtectedRoute>
                <RoleRoute allowedRoles={['ORGANIZER']}>
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
                <RoleRoute allowedRoles={['PLAYER', 'ORGANIZER', 'UMPIRE']}>
                  <MyPoints />
                </RoleRoute>
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <RoleRoute allowedRoles={['PLAYER', 'ORGANIZER', 'UMPIRE']}>
                  <UnifiedDashboard />
                </RoleRoute>
              </ProtectedRoute>
            }
          />
          
          {/* Legacy dashboard routes - redirect to unified dashboard */}
          <Route path="/player-dashboard" element={<Navigate to="/dashboard?role=PLAYER" replace />} />
          <Route path="/organizer/dashboard" element={<Navigate to="/dashboard?role=ORGANIZER" replace />} />
          <Route path="/umpire/dashboard" element={<Navigate to="/dashboard?role=UMPIRE" replace />} />
          
          {/* Player View Draws - Read Only */}
          <Route
            path="/player/tournaments/:id/draws"
            element={
              <ProtectedRoute>
                <RoleRoute allowedRoles={['PLAYER', 'ORGANIZER', 'UMPIRE']}>
                  <PlayerViewDrawsPage />
                </RoleRoute>
              </ProtectedRoute>
            }
          />
          
          {/* Organizer KYC Routes - DISABLED */}
          {/* <Route
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
          /> */}
          
          <Route
            path="/organizer/profile/:id?"
            element={
              <ProtectedRoute>
                <RoleRoute allowedRoles={['ORGANIZER']}>
                  <OrganizerProfilePage />
                </RoleRoute>
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/organizer/history"
            element={
              <ProtectedRoute>
                <RoleRoute allowedRoles={['ORGANIZER']}>
                  <OrganizerTournamentHistory />
                </RoleRoute>
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/organizer/categories/:categoryId"
            element={
              <ProtectedRoute>
                <RoleRoute allowedRoles={['ORGANIZER']}>
                  <TournamentCategoryDetails />
                </RoleRoute>
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/organizer/tournaments/:id"
            element={
              <ProtectedRoute>
                <RoleRoute allowedRoles={['ORGANIZER']}>
                  <TournamentManagementPage />
                </RoleRoute>
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/organizer/cancellation/:registrationId"
            element={
              <ProtectedRoute>
                <RoleRoute allowedRoles={['ORGANIZER']}>
                  <CancellationRequestPage />
                </RoleRoute>
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/umpire/scoring/:matchId"
            element={
              <ProtectedRoute>
                <RoleRoute allowedRoles={['UMPIRE']}>
                  <UmpireScoring />
                </RoleRoute>
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/match/:matchId/score"
            element={
              <ProtectedRoute>
                <RoleRoute allowedRoles={['UMPIRE', 'ORGANIZER']}>
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
          
          
          {/* New Admin Panel Routes */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route path="users" element={<UserManagementPage />} />
            <Route path="invites" element={<InviteManagementPage />} />
            <Route path="audit-logs" element={<AuditLogsPage />} />
            <Route path="academies" element={<AcademyApprovalsPage />} />
            {/* <Route path="kyc" element={<AdminKYCDashboard />} /> */}
            
            {/* Payment System Routes */}
            <Route path="payment-verifications" element={<PaymentVerificationPage />} />
            <Route path="refund-requests" element={<RefundRequestsPage />} />
            <Route path="tournament-payments" element={<TournamentPaymentsPage />} />
            <Route path="organizer-payouts" element={<OrganizerPayoutsPage />} />
            <Route path="revenue" element={<RevenueDashboardPage />} />
            <Route path="qr-settings" element={<QRSettingsPage />} />
          </Route>
          
          {/* Catch all route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>{/* end page-width constraint */}
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
              background: '#0d1a10',
              color: '#f1f5f9',
              border: '1px solid rgba(0,255,136,0.2)',
              boxShadow: '0 0 20px rgba(0,255,136,0.1)',
            },
            success: {
              iconTheme: {
                primary: '#00ff88',
                secondary: '#003320',
              },
            },
            error: {
              iconTheme: {
                primary: '#ff5050',
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