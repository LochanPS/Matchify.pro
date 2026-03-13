/**
 * Access Control Utilities for Match Viewing
 * Handles authorization logic for public/private tournaments
 */

/**
 * Check if user has access to a private tournament match
 * @param {Object} tournament - Tournament object with privacy and organizerId
 * @param {Object} match - Match object with player/team IDs
 * @param {String} userId - Current user ID (may be null)
 * @returns {Boolean} - True if user has access
 */
export function checkPrivateTournamentAccess(tournament, match, userId) {
  // Public tournaments are accessible to everyone
  if (tournament.privacy === 'public') {
    return true;
  }

  // Private tournaments require authentication
  if (!userId) {
    return false;
  }

  // Check if user is the organizer
  if (tournament.organizerId === userId) {
    return true;
  }

  // Check if user is a participant in the match
  const isParticipant =
    match.player1Id === userId ||
    match.player2Id === userId ||
    match.team1Player1Id === userId ||
    match.team1Player2Id === userId ||
    match.team2Player1Id === userId ||
    match.team2Player2Id === userId ||
    match.umpireId === userId;

  return isParticipant;
}

/**
 * Check if a match is publicly viewable
 * @param {Object} tournament - Tournament object with privacy setting
 * @returns {Boolean} - True if match is public
 */
export function isMatchPublic(tournament) {
  return tournament.privacy === 'public';
}

/**
 * Filter matches based on user access
 * @param {Array} matches - Array of match objects with tournament data
 * @param {String} userId - Current user ID (may be null)
 * @returns {Array} - Filtered array of accessible matches
 */
export function filterAccessibleMatches(matches, userId) {
  return matches.filter((match) => {
    return checkPrivateTournamentAccess(match.tournament, match, userId);
  });
}

/**
 * Get access error response
 * @param {Boolean} isAuthenticated - Whether user is authenticated
 * @returns {Object} - Error response object
 */
export function getAccessErrorResponse(isAuthenticated) {
  if (!isAuthenticated) {
    return {
      status: 401,
      message: 'Authentication required to view private tournament matches',
    };
  }

  return {
    status: 403,
    message: 'You do not have access to this match',
  };
}
