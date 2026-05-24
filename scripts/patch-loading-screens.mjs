/**
 * Replaces inline loading screens with <LoadingScreen message="..." />
 * across all frontend pages.
 *
 * Run: node scripts/patch-loading-screens.mjs
 */

import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..', 'frontend', 'src', 'pages');

const FILES = [
  'AcademyDetailPage.jsx',
  'AcademyOwnerDashboard.jsx',
  'AdminDashboard.jsx',
  'CancellationRequestPage.jsx',
  'CancellationRequestsPage.jsx',
  'ConductMatchPage.jsx',
  'CourtBookingPage.jsx',
  'EditTournament.jsx',
  'Leaderboard.jsx',
  'LiveMatchDetail.jsx',
  'LiveTournamentDashboard.jsx',
  'ManageCategoriesPage.jsx',
  'MatchScoringPage.jsx',
  'MyPoints.jsx',
  'MyRegistrationsPage.jsx',
  'OrganizerProfilePage.jsx',
  'PartnerConfirmationPage.jsx',
  'PlayerViewDrawsPage.jsx',
  'ProfilePage.jsx',
  'RefundIssuePage.jsx',
  'ScoringConsolePage.jsx',
  'SpectatorViewPage.jsx',
  'TournamentCategoryDetails.jsx',
  'TournamentDetailPage.jsx',
  'TournamentManagementPage.jsx',
  'TournamentRegistrationPage.jsx',
  'UmpireDashboard.jsx',
  'ViewDrawsPage.jsx',
  'Wallet.jsx',
];

const IMPORT_LINE = "import LoadingScreen from '../components/LoadingScreen';";

// Regex: matches the entire if (loading) { return (<div...>...</div>); } block
// Captures the message text inside <p> tags within the block.
// We match a generous multiline region.
const BLOCK_RE = /if\s*\(loading\)\s*\{\s*return\s*\(\s*<div[^>]*min-h-screen[^>]*>[\s\S]*?<\/div>\s*\)\s*;\s*\}/g;
const MSG_RE = />([^<]*Loading[^<]*)</i;

let totalPatched = 0;

for (const file of FILES) {
  const filePath = join(root, file);
  let src;
  try {
    src = readFileSync(filePath, 'utf8');
  } catch {
    console.warn(`  SKIP (not found): ${file}`);
    continue;
  }

  // Already patched?
  if (src.includes('LoadingScreen')) {
    console.log(`  SKIP (already has LoadingScreen): ${file}`);
    continue;
  }

  let patched = src;
  let changed = false;

  patched = patched.replace(BLOCK_RE, (match) => {
    const msgMatch = match.match(MSG_RE);
    const message = msgMatch
      ? msgMatch[1].trim().replace(/\s+/g, ' ')
      : 'Loading...';
    changed = true;
    return `if (loading) {\n    return <LoadingScreen message="${message}" />;\n  }`;
  });

  if (!changed) {
    console.warn(`  SKIP (pattern not matched): ${file}`);
    continue;
  }

  // Add import if missing
  if (!patched.includes(IMPORT_LINE)) {
    // Insert after the last existing import line
    patched = patched.replace(
      /(import[^\n]+\n)(?!import)/,
      `$1${IMPORT_LINE}\n`
    );
  }

  writeFileSync(filePath, patched, 'utf8');
  console.log(`  ✅ Patched: ${file}`);
  totalPatched++;
}

console.log(`\nDone. ${totalPatched} files patched.`);
