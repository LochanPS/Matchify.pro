import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { tournamentAPI } from '../api/tournament';
import { useAuth } from '../contexts/AuthContext';
import { formatDateLongIndian, formatDateTimeIndian } from '../utils/dateFormat';
import {
  MapPinIcon,
  CalendarIcon,
  UserGroupIcon,
  ClockIcon,
  CurrencyRupeeIcon,
  ArrowLeftIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';

const TournamentDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [tournament, setTournament] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPoster, setSelectedPoster] = useState(0);
  const [publishing, setPublishing] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchTournament();
  }, [id]);

  const fetchTournament = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await tournamentAPI.getTournament(id);
      setTournament(response.data);
    } catch (err) {
      console.error('Error fetching tournament:', err);
      setError('Failed to load tournament details');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return formatDateLongIndian(dateString);
  };

  const formatDateTime = (dateString) => {
    return formatDateTimeIndian(dateString);
  };

  const handlePublish = async () => {
    if (!confirm('Are you sure you want to publish this tournament? It will be visible to all players.')) return;
    
    try {
      setPublishing(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/tournaments/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: 'published' })
      });
      
      const data = await response.json();
      if (data.success) {
        setTournament({ ...tournament, status: 'published' });
        alert('Tournament published successfully!');
      } else {
        alert(data.error || 'Failed to publish tournament');
      }
    } catch (err) {
      console.error('Error publishing tournament:', err);
      alert('Failed to publish tournament');
    } finally {
      setPublishing(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this tournament? This action cannot be undone.')) return;
    
    try {
      setDeleting(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/tournaments/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const data = await response.json();
      if (data.success) {
        alert('Tournament deleted successfully!');
        navigate('/organizer/dashboard');
      } else {
        alert(data.error || 'Failed to delete tournament');
      }
    } catch (err) {
      console.error('Error deleting tournament:', err);
      alert('Failed to delete tournament');
    } finally {
      setDeleting(false);
    }
  };

  // Check if user can register (has PLAYER, ORGANIZER, or UMPIRE role)
  const canRegister = () => {
    if (!user) return false;
    const userRoles = user.roles || user.role || '';
    const rolesArray = typeof userRoles === 'string' ? userRoles.split(',') : userRoles;
    return rolesArray.some(r => ['PLAYER', 'ORGANIZER', 'UMPIRE'].includes(r.trim()));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !tournament) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 text-lg mb-4">{error || 'Tournament not found'}</p>
          <button
            onClick={() => navigate('/tournaments')}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Back to Tournaments
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <button
          onClick={() => navigate('/tournaments')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeftIcon className="h-5 w-5" />
          Back to Tournaments
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Tournament Posters */}
            {tournament.posters && tournament.posters.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
                <img
                  src={tournament.posters[selectedPoster].imageUrl}
                  alt={tournament.name}
                  className="w-full h-96 object-cover"
                />
                {tournament.posters.length > 1 && (
                  <div className="p-4 flex gap-2 overflow-x-auto">
                    {tournament.posters.map((poster, index) => (
                      <button
                        key={poster.id}
                        onClick={() => setSelectedPoster(index)}
                        className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 ${
                          selectedPoster === index ? 'border-blue-500' : 'border-gray-200'
                        }`}
                      >
                        <img
                          src={poster.imageUrl}
                          alt={`Poster ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Tournament Info */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    {tournament.name}
                  </h1>
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                    tournament.status === 'published' ? 'bg-green-100 text-green-800' :
                    tournament.status === 'ongoing' ? 'bg-blue-100 text-blue-800' :
                    tournament.status === 'completed' ? 'bg-gray-100 text-gray-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {tournament.status.charAt(0).toUpperCase() + tournament.status.slice(1)}
                  </span>
                </div>
              </div>

              <p className="text-gray-600 whitespace-pre-wrap mb-6">
                {tournament.description}
              </p>

              {/* Key Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-start gap-3">
                  <MapPinIcon className="h-5 w-5 text-gray-400 mt-1" />
                  <div>
                    <p className="font-medium text-gray-900">Venue</p>
                    <p className="text-gray-600">{tournament.venue}</p>
                    <p className="text-sm text-gray-500">
                      {tournament.address}, {tournament.city}, {tournament.state} - {tournament.pincode}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <CalendarIcon className="h-5 w-5 text-gray-400 mt-1" />
                  <div>
                    <p className="font-medium text-gray-900">Tournament Dates</p>
                    <p className="text-gray-600">
                      {formatDate(tournament.startDate)} - {formatDate(tournament.endDate)}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <ClockIcon className="h-5 w-5 text-gray-400 mt-1" />
                  <div>
                    <p className="font-medium text-gray-900">Registration Period</p>
                    <p className="text-gray-600 text-sm">
                      Opens: {formatDateTime(tournament.registrationOpenDate)}
                    </p>
                    <p className="text-gray-600 text-sm">
                      Closes: {formatDateTime(tournament.registrationCloseDate)}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <UserGroupIcon className="h-5 w-5 text-gray-400 mt-1" />
                  <div>
                    <p className="font-medium text-gray-900">Format</p>
                    <p className="text-gray-600">
                      {tournament.format === 'both' ? 'Singles & Doubles' : 
                       tournament.format.charAt(0).toUpperCase() + tournament.format.slice(1)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Categories */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Categories</h2>
              
              {tournament.categories && tournament.categories.length > 0 ? (
                <div className="space-y-4">
                  {tournament.categories.map((category) => (
                    <div
                      key={category.id}
                      className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 mb-2">
                            {category.name}
                          </h3>
                          <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                            <span>Format: {category.format}</span>
                            <span>Gender: {category.gender}</span>
                            {category.ageGroup && <span>Age: {category.ageGroup}</span>}
                            {category.maxParticipants && (
                              <span>Max: {category.maxParticipants} players</span>
                            )}
                          </div>
                          
                          {/* Prize Info */}
                          {(category.prizeWinner || category.prizeRunnerUp || category.prizeSemiFinalist) && (
                            <div className="mt-3 pt-3 border-t border-gray-100">
                              <span className="text-xs font-medium text-green-700 bg-green-50 px-2 py-1 rounded">💰 Cash Prize</span>
                              <div className="flex flex-wrap gap-3 mt-2 text-sm">
                                {category.prizeWinner && (
                                  <span className="text-green-600">🥇 ₹{category.prizeWinner}</span>
                                )}
                                {category.prizeRunnerUp && (
                                  <span className="text-blue-600">🥈 ₹{category.prizeRunnerUp}</span>
                                )}
                                {category.prizeSemiFinalist && (
                                  <span className="text-orange-600">🥉 ₹{category.prizeSemiFinalist}</span>
                                )}
                              </div>
                              {category.prizeDescription && (
                                <p className="text-xs text-gray-500 mt-1">+ {category.prizeDescription}</p>
                              )}
                            </div>
                          )}
                        </div>
                        <div className="text-right">
                          <div className="flex items-center gap-1 text-lg font-bold text-gray-900">
                            <CurrencyRupeeIcon className="h-5 w-5" />
                            {category.entryFee}
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            {category.registrationCount} registered
                          </p>
                        </div>
                      </div>
                      
                      {user && user.role === 'PLAYER' && (
                        <button className="mt-3 w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                          Register for this category
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No categories available yet</p>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Organizer Info */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Organized By</h3>
              <div className="space-y-2">
                <p className="font-medium text-gray-900">{tournament.organizer.name}</p>
                <p className="text-sm text-gray-600">{tournament.organizer.email}</p>
                {tournament.organizer.phone && (
                  <p className="text-sm text-gray-600">{tournament.organizer.phone}</p>
                )}
              </div>
            </div>

            {/* Quick Stats */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Quick Stats</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Categories</span>
                  <span className="font-medium">{tournament.categories?.length || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Registrations</span>
                  <span className="font-medium">{tournament._count.registrations}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Zone</span>
                  <span className="font-medium">{tournament.zone}</span>
                </div>
              </div>
            </div>

            {/* Action Buttons - Register */}
            {user && canRegister() && tournament.status === 'published' && (
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <button
                  onClick={() => navigate(`/tournaments/${id}/register`)}
                  className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-semibold text-lg transition-colors"
                >
                  Register Now
                </button>
                <p className="text-xs text-gray-500 text-center mt-2">
                  Registration closes on {formatDate(tournament.registrationCloseDate)}
                </p>
              </div>
            )}
            
            {/* Organizer Management */}
            {user && user.id === tournament.organizerId && (
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Manage Tournament</h3>
                <div className="space-y-2">
                  {tournament.status === 'draft' && (
                    <button
                      onClick={handlePublish}
                      disabled={publishing || tournament.categories?.length === 0}
                      className="w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                      {publishing ? 'Publishing...' : 'Publish Tournament'}
                    </button>
                  )}
                  {tournament.status === 'draft' && tournament.categories?.length === 0 && (
                    <p className="text-xs text-red-500 text-center">Add at least one category to publish</p>
                  )}
                  <button
                    onClick={() => navigate(`/tournaments/${id}/edit`)}
                    className="w-full bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700"
                  >
                    ✏️ Edit Tournament
                  </button>
                  <button
                    onClick={() => navigate(`/tournaments/${id}/categories`)}
                    className="w-full bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700"
                  >
                    Manage Categories
                  </button>
                  <button
                    onClick={() => navigate(`/organizer/tournaments/${id}`)}
                    className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                  >
                    View Registrations
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={deleting}
                    className="w-full bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 disabled:bg-gray-400 flex items-center justify-center gap-2"
                  >
                    <TrashIcon className="h-4 w-4" />
                    {deleting ? 'Deleting...' : 'Delete Tournament'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TournamentDetailPage;
