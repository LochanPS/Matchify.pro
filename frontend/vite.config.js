import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunks - separate large libraries
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui-vendor': ['@heroicons/react', 'lucide-react'],
          'chart-vendor': ['recharts'],
          'form-vendor': ['react-hook-form'],
          
          // Feature-based chunks
          'admin': [
            './src/pages/admin/AdminLayout.jsx',
            './src/pages/admin/AdminDashboardPage.jsx',
            './src/pages/admin/UserManagementPage.jsx',
            './src/pages/admin/InviteManagementPage.jsx',
            './src/pages/admin/AuditLogsPage.jsx',
            './src/pages/admin/AcademyApprovalsPage.jsx',
            './src/pages/admin/AdminKYCDashboard.jsx',
            './src/pages/admin/KYCPaymentVerification.jsx',
            './src/pages/admin/AdminVideoCallPage.jsx',
            './src/pages/admin/PhoneVerificationManagement.jsx',
          ],
          'organizer': [
            './src/pages/OrganizerDashboard.jsx',
            './src/pages/CreateTournament.jsx',
            './src/pages/EditTournament.jsx',
            './src/pages/TournamentManagementPage.jsx',
            './src/pages/ManageCategoriesPage.jsx',
          ],
          'kyc': [
            './src/pages/organizer/KYCInfoPage.jsx',
            './src/pages/organizer/PhoneVerificationPage.jsx',
            './src/pages/organizer/KYCPaymentPage.jsx',
            './src/pages/organizer/KYCSubmission.jsx',
            './src/pages/organizer/VideoCallPage.jsx',
          ],
          'scoring': [
            './src/pages/UmpireScoring.jsx',
            './src/pages/MatchScoringPage.jsx',
            './src/pages/ScoringConsolePage.jsx',
            './src/pages/ConductMatchPage.jsx',
          ],
          'live': [
            './src/pages/LiveMatches.jsx',
            './src/pages/LiveMatchDetail.jsx',
            './src/pages/LiveTournamentDashboard.jsx',
            './src/pages/SpectatorViewPage.jsx',
          ],
        },
      },
    },
    chunkSizeWarningLimit: 1000, // Increase limit to 1000kb to reduce warnings
  },
  define: {
    'process.env': process.env
  }
})