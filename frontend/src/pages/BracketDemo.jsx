import { useState } from 'react';
import TournamentBracket from '../components/tournament/TournamentBracket';
import PyramidBracket from '../components/tournament/PyramidBracket';

const BracketDemo = () => {
  const [viewMode, setViewMode] = useState('pyramid'); // 'linear' or 'pyramid'
  // Sample data for demonstration
  const sampleMatches = [
    // Round of 16 (Round 1)
    {
      id: '1',
      round: 1,
      matchNumber: 1,
      courtNumber: 1,
      player1Id: 'p1',
      player2Id: 'p2',
      player1: { name: 'John Doe' },
      player2: { name: 'Jane Smith' },
      status: 'COMPLETED',
      winnerId: 'p1',
      scoreJson: JSON.stringify({ player1: [21, 21], player2: [15, 18] }),
      scheduledTime: new Date('2026-01-20T09:00:00').toISOString()
    },
    {
      id: '2',
      round: 1,
      matchNumber: 2,
      courtNumber: 2,
      player1Id: 'p3',
      player2Id: 'p4',
      player1: { name: 'Mike Johnson' },
      player2: { name: 'Sarah Williams' },
      status: 'COMPLETED',
      winnerId: 'p3',
      scoreJson: JSON.stringify({ player1: [21, 19, 21], player2: [18, 21, 15] }),
      scheduledTime: new Date('2026-01-20T09:30:00').toISOString()
    },
    {
      id: '3',
      round: 1,
      matchNumber: 3,
      courtNumber: 3,
      player1Id: 'p5',
      player2Id: 'p6',
      player1: { name: 'David Brown' },
      player2: { name: 'Emily Davis' },
      status: 'LIVE',
      winnerId: null,
      scoreJson: JSON.stringify({ player1: [21, 15], player2: [18, 21] }),
      scheduledTime: new Date('2026-01-20T10:00:00').toISOString()
    },
    {
      id: '4',
      round: 1,
      matchNumber: 4,
      courtNumber: 4,
      player1Id: 'p7',
      player2Id: 'p8',
      player1: { name: 'Chris Wilson' },
      player2: { name: 'Lisa Anderson' },
      status: 'PENDING',
      winnerId: null,
      scoreJson: null,
      scheduledTime: new Date('2026-01-20T10:30:00').toISOString()
    },
    {
      id: '5',
      round: 1,
      matchNumber: 5,
      courtNumber: 1,
      player1Id: 'p9',
      player2Id: 'p10',
      player1: { name: 'Tom Martinez' },
      player2: { name: 'Anna Taylor' },
      status: 'COMPLETED',
      winnerId: 'p9',
      scoreJson: JSON.stringify({ player1: [21, 21], player2: [12, 16] }),
      scheduledTime: new Date('2026-01-20T11:00:00').toISOString()
    },
    {
      id: '6',
      round: 1,
      matchNumber: 6,
      courtNumber: 2,
      player1Id: 'p11',
      player2Id: 'p12',
      player1: { name: 'James Thomas' },
      player2: { name: 'Maria Garcia' },
      status: 'COMPLETED',
      winnerId: 'p12',
      scoreJson: JSON.stringify({ player1: [19, 21, 18], player2: [21, 18, 21] }),
      scheduledTime: new Date('2026-01-20T11:30:00').toISOString()
    },
    {
      id: '7',
      round: 1,
      matchNumber: 7,
      courtNumber: 3,
      player1Id: 'p13',
      player2Id: 'p14',
      player1: { name: 'Robert Lee' },
      player2: { name: 'Jennifer White' },
      status: 'PENDING',
      winnerId: null,
      scoreJson: null,
      scheduledTime: new Date('2026-01-20T12:00:00').toISOString()
    },
    {
      id: '8',
      round: 1,
      matchNumber: 8,
      courtNumber: 4,
      player1Id: 'p15',
      player2Id: 'p16',
      player1: { name: 'Daniel Harris' },
      player2: { name: 'Patricia Clark' },
      status: 'PENDING',
      winnerId: null,
      scoreJson: null,
      scheduledTime: new Date('2026-01-20T12:30:00').toISOString()
    },

    // Quarter Finals (Round 2)
    {
      id: '9',
      round: 2,
      matchNumber: 9,
      courtNumber: 1,
      player1Id: 'p1',
      player2Id: 'p3',
      player1: { name: 'John Doe' },
      player2: { name: 'Mike Johnson' },
      status: 'COMPLETED',
      winnerId: 'p1',
      scoreJson: JSON.stringify({ player1: [21, 21], player2: [17, 19] }),
      scheduledTime: new Date('2026-01-20T14:00:00').toISOString()
    },
    {
      id: '10',
      round: 2,
      matchNumber: 10,
      courtNumber: 2,
      player1Id: 'p5',
      player2Id: 'p7',
      player1: { name: 'David Brown' },
      player2: { name: 'Chris Wilson' },
      status: 'PENDING',
      winnerId: null,
      scoreJson: null,
      scheduledTime: new Date('2026-01-20T14:30:00').toISOString()
    },
    {
      id: '11',
      round: 2,
      matchNumber: 11,
      courtNumber: 3,
      player1Id: 'p9',
      player2Id: 'p12',
      player1: { name: 'Tom Martinez' },
      player2: { name: 'Maria Garcia' },
      status: 'COMPLETED',
      winnerId: 'p9',
      scoreJson: JSON.stringify({ player1: [21, 18, 21], player2: [19, 21, 17] }),
      scheduledTime: new Date('2026-01-20T15:00:00').toISOString()
    },
    {
      id: '12',
      round: 2,
      matchNumber: 12,
      courtNumber: 4,
      player1Id: 'p13',
      player2Id: 'p15',
      player1: { name: 'Robert Lee' },
      player2: { name: 'Daniel Harris' },
      status: 'PENDING',
      winnerId: null,
      scoreJson: null,
      scheduledTime: new Date('2026-01-20T15:30:00').toISOString()
    },

    // Semi Finals (Round 3)
    {
      id: '13',
      round: 3,
      matchNumber: 13,
      courtNumber: 1,
      player1Id: 'p1',
      player2Id: 'p5',
      player1: { name: 'John Doe' },
      player2: { name: 'David Brown' },
      status: 'PENDING',
      winnerId: null,
      scoreJson: null,
      scheduledTime: new Date('2026-01-20T17:00:00').toISOString()
    },
    {
      id: '14',
      round: 3,
      matchNumber: 14,
      courtNumber: 2,
      player1Id: 'p9',
      player2Id: 'p13',
      player1: { name: 'Tom Martinez' },
      player2: { name: 'Robert Lee' },
      status: 'PENDING',
      winnerId: null,
      scoreJson: null,
      scheduledTime: new Date('2026-01-20T17:30:00').toISOString()
    },

    // Final (Round 4)
    {
      id: '15',
      round: 4,
      matchNumber: 15,
      courtNumber: 1,
      player1Id: 'p1',
      player2Id: 'p9',
      player1: { name: 'John Doe' },
      player2: { name: 'Tom Martinez' },
      status: 'PENDING',
      winnerId: null,
      scoreJson: null,
      scheduledTime: new Date('2026-01-20T19:00:00').toISOString()
    }
  ];

  return (
    <div className="min-h-screen">
      {/* View Toggle */}
      <div className="fixed top-4 right-4 z-50 flex gap-2 bg-slate-800/90 backdrop-blur-xl border border-white/10 rounded-xl p-2">
        <button
          onClick={() => setViewMode('pyramid')}
          className={`px-4 py-2 rounded-lg font-semibold transition-all ${
            viewMode === 'pyramid'
              ? 'bg-gradient-to-r from-purple-500 to-indigo-600 text-white shadow-lg'
              : 'text-gray-400 hover:text-white hover:bg-white/5'
          }`}
        >
          🏔️ Pyramid View
        </button>
        <button
          onClick={() => setViewMode('linear')}
          className={`px-4 py-2 rounded-lg font-semibold transition-all ${
            viewMode === 'linear'
              ? 'bg-gradient-to-r from-purple-500 to-indigo-600 text-white shadow-lg'
              : 'text-gray-400 hover:text-white hover:bg-white/5'
          }`}
        >
          ➡️ Linear View
        </button>
      </div>

      {viewMode === 'pyramid' ? (
        <PyramidBracket
          matches={sampleMatches}
          categoryName="Men's Singles - Open Category"
          format="SINGLES"
        />
      ) : (
        <TournamentBracket
          matches={sampleMatches}
          categoryName="Men's Singles - Open Category"
          format="SINGLES"
        />
      )}
    </div>
  );
};

export default BracketDemo;
