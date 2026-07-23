// ── Sport traits (backend) ───────────────────────────────────────────────────
// Single source of truth for which sports register a TEAM (name + roster)
// instead of an individual or a pair. Mirrors frontend/src/config/sports.js.
// Adding a team sport = one entry here; no other file needs a sport name.

export const TEAM_SPORTS = ['Basketball']; // Football to follow

export const isTeamSport = (sport) => TEAM_SPORTS.includes(sport);

// Minimum roster size for a team entry (FIBA: five players on court).
export const MIN_ROSTER = 5;
