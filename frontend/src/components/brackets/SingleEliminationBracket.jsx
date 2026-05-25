import React from 'react';
import MatchCard from './MatchCard';

const CARD_W = 224;
const CONN_W = 44;
const SLOT_H = 220;
const LINE   = 'rgba(245,158,11,0.5)';

const getRoundLabel = (roundName) => {
  const n = roundName.toLowerCase();
  if (n.includes('final') && !n.includes('semi') && !n.includes('quarter')) return 'Final';
  if (n.includes('semi')) return 'Semi Finals';
  if (n.includes('quarter')) return 'Quarter Finals';
  return roundName;
};

const SingleEliminationBracket = ({ bracket, onMatchClick }) => {
  if (!bracket || !bracket.rounds) {
    return (
      <div style={{ textAlign: 'center', padding: '48px 24px' }}>
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '14px' }}>No bracket data available</p>
      </div>
    );
  }

  const roundNames = Object.keys(bracket.rounds);
  const sortedRoundNames = [...roundNames].sort(
    (a, b) => bracket.rounds[a].length - bracket.rounds[b].length
  );
  const totalRounds = sortedRoundNames.length;

  return (
    <div style={{ padding: '10px' }}>
      <div style={{
        background: '#0d1625',
        borderRadius: '18px',
        border: '1px solid rgba(255,255,255,0.08)',
        overflow: 'hidden',
      }}>

        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '14px 16px',
          borderBottom: '1px solid rgba(255,255,255,0.07)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '40px', height: '40px', borderRadius: '12px',
              background: 'linear-gradient(135deg,#FCD34D,#D97706)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#050810" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
                <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
                <path d="M4 22h16" />
                <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
                <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
                <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
              </svg>
            </div>
            <div>
              <div style={{ fontSize: '15px', fontWeight: 700, color: '#ffffff', lineHeight: 1.2 }}>
                Knockout Bracket
              </div>
              <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                {totalRounds} {totalRounds === 1 ? 'Round' : 'Rounds'}
              </div>
            </div>
          </div>
          {totalRounds > 1 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'rgba(255,255,255,0.25)', fontSize: '11px', fontWeight: 500 }}>
              <span>scroll →</span>
            </div>
          )}
        </div>

        {/* Scrollable bracket */}
        <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
          <div style={{ minWidth: 'max-content', padding: '12px 12px 20px' }}>

            {/* Round labels row */}
            <div style={{ display: 'flex', marginBottom: '12px' }}>
              {sortedRoundNames.map((roundName, ri) => (
                <React.Fragment key={ri}>
                  <div style={{ width: CARD_W, flexShrink: 0 }}>
                    <div style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                      padding: '7px 12px', borderRadius: '10px',
                      background: ri === totalRounds - 1 ? 'rgba(245,158,11,0.12)' : 'rgba(255,255,255,0.05)',
                      border: ri === totalRounds - 1 ? '1px solid rgba(245,158,11,0.3)' : '1px solid rgba(255,255,255,0.09)',
                    }}>
                      <span style={{
                        fontSize: '11px', fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase',
                        color: ri === totalRounds - 1 ? '#FCD34D' : 'rgba(255,255,255,0.5)',
                      }}>
                        {getRoundLabel(roundName)}
                      </span>
                    </div>
                  </div>
                  {ri < totalRounds - 1 && <div style={{ width: CONN_W, flexShrink: 0 }} />}
                </React.Fragment>
              ))}
            </div>

            {/* Match slots + connectors */}
            <div style={{ display: 'flex', alignItems: 'flex-start' }}>
              {sortedRoundNames.map((roundName, ri) => {
                const roundMatches = bracket.rounds[roundName];
                const slotH = SLOT_H * Math.pow(2, ri);

                return (
                  <React.Fragment key={ri}>
                    {/* Round column */}
                    <div style={{ width: CARD_W, flexShrink: 0 }}>
                      {roundMatches.map((match, mi) => (
                        <div key={match.id || mi} style={{ height: slotH, display: 'flex', alignItems: 'center' }}>
                          <div style={{ width: '100%' }}>
                            <MatchCard match={match} onClick={onMatchClick} />
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Connector column */}
                    {ri < totalRounds - 1 && (
                      <div style={{ width: CONN_W, flexShrink: 0, position: 'relative', height: roundMatches.length * slotH }}>
                        {roundMatches.map((_, mi) => {
                          if (mi % 2 !== 0) return null;
                          if (!roundMatches[mi + 1]) return null;

                          const topCenter = mi * slotH + slotH / 2;
                          const botCenter = (mi + 1) * slotH + slotH / 2;
                          const midY      = (topCenter + botCenter) / 2;
                          const spineX    = CONN_W / 2;

                          return (
                            <React.Fragment key={mi}>
                              <div style={{ position: 'absolute', top: topCenter - 0.75, left: 0, width: spineX, height: 1.5, background: LINE }} />
                              <div style={{ position: 'absolute', top: botCenter - 0.75, left: 0, width: spineX, height: 1.5, background: LINE }} />
                              <div style={{ position: 'absolute', top: topCenter, left: spineX - 0.75, width: 1.5, height: botCenter - topCenter, background: LINE }} />
                              <div style={{ position: 'absolute', top: midY - 0.75, left: spineX, width: spineX, height: 1.5, background: LINE }} />
                            </React.Fragment>
                          );
                        })}
                      </div>
                    )}
                  </React.Fragment>
                );
              })}
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};

export default SingleEliminationBracket;
