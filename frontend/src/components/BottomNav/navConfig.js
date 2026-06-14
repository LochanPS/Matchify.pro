import { Trophy, LayoutDashboard, GraduationCap, User } from 'lucide-react';

// ── Tab definitions ───────────────────────────────────────────────────────────
// To add a new tab: push an entry here. No other file needs to change.
// matchPaths: any pathname that starts with one of these strings activates this tab.
export const NAV_ITEMS = [
  {
    id: 'tournaments',
    label: 'Tournaments',
    icon: Trophy,
    path: '/tournaments',
    matchPaths: ['/tournaments', '/leaderboard'],
    requiresAuth: false,
  },
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
    path: '/dashboard',
    matchPaths: ['/dashboard', '/organizer'],
    requiresAuth: true,
  },
  {
    id: 'academies',
    label: 'Academies',
    icon: GraduationCap,
    path: '/academies',
    matchPaths: ['/academies'],
    requiresAuth: false,
  },
  {
    id: 'profile',
    label: 'Profile',
    icon: User,
    path: '/profile',
    matchPaths: ['/profile', '/registrations', '/my-points', '/notifications', '/my-bookings'],
    requiresAuth: true,
  },
];

// ── Allowlist: nav shows ONLY on these exact main pages ───────────────────────
// Anything not in this set (detail pages, draws, scoring, auth, admin) gets no nav.
const NAV_PAGES = new Set([
  '/',
  '/tournaments',
  '/leaderboard',
  '/dashboard',
  '/academies',
  '/profile',
  '/registrations',
  '/my-points',
  '/notifications',
  '/my-bookings',
]);

export function isBottomNavVisible(pathname, user) {
  if (user?.isAdmin) return false;
  return NAV_PAGES.has(pathname);
}

// Height of the nav bar in px (without safe-area). Import this wherever
// bottom padding needs to match the nav height.
export const BOTTOM_NAV_HEIGHT = 60;
