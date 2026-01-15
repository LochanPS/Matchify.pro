import { useState } from 'react';
import { Trophy, Clock, MapPin, User, Users, Crown } from 'lucide-react';

const PyramidBracket = ({ matches, categoryName, format }) => {
  const [hoveredMatch, setHoveredMatch] = useState(null);

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
  const sortedRounds = Object.keys(roundsData).sort((a, b) => parseInt(b) - parseInt(a)); // Reverse: highest round first

  // Get round name
  const getRoundName = (roundNumber, matchCount) => {
    const totalRounds = sortedRounds.length;
    const roundIndex = sortedRounds.indexOf(roundNumber.toString());
    
    if (roundIndex === 0) return 'Final';
    if (roundIndex === 1) return 'Semi Finals';
    if (roundIndex === 2) return 'Quarter Finals';
    if (matchCount === 8) return 'Round of 16';
    if (matchCount === 16) return 'Round of 32';
    return `Round ${totalRounds - roundIndex}`;
  };

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

  // Calculate pyramid positions
  const calculatePositions = () => {
    const positions = [];
    const MATCH_HEIGHT = 120;
    const BASE_SPACING = 160;
    const VERTICAL_GAP = 180;
    
    sortedRounds.forEach((roundNumber, roundIndex) => {
      const roundMatches = roundsData[roundNumber];
      const matchCount = roundMatches.length;
      
      // Calculate vertical position (top to bottom: Final at top)
      const y = roundIndex * VERTICAL_GAP + 100;
      
      // Calculate horizontal spacing for this round
      // Each round doubles the spacing from the previous
      const spacing = BASE_SPACING * Math.pow(2, roundIndex);
      
      // Calculate total width needed for this round
      const totalWidth = (matchCount - 1) * spacing;
      
      // Starting X position (centered)
      const startX = -totalWidth / 2;
      
      roundMatches.forEach((match, matchIndex) => {
        // Calculate X position - evenly distributed
        const x = startX + (matchIndex * spacing);
        
        positions.push({
          match,
          x,
          y,
          roundIndex,
          matchIndex,
          roundName: getRoundName(roundNumber, matchCount)
        });
      });
    });
    
    return positions;
  };

  const positions = calculatePositions();
  
  // Calculate SVG viewBox to fit all matches
  const minX = Math.min(...positions.map(p => p.x)) - 200;
  const maxX = Math.max(...positions.map(p => p.x)) + 200;
  const minY = 0;
  const maxY = Math.max(...positions.map(p => p.y)) + 200;
  
  const viewBoxWidth = maxX - minX;
  const viewBoxHeight = maxY - minY;

  // Draw connector lines
  const drawConnectors = () => {
    const lines = [];
    
    positions.forEach((pos, idx) => {
      // Find child matches (matches in the next round that this match feeds into)
      const nextRoundIndex = pos.roundIndex - 1;
      if (nextRoundIndex >= 0) {
        const nextRoundPositions = positions.filter(p => p.roundIndex === nextRoundIndex);
        
        // This match feeds into the match at position floor(matchIndex / 2) in next round
        const childIndex = Math.floor(pos.matchIndex / 2);
        const childPos = nextRoundPositions[childIndex];
        
        if (childPos) {
          // Draw line from this match to child match
          const startX = pos.x;
          const startY = pos.y + 60; // Bottom of current match
          const endX = childPos.x;
          const endY = childPos.y - 20; // Top of child match
          
          // Calculate control points for smooth curve
          const midY = (startY + endY) / 2;
          
          lines.push(
            <path
              key={`line-${idx}`}
              d={`M ${startX} ${startY} Q ${startX} ${midY}, ${(startX + endX) / 2} ${midY} T ${endX} ${endY}`}
              stroke="url(#gradient)"
              strokeWidth="2"
              fill="none"
              opacity="0.3"
              className="transition-all duration-300"
            />
          );
        }
      }
    });
    
    return lines;
  };

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-12 overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob"></div>
        <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-2000"></div>
      </div>

      {/* Header */}
      <div className="relative z-10 text-center mb-12">
        <div className="inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-purple-500/10 to-indigo-500/10 rounded-2xl border border-purple-500/20 backdrop-blur-sm mb-4">
          <Trophy className="w-6 h-6 text-purple-400" />
          <h1 className="text-3xl font-bold text-white">{categoryName}</h1>
        </div>
        <p className="text-gray-400 mt-2">Knockout Bracket - {format}</p>
      </div>

      {/* Pyramid Bracket */}
      <div className="relative z-10 flex justify-center items-start px-8">
        <svg
          width="100%"
          height={viewBoxHeight + 100}
          viewBox={`${minX} ${minY} ${viewBoxWidth} ${viewBoxHeight}`}
          className="max-w-full"
          style={{ minHeight: '600px' }}
        >
          {/* Gradient definitions */}
          <defs>
            <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#a855f7" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#6366f1" stopOpacity="0.6" />
            </linearGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>

          {/* Connector lines */}
          <g className="connectors">
            {drawConnectors()}
          </g>

          {/* Match cards */}
          <g className="matches">
            {positions.map((pos, idx) => {
              const match = pos.match;
              const isHovered = hoveredMatch === match.id;
              const isCompleted = match.status === 'COMPLETED';
              const isLive = match.status === 'LIVE';
              
              const team1Id = format === 'SINGLES' ? match.player1Id : match.team1Player1Id;
              const team2Id = format === 'SINGLES' ? match.player2Id : match.team2Player1Id;
              
              const team1Name = getTeamName(match, team1Id);
              const team2Name = getTeamName(match, team2Id);
              const team1Score = getScore(match, team1Id);
              const team2Score = getScore(match, team2Id);
              
              const isTeam1Winner = match.winnerId === team1Id;
              const isTeam2Winner = match.winnerId === team2Id;

              const cardWidth = 280;
              const cardHeight = 100;
              const x = pos.x - cardWidth / 2;
              const y = pos.y;

              return (
                <g
                  key={match.id}
                  transform={`translate(${x}, ${y})`}
                  onMouseEnter={() => setHoveredMatch(match.id)}
                  onMouseLeave={() => setHoveredMatch(null)}
                  className="cursor-pointer transition-transform duration-300"
                  style={{
                    transform: isHovered ? 'translateY(-8px)' : 'translateY(0)',
                  }}
                >
                  {/* Halo effect */}
                  {isHovered && (
                    <rect
                      x="-4"
                      y="-4"
                      width={cardWidth + 8}
                      height={cardHeight + 8}
                      rx="16"
                      fill="url(#gradient)"
                      opacity="0.4"
                      filter="url(#glow)"
                      className="animate-pulse"
                    />
                  )}
                  
                  {/* Card background */}
                  <rect
                    width={cardWidth}
                    height={cardHeight}
                    rx="12"
                    fill="rgba(30, 41, 59, 0.95)"
                    stroke={isLive ? '#ef4444' : 'rgba(255, 255, 255, 0.1)'}
                    strokeWidth="2"
                    filter={isHovered ? 'url(#glow)' : ''}
                  />

                  {/* Match header */}
                  <rect
                    width={cardWidth}
                    height="24"
                    rx="12"
                    fill="rgba(51, 65, 85, 0.5)"
                  />
                  <text
                    x={cardWidth / 2}
                    y="16"
                    textAnchor="middle"
                    fill="#94a3b8"
                    fontSize="11"
                    fontWeight="600"
                  >
                    {pos.roundName} • Match {match.matchNumber}
                  </text>

                  {/* Live indicator */}
                  {isLive && (
                    <>
                      <circle cx="20" cy="12" r="4" fill="#ef4444" className="animate-pulse" />
                      <text x="30" y="16" fill="#ef4444" fontSize="10" fontWeight="700">
                        LIVE
                      </text>
                    </>
                  )}

                  {/* Team 1 */}
                  <g transform="translate(0, 28)">
                    <rect
                      width={cardWidth}
                      height="34"
                      fill={isTeam1Winner ? 'rgba(168, 85, 247, 0.15)' : 'transparent'}
                    />
                    <text
                      x="12"
                      y="22"
                      fill={isTeam1Winner ? '#ffffff' : '#d1d5db'}
                      fontSize="13"
                      fontWeight={isTeam1Winner ? '700' : '600'}
                    >
                      {team1Name.length > 28 ? team1Name.substring(0, 28) + '...' : team1Name}
                    </text>
                    {isTeam1Winner && (
                      <text x={cardWidth - 50} y="22" fill="#fbbf24" fontSize="16">
                        👑
                      </text>
                    )}
                    {team1Score && (
                      <text
                        x={cardWidth - 15}
                        y="22"
                        textAnchor="end"
                        fill={isTeam1Winner ? '#a855f7' : '#6b7280'}
                        fontSize="14"
                        fontWeight="700"
                      >
                        {team1Score.join('-')}
                      </text>
                    )}
                  </g>

                  {/* Divider */}
                  <line
                    x1="12"
                    y1="62"
                    x2={cardWidth - 12}
                    y2="62"
                    stroke="rgba(255, 255, 255, 0.1)"
                    strokeWidth="1"
                  />

                  {/* Team 2 */}
                  <g transform="translate(0, 62)">
                    <rect
                      width={cardWidth}
                      height="34"
                      fill={isTeam2Winner ? 'rgba(168, 85, 247, 0.15)' : 'transparent'}
                    />
                    <text
                      x="12"
                      y="22"
                      fill={isTeam2Winner ? '#ffffff' : '#d1d5db'}
                      fontSize="13"
                      fontWeight={isTeam2Winner ? '700' : '600'}
                    >
                      {team2Name.length > 28 ? team2Name.substring(0, 28) + '...' : team2Name}
                    </text>
                    {isTeam2Winner && (
                      <text x={cardWidth - 50} y="22" fill="#fbbf24" fontSize="16">
                        👑
                      </text>
                    )}
                    {team2Score && (
                      <text
                        x={cardWidth - 15}
                        y="22"
                        textAnchor="end"
                        fill={isTeam2Winner ? '#a855f7' : '#6b7280'}
                        fontSize="14"
                        fontWeight="700"
                      >
                        {team2Score.join('-')}
                      </text>
                    )}
                  </g>

                  {/* Completed badge */}
                  {isCompleted && !isLive && (
                    <rect
                      x={cardWidth - 70}
                      y="4"
                      width="60"
                      height="16"
                      rx="8"
                      fill="rgba(34, 197, 94, 0.2)"
                      stroke="rgba(34, 197, 94, 0.4)"
                      strokeWidth="1"
                    />
                  )}
                  {isCompleted && !isLive && (
                    <text
                      x={cardWidth - 40}
                      y="15"
                      textAnchor="middle"
                      fill="#22c55e"
                      fontSize="9"
                      fontWeight="700"
                    >
                      DONE
                    </text>
                  )}
                </g>
              );
            })}
          </g>
        </svg>
      </div>

      {/* Legend */}
      <div className="relative z-10 max-w-4xl mx-auto mt-12 px-8">
        <div className="bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
          <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Legend</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse"></div>
              <span className="text-sm text-gray-300">Live Match</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span className="text-sm text-gray-300">Completed</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-yellow-400">👑</span>
              <span className="text-sm text-gray-300">Winner</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-purple-500"></div>
              <span className="text-sm text-gray-300">Winning Team</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PyramidBracket;
