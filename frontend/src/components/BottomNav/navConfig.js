import { Trophy, LayoutDashboard, BarChart2, User } from 'lucide-react';

// ── Tab definitions ───────────────────────────────────────────────────────────
// To add a new tab: push an entry here. No other file needs to change.
// matchPaths: any pathname that starts with one of these strings activates this tab.
export const NAV_ITEMS = [
  {
    id: 'tournaments',
    label: 'Tournaments',
    icon: Trophy,
    path: '/tournaments',
    matchPaths: ['/tournaments', '/leaderboard', '/academies'],
  },
  {
    id: 'organizer',
    label: 'Organizer',
    icon: LayoutDashboard,
    path: '/dashboard',
    matchPaths: ['/dashboard', '/organizer'],
  },
  {
    id: 'scoring',
    label: 'Scoring',
    icon: BarChart2,
    path: '/matches',
    matchPaths: ['/matches', '/match/'],
  },
  {
    id: 'profile',
    label: 'Profile',
    icon: User,
    path: '/profile',
    matchPaths: ['/profile', '/registrations', '/my-points', '/notifications', '/my-bookings'],
  },
];

// ── Paths where the bottom nav is hidden ──────────────────────────────────────
// Full-screen experiences, auth screens, admin panel.
// Prefix match: any pathname that starts with one of these is hidden.
const HIDDEN_PREFIXES = [
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/terms',
  '/privacy',
  '/admin-dashboard',
  '/admin/',
  '/scoring/',
  '/umpire/scoring/',
  '/watch/',
  '/quick-match',
  '/partner/confirm/',
];

// Also hides when pathname ends with /score (active umpire/organiser scoring screen)
export function isBottomNavVisible(pathname, user) {
  if (!user || user.isAdmin) return false;
  if (pathname.endsWith('/score')) return false;
  return !HIDDEN_PREFIXES.some((p) => pathname === p || pathname.startsWith(p));
}

// Height of the nav bar in px (without safe-area). Import this wherever
// bottom padding needs to match the nav height.
export const BOTTOM_NAV_HEIGHT = 60;
