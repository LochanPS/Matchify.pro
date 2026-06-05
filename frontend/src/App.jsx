// Matchify.pro - Premier Badminton Tournament Platform
// Version: 1.0.7 - Splash screen on first load
// Last Updated: Jun 2026
import { lazy, Suspense, Component, useEffect, useState } from 'react'
import api from './utils/api'
import SplashScreen from './components/SplashScreen'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import AnimatedBackground from './components/AnimatedBackground'
import LoadingScreen from './components/LoadingScreen'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { NotificationProvider } from './contexts/NotificationContext'
import { WebSocketProvider } from './contexts/WebSocketContext'
import { TransitionProvider } from './contexts/TransitionContext'
import { Toaster } from 'react-hot-toast'
import Navbar from './components/Navbar'
import ScrollToTop from './components/ScrollToTop'
import ProfileCompletionModal from './components/ProfileCompletionModal'
import MandatoryProfilePhotoModal from './components/MandatoryProfilePhotoModal'
import ImpersonationBanner from './components/ImpersonationBanner'
import ProtectedRoute from './components/ProtectedRoute'
import RoleRoute from './components/RoleRoute'
import SupportFooter from './components/SupportFooter'

// ── Lazy-loaded pages (loaded only when first visited) ──────────────────────
const HomePage                  = lazy(() => import('./pages/HomePageMobile'))
const LoginPage                 = lazy(() => import('./pages/LoginPageMobile'))
const RegisterPage              = lazy(() => import('./pages/RegisterPageMobile'))
const ProfilePage               = lazy(() => import('./pages/ProfilePage'))
// Wallet disabled for now
const TournamentsPage           = lazy(() => import('./pages/TournamentsPage'))
const TournamentDetailPage      = lazy(() => import('./pages/TournamentDetailPage'))
const TournamentDiscoveryPage   = lazy(() => import('./pages/TournamentDiscoveryPage'))
const CreateTournament          = lazy(() => import('./pages/CreateTournament'))
const EditTournament            = lazy(() => import('./pages/EditTournament'))
const ViewDrawsPage             = lazy(() => import('./pages/ViewDrawsPage'))
const PlayerViewDrawsPage       = lazy(() => import('./pages/PlayerViewDrawsPage'))
const DrawPage                  = lazy(() => import('./pages/DrawPage'))
const TournamentRegistrationPage = lazy(() => import('./pages/TournamentRegistrationPage'))
const MyRegistrationsPage       = lazy(() => import('./pages/MyRegistrationsPage'))
const PartnerConfirmationPage   = lazy(() => import('./pages/PartnerConfirmationPage'))
const TournamentManagementPage  = lazy(() => import('./pages/TournamentManagementPage'))
const ManageCategoriesPage      = lazy(() => import('./pages/ManageCategoriesPage'))
const OrganizerProfilePage      = lazy(() => import('./pages/OrganizerProfilePage'))
const UnifiedDashboard          = lazy(() => import('./pages/UnifiedDashboardMobile'))
const UmpireScoring             = lazy(() => import('./pages/UmpireScoring'))
const MatchScoringPage          = lazy(() => import('./pages/MatchScoringPage'))
const AdminDashboard            = lazy(() => import('./pages/AdminDashboard'))
const Leaderboard               = lazy(() => import('./pages/Leaderboard'))
const MyPoints                  = lazy(() => import('./pages/MyPoints'))
const ScoringConsolePage        = lazy(() => import('./pages/ScoringConsolePage'))
const MatchListPage             = lazy(() => import('./pages/MatchListPage'))
const SpectatorViewPage         = lazy(() => import('./pages/SpectatorViewPage'))
const ConductMatchPage          = lazy(() => import('./pages/ConductMatchPage'))
const QuickMatchPage            = lazy(() => import('./pages/QuickMatchPage'))
const LiveTournamentDashboard   = lazy(() => import('./pages/LiveTournamentDashboard'))
const LiveMatches               = lazy(() => import('./pages/LiveMatches'))
const LiveMatchDetail           = lazy(() => import('./pages/LiveMatchDetail'))
const TournamentLiveMatchesPage = lazy(() => import('./pages/TournamentLiveMatchesPage'))
const OrganizerTournamentHistory = lazy(() => import('./pages/OrganizerTournamentHistory'))
const TournamentCategoryDetails = lazy(() => import('./pages/TournamentCategoryDetails'))
const NotificationsPage         = lazy(() => import('./pages/NotificationsPage'))
const NotificationDetailPage    = lazy(() => import('./pages/NotificationDetailPage'))
const CancellationRequestPage   = lazy(() => import('./pages/CancellationRequestPage'))
const RefundIssuePage           = lazy(() => import('./pages/RefundIssuePage'))
const SearchAcademiesPage       = lazy(() => import('./pages/SearchAcademiesPage'))
const AcademyDetailPage         = lazy(() => import('./pages/AcademyDetailPage'))
const AddAcademyPage            = lazy(() => import('./pages/AddAcademyPage'))
const EditAcademyPage           = lazy(() => import('./pages/EditAcademyPage'))
const AcademyOwnerDashboard     = lazy(() => import('./pages/AcademyOwnerDashboard'))
const ManageCourtsPage          = lazy(() => import('./pages/ManageCourtsPage'))
const OwnerBookingsPage         = lazy(() => import('./pages/OwnerBookingsPage'))
const CourtBookingPage          = lazy(() => import('./pages/CourtBookingPage'))
const MyBookingsPage            = lazy(() => import('./pages/MyBookingsPage'))
const TermsOfService            = lazy(() => import('./pages/TermsOfService'))
const PrivacyPolicy             = lazy(() => import('./pages/PrivacyPolicy'))
const ForgotPasswordPage        = lazy(() => import('./pages/ForgotPasswordPage'))
const ResetPasswordPage         = lazy(() => import('./pages/ResetPasswordPage'))
// Admin layout & pages
const AdminLayout               = lazy(() => import('./pages/admin/AdminLayout'))
const UserManagementPage        = lazy(() => import('./pages/admin/UserManagementPage'))
const InviteManagementPage      = lazy(() => import('./pages/admin/InviteManagementPage'))
const AuditLogsPage             = lazy(() => import('./pages/admin/AuditLogsPage'))
const AcademyApprovalsPage      = lazy(() => import('./pages/admin/AcademyApprovalsPage'))
const AdminManageAcademiesPage  = lazy(() => import('./pages/admin/AdminManageAcademiesPage'))
const PaymentVerificationPage   = lazy(() => import('./pages/admin/PaymentVerificationPage'))
const RefundRequestsPage        = lazy(() => import('./pages/admin/RefundRequestsPage'))
const TournamentPaymentsPage    = lazy(() => import('./pages/admin/TournamentPaymentsPage'))
const OrganizerPayoutsPage      = lazy(() => import('./pages/admin/OrganizerPayoutsPage'))
const RevenueDashboardPage      = lazy(() => import('./pages/admin/RevenueDashboardPage'))
const QRSettingsPage            = lazy(() => import('./pages/admin/QRSettingsPage'))

// ── Chunk Error Boundary ─────────────────────────────────────────────────────
// Catches lazy-import failures (network blip, stale cache after deploy).
// ChunkLoadError / "Failed to fetch dynamically imported module" → auto-reload.
// Any other render error → show a tap-to-reload card.
class ChunkErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, reloading: false };
  }

  static getDerivedStateFromError(error) {
    const msg = error?.message || '';
    const isChunkError =
      error?.name === 'ChunkLoadError' ||
      msg.includes('Failed to fetch dynamically imported module') ||
      msg.includes('Loading chunk') ||
      msg.includes('Unexpected token');
    if (isChunkError) {
      // Reload once — prevents infinite loop by checking flag in sessionStorage
      if (!sessionStorage.getItem('_chunkReloaded')) {
        sessionStorage.setItem('_chunkReloaded', '1');
        window.location.reload();
        return { hasError: false, reloading: true };
      }
    }
    return { hasError: true, reloading: false };
  }

  componentDidCatch() {
    // Only clear the reload flag when we're showing the error UI (not reloading)
    // so the user can tap "Reload Page" and get a fresh attempt.
    if (!this.state.reloading) {
      sessionStorage.removeItem('_chunkReloaded');
    }
  }

  render() {
    if (this.state.reloading) return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: '#07071a',
      }}>
        <div style={{
          width: 40, height: 40, borderRadius: '50%',
          border: '3px solid rgba(0,212,255,0.15)',
          borderTopColor: '#00d4ff',
          animation: 'pageLoaderSpin 0.7s linear infinite',
        }} />
        <style>{`@keyframes pageLoaderSpin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '60vh', display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', gap: 16, padding: 24,
        }}>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14 }}>
            Something went wrong loading this page.
          </p>
          <button
            onClick={() => { sessionStorage.removeItem('_chunkReloaded'); window.location.reload(); }}
            style={{
              padding: '10px 24px', borderRadius: 12, border: '1px solid rgba(0,212,255,0.3)',
              background: 'rgba(0,212,255,0.1)', color: '#00d4ff', fontSize: 14,
              fontWeight: 700, cursor: 'pointer',
            }}
          >
            Reload Page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// Full-page loading fallback for Suspense (lazy-loaded routes)
function PageLoader() {
  return <LoadingScreen message="Loading..." />;
}

// Inner component that can access AuthContext
function AppContent() {
  const { user, showProfileCompletion, showProfilePhotoModal, setShowProfilePhotoModal, completeProfile } = useAuth();
  const location = useLocation();

  // ── Option D: Keepwarm ping ──────────────────────────────────────────────
  // Ping /api/health every 8 minutes to prevent Vercel cold starts.
  // Silent — no error shown, no retry, no auth needed.
  useEffect(() => {
    const ping = () =>
      api.get('/health', { _skipLogout: true, _noRetry: true, timeout: 5000 })
        .catch(() => {}); // always silent
    ping(); // warm up immediately on app load
    const t = setInterval(ping, 8 * 60 * 1000);
    return () => clearInterval(t);
  }, []);
  
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

  // Hide global Navbar on pages that have their own built-in fixed header.
  // /login and /register ALWAYS have their own header (hide global Navbar always).
  // / (HomePageMobile) only shows its own header when user is NOT logged in —
  // when logged in, the home page's header is hidden so we MUST show global Navbar.
  const alwaysOwnHeader = ['/login', '/register'];
  const shouldShowNavbar = !location.pathname.startsWith('/admin-dashboard') &&
                           !alwaysOwnHeader.includes(location.pathname) &&
                           !(location.pathname === '/' && !user);

  // Admin routes need full-width desktop layout — all other pages constrained
  // to 480px mobile-app width so they look identical on any phone or tablet.
  const isAdminRoute = location.pathname.startsWith('/admin-dashboard') ||
                       location.pathname.startsWith('/admin/')  ||
                       location.pathname === '/admin' ||
                       user?.isAdmin;

  return (
    <div className="min-h-screen" style={{ background: '#161730' }}>
      {/* Global animated background — stars + glowing orbs + floating balloons, fixed behind every page */}
      <AnimatedBackground fullWidth={isAdminRoute} />
      <ScrollToTop />
      <ImpersonationBanner />
      <div className={isImpersonating() ? 'pt-[60px]' : ''}> {/* Add padding only when impersonating */}
        {shouldShowNavbar && <Navbar />}
      </div>
      
      {/* Profile Photo Modal — skippable, re-prompts on next login */}
      {showProfilePhotoModal && user && !user.isAdmin && (
        <MandatoryProfilePhotoModal isOpen={showProfilePhotoModal} onSkip={() => setShowProfilePhotoModal(false)} />
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
      <ChunkErrorBoundary>
      <Suspense fallback={<PageLoader />}>
      <Routes>
            {/* Public routes */}
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/terms" element={<TermsOfService />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/tournaments" element={<TournamentDiscoveryPage />} />
          <Route path="/academies" element={<SearchAcademiesPage />} />
          <Route path="/academies/add" element={<AddAcademyPage />} />
          <Route path="/academies/:id" element={<AcademyDetailPage />} />
          <Route path="/academies/:id/edit" element={<ProtectedRoute><EditAcademyPage /></ProtectedRoute>} />
          <Route path="/academies/:academyId/courts/:courtId/book" element={
            <ProtectedRoute><CourtBookingPage /></ProtectedRoute>
          } />
          <Route path="/my-bookings" element={
            <ProtectedRoute><MyBookingsPage /></ProtectedRoute>
          } />
          <Route path="/my-academy" element={
            <ProtectedRoute><AcademyOwnerDashboard /></ProtectedRoute>
          } />
          <Route path="/owner/academies/:academyId/courts" element={
            <ProtectedRoute><ManageCourtsPage /></ProtectedRoute>
          } />
          <Route path="/owner/academies/:academyId/bookings" element={
            <ProtectedRoute><OwnerBookingsPage /></ProtectedRoute>
          } />
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
          
          {/* Quick Match — standalone scorer, no tournament required */}
          <Route path="/quick-match" element={
            <ProtectedRoute>
              <QuickMatchPage />
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
            path="/tournaments/:id/live"
            element={<TournamentLiveMatchesPage />}
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />
          
          {/* Wallet route disabled for now */}

          {/* /notifications defined above — duplicate removed */}
          
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
          <Route path="/admin" element={
            <ProtectedRoute>
              <RoleRoute allowedRoles={['ADMIN']}>
                <AdminLayout />
              </RoleRoute>
            </ProtectedRoute>
          }>
            <Route path="users" element={<UserManagementPage />} />
            <Route path="invites" element={<InviteManagementPage />} />
            <Route path="audit-logs" element={<AuditLogsPage />} />
            <Route path="academies" element={<AcademyApprovalsPage />} />
            <Route path="academies/manage" element={<AdminManageAcademiesPage />} />
            
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
      </Suspense>
      </ChunkErrorBoundary>
        {!isAdminRoute && <SupportFooter />}
      </div>{/* end page-width constraint */}
    </div>
  );
}

function App() {
  // Show splash screen once per browser session — not on every navigation
  const [showSplash, setShowSplash] = useState(() => {
    try {
      const seen = sessionStorage.getItem('_splashSeen');
      return !seen; // true = show splash, false = skip
    } catch {
      return true;
    }
  });

  const handleSplashComplete = () => {
    try { sessionStorage.setItem('_splashSeen', '1'); } catch {}
    setShowSplash(false);
  };

  return (
    <>
      {showSplash && <SplashScreen onComplete={handleSplashComplete} />}
    <AuthProvider>
      <NotificationProvider>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: {
              background: '#0d1a10',
              color: '#f1f5f9',
              border: '1px solid rgba(6,182,212,0.2)',
              boxShadow: '0 0 20px rgba(6,182,212,0.1)',
            },
            success: {
              iconTheme: {
                primary: '#06b6d4',
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
        <WebSocketProvider>
          <TransitionProvider>
            <AppContent />
          </TransitionProvider>
        </WebSocketProvider>
      </NotificationProvider>
    </AuthProvider>
    </>
  );
}

export default App