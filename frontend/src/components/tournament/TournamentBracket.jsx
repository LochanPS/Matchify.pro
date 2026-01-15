import { useState, useEffect } from 'react';
import { Trophy, Clock, MapPin, User, Users, ChevronRight } from 'lucide-react';

const TournamentBracket = ({ matches, categoryName, format }) => {
  const [hoveredMatch, setHoveredMatch] = useState(null);
  const [pointsTable, setPointsTable] = useState([]);

  // Organize matches by rounds
  const organizeByRounds = () => {
    const rounds = {};
    matches.forEach(match => {
      if (!rounds[match.round]) {
        rounds[match.round] = [];
      }
      rounds[match.round].push(match);
    });
    return rounds;
  };

  const roundsData = organizeByRounds();
  const sortedRounds = Object.keys(roundsData).sort((a, b) => parseInt(a) - parseInt(b));

  // Get round name based on number of matches
  const getRoundName = (roundNumber, matchCount) => {
    const totalRounds = sortedRounds.length;
    const roundIndex = sortedRounds.indexOf(roundNumber.toString());
    
    if (roundIndex === totalRounds - 1) return 'Final';
    if (roundIndex === totalRounds - 2) return 'Semi Finals';
    if (roundIndex === totalRounds - 3) return 'Quarter Finals';
    if (matchCount === 8) return 'Round of 16';
    if (matchCount === 16) return 'Round of 32';
    return `Round ${roundNumber}`;
  };

  // Calculate points table
  useEffect(() => {
    const teams = new Map();
    
    matches.forEach(match => {
      if (match.status === 'COMPLETED' && match.winnerId) {
        // Winner gets 2 points
        const winner = teams.get(match.winnerId) || { id: match.winnerId, name: getTeamName(match, match.winnerId), wins: 0, losses: 0, points: 0 };
        winner.wins += 1;
        winner.points += 2;
        teams.set(match.winnerId, winner);

        // Loser gets 0 points
        const loserId = getOpponentId(match, match.winnerId);
        if (loserId) {
          const loser = teams.get(loserId) || { id: loserId, name: getTeamName(match, loserId), wins: 0, losses: 0, points: 0 };
          loser.losses += 1;
          teams.set(loserId, loser);
        }
      }
    });

    const tableData = Array.from(teams.values()).sort((a, b) => b.points - a.points);
    setPointsTable(tableData);
  }, [matches]);

  const getTeamName = (match, teamId) => {
    if (format === 'SINGLES') {
      if (match.player1Id === teamId) return match.player1?.name || 'TBD';
      if (match.player2Id === teamId) return match.player2?.name || 'TBD';
    } else {
      if (match.team1Player1Id === teamId) {
        return `${match.team1Player1?.name || 'TBD'} / ${match.team1Player2?.name || 'TBD'}`;
      }
      if (match.team2Player1Id === teamId) {
        return `${match.team2Player1?.name || 'TBD'} / ${match.team2Player2?.name || 'TBD'}`;
      }
    }
    return 'TBD';
  };

  const getOpponentId = (match, winnerId) => {
    if (format === 'SINGLES') {
      return match.player1Id === winnerId ? match.player2Id : match.player1Id;
    } else {
      return match.team1Player1Id === winnerId ? match.team2Player1Id : match.team1Player1Id;
    }
  };

  const getScore = (match, teamId) => {
    if (!match.scoreJson) return null;
    try {
      const score = JSON.parse(match.scoreJson);
      if (format === 'SINGLES') {
        return teamId === match.player1Id ? score.player1 : score.player2;
      } else {
        return teamId === match.team1Player1Id ? score.team1 : score.team2;
      }
    } catch {
      return null;
    }
  };

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8">
      {/* Header */}
      <div className="mb-12 text-center">
        <div className="inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-purple-500/10 to-indigo-500/10 rounded-2xl border border-purple-500/20 backdrop-blur-sm mb-4">
          <Trophy className="w-6 h-6 text-purple-400" />
          <h1 className="text-3xl font-bold text-white">{categoryName}</h1>
        </div>
        <p className="text-gray-400 mt-2">Tournament Bracket - {format}</p>
      </div>

      <div className="flex gap-8">
        {/* Main Bracket Area */}
        <div className="flex-1 overflow-x-auto pb-8">
          <div className="inline-flex gap-12 min-w-full justify-center">
            {sortedRounds.map((roundNumber, roundIndex) => {
              const roundMatches = roundsData[roundNumber];
              const roundName = getRoundName(roundNumber, roundMatches.length);
              
              // Calculate vertical spacing - more space for later rounds
              const verticalSpacing = 80 * Math.pow(2, roundIndex);
              const topPadding = verticalSpacing / 2;

              return (
                <div key={roundNumber} className="relative flex flex-col" style={{ minWidth: '320px' }}>
                  {/* Round Header */}
                  <div className="sticky top-0 z-10 mb-8">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800/90 backdrop-blur-xl border border-white/10 rounded-xl shadow-lg">
                      <div className="w-2 h-2 rounded-full bg-gradient-to-r from-purple-500 to-indigo-500 animate-pulse"></div>
                      <span className="text-sm font-bold text-white">{roundName}</span>
                      <span className="text-xs text-gray-500">({roundMatches.length} matches)</span>
                    </div>
                  </div>

                  {/* Matches */}
                  <div className="flex flex-col gap-6" style={{ paddingTop: `${topPadding}px` }}>
                    {roundMatches.map((match, matchIndex) => {
                      const isHovered = hoveredMatch === match.id;
                      const isCompleted = match.status === 'COMPLETED';
                      const isLive = match.status === 'LIVE';
                      
                      // Get team IDs
                      const team1Id = format === 'SINGLES' ? match.player1Id : match.team1Player1Id;
                      const team2Id = format === 'SINGLES' ? match.player2Id : match.team2Player1Id;
                      
                      const team1Name = getTeamName(match, team1Id);
                      const team2Name = getTeamName(match, team2Id);
                      const team1Score = getScore(match, team1Id);
                      const team2Score = getScore(match, team2Id);
                      
                      const isTeam1Winner = match.winnerId === team1Id;
                      const isTeam2Winner = match.winnerId === team2Id;

                      return (
                        <div
                          key={match.id}
                          className="relative"
                          style={{ marginBottom: matchIndex < roundMatches.length - 1 ? `${verticalSpacing - 80}px` : '0' }}
                        >
                          {/* Match Card */}
                          <div
                            onMouseEnter={() => setHoveredMatch(match.id)}
                            onMouseLeave={() => setHoveredMatch(null)}
                            className={`
                              relative group cursor-pointer
                              transition-all duration-300 ease-out
                              ${isHovered ? 'scale-105 z-20' : 'scale-100'}
                            `}
                          >
                            {/* Halo Effect */}
                            <div className={`
                              absolute -inset-1 rounded-2xl transition-all duration-300
                              ${isLive ? 'bg-gradient-to-r from-red-500 via-orange-500 to-red-500 blur-lg opacity-50 animate-pulse' : ''}
                              ${isCompleted && !isLive ? 'bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 blur-lg opacity-0 group-hover:opacity-30' : ''}
                              ${!isCompleted && !isLive ? 'bg-gradient-to-r from-slate-600 via-slate-500 to-slate-600 blur-lg opacity-0 group-hover:opacity-20' : ''}
                            `}></div>

                            {/* Card Content */}
                            <div className={`
                              relative bg-slate-800/90 backdrop-blur-xl rounded-2xl overflow-hidden
                              border transition-all duration-300
                              ${isLive ? 'border-red-500/50 shadow-lg shadow-red-500/20' : 'border-white/10'}
                              ${isHovered ? 'shadow-2xl' : 'shadow-lg'}
                            `}>
                              {/* Match Header */}
                              <div className="px-4 py-2 bg-gradient-to-r from-slate-700/50 to-slate-800/50 border-b border-white/5 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-semibold text-gray-400">Match {match.matchNumber}</span>
                                  {isLive && (
                                    <span className="flex items-center gap-1 px-2 py-0.5 bg-red-500/20 text-red-400 text-xs font-bold rounded-full border border-red-500/30">
                                      <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></div>
                                      LIVE
                                    </span>
                                  )}
                                  {isCompleted && (
                                    <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs font-bold rounded-full border border-green-500/30">
                                      COMPLETED
                                    </span>
                                  )}
                                </div>
                                {match.courtNumber && (
                                  <div className="flex items-center gap-1 text-xs text-gray-500">
                                    <MapPin className="w-3 h-3" />
                                    Court {match.courtNumber}
                                  </div>
                                )}
                              </div>

                              {/* Team 1 */}
                              <div className={`
                                px-4 py-3 flex items-center justify-between transition-all
                                ${isTeam1Winner ? 'bg-gradient-to-r from-purple-500/10 to-transparent' : ''}
                                ${isHovered ? 'bg-white/5' : ''}
                              `}>
                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                  {format === 'SINGLES' ? (
                                    <User className={`w-5 h-5 flex-shrink-0 ${isTeam1Winner ? 'text-purple-400' : 'text-gray-500'}`} />
                                  ) : (
                                    <Users className={`w-5 h-5 flex-shrink-0 ${isTeam1Winner ? 'text-purple-400' : 'text-gray-500'}`} />
                                  )}
                                  <span className={`
                                    font-semibold truncate
                                    ${isTeam1Winner ? 'text-white' : 'text-gray-300'}
                                  `}>
                                    {team1Name}
                                  </span>
                                  {isTeam1Winner && (
                                    <Trophy className="w-4 h-4 text-yellow-400 flex-shrink-0" />
                                  )}
                                </div>
                                {team1Score && (
                                  <div className={`
                                    text-xl font-bold ml-3 flex-shrink-0
                                    ${isTeam1Winner ? 'text-purple-400' : 'text-gray-500'}
                                  `}>
                                    {team1Score.join('-')}
                                  </div>
                                )}
                              </div>

                              {/* Divider */}
                              <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>

                              {/* Team 2 */}
                              <div className={`
                                px-4 py-3 flex items-center justify-between transition-all
                                ${isTeam2Winner ? 'bg-gradient-to-r from-purple-500/10 to-transparent' : ''}
                                ${isHovered ? 'bg-white/5' : ''}
                              `}>
                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                  {format === 'SINGLES' ? (
                                    <User className={`w-5 h-5 flex-shrink-0 ${isTeam2Winner ? 'text-purple-400' : 'text-gray-500'}`} />
                                  ) : (
                                    <Users className={`w-5 h-5 flex-shrink-0 ${isTeam2Winner ? 'text-purple-400' : 'text-gray-500'}`} />
                                  )}
                                  <span className={`
                                    font-semibold truncate
                                    ${isTeam2Winner ? 'text-white' : 'text-gray-300'}
                                  `}>
                                    {team2Name}
                                  </span>
                                  {isTeam2Winner && (
                                    <Trophy className="w-4 h-4 text-yellow-400 flex-shrink-0" />
                                  )}
                                </div>
                                {team2Score && (
                                  <div className={`
                                    text-xl font-bold ml-3 flex-shrink-0
                                    ${isTeam2Winner ? 'text-purple-400' : 'text-gray-500'}
                                  `}>
                                    {team2Score.join('-')}
                                  </div>
                                )}
                              </div>

                              {/* Match Time */}
                              {match.scheduledTime && (
                                <div className="px-4 py-2 bg-slate-900/50 border-t border-white/5 flex items-center gap-2 text-xs text-gray-500">
                                  <Clock className="w-3 h-3" />
                                  {new Date(match.scheduledTime).toLocaleString()}
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Connector Line to Next Round */}
                          {roundIndex < sortedRounds.length - 1 && (
                            <div className="absolute top-1/2 -right-12 w-12 flex items-center justify-center">
                              <div className="w-full h-px bg-gradient-to-r from-purple-500/30 to-transparent"></div>
                              <ChevronRight className="absolute w-4 h-4 text-purple-500/50" />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Points Table Sidebar */}
        <div className="w-80 flex-shrink-0 sticky top-8 h-fit">
          <div className="bg-slate-800/90 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
            {/* Header */}
            <div className="px-6 py-4 bg-gradient-to-r from-purple-500/20 to-indigo-500/20 border-b border-white/10">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Trophy className="w-5 h-5 text-purple-400" />
                Points Table
              </h3>
            </div>

            {/* Table */}
            <div className="p-4">
              {pointsTable.length > 0 ? (
                <div className="space-y-2">
                  {pointsTable.map((team, index) => (
                    <div
                      key={team.id}
                      className={`
                        flex items-center gap-3 p-3 rounded-xl transition-all
                        ${index === 0 ? 'bg-gradient-to-r from-yellow-500/10 to-transparent border border-yellow-500/20' : 'bg-slate-700/30 hover:bg-slate-700/50'}
                      `}
                    >
                      <div className={`
                        w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm flex-shrink-0
                        ${index === 0 ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' : 'bg-slate-600/50 text-gray-400'}
                      `}>
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-white truncate">{team.name}</div>
                        <div className="text-xs text-gray-500">
                          {team.wins}W - {team.losses}L
                        </div>
                      </div>
                      <div className={`
                        text-lg font-bold flex-shrink-0
                        ${index === 0 ? 'text-yellow-400' : 'text-purple-400'}
                      `}>
                        {team.points}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Trophy className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">No completed matches yet</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TournamentBracket;
