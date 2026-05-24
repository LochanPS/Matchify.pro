import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// ── CONFIG ────────────────────────────────────────────────────────────────────
const BASE_URL = 'https://matchify-probackend.vercel.app';
const TOKEN    = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIzMGFjYjkxNC05NmVlLTQ5Y2QtYmNlOC1hMTUxOWJmYjM4MzIiLCJyb2xlcyI6IlBMQVlFUiIsImlhdCI6MTc3OTQ2ODIzMiwiZXhwIjoxNzgyMDYwMjMyfQ.azWdXOzz61q1k-iwsNvA6Um_K2yeG5kbENS1d_IHimg';

// ⚠️ FILL IN YOUR TOURNAMENT ID from the URL when you open a tournament
const TOURNAMENT_ID = 'd6cba5e4-b535-4e09-877f-5dddf7973315';

// ── LOAD PROFILE ──────────────────────────────────────────────────────────────
export const options = {
  scenarios: {
    // Ramp up to 50 users over 30s, hold for 1 min, ramp down
    tournament_load: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '30s', target: 20 },  // ramp up to 20 users
        { duration: '1m',  target: 50 },  // ramp up to 50 users (peak)
        { duration: '30s', target: 50 },  // hold at 50
        { duration: '20s', target: 0  },  // ramp down
      ],
    },
  },
  thresholds: {
    http_req_duration: ['p(95)<3000'],  // 95% of requests under 3s
    http_req_failed:   ['rate<0.05'],   // less than 5% errors
  },
};

// ── CUSTOM METRICS ─────────────────────────────────────────────────────────────
const errorRate   = new Rate('errors');
const drawLatency = new Trend('draw_page_latency');

// ── HEADERS ───────────────────────────────────────────────────────────────────
const headers = {
  'Authorization': `Bearer ${TOKEN}`,
  'Content-Type': 'application/json',
};

// ── MAIN TEST FUNCTION ────────────────────────────────────────────────────────
export default function () {
  // 1. Health check / root ping
  const ping = http.get(`${BASE_URL}/api/health`, { headers });
  check(ping, { 'health ok': (r) => r.status < 500 });

  sleep(0.5);

  // 2. Get tournaments list (all users do this on login)
  const tournaments = http.get(`${BASE_URL}/api/tournaments`, { headers });
  check(tournaments, {
    'tournaments status 200': (r) => r.status === 200,
    'tournaments fast':       (r) => r.timings.duration < 2000,
  });
  errorRate.add(tournaments.status >= 500);

  sleep(0.3);

  // 3. Draw page fetch (heaviest endpoint — everyone views this during tournament)
  if (TOURNAMENT_ID !== 'YOUR_TOURNAMENT_ID_HERE') {
    const draw = http.get(
      `${BASE_URL}/api/tournaments/${TOURNAMENT_ID}/draw-page-full`,
      { headers }
    );
    drawLatency.add(draw.timings.duration);
    check(draw, {
      'draw page 200':   (r) => r.status === 200,
      'draw page <3s':   (r) => r.timings.duration < 3000,
    });
    errorRate.add(draw.status >= 500);

    sleep(0.3);

    // 4. Get matches for tournament
    const matches = http.get(
      `${BASE_URL}/api/tournaments/${TOURNAMENT_ID}/matches`,
      { headers }
    );
    check(matches, {
      'matches status ok': (r) => r.status < 500,
    });

    sleep(0.5);

    // 5. Get leaderboard / standings
    const leaderboard = http.get(
      `${BASE_URL}/api/tournaments/${TOURNAMENT_ID}/leaderboard`,
      { headers }
    );
    check(leaderboard, {
      'leaderboard status ok': (r) => r.status < 500,
    });
  }

  sleep(1);
}
