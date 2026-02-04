import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { tournamentAPI } from '../api/tournament';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/api';
import {
  ArrowLeft,
  GitBranch,
  Users,
  Trophy,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  X,
  Shuffle,
  Plus,
  Settings,
  Layers,
  Grid3X3
} from 'lucide-react';

const ViewDrawsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [tournament, setTournament] = useState(null);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [draw, setDraw] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [showConfigModal, setShowConfigModal] = useState(false);

  const isOrganizer = user?.id === tournament?.organizerId;

  useEffect(() => {
    try {
      fetchTournamentData();
    } catch (err) {
      console.error('Error in fetchTournamentData effect:', err);
      setError('Failed to initialize page: ' + err.message);
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    try {
      if (selectedCategory) {
        fetchDraw(selectedCategory.id);
      }
    } catch (err) {
      console.error('Error in fetchDraw effect:', err);
      setError('Failed to load draw: ' + err.message);
    }
  }, [selectedCategory]);

  const fetchTournamentData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await tournamentAPI.getTournament(id);
      console.log('Tournament data:', response.data);
      setTournament(response.data);
      setCategories(response.data.categories || []);
      if (response.data.categories?.length > 0) {
        setSelectedCategory(response.data.categories[0]);
      }
    } catch (err) {
      console.error('Error fetching tournament:', err);
      setError('Failed to load tournament: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  const fetchDraw = async (categoryId) => {
    try {
      const response = await api.get(`/tournaments/${id}/categories/${categoryId}/draw`);
      setDraw(response.data.draw);
    } catch (err) {
      if (err.response?.status !== 404) {
        console.error('Error fetching draw:', err);
      }
      setDraw(null);
    }
  };

  const createDraw = async (config) => {
    if (!selectedCategory) return;
    
    setGenerating(true);
    setError(null);
    
    try {
      const response = await api.post(`/draws/create`, {
        tournamentId: id,
        categoryId: selectedCategory.id,
        ...config
      });
      setDraw(response.data.draw);
      setSuccess('Draw created successfully!');
      setShowConfigModal(false);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Error creating draw:', err);
      setError(err.response?.data?.error || 'Failed to create draw');
    } finally {
      setGenerating(false);
    }
  };

  const getFormatLabel = (format) => {
    switch (format) {
      case 'KNOCKOUT': return 'Knockout';
      case 'ROUND_ROBIN': return 'Round Robin';
      case 'ROUND_ROBIN_KNOCKOUT': return 'Round Robin + Knockout';
      default: return format || 'Not Set';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading draws...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-4 group">
            <ArrowLeft className="h-5 w-5 group-hover:-translate-x-1 transition-transform" />
            <span className="font-medium">Back to Tournament</span>
          </button>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl shadow-lg shadow-amber-500/20">
              <GitBranch className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Tournament Draws</h1>
              <p className="text-gray-400">{tournament?.name}</p>
            </div>
          </div>
        </div>

        {/* Messages */}
        {error && (
          <div className="mb-6 bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0" />
            <span className="text-red-300 font-medium">{error}</span>
            <button onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-red-300"><X className="w-5 h-5" /></button>
          </div>
        )}
        {success && (
          <div className="mb-6 bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0" />
            <span className="text-emerald-300 font-medium">{success}</span>
            <button onClick={() => setSuccess(null)} className="ml-auto text-emerald-400 hover:text-emerald-300"><X className="w-5 h-5" /></button>
          </div>
        )}

        {categories.length === 0 ? (
          <div className="bg-slate-800/50 backdrop-blur-sm border border-white/10 rounded-2xl p-12 text-center">
            <Trophy className="w-16 h-16 text-gray-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No Categories</h3>
            <p className="text-gray-400 mb-6">Add categories to this tournament to create draws.</p>
            {isOrganizer && (
              <button onClick={() => navigate(`/tournaments/${id}/categories`)} className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl hover:shadow-lg transition-all font-semibold">
                Manage Categories
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Category Selector */}
            <div className="lg:col-span-1">
              <div className="bg-slate-800/50 backdrop-blur-sm border border-white/10 rounded-2xl p-4">
                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Categories</h3>
                <div className="space-y-2">
                  {categories.map((category) => (
                    <button
                      key={category.id}
                      onClick={() => setSelectedCategory(category)}
                      className={`w-full text-left px-4 py-3 rounded-xl transition-all ${
                        selectedCategory?.id === category.id
                          ? 'bg-indigo-500/20 border border-indigo-500/50 text-white'
                          : 'bg-slate-700/30 border border-white/5 text-gray-300 hover:bg-slate-700/50'
                      }`}
                    >
                      <div className="font-medium">{category.name}</div>
                      <div className="text-xs text-gray-400 mt-1">
                        {category.registrationCount || 0} / {category.maxParticipants || '∞'} entries
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Draw Display */}
            <div className="lg:col-span-3">
              {selectedCategory ? (
                <div className="bg-slate-800/50 backdrop-blur-sm border border-white/10 rounded-2xl overflow-hidden">
                  <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
                    <div>
                      <h2 className="text-lg font-semibold text-white">{selectedCategory.name}</h2>
                      <div className="flex items-center gap-4 mt-1 text-sm text-gray-400">
                        <span className="flex items-center gap-1"><Users className="w-4 h-4" />{selectedCategory.registrationCount || 0} participants</span>
                        <span className="flex items-center gap-1"><Layers className="w-4 h-4" />Max: {selectedCategory.maxParticipants || '∞'}</span>
                      </div>
                    </div>
                    {isOrganizer && (
                      <button
                        onClick={() => setShowConfigModal(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-xl hover:shadow-lg hover:shadow-amber-500/25 transition-all font-semibold"
                      >
                        {draw ? <Settings className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                        {draw ? 'Edit Draw' : 'Create Draw'}
                      </button>
                    )}
                  </div>

                  <div className="p-6">
                    {draw ? (
                      <DrawBracket draw={draw} />
                    ) : (
                      <div className="text-center py-12">
                        <div className="w-20 h-20 bg-amber-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                          <GitBranch className="w-10 h-10 text-amber-400" />
                        </div>
                        <h3 className="text-xl font-semibold text-white mb-2">Draw Not Generated Yet</h3>
                        <p className="text-gray-400 mb-6">Click "Create Draw" to set up the tournament bracket.</p>
                        {isOrganizer && (
                          <button
                            onClick={() => setShowConfigModal(true)}
                            className="px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-xl hover:shadow-lg hover:shadow-amber-500/25 transition-all font-semibold"
                          >
                            <Plus className="w-5 h-5 inline mr-2" />
                            Create Draw
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="bg-slate-800/50 backdrop-blur-sm border border-white/10 rounded-2xl p-12 text-center">
                  <p className="text-gray-400">Select a category to view its draw</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Draw Configuration Modal */}
      {showConfigModal && selectedCategory && (
        <DrawConfigModal
          category={selectedCategory}
          existingDraw={draw}
          onClose={() => setShowConfigModal(false)}
          onSave={createDraw}
          saving={generating}
        />
      )}
    </div>
  );
};

// Draw Configuration Modal
const DrawConfigModal = ({ category, existingDraw, onClose, onSave, saving }) => {
  const maxParticipants = category.maxParticipants || 32;
  
  const [config, setConfig] = useState({
    format: existingDraw?.format || category.tournamentFormat || 'KNOCKOUT',
    bracketSize: existingDraw?.bracketSize || maxParticipants,
    numberOfGroups: existingDraw?.numberOfGroups || 4,
    playersPerGroup: existingDraw?.playersPerGroup || Math.floor(maxParticipants / 4),
    advanceFromGroup: existingDraw?.advanceFromGroup || 2
  });

  const formatOptions = [
    { value: 'KNOCKOUT', label: 'Knockout', icon: '🏆', desc: 'Single elimination. Lose once, you\'re out.' },
    { value: 'ROUND_ROBIN', label: 'Round Robin', icon: '🔄', desc: 'Everyone plays everyone in the group.' },
    { value: 'ROUND_ROBIN_KNOCKOUT', label: 'Round Robin + Knockout', icon: '⚡', desc: 'Round robin groups, then knockout finals.' }
  ];

  const groupOptions = [2, 4, 8, 16].filter(n => n <= maxParticipants / 2);

  const handleSave = () => {
    onSave(config);
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 border border-white/10 rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white">Configure Draw</h2>
            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg transition-colors"><X className="w-5 h-5 text-gray-400" /></button>
          </div>
          <p className="text-gray-400 text-sm mt-1">{category.name} • Max {maxParticipants} participants</p>
        </div>

        <div className="p-6 space-y-6">
          {/* Format Selection */}
          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-3">Tournament Format</label>
            <div className="space-y-3">
              {formatOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setConfig({ ...config, format: option.value })}
                  className={`w-full p-4 rounded-xl text-left transition-all ${
                    config.format === option.value
                      ? 'bg-amber-500/20 border-2 border-amber-500'
                      : 'bg-slate-700/50 border-2 border-transparent hover:border-white/20'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{option.icon}</span>
                    <div>
                      <div className="font-semibold text-white">{option.label}</div>
                      <div className="text-sm text-gray-400">{option.desc}</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Bracket Size */}
          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2">Draw Size (Slots)</label>
            <select
              value={config.bracketSize}
              onChange={(e) => setConfig({ ...config, bracketSize: parseInt(e.target.value) })}
              className="w-full px-4 py-3 bg-slate-700/50 border border-white/10 rounded-xl text-white focus:outline-none focus:border-amber-500"
            >
              {[4, 8, 16, 32, 64, 128].filter(n => n >= 4).map(size => (
                <option key={size} value={size}>{size} Players</option>
              ))}
            </select>
          </div>

          {/* Group Settings (for Round Robin formats) */}
          {(config.format === 'ROUND_ROBIN' || config.format === 'ROUND_ROBIN_KNOCKOUT') && (
            <>
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">Number of Groups</label>
                <div className="grid grid-cols-4 gap-2">
                  {groupOptions.map(num => (
                    <button
                      key={num}
                      onClick={() => setConfig({ ...config, numberOfGroups: num, playersPerGroup: Math.floor(config.bracketSize / num) })}
                      className={`py-3 rounded-xl font-semibold transition-all ${
                        config.numberOfGroups === num
                          ? 'bg-purple-500 text-white'
                          : 'bg-slate-700/50 text-gray-300 hover:bg-slate-700'
                      }`}
                    >
                      {num}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  {config.numberOfGroups} groups × {Math.floor(config.bracketSize / config.numberOfGroups)} players each
                </p>
              </div>

              {config.format === 'ROUND_ROBIN_KNOCKOUT' && (
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">Players Advancing from Each Group</label>
                  <div className="grid grid-cols-4 gap-2">
                    {[1, 2, 3, 4].map(num => (
                      <button
                        key={num}
                        onClick={() => setConfig({ ...config, advanceFromGroup: num })}
                        className={`py-3 rounded-xl font-semibold transition-all ${
                          config.advanceFromGroup === num
                            ? 'bg-emerald-500 text-white'
                            : 'bg-slate-700/50 text-gray-300 hover:bg-slate-700'
                        }`}
                      >
                        Top {num}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    {config.numberOfGroups * config.advanceFromGroup} players will advance to knockout stage
                  </p>
                </div>
              )}
            </>
          )}

          {/* Preview */}
          <div className="bg-slate-700/30 rounded-xl p-4">
            <h4 className="text-sm font-semibold text-gray-300 mb-2">Draw Preview</h4>
            <div className="text-sm text-gray-400">
              {config.format === 'KNOCKOUT' && (
                <p>🏆 {config.bracketSize}-player knockout bracket with {Math.log2(config.bracketSize)} rounds</p>
              )}
              {config.format === 'ROUND_ROBIN' && (
                <p>🔄 {config.numberOfGroups} groups of {Math.floor(config.bracketSize / config.numberOfGroups)} players each playing round robin</p>
              )}
              {config.format === 'ROUND_ROBIN_KNOCKOUT' && (
                <>
                  <p>⚡ Stage 1: {config.numberOfGroups} groups × {Math.floor(config.bracketSize / config.numberOfGroups)} players (Round Robin)</p>
                  <p className="mt-1">⚡ Stage 2: Top {config.advanceFromGroup} from each group → {config.numberOfGroups * config.advanceFromGroup}-player Knockout</p>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-white/10 flex gap-3">
          <button onClick={onClose} className="flex-1 px-4 py-3 bg-slate-700 text-gray-300 rounded-xl hover:bg-slate-600 transition-colors font-semibold">
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 px-4 py-3 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-xl hover:shadow-lg hover:shadow-amber-500/25 transition-all font-semibold disabled:opacity-50"
          >
            {saving ? 'Creating...' : 'Create Draw'}
          </button>
        </div>
      </div>
    </div>
  );
};

// Draw Bracket Component
const DrawBracket = ({ draw }) => {
  // Handle both bracketJson and bracket (for backward compatibility)
  const rawData = draw.bracketJson || draw.bracket;
  const data = typeof rawData === 'string' ? JSON.parse(rawData) : rawData;
  const format = draw.format || data?.format;

  if (format === 'ROUND_ROBIN') {
    return <RoundRobinDraw data={data} />;
  }
  if (format === 'ROUND_ROBIN_KNOCKOUT') {
    return <GroupsKnockoutDraw data={data} />;
  }
  return <KnockoutBracket data={data} />;
};

// Knockout Bracket Component
const KnockoutBracket = ({ data }) => {
  if (!data?.rounds) return <p className="text-gray-400 text-center">No bracket data</p>;

  const getRoundName = (idx, total) => {
    const r = total - idx;
    if (r === 1) return 'Final';
    if (r === 2) return 'Semi Finals';
    if (r === 3) return 'Quarter Finals';
    return `Round ${idx + 1}`;
  };

  // Helper function to display player name with partner
  const getPlayerDisplay = (player) => {
    if (!player || !player.name || player.name === 'TBD') return 'TBD';
    if (player.partnerName) {
      return `${player.name} & ${player.partnerName}`;
    }
    return player.name;
  };

  return (
    <div className="overflow-x-auto">
      <div className="flex gap-6 min-w-max p-4">
        {data.rounds.map((round, ri) => (
          <div key={ri} className="flex flex-col">
            <h4 className="text-sm font-semibold text-amber-400 text-center mb-3">{getRoundName(ri, data.rounds.length)}</h4>
            <div className="flex flex-col justify-around flex-1 gap-2" style={{ paddingTop: ri > 0 ? `${Math.pow(2, ri) * 16}px` : 0 }}>
              {round.matches.map((match, mi) => (
                <div key={mi} className="bg-slate-700/50 border border-white/10 rounded-lg p-2 w-56" style={{ marginBottom: ri > 0 ? `${Math.pow(2, ri) * 32}px` : 0 }}>
                  <div className={`px-2 py-1.5 rounded mb-1 text-sm ${match.winner === 1 ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-600/50 text-white'}`}>
                    {getPlayerDisplay(match.player1)}
                  </div>
                  <div className={`px-2 py-1.5 rounded text-sm ${match.winner === 2 ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-600/50 text-white'}`}>
                    {getPlayerDisplay(match.player2)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};


// Round Robin Draw Component
const RoundRobinDraw = ({ data }) => {
  if (!data?.groups) return <p className="text-gray-400 text-center">No group data</p>;

  return (
    <div className="space-y-6">
      {data.groups.map((group, gi) => (
        <div key={gi} className="bg-slate-700/30 rounded-xl p-4">
          <h4 className="text-lg font-semibold text-white mb-3">Group {String.fromCharCode(65 + gi)}</h4>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left py-2 px-3 text-gray-400">#</th>
                  <th className="text-left py-2 px-3 text-gray-400">Player</th>
                  <th className="text-center py-2 px-3 text-gray-400">P</th>
                  <th className="text-center py-2 px-3 text-gray-400">W</th>
                  <th className="text-center py-2 px-3 text-gray-400">L</th>
                  <th className="text-center py-2 px-3 text-gray-400">Pts</th>
                </tr>
              </thead>
              <tbody>
                {group.participants.map((p, pi) => (
                  <tr key={pi} className="border-b border-white/5">
                    <td className="py-2 px-3 text-gray-500">{pi + 1}</td>
                    <td className="py-2 px-3 text-white">{p.name || `Slot ${pi + 1}`}</td>
                    <td className="py-2 px-3 text-center text-gray-400">{p.played || 0}</td>
                    <td className="py-2 px-3 text-center text-emerald-400">{p.wins || 0}</td>
                    <td className="py-2 px-3 text-center text-red-400">{p.losses || 0}</td>
                    <td className="py-2 px-3 text-center text-amber-400 font-semibold">{p.points || 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
};

// Groups + Knockout Draw Component
const GroupsKnockoutDraw = ({ data }) => {
  return (
    <div className="space-y-8">
      {/* Group Stage */}
      <div>
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <span className="px-3 py-1 bg-purple-500/20 text-purple-400 rounded-lg text-sm">Stage 1</span>
          Group Stage (Round Robin)
        </h3>
        <RoundRobinDraw data={data} />
      </div>

      {/* Knockout Stage */}
      {data.knockout && (
        <div>
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <span className="px-3 py-1 bg-amber-500/20 text-amber-400 rounded-lg text-sm">Stage 2</span>
            Knockout Stage
          </h3>
          <KnockoutBracket data={data.knockout} />
        </div>
      )}
    </div>
  );
};

export default ViewDrawsPage;
