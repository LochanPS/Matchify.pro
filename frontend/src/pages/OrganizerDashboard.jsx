import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/api';
import { formatDateIndian } from '../utils/dateFormat';
import { X, Users, Mail, Phone, MapPin, Trophy, Trash2, Edit3 } from 'lucide-react';
import { getTournamentDrafts, deleteTournamentDraft } from '../hooks/useTournamentForm';

export default function OrganizerDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tournaments, setTournaments] = useState([]);
  const [drafts, setDrafts] = useState([]);
  const [stats, setStats] = useState({
    totalTournaments: 0,
    activeTournaments: 0,
    totalParticipants: 0,
    revenue: 0
  });
  const [loading, setLoading] = useState(true);
  const [showParticipantsModal, setShowParticipantsModal] = useState(false);
  const [allParticipants, setAllParticipants] = useState([]);

  useEffect(() => {
    fetchOrganizerData();
    loadDrafts();
  }, []);

  const loadDrafts = () => {
    const savedDrafts = getTournamentDrafts();
    setDrafts(savedDrafts);
  };

  const handleDeleteDraft = (draftId) => {
    if (window.confirm('Are you sure you want to delete this draft?')) {
      deleteTournamentDraft(draftId);
      loadDrafts();
    }
  };

  const handleContinueDraft = (draftId) => {
    navigate(`/tournaments/create?draft=${draftId}`);
  };

  useEffect(() => {
    fetchOrganizerData();
  }, []);

  const fetchOrganizerData = async () => {
    try {
      // Fetch dashboard data from organizer API
      const dashboardRes = await api.get('/organizer/dashboard');
      const dashboardData = dashboardRes.data.data;
      
      // Fetch tournaments created by this organizer
      const tournamentsRes = await api.get('/multi-tournaments');
      const organizerTournaments = tournamentsRes.data.tournaments.filter(
        t => t.organizerId === user.id
      );
      
      setTournaments(organizerTournaments);
      setAllParticipants(dashboardData.recent_registrations || []);
      
      // Use stats from backend API (which calculates actual revenue from registrations)
      setStats({
        totalTournaments: dashboardData.total_tournaments || organizerTournaments.length,
        activeTournaments: dashboardData.tournaments_by_status?.ongoing || 0,
        totalParticipants: dashboardData.total_registrations || 0,
        revenue: dashboardData.revenue?.total || 0
      });
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching organizer data:', error);
      // Fallback to basic calculation if API fails
      try {
        const tournamentsRes = await api.get('/multi-tournaments');
        const organizerTournaments = tournamentsRes.data.tournaments.filter(
          t => t.organizerId === user.id
        );
        setTournaments(organizerTournaments);
        
        const totalParticipants = organizerTournaments.reduce((sum, t) => sum + (t._count?.registrations || 0), 0);
        
        setStats({
          totalTournaments: organizerTournaments.length,
          activeTournaments: organizerTournaments.filter(t => t.status === 'ongoing').length,
          totalParticipants,
          revenue: 0
        });
      } catch (e) {
        console.error('Fallback also failed:', e);
      }
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Organizer Dashboard</h1>
        <p className="text-gray-600">Welcome back, {user.name}!</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <StatCard 
          icon="🏆" 
          label="Total Tournaments" 
          value={stats.totalTournaments} 
          color="blue"
        />
        <StatCard 
          icon="⚡" 
          label="Active Tournaments" 
          value={stats.activeTournaments} 
          color="green"
        />
        <StatCard 
          icon="👥" 
          label="Total Participants" 
          value={stats.totalParticipants} 
          color="purple"
          onClick={() => setShowParticipantsModal(true)}
          clickable
        />
        <StatCard 
          icon="💰" 
          label="Revenue" 
          value={`₹${stats.revenue}`} 
          color="yellow"
        />
      </div>

      {/* Quick Actions */}
      <div className="bg-white p-6 rounded-lg shadow mb-8">
        <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link to="/tournaments/create" className="flex items-center p-4 border rounded-lg hover:bg-blue-50 transition-colors">
            <div className="p-2 bg-blue-100 rounded-lg mr-4">
              <span className="text-2xl">➕</span>
            </div>
            <div>
              <h3 className="font-medium">Create Tournament</h3>
              <p className="text-sm text-gray-600">Start a new tournament</p>
            </div>
          </Link>

          <Link to="/organizer/history" className="flex items-center p-4 border rounded-lg hover:bg-green-50 transition-colors">
            <div className="p-2 bg-green-100 rounded-lg mr-4">
              <span className="text-2xl">📋</span>
            </div>
            <div>
              <h3 className="font-medium">Manage Tournaments</h3>
              <p className="text-sm text-gray-600">View and edit your tournaments</p>
            </div>
          </Link>

          <div onClick={() => setShowParticipantsModal(true)} className="flex items-center p-4 border rounded-lg hover:bg-purple-50 transition-colors cursor-pointer">
            <div className="p-2 bg-purple-100 rounded-lg mr-4">
              <span className="text-2xl">👥</span>
            </div>
            <div>
              <h3 className="font-medium">View Participants</h3>
              <p className="text-sm text-gray-600">See all registered players</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tournament Drafts Section */}
      {drafts.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 p-6 rounded-lg shadow mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="text-2xl">📝</span>
              <h2 className="text-xl font-semibold text-yellow-800">Saved Drafts</h2>
              <span className="bg-yellow-200 text-yellow-800 text-xs px-2 py-1 rounded-full">{drafts.length}</span>
            </div>
          </div>
          <p className="text-yellow-700 text-sm mb-4">Continue creating your tournaments from where you left off</p>
          
          <div className="space-y-3">
            {drafts.map((draft) => (
              <div key={draft.id} className="bg-white border border-yellow-200 rounded-lg p-4 flex items-center justify-between">
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900">
                    {draft.formData?.name || 'Untitled Tournament'}
                  </h3>
                  <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                    <span>Step {draft.currentStep || 1} of 6</span>
                    <span>•</span>
                    <span>{draft.completedSteps?.length || 0} steps completed</span>
                    {draft.formData?.city && (
                      <>
                        <span>•</span>
                        <span>{draft.formData.city}</span>
                      </>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    Last edited: {new Date(draft.updatedAt).toLocaleString('en-IN')}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleContinueDraft(draft.id)}
                    className="flex items-center gap-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                  >
                    <Edit3 className="w-4 h-4" />
                    Continue
                  </button>
                  <button
                    onClick={() => handleDeleteDraft(draft.id)}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete draft"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Tournaments Table */}
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Recent Tournaments</h2>
          <Link to="/organizer/history" className="text-blue-600 hover:text-blue-700 text-sm font-medium">View All</Link>
        </div>

        {tournaments.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500 mb-4">No tournaments created yet</p>
            <Link to="/tournaments/create" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg">
              Create Your First Tournament
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tournament</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Participants</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Start Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {tournaments.slice(0, 5).map((tournament) => (
                  <tr key={tournament.id}>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{tournament.name}</div>
                      <div className="text-sm text-gray-500">{tournament.city}, {tournament.state}</div>
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={tournament.status} />
                    </td>
                    <td className="px-6 py-4">
                      <Link to={`/organizer/tournaments/${tournament.id}`} className="text-purple-600 hover:underline">
                        {tournament._count?.registrations || 0} participants
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">{formatDateIndian(tournament.startDate)}</td>
                    <td className="px-6 py-4 text-sm">
                      <Link to={`/tournaments/${tournament.id}`} className="text-blue-600 hover:text-blue-700 mr-3">View</Link>
                      <Link to={`/organizer/tournaments/${tournament.id}`} className="text-green-600 hover:text-green-700">Registrations</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Participants Modal */}
      {showParticipantsModal && (
        <ParticipantsModal 
          participants={allParticipants}
          totalRevenue={stats.revenue}
          onClose={() => setShowParticipantsModal(false)}
        />
      )}
    </div>
  );
}

// Stat Card Component
const StatCard = ({ icon, label, value, color, onClick, clickable }) => {
  const colorClasses = {
    blue: 'bg-blue-100',
    green: 'bg-green-100',
    purple: 'bg-purple-100',
    yellow: 'bg-yellow-100'
  };
  
  return (
    <div 
      className={`bg-white p-6 rounded-lg shadow ${clickable ? 'cursor-pointer hover:shadow-lg hover:bg-purple-50 transition-all' : ''}`}
      onClick={onClick}
    >
      <div className="flex items-center">
        <div className={`p-3 ${colorClasses[color]} rounded-lg text-2xl`}>{icon}</div>
        <div className="ml-4">
          <p className="text-sm font-medium text-gray-600">{label}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {clickable && <p className="text-xs text-purple-600">Click to view details</p>}
        </div>
      </div>
    </div>
  );
};

// Status Badge Component
const StatusBadge = ({ status }) => {
  const styles = {
    published: 'bg-green-100 text-green-800',
    draft: 'bg-yellow-100 text-yellow-800',
    ongoing: 'bg-blue-100 text-blue-800',
    completed: 'bg-gray-100 text-gray-800'
  };
  return (
    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${styles[status] || styles.draft}`}>
      {status}
    </span>
  );
};

// Participants Modal Component
const ParticipantsModal = ({ participants, totalRevenue, onClose }) => {
  // Group registrations by player (using player_email as unique identifier)
  const groupedByPlayer = participants.reduce((acc, reg) => {
    const key = reg.player_email;
    if (!acc[key]) {
      acc[key] = {
        player_name: reg.player_name,
        player_email: reg.player_email,
        player_phone: reg.player_phone,
        player_city: reg.player_city,
        player_state: reg.player_state,
        player_photo: reg.player_photo,
        registrations: []
      };
    }
    acc[key].registrations.push(reg);
    return acc;
  }, {});

  const uniquePlayers = Object.values(groupedByPlayer);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[85vh] overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b bg-purple-50">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">All Participants</h2>
            <p className="text-sm text-gray-600">{uniquePlayers.length} unique players • {participants.length} total registrations</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-purple-100 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="overflow-y-auto max-h-[60vh] p-4">
          {uniquePlayers.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">No participants yet</p>
              <p className="text-gray-400 text-sm mt-1">Participants will appear here once they register</p>
            </div>
          ) : (
            <div className="space-y-4">
              {uniquePlayers.map((player, index) => {
                const totalAmount = player.registrations.reduce((sum, r) => sum + (r.amount_paid || 0), 0);
                const allPaid = player.registrations.every(r => r.payment_status === 'completed');
                const allPending = player.registrations.every(r => r.payment_status !== 'completed');
                
                return (
                  <div key={player.player_email || index} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        {/* Avatar */}
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                          {player.player_name?.charAt(0)?.toUpperCase() || 'P'}
                        </div>
                        
                        {/* Player Info */}
                        <div>
                          <h3 className="font-semibold text-gray-900 text-lg">{player.player_name}</h3>
                          
                          <div className="mt-2 space-y-1">
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Mail className="w-4 h-4 text-gray-400" />
                              {player.player_email}
                            </div>
                            
                            {player.player_phone && (
                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                <Phone className="w-4 h-4 text-gray-400" />
                                {player.player_phone}
                              </div>
                            )}
                            
                            {(player.player_city || player.player_state) && (
                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                <MapPin className="w-4 h-4 text-gray-400" />
                                {[player.player_city, player.player_state].filter(Boolean).join(', ')}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {/* Payment Info */}
                      <div className="text-right">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          allPaid ? 'bg-green-100 text-green-800' : 
                          allPending ? 'bg-yellow-100 text-yellow-800' : 
                          'bg-orange-100 text-orange-800'
                        }`}>
                          {allPaid ? '✓ All Paid' : allPending ? 'Pending' : 'Partial'}
                        </span>
                        <p className="text-lg font-bold text-green-600 mt-1">₹{totalAmount}</p>
                        <p className="text-xs text-gray-500">{player.registrations.length} {player.registrations.length === 1 ? 'category' : 'categories'}</p>
                      </div>
                    </div>
                    
                    {/* Categories List */}
                    <div className="mt-3 pt-3 border-t">
                      <div className="flex flex-wrap gap-2">
                        {player.registrations.map((reg, regIndex) => (
                          <div key={regIndex} className="flex items-center gap-2 bg-gray-50 border rounded-lg px-3 py-2">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 px-2 py-0.5 rounded text-xs">
                                  <Trophy className="w-3 h-3" />
                                  {reg.tournament_name}
                                </span>
                                <span className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded text-xs font-medium">
                                  {reg.category_name}
                                </span>
                                <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-xs">
                                  {reg.category_format}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={`text-xs px-2 py-0.5 rounded ${
                                reg.payment_status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                              }`}>
                                {reg.payment_status === 'completed' ? '✓ Paid' : 'Pending'}
                              </span>
                              <span className="text-sm font-semibold text-gray-700">₹{reg.amount_paid}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                      <p className="text-xs text-gray-400 mt-2">
                        Registered: {formatDateIndian(player.registrations[0]?.created_at)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        
        {/* Footer with Total Revenue */}
        <div className="p-4 border-t bg-gradient-to-r from-green-50 to-emerald-50">
          <div className="flex items-center justify-between">
            <span className="text-gray-600">Total Revenue from Registrations:</span>
            <span className="text-2xl font-bold text-green-600">₹{totalRevenue}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
