import { Routes, Route, Navigate } from 'react-router-dom'
import { lazy, Suspense } from 'react'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { NotificationProvider } from './contexts/NotificationContext'
import Navbar from './components/Navbar'
import ProfileCompletionModal from './components/ProfileCompletionModal'
import ImpersonationBanner from './components/ImpersonationBanner'
import ProtectedRoute from './components/ProtectedRoute'
import RoleRoute from './components/RoleRoute'

// Loading component
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
    <div className="text-center">
      <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
      <p className="text-white text-lg">Loading...</p>
    </div>
  </div>
)

// Lazy load all pages - Critical pages loaded first
const HomePage = lazy(() => import('./pages/HomePage'))
const LoginPage = lazy(() => import('./pages/LoginPage'))
const RegisterPage = lazy(() => import('./pages/RegisterPage'))

// Player pages
const PlayerDashboard = lazy(() => import('./pages/PlayerDashboard'))
const ProfilePage = lazy(() => import('./pages/ProfilePage'))
const MyRegistrationsPage = lazy(() => import('./pages/MyRegistrationsPage'))
const MyPoints = lazy(() => import('./pages/MyPoints'))

// Tournament pages
const TournamentDiscoveryPage = lazy(() => import('./pages/TournamentDiscoveryPage'))
const TournamentDetailPage = lazy(() => import('./pages/TournamentDetailPage'))
const TournamentRegistrationPage = lazy(() => import('./pages/TournamentRegistrationPage'))
const ViewDrawsPage = lazy(() => import('./pages/ViewDrawsPage'))
const DrawPage = lazy(() => import('./pages/DrawPage'))
const Leaderboard = lazy(() => import('./pages/Leaderboard'))

// Organizer pages
const OrganizerDashboard = lazy(() => import('./pages/OrganizerDashboard'))
const CreateTournament = lazy(() => import('./pages/CreateTournament'))
const EditTournament = lazy(() => import('./pages/EditTournament'))
const ManageCategoriesPage = lazy(() => import('./pages/ManageCategoriesPage'))
const TournamentManagementPage = lazy(() => import('./pages/TournamentManagementPage'))
const OrganizerTournamentHistory = lazy(() => import('./pages/OrganizerTournamentHistory'))
const TournamentCategoryDetails = lazy(() => import('./pages/TournamentCategoryDetails'))
const CancellationRequestPage = lazy(() => import('./pages/CancellationRequestPage'))

// Organizer KYC pages
const KYCInfoPage = lazy(() => import('./pages/organizer/KYCInfoPage'))
const PhoneVerificationPage = lazy(() => import('./pages/organizer/PhoneVerificationPage'))
const KYCPaymentPage = lazy(() => import('./pages/organizer/KYCPaymentPage'))
const KYCSubmission = lazy(() => import('./pages/organizer/KYCSubmission'))
const VideoCallPage = lazy(() => import('./pages/organizer/VideoCallPage'))

// Umpire pages
const UmpireDashboard = lazy(() => import('./pages/UmpireDashboard'))
const UmpireScoring = lazy(() => import('./pages/UmpireScoring'))
const MatchScoringPage = lazy(() => import('./pages/MatchScoringPage'))
const ScoringConsolePage = lazy(() => import('./pages/ScoringConsolePage'))
const ConductMatchPage = lazy(() => import('./pages/ConductMatchPage'))

// Match/Live pages
const MatchListPage = lazy(() => import('./pages/MatchListPage'))
const LiveMatches = lazy(() => import('./pages/LiveMatches'))
const LiveMatchDetail = lazy(() => import('./pages/LiveMatchDetail'))
const SpectatorViewPage = lazy(() => import('./pages/SpectatorViewPage'))
const LiveTournamentDashboard = lazy(() => import('./pages/LiveTournamentDashboard'))

// Wallet/Credits pages
const Wallet = lazy(() => import('./pages/Wallet'))
const Credits = lazy(() => import('./pages/Credits'))

// Notification pages
const NotificationsPage = lazy(() => import('./pages/NotificationsPage'))
const NotificationDetailPage = lazy(() => import('./pages/NotificationDetailPage'))

// Other pages
const PartnerConfirmationPage = lazy(() => import('./pages/PartnerConfirmationPage'))
const AcceptInvite = lazy(() => import('./pages/AcceptInvite'))
const RefundIssuePage = lazy(() => import('./pages/RefundIssuePage'))
const SearchAcademiesPage = lazy(() => import('./pages/SearchAcademiesPage'))
const AddAcademyPage = lazy(() => import('./pages/AddAcademyPage'))
const BracketDemo = lazy(() => import('./pages/BracketDemo'))

// Admin pages
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'))
const AdminInvites = lazy(() => import('./pages/AdminInvites'))
const AdminLayout = lazy(() => import('./pages/admin/AdminLayout'))
const AdminDashboardPage = lazy(() => import('./pages/admin/AdminDashboardPage'))
const UserManagementPage = lazy(() => import('./pages/admin/UserManagementPage'))
const InviteManagementPage = lazy(() => import('./pages/admin/InviteManagementPage'))
const AuditLogsPage = lazy(() => import('./pages/admin/AuditLogsPage'))
const AcademyApprovalsPage = lazy(() => import('./pages/admin/AcademyApprovalsPage'))
const AdminKYCDashboard = lazy(() => import('./pages/admin/AdminKYCDashboard'))
const KYCPaymentVerification = lazy(() => import('./pages/admin/KYCPaymentVerification'))
const AdminVideoCallPage = lazy(() => import('./pages/admin/AdminVideoCallPage'))
const PhoneVerificationManagement = lazy(() => import('./pages/admin/PhoneVerificationManagement'))

// Inner component that can access AuthContext
function AppContent() {
  const { user, showProfileCompletion, completeProfile } = useAuth();
  
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

  return (
    <div className="min-h-screen bg-gray-50">
      <ImpersonationBanner />
      <div className={isImpersonating() ? 'pt-[60px]' : ''}> {/* Add padding only when impersonating */}
        <Navbar />
      </div>
      
      {/* Profile Completion Modal - shows when user has incomplete profile */}
      {showProfileCompletion && user && (
        <ProfileCompletionModal
          user={user}
          onComplete={completeProfile}
        />
      )}
      
      <Suspense fallback={<PageLoader />}>
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
            path="/organizer/kyc/info"
            element={
              <ProtectedRoute>
                <RoleRoute allowedRoles={['ORGANIZER']} blockAdmin={true}>
                  <KYCInfoPage />
                </RoleRoute>
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/organizer/kyc/phone-verify"
            element={
              <ProtectedRoute>
                <RoleRoute allowedRoles={['ORGANIZER']} blockAdmin={true}>
                  <PhoneVerificationPage />
                </RoleRoute>
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/organizer/kyc/payment"
            element={
              <ProtectedRoute>
                <RoleRoute allowedRoles={['ORGANIZER']} blockAdmin={true}>
                  <KYCPaymentPage />
                </RoleRoute>
              </ProtectedRoute>
            }
          />
          
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
            path="/admin/dashboard"
            element={
              <ProtectedRoute>
                <RoleRoute allowedRoles={['ADMIN']}>
                  <AdminDashboard />
                </RoleRoute>
              </ProtectedRoute>
            }
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
            <Route path="dashboard" element={<AdminDashboardPage />} />
            <Route path="users" element={<UserManagementPage />} />
            <Route path="invites" element={<InviteManagementPage />} />
            <Route path="audit-logs" element={<AuditLogsPage />} />
            <Route path="academies" element={<AcademyApprovalsPage />} />
            <Route path="kyc" element={<AdminKYCDashboard />} />
            <Route path="kyc/payments" element={<KYCPaymentVerification />} />
            <Route path="kyc/video-call" element={<AdminVideoCallPage />} />
            <Route path="kyc/phone-verifications" element={<PhoneVerificationManagement />} />
          </Route>
          
          {/* Catch all route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
      </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <AppContent />
      </NotificationProvider>
    </AuthProvider>
  );
}

export default App