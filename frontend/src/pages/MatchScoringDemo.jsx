import { useState } from 'react';
import { Link } from 'react-router-dom';
import MatchManagementNav from '../components/MatchManagementNav';

const MatchScoringDemo = () => {
  const [selectedDemo, setSelectedDemo] = useState('live-scoring');

  const demoTournamentId = 'd4398ca9-0287-40aa-b040-020cfdfe77fb'; // Use actual tournament ID
  const demoMatchId = 'demo-match-1';

  const demos = [
    {
      id: 'live-scoring',
      title: 'Live Match Scoring',
      description: 'Real-time match scoring with set tracking, timer, and point management',
      features: [
        'Live timer with start/pause functionality',
        'Set-by-set scoring (21x3 format)',
        'Point addition and undo functionality',
        'Automatic set and match winner detection',
        'Real-time score updates'
      ],
      path: `/match/${demoMatchId}/live`,
      image: '🎾',
      color: 'from-green-600 to-teal-600'
    },
    {
      id: 'tournament-draw',
      title: 'Tournament Draw & Brackets',
      description: 'Visual tournament bracket management with umpire assignment',
      features: [
        'Round-by-round match display',
        'Umpire assignment interface',
        'Match status tracking',
        'Court and time scheduling',
        'One-click match starting'
      ],
      path: `/tournament/${demoTournamentId}/draw`,
      image: '🏆',
      color: 'from-purple-600 to-blue-600'
    },
    {
      id: 'match-results',
      title: 'Tournament Results & History',
      description: 'Comprehensive match results and tournament progression tracking',
      features: [
        'Match history with detailed scores',
        'Tournament progression tracking',
        'Qualification round results',
        'Player performance statistics',
        'Venue and timing information'
      ],
      path: `/tournament/${demoTournamentId}/results`,
      image: '📊',
      color: 'from-orange-600 to-red-600'
    }
  ];

  const selectedDemoData = demos.find(d => d.id === selectedDemo);

  return (
    <div className="min-h-screen bg-slate-900 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">
            🎾 Match Scoring System Demo
          </h1>
          <p className="text-gray-400 text-lg max-w-3xl mx-auto">
            Experience the complete match management system with live scoring, tournament draws, 
            and comprehensive results tracking - just like the images you shared!
          </p>
        </div>

        {/* Navigation */}
        <MatchManagementNav tournamentId={demoTournamentId} currentPage="demo" />

        {/* Demo Selection */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {demos.map((demo) => (
            <button
              key={demo.id}
              onClick={() => setSelectedDemo(demo.id)}
              className={`p-6 rounded-xl border-2 transition text-left ${
                selectedDemo === demo.id
                  ? 'border-teal-500 bg-teal-900/30 shadow-lg shadow-teal-500/20'
                  : 'border-slate-600 bg-slate-800 hover:border-slate-500'
              }`}
            >
              <div className="text-4xl mb-3">{demo.image}</div>
              <h3 className="text-xl font-bold text-white mb-2">{demo.title}</h3>
              <p className="text-gray-400 text-sm">{demo.description}</p>
            </button>
          ))}
        </div>

        {/* Selected Demo Details */}
        {selectedDemoData && (
          <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden mb-8">
            <div className={`bg-gradient-to-r ${selectedDemoData.color} p-6`}>
              <div className="flex items-center gap-4">
                <div className="text-6xl">{selectedDemoData.image}</div>
                <div>
                  <h2 className="text-3xl font-bold text-white mb-2">
                    {selectedDemoData.title}
                  </h2>
                  <p className="text-white/80 text-lg">
                    {selectedDemoData.description}
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Features */}
                <div>
                  <h3 className="text-xl font-bold text-white mb-4">Key Features</h3>
                  <ul className="space-y-3">
                    {selectedDemoData.features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <span className="text-teal-400 mt-1">✓</span>
                        <span className="text-gray-300">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Action */}
                <div className="flex flex-col justify-center">
                  <div className="bg-slate-700 rounded-lg p-6 text-center">
                    <h4 className="text-lg font-bold text-white mb-3">
                      Try it now!
                    </h4>
                    <p className="text-gray-400 mb-4">
                      Experience the {selectedDemoData.title.toLowerCase()} interface
                    </p>
                    <Link
                      to={selectedDemoData.path}
                      className={`inline-block bg-gradient-to-r ${selectedDemoData.color} text-white font-bold py-3 px-8 rounded-lg transition hover:shadow-lg transform hover:scale-105`}
                    >
                      Launch Demo →
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Implementation Status */}
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 mb-8">
          <h3 className="text-xl font-bold text-white mb-4">✅ Implementation Status</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-green-900/30 border border-green-700 rounded-lg p-4">
              <div className="text-green-400 text-2xl mb-2">✅</div>
              <h4 className="text-green-300 font-medium mb-1">Live Scoring</h4>
              <p className="text-green-200 text-sm">Real-time match scoring interface</p>
            </div>
            
            <div className="bg-green-900/30 border border-green-700 rounded-lg p-4">
              <div className="text-green-400 text-2xl mb-2">✅</div>
              <h4 className="text-green-300 font-medium mb-1">Tournament Draw</h4>
              <p className="text-green-200 text-sm">Bracket management system</p>
            </div>
            
            <div className="bg-green-900/30 border border-green-700 rounded-lg p-4">
              <div className="text-green-400 text-2xl mb-2">✅</div>
              <h4 className="text-green-300 font-medium mb-1">Match Results</h4>
              <p className="text-green-200 text-sm">Comprehensive results tracking</p>
            </div>
            
            <div className="bg-green-900/30 border border-green-700 rounded-lg p-4">
              <div className="text-green-400 text-2xl mb-2">✅</div>
              <h4 className="text-green-300 font-medium mb-1">Umpire System</h4>
              <p className="text-green-200 text-sm">Umpire assignment & management</p>
            </div>
          </div>
        </div>

        {/* Technical Details */}
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
          <h3 className="text-xl font-bold text-white mb-4">🔧 Technical Implementation</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-lg font-medium text-teal-400 mb-3">Frontend Components</h4>
              <ul className="space-y-2 text-gray-300">
                <li>• LiveMatchScoring.jsx - Real-time scoring interface</li>
                <li>• TournamentDraw.jsx - Bracket management</li>
                <li>• TournamentResults.jsx - Results & history</li>
                <li>• MatchManagementNav.jsx - Navigation component</li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-lg font-medium text-teal-400 mb-3">Backend APIs</h4>
              <ul className="space-y-2 text-gray-300">
                <li>• GET /api/matches/:matchId - Match details</li>
                <li>• PUT /api/matches/:matchId/score - Update scores</li>
                <li>• POST /api/matches/:matchId/start - Start match</li>
                <li>• POST /api/matches/:matchId/assign-umpire - Assign umpire</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Quick Links */}
        <div className="mt-8 text-center">
          <h3 className="text-xl font-bold text-white mb-4">Quick Access</h3>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              to={`/tournament/${demoTournamentId}/draw`}
              className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg transition"
            >
              🏆 Tournament Draw
            </Link>
            <Link
              to={`/match/${demoMatchId}/live`}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg transition"
            >
              🎾 Live Scoring
            </Link>
            <Link
              to={`/tournament/${demoTournamentId}/results`}
              className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-3 rounded-lg transition"
            >
              📊 Match Results
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MatchScoringDemo;