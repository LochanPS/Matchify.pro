import React from 'react';
import { Users } from 'lucide-react';

const DoublesRotationIndicator = ({
  isDoubles,
  currentServer,
  player1Team,
  player2Team,
  score
}) => {
  if (!isDoubles) return null;

  const getServerPosition = (team, isServing) => {
    if (!score || !score.currentScore) return null;
    const teamScore = team === 'player1' ? score.currentScore.player1 : score.currentScore.player2;
    const isEven = teamScore % 2 === 0;
    if (!isServing) return null;
    return isEven ? 'right' : 'left';
  };

  const player1ServerPos = currentServer === 'player1' ? getServerPosition('player1', true) : null;
  const player2ServerPos = currentServer === 'player2' ? getServerPosition('player2', true) : null;

  const TeamCard = ({ teamLabel, teamData, serverPos, isServing, accentColor, accentBg, accentBorder }) => (
    <div style={{
      background: isServing ? accentBg : 'rgba(255,255,255,0.03)',
      border: `1px solid ${isServing ? accentBorder : 'rgba(255,255,255,0.07)'}`,
      borderRadius: 12,
      padding: '12px 14px',
      transition: 'all 0.3s ease'
    }}>
      <p style={{
        fontSize: 11, fontWeight: 700,
        color: isServing ? accentColor : 'rgba(255,255,255,0.35)',
        textTransform: 'uppercase', letterSpacing: '0.08em',
        marginBottom: 10
      }}>{teamLabel} {isServing && '· Serving'}</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {[
          { name: teamData?.player1 || 'Player A', pos: serverPos === 'right' },
          { name: teamData?.player2 || 'Player B', pos: serverPos === 'left' }
        ].map(({ name, pos }, idx) => (
          <div key={idx} style={{
            display: 'flex', alignItems: 'center', gap: 8
          }}>
            <div style={{
              width: 7, height: 7, borderRadius: '50%', flexShrink: 0,
              background: (isServing && pos) ? accentColor : 'rgba(255,255,255,0.1)',
              boxShadow: (isServing && pos) ? `0 0 6px ${accentColor}` : 'none',
              transition: 'all 0.3s'
            }} />
            <span style={{
              fontSize: 13,
              fontWeight: (isServing && pos) ? 700 : 400,
              color: (isServing && pos) ? '#fff' : 'rgba(255,255,255,0.45)',
              flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
            }}>{name}</span>
            {isServing && pos && (
              <span style={{
                fontSize: 10, fontWeight: 600,
                color: accentColor,
                background: accentBg,
                padding: '2px 7px', borderRadius: 8
              }}>{serverPos === 'right' ? 'R' : 'L'}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div style={{
      background: 'linear-gradient(145deg, #0C1220, #0A0F1A)',
      border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: 14,
      padding: '14px 16px',
      marginBottom: 16
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <Users style={{ width: 14, height: 14, color: '#6B7280' }} />
        <p style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0 }}>
          Service Rotation
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <TeamCard
          teamLabel="Team 1"
          teamData={player1Team}
          serverPos={player1ServerPos}
          isServing={currentServer === 'player1'}
          accentColor="#FCD34D"
          accentBg="rgba(245,158,11,0.1)"
          accentBorder="rgba(245,158,11,0.25)"
        />
        <TeamCard
          teamLabel="Team 2"
          teamData={player2Team}
          serverPos={player2ServerPos}
          isServing={currentServer === 'player2'}
          accentColor="#C4B5FD"
          accentBg="rgba(139,92,246,0.1)"
          accentBorder="rgba(139,92,246,0.25)"
        />
      </div>

      <div style={{
        marginTop: 10,
        background: 'rgba(245,158,11,0.06)',
        border: '1px solid rgba(245,158,11,0.15)',
        borderRadius: 8, padding: '7px 12px'
      }}>
        <p style={{ fontSize: 11, color: 'rgba(245,158,11,0.7)', margin: 0 }}>
          Even score = Right court · Odd score = Left court
        </p>
      </div>
    </div>
  );
};

export default DoublesRotationIndicator;

