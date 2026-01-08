import React from 'react';
import MatchCard from './MatchCard';

const SingleEliminationBracket = ({ bracket, onMatchClick }) => {
  if (!bracket || !bracket.rounds) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No bracket data available</p>
      </div>
    );
  }

  // Get round names in order (Final, Semi-Final, Quarter-Final, etc.)
  const roundNames = Object.keys(bracket.rounds);
  
  // Sort rounds by number of matches (fewer matches = later round)
  const sortedRoundNames = roundNames.sort((a, b) => {
    return bracket.rounds[a].length - bracket.rounds[b].length;
  });

  // Calculate vertical spacing based on round
  const getVerticalSpacing = (roundIndex) => {
    // Double spacing for each previous round
    return Math.pow(2, roundIndex) * 100; // 100px base spacing
  };

  return (
    <div className="p-8 overflow-x-auto bg-gray-50">
      <div className="flex gap-20 items-start min-w-max">
        {sortedRoundNames.map((roundName, roundIndex) => {
          const roundMatches = bracket.rounds[roundName];
          const verticalSpacing = getVerticalSpacing(roundIndex);

          return (
            <div key={roundName} className="flex flex-col">
              {/* Round Header */}
              <div className="mb-6 text-center">
                <h3 className="text-xl font-bold text-gray-800">
                  {getRoundIcon(roundName)} {roundName}
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  {roundMatches.length} {roundMatches.length === 1 ? 'Match' : 'Matches'}
                </p>
              </div>

              {/* Matches */}
              <div 
                className="flex flex-col"
                style={{ 
                  gap: roundIndex === 0 ? '24px' : `${verticalSpacing - 100}px`,
                  marginTop: roundIndex > 0 ? `${(verticalSpacing - 100) / 2}px` : '0'
                }}
              >
                {roundMatches.map((match, matchIndex) => (
                  <div key={match.id} className="relative">
                    <MatchCard
                      match={match}
                      onClick={onMatchClick}
                    />

                    {/* Connector lines to next round */}
                    {roundIndex < sortedRoundNames.length - 1 && (
                      <svg
                        className="absolute left-full top-1/2 -translate-y-1/2 pointer-events-none"
                        width="80"
                        height={matchIndex % 2 === 0 ? verticalSpacing + 20 : 20}
                        style={{
                          marginTop: matchIndex % 2 === 0 ? '-10px' : '0',
                        }}
                      >
                        {/* Horizontal line from match */}
                        <line
                          x1="0"
                          y1={matchIndex % 2 === 0 ? 10 : 10}
                          x2="40"
                          y2={matchIndex % 2 === 0 ? 10 : 10}
                          stroke="#9CA3AF"
                          strokeWidth="2"
                        />
                        
                        {/* Vertical connector for pairs */}
                        {matchIndex % 2 === 0 && (
                          <>
                            <line
                              x1="40"
                              y1="10"
                              x2="40"
                              y2={verticalSpacing + 10}
                              stroke="#9CA3AF"
                              strokeWidth="2"
                            />
                            <line
                              x1="40"
                              y1={(verticalSpacing + 20) / 2}
                              x2="80"
                              y2={(verticalSpacing + 20) / 2}
                              stroke="#9CA3AF"
                              strokeWidth="2"
                            />
                          </>
                        )}
                      </svg>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Helper function to get round icons
const getRoundIcon = (roundName) => {
  if (roundName.includes('Final') && !roundName.includes('Semi') && !roundName.includes('Quarter')) {
    return '🏆';
  }
  if (roundName.includes('Semi')) {
    return '🥈';
  }
  if (roundName.includes('Quarter')) {
    return '🥉';
  }
  return '🎾';
};

export default SingleEliminationBracket;
