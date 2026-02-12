import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { tournamentAPI } from '../api/tournament';
import { superAdminAPI } from '../api/superAdmin';
import { useAuth } from '../contexts/AuthContext';
import { formatDateLongIndian, formatDateTimeIndian } from '../utils/dateFormat';
import { getImageUrl } from '../utils/imageUrl';
import api from '../utils/api';
import {
  MapPinIcon,
  CalendarIcon,
  UserGroupIcon,
  ClockIcon,
  CurrencyRupeeIcon,
  ArrowLeftIcon,
  TrashIcon,
  ExclamationTriangleIcon,
  TrophyIcon,
  SparklesIcon,
  UserIcon,
  UserPlusIcon,
} from '@heroicons/react/24/outline';
import { Edit, Users, Eye, Layers, GitBranch } from 'lucide-react';

// Delete Tournament Modal Component
const DeleteTournamentModal = ({ isOpen, onClose, onConfirm, tournamentName, isDeleting }) => {
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = () => {
    if (!reason.trim()) {
      setError('Please provide a reason for cancelling the tournament');
      return;
    }
    if (reason.trim().length < 10) {
      setError('Please provide a more detailed reason (at least 10 characters)');
      return;
    }
    onConfirm(reason.trim());
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
        <div className="bg-gradient-to-r from-red-500 to-rose-600 p-6 text-white">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <ExclamationTriangleIcon className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Cancel Tournament</h2>
              <p className="text-red-100 text-sm mt-1">This action cannot be undone</p>
            </div>
          </div>
        </div>

        <div className="p-6">
          <p className="text-gray-700 mb-4">
            You are about to cancel <span className="font-semibold">"{tournamentName}"</span>.
          </p>
          
          <p className="text-gray-400 text-sm mb-4">
            All registered participants will be notified about this cancellation with your reason.
          </p>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Reason for Cancellation <span className="text-red-500">*</span>
            </label>
            <textarea
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                setError('');
              }}
              placeholder="Please explain why you are cancelling this tournament..."
              rows={4}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none transition-all"
            />
            <p className="mt-1 text-xs text-gray-400">
              This message will be sent to all registered participants.
            </p>
          </div>

          <div className="flex gap-3 mt-6">
            <button
              onClick={onClose}
              disabled={isDeleting}
              className="flex-1 px-4 py-3 border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 font-medium"
            >
              Keep Tournament
            </button>
            <button
              onClick={handleSubmit}
              disabled={isDeleting}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-red-500 to-rose-600 text-white rounded-xl hover:shadow-lg hover:shadow-red-500/30 transition-all disabled:opacity-50 flex items-center justify-center gap-2 font-semibold"
            >
              {isDeleting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  Cancelling...
                </>
              ) : (
                <>
                  <TrashIcon className="h-4 w-4" />
                  Cancel Tournament
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

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
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showPublishConfirmModal, setShowPublishConfirmModal] = useState(false);
  const [publishResultModal, setPublishResultModal] = useState(null);
  const [deleteResultModal, setDeleteResultModal] = useState(null);
  
  // Umpire management state
  const [showUmpireModal, setShowUmpireModal] = useState(false);
  const [umpireCode, setUmpireCode] = useState('');
  const [umpires, setUmpires] = useState([]);
  const [loadingUmpires, setLoadingUmpires] = useState(false);
  const [addingUmpire, setAddingUmpire] = useState(false);
  const [umpireError, setUmpireError] = useState('');
  const [umpireSuccess, setUmpireSuccess] = useState('');

  // Quick Add Player state (Super Admin only)
  const [showQuickAddModal, setShowQuickAddModal] = useState(false);
  const [quickAddData, setQuickAddData] = useState({
    name: '',
    email: '',
    phone: '',
    categoryId: '',
    gender: 'Male'
  });
  const [quickAddLoading, setQuickAddLoading] = useState(false);
  const [quickAddError, setQuickAddError] = useState('');
  const [quickAddSuccess, setQuickAddSuccess] = useState('');

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

  // Fetch umpires when modal opens
  const fetchUmpires = async () => {
    try {
      setLoadingUmpires(true);
      const response = await tournamentAPI.getTournamentUmpires(id);
      if (response.success) {
        setUmpires(response.umpires || []);
      }
    } catch (err) {
      console.error('Error fetching umpires:', err);
    } finally {
      setLoadingUmpires(false);
    }
  };

  const handleAddUmpire = async () => {
    if (!umpireCode.trim()) {
      setUmpireError('Please enter an umpire code');
      return;
    }

    // Validate format: #123ABCD (# + 3 digits + 4 letters)
    const codePattern = /^#\d{3}[A-Za-z]{4}$/;
    if (!codePattern.test(umpireCode.trim())) {
      setUmpireError('Invalid code format. Use #123ABCD (# + 3 digits + 4 letters)');
      return;
    }

    try {
      setAddingUmpire(true);
      setUmpireError('');
      setUmpireSuccess('');
      
      const response = await tournamentAPI.addUmpireByCode(id, umpireCode.trim());
      
      if (response.success) {
        setUmpireSuccess(`Umpire "${response.umpire.name}" added successfully!`);
        setUmpireCode('');
        fetchUmpires(); // Refresh the list
      } else {
        setUmpireError(response.error || 'Failed to add umpire');
      }
    } catch (err) {
      console.error('Error adding umpire:', err);
      setUmpireError(err.response?.data?.error || 'Failed to add umpire. Please try again.');
    } finally {
      setAddingUmpire(false);
    }
  };

  const handleRemoveUmpire = async (umpireId) => {
    try {
      const response = await tournamentAPI.removeUmpire(id, umpireId);
      if (response.success) {
        setUmpires(umpires.filter(u => u.id !== umpireId));
        setUmpireSuccess('Umpire removed successfully');
        setTimeout(() => setUmpireSuccess(''), 3000);
      }
    } catch (err) {
      console.error('Error removing umpire:', err);
      setUmpireError('Failed to remove umpire');
    }
  };

  const openUmpireModal = () => {
    setShowUmpireModal(true);
    setUmpireCode('');
    setUmpireError('');
    setUmpireSuccess('');
    fetchUmpires();
  };

  const formatDate = (dateString) => formatDateLongIndian(dateString);
  const formatDateTime = (dateString) => formatDateTimeIndian(dateString);

  const handlePublish = async () => {
    setShowPublishConfirmModal(false);
    
    try {
      setPublishing(true);
      const response = await api.put(`/tournaments/${id}`, { status: 'published' });
      
      if (response.data.success) {
        setTournament({ ...tournament, status: 'published' });
        setPublishResultModal({
          type: 'success',
          title: 'Tournament Published! 🎉',
          message: 'Your tournament is now live and visible to all players. They can start registering!'
        });
      } else {
        setPublishResultModal({
          type: 'error',
          title: 'Publication Failed',
          message: response.data.error || 'Failed to publish tournament. Please try again.'
        });
      }
    } catch (err) {
      console.error('Error publishing tournament:', err);
      setPublishResultModal({
        type: 'error',
        title: 'Publication Failed',
        message: 'Failed to publish tournament. Please check your connection and try again.'
      });
    } finally {
      setPublishing(false);
    }
  };

  const handleDelete = async (reason) => {
    try {
      setDeleting(true);
      const response = await api.delete(`/tournaments/${id}`, { data: { reason } });
      
      if (response.data.success) {
        setShowDeleteModal(false);
        const notifiedCount = response.data.notifiedParticipants || 0;
        if (notifiedCount > 0) {
          setDeleteResultModal({
            type: 'success',
            title: 'Tournament Cancelled',
            message: `Tournament has been cancelled successfully. ${notifiedCount} participant(s) have been notified via Matchify.pro.`,
            redirectTo: '/organizer/dashboard'
          });
        } else {
          setDeleteResultModal({
            type: 'success',
            title: 'Tournament Deleted',
            message: 'Tournament has been deleted successfully.',
            redirectTo: '/organizer/dashboard'
          });
        }
      } else {
        setDeleteResultModal({
          type: 'error',
          title: 'Deletion Failed',
          message: data.error || 'Failed to delete tournament. Please try again.'
        });
      }
    } catch (err) {
      console.error('Error deleting tournament:', err);
      setDeleteResultModal({
        type: 'error',
        title: 'Deletion Failed',
        message: 'Failed to delete tournament. Please check your connection and try again.'
      });
    } finally {
      setDeleting(false);
    }
  };

  const handleQuickAddPlayer = async (e) => {
    e.preventDefault();
    setQuickAddError('');
    setQuickAddSuccess('');

    // Validation
    if (!quickAddData.name || !quickAddData.email || !quickAddData.phone || !quickAddData.categoryId) {
      setQuickAddError('All fields are required');
      return;
    }

    try {
      setQuickAddLoading(true);
      const response = await superAdminAPI.quickAddPlayer(id, quickAddData);
      
      if (response.data.success) {
        setQuickAddSuccess(`Player "${quickAddData.name}" added successfully!`);
        // Reset form
        setQuickAddData({
          name: '',
          email: '',
          phone: '',
          categoryId: '',
          gender: 'Male'
        });
        // Refresh tournament data to update registration count
        setTimeout(() => {
          fetchTournament();
          setShowQuickAddModal(false);
          setQuickAddSuccess('');
        }, 2000);
      }
    } catch (err) {
      console.error('Quick add error:', err);
      setQuickAddError(err.response?.data?.error || 'Failed to add player');
    } finally {
      setQuickAddLoading(false);
    }
  };

  const isSuperAdmin = () => {
    if (!user) return false;
    return user.isAdmin === true || (user.roles && user.roles.includes('SUPER_ADMIN'));
  };

  const canRegister = () => {
    if (!user) return false;
    const userRoles = user.roles || user.role || '';
    const rolesArray = typeof userRoles === 'string' ? userRoles.split(',') : userRoles;
    return rolesArray.some(r => ['PLAYER', 'ORGANIZER', 'UMPIRE'].includes(r.trim()));
  };

  const getStatusStyle = (status) => {
    const styles = {
      published: { bg: 'bg-green-100', text: 'text-green-700', label: 'Open for Registration' },
      ongoing: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Ongoing' },
      completed: { bg: 'bg-gray-100', text: 'text-gray-700', label: 'Completed' },
      draft: { bg: 'bg-amber-100', text: 'text-amber-700', label: 'Draft' },
      cancelled: { bg: 'bg-red-100', text: 'text-red-700', label: 'Cancelled' },
    };
    return styles[status] || styles.draft;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-gray-400 mt-4 font-medium">Loading tournament...</p>
        </div>
      </div>
    );
  }

  if (error || !tournament) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center bg-white rounded-2xl shadow-xl p-10 max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <ExclamationTriangleIcon className="w-8 h-8 text-red-600" />
          </div>
          <p className="text-red-600 text-lg font-semibold mb-4">{error || 'Tournament not found'}</p>
          <button
            onClick={() => navigate('/tournaments')}
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl hover:shadow-lg transition-all font-semibold"
          >
            Back to Tournaments
          </button>
        </div>
      </div>
    );
  }

  const statusStyle = getStatusStyle(tournament.status);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Hero Header with Poster */}
      <div className="relative bg-gradient-to-r from-slate-900 via-purple-900 to-slate-900 overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-white/70 hover:text-white mb-6 transition-colors"
          >
            <ArrowLeftIcon className="h-5 w-5" />
            Back to Tournaments
          </button>

          <div className="flex flex-col md:flex-row gap-8 items-start">
            {/* Poster */}
            {tournament.posters && tournament.posters.length > 0 && (
              <div className="w-full md:w-80 flex-shrink-0">
                <div className="rounded-2xl overflow-hidden shadow-2xl border-4 border-white/20">
                  <img
                    src={getImageUrl(tournament.posters[selectedPoster].imageUrl)}
                    alt={tournament.name}
                    className="w-full h-64 md:h-80 object-cover"
                  />
                </div>
                {tournament.posters.length > 1 && (
                  <div className="flex gap-2 mt-3 overflow-x-auto pb-2">
                    {tournament.posters.map((poster, index) => (
                      <button
                        key={poster.id}
                        onClick={() => setSelectedPoster(index)}
                        className={`flex-shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 transition-all ${
                          selectedPoster === index ? 'border-white scale-105' : 'border-white/30 opacity-70 hover:opacity-100'
                        }`}
                      >
                        <img 
                          src={getImageUrl(poster.imageUrl)} 
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
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-4">
                <span className={`px-4 py-1.5 rounded-full text-sm font-semibold ${statusStyle.bg} ${statusStyle.text}`}>
                  {statusStyle.label}
                </span>
                <span className="px-3 py-1.5 bg-white/10 backdrop-blur-sm rounded-full text-white/80 text-sm border border-white/20">
                  {tournament.format === 'both' ? '🏸 Singles & Doubles' : 
                   tournament.format === 'singles' ? '🏸 Singles' : '👥 Doubles'}
                </span>
              </div>

              <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
                {tournament.name}
              </h1>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-white/80">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
                    <MapPinIcon className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="text-white font-medium">{tournament.venue}</p>
                    <p className="text-sm text-white/60">{tournament.city}, {tournament.state}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
                    <CalendarIcon className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="text-white font-medium">{formatDate(tournament.startDate)}</p>
                    <p className="text-sm text-white/60">to {formatDate(tournament.endDate)}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 -mt-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Description */}
            <div className="bg-slate-800/50 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
              <h2 className="text-xl font-bold text-white mb-4">About Tournament</h2>
              <p className="text-gray-400 whitespace-pre-wrap leading-relaxed break-words max-w-full overflow-hidden">
                {tournament.description && tournament.description.length > 500 
                  ? tournament.description.substring(0, 500) + '...' 
                  : tournament.description || 'No description provided.'}
              </p>
            </div>

            {/* Key Details */}
            <div className="bg-slate-800/50 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
              <h2 className="text-xl font-bold text-white mb-4">Tournament Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-purple-500/20 border border-purple-500/30 rounded-xl flex items-center justify-center flex-shrink-0">
                    <MapPinIcon className="h-6 w-6 text-purple-400" />
                  </div>
                  <div>
                    <p className="font-semibold text-white">Venue</p>
                    <p className="text-gray-400">{tournament.venue}</p>
                    <p className="text-sm text-gray-400">
                      {tournament.address}, {tournament.city}, {tournament.state} - {tournament.pincode}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-amber-500/20 border border-amber-500/30 rounded-xl flex items-center justify-center flex-shrink-0">
                    <CalendarIcon className="h-6 w-6 text-amber-400" />
                  </div>
                  <div>
                    <p className="font-semibold text-white">Tournament Schedule</p>
                    <p className="text-gray-400">Start: {formatDate(tournament.startDate)}</p>
                    <p className="text-gray-400">End: {formatDate(tournament.endDate)}</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-blue-500/20 border border-blue-500/30 rounded-xl flex items-center justify-center flex-shrink-0">
                    <ClockIcon className="h-6 w-6 text-blue-400" />
                  </div>
                  <div>
                    <p className="font-semibold text-white">Registration Period</p>
                    <p className="text-sm text-gray-400">Opens: {formatDateTime(tournament.registrationOpenDate)}</p>
                    <p className="text-sm text-gray-400">Closes: {formatDateTime(tournament.registrationCloseDate)}</p>
                  </div>
                </div>

                {/* Shuttle Information */}
                {(tournament.shuttleType || tournament.shuttleBrand) && (
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-emerald-500/20 border border-emerald-500/30 rounded-xl flex items-center justify-center flex-shrink-0">
                      <span className="text-2xl">🏸</span>
                    </div>
                    <div>
                      <p className="font-semibold text-white">Shuttle Information</p>
                      {tournament.shuttleType && (
                        <p className="text-gray-400">
                          Type: <span className="text-white font-medium">{tournament.shuttleType}</span>
                        </p>
                      )}
                      {tournament.shuttleBrand && (
                        <p className="text-gray-400">
                          Brand: <span className="text-white font-medium">{tournament.shuttleBrand}</span>
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Categories */}
            <div className="bg-slate-800/50 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center">
                  <TrophyIcon className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-xl font-bold text-white">Categories</h2>
              </div>
              
              {tournament.categories && tournament.categories.length > 0 ? (
                <div className="space-y-4">
                  {tournament.categories.map((category) => {
                    // Parse scoring format for display
                    const getScoringDisplay = () => {
                      const format = category.scoringFormat || '21x3';
                      
                      // Try parsing "3 games to 21 pts" format
                      const match1 = format.match(/(\d+)\s*games?\s*to\s*(\d+)/i);
                      if (match1) {
                        return { points: match1[2], sets: match1[1] };
                      }
                      
                      // Try parsing "21x3" format
                      const match2 = format.match(/(\d+)x(\d+)/);
                      if (match2) {
                        return { points: match2[1], sets: match2[2] };
                      }
                      
                      return { points: '21', sets: '3' };
                    };
                    const scoring = getScoringDisplay();
                    
                    // Get tournament format display
                    const getFormatDisplay = () => {
                      switch (category.tournamentFormat) {
                        case 'KNOCKOUT': return { label: 'Knockout', icon: '🏆', color: 'amber' };
                        case 'ROUND_ROBIN': return { label: 'Round Robin', icon: '🔄', color: 'purple' };
                        case 'ROUND_ROBIN_KNOCKOUT': return { label: 'Round Robin + Knockout', icon: '⚡', color: 'emerald' };
                        default: return { label: 'Knockout', icon: '🏆', color: 'amber' };
                      }
                    };
                    const formatInfo = getFormatDisplay();
                    
                    return (
                    <div
                      key={category.id}
                      className="border border-white/10 rounded-2xl p-5 hover:border-purple-500/50 hover:shadow-[0_0_20px_rgba(168,85,247,0.2)] transition-all bg-slate-700/50"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-bold text-white text-lg mb-2">
                            {category.name}
                          </h3>
                          <div className="flex flex-wrap gap-2 mb-3">
                            <span className="px-3 py-1 bg-purple-500/20 text-purple-400 border border-purple-500/30 rounded-full text-xs font-medium">
                              {category.format}
                            </span>
                            <span className="px-3 py-1 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-full text-xs font-medium">
                              {category.gender}
                            </span>
                            {category.ageGroup && (
                              <span className="px-3 py-1 bg-green-500/20 text-green-400 border border-green-500/30 rounded-full text-xs font-medium">
                                {category.ageGroup}
                              </span>
                            )}
                            {category.maxParticipants && (
                              <span className="px-3 py-1 bg-slate-600/50 text-gray-300 border border-white/10 rounded-full text-xs font-medium">
                                Max {category.maxParticipants}
                              </span>
                            )}
                          </div>
                          
                          {/* Tournament Format & Scoring Info */}
                          <div className="mt-3 pt-3 border-t border-white/10">
                            <div className="flex flex-wrap gap-4 text-sm">
                              {/* Tournament Format */}
                              <div className="flex items-center gap-2">
                                <span className={`px-2 py-1 rounded-lg text-xs font-semibold ${
                                  formatInfo.color === 'amber' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                                  formatInfo.color === 'purple' ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' :
                                  'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                }`}>
                                  {formatInfo.icon} {formatInfo.label}
                                </span>
                              </div>
                              {/* Scoring Format */}
                              <div className="flex items-center gap-2 text-gray-400">
                                <span className="text-xs">🎯</span>
                                <span className="text-xs font-medium">{scoring.points} pts × {scoring.sets} {parseInt(scoring.sets) === 1 ? 'set' : 'sets'}</span>
                              </div>
                            </div>
                          </div>
                          
                          {(category.prizeWinner || category.prizeRunnerUp || category.prizeSemiFinalist) && (
                            <div className="mt-3 pt-3 border-t border-white/10">
                              <div className="flex items-center gap-2 mb-2">
                                <SparklesIcon className="w-4 h-4 text-amber-400" />
                                <span className="text-xs font-semibold text-amber-400">Cash Prize</span>
                              </div>
                              <div className="flex flex-wrap gap-3 text-sm">
                                {category.prizeWinner && (
                                  <span className="text-green-400 font-medium">🥇 ₹{category.prizeWinner}</span>
                                )}
                                {category.prizeRunnerUp && (
                                  <span className="text-blue-400 font-medium">🥈 ₹{category.prizeRunnerUp}</span>
                                )}
                                {category.prizeSemiFinalist && (
                                  <span className="text-orange-400 font-medium">🥉 ₹{category.prizeSemiFinalist}</span>
                                )}
                              </div>
                              {category.prizeDescription && (
                                <p className="text-xs text-gray-500 mt-1">+ {category.prizeDescription}</p>
                              )}
                            </div>
                          )}
                        </div>
                        <div className="text-right">
                          <div className="flex items-center gap-1 text-2xl font-bold text-white">
                            <CurrencyRupeeIcon className="h-6 w-6" />
                            {category.entryFee}
                          </div>
                          <p className="text-xs text-gray-400 mt-1">
                            {category.registrationCount || 0} registered
                          </p>
                        </div>
                      </div>
                    </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-10">
                  <div className="w-16 h-16 bg-slate-700/50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Layers className="w-8 h-8 text-gray-500" />
                  </div>
                  <p className="text-gray-400">No categories available yet</p>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Register Button - Show for published tournaments */}
            {tournament.status === 'published' && (
              <div className="bg-gradient-to-br from-purple-600 to-indigo-700 rounded-2xl p-6 text-white shadow-xl shadow-purple-500/30">
                <h3 className="font-bold text-lg mb-2">Ready to Compete?</h3>
                <p className="text-purple-100 text-sm mb-4">
                  Registration closes on {formatDate(tournament.registrationCloseDate)}
                </p>
                {user && canRegister() ? (
                  <button
                    onClick={() => navigate(`/tournaments/${id}/register`)}
                    className="w-full bg-white text-purple-700 px-6 py-3.5 rounded-xl hover:bg-purple-50 font-bold text-lg transition-all hover:scale-105"
                  >
                    Register Now
                  </button>
                ) : (
                  <button
                    onClick={() => setShowLoginModal(true)}
                    className="w-full bg-white text-purple-700 px-6 py-3.5 rounded-xl hover:bg-purple-50 font-bold text-lg transition-all hover:scale-105"
                  >
                    Register Now
                  </button>
                )}
              </div>
            )}

            {/* Organizer Info */}
            <div className="bg-slate-800/50 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
              <h3 className="font-bold text-white mb-4">Organized By</h3>
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-xl flex items-center justify-center text-white font-bold text-xl">
                  {tournament.organizer.name?.charAt(0)?.toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold text-white">{tournament.organizer.name}</p>
                  <p className="text-sm text-gray-400">{tournament.organizer.email}</p>
                  {tournament.organizer.phone && (
                    <p className="text-sm text-gray-400">{tournament.organizer.phone}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="bg-slate-800/50 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
              <h3 className="font-bold text-white mb-4">Quick Stats</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-purple-500/20 border border-purple-500/30 rounded-xl">
                  <span className="text-gray-300 font-medium">Categories</span>
                  <span className="font-bold text-purple-400">{tournament.categories?.length || 0}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-blue-500/20 border border-blue-500/30 rounded-xl">
                  <span className="text-gray-300 font-medium">Registrations</span>
                  <span className="font-bold text-blue-400">{tournament._count?.registrations || 0}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-green-500/20 border border-green-500/30 rounded-xl">
                  <span className="text-gray-300 font-medium">Zone</span>
                  <span className="font-bold text-green-400">{tournament.zone}</span>
                </div>
              </div>
              
              {/* View Draws Button - Available for all users */}
              {tournament.status === 'published' && (
                <button
                  onClick={() => {
                    // Organizers go to full management page, others go to read-only view
                    if (user && user.id === tournament.organizerId) {
                      navigate(`/tournaments/${id}/draws`);
                    } else {
                      navigate(`/player/tournaments/${id}/draws`);
                    }
                  }}
                  className="w-full mt-4 flex items-center justify-center gap-2 bg-amber-500/20 text-amber-400 border border-amber-500/30 px-4 py-3 rounded-xl hover:bg-amber-500/30 font-semibold transition-all"
                >
                  <GitBranch className="w-4 h-4" />
                  View Draws
                </button>
              )}
            </div>
            
            {/* Organizer Management */}
            {console.log('🔍 Organizer Check:', {
              userId: user?.id,
              organizerId: tournament.organizerId,
              isMatch: user?.id === tournament.organizerId,
              userName: user?.name,
              userEmail: user?.email
            })}
            {user && user.id === tournament.organizerId && (
              <div className="bg-slate-800/50 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
                <h3 className="font-bold text-white mb-4">Manage Tournament</h3>
                <div className="space-y-3">
                  {tournament.status === 'draft' && (
                    <>
                      <button
                        onClick={() => setShowPublishConfirmModal(true)}
                        disabled={publishing || tournament.categories?.length === 0}
                        className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white px-4 py-3 rounded-xl hover:shadow-lg hover:shadow-green-500/30 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed font-semibold transition-all"
                      >
                        {publishing ? 'Publishing...' : '🚀 Publish Tournament'}
                      </button>
                      {tournament.categories?.length === 0 && (
                        <p className="text-xs text-red-500 text-center">Add at least one category to publish</p>
                      )}
                    </>
                  )}
                  <button
                    onClick={() => navigate(`/tournaments/${id}/edit`)}
                    className="w-full flex items-center justify-center gap-2 bg-purple-500/20 text-purple-400 border border-purple-500/30 px-4 py-3 rounded-xl hover:bg-purple-500/30 font-semibold transition-all"
                  >
                    <Edit className="w-4 h-4" />
                    Edit Tournament
                  </button>
                  <button
                    onClick={() => navigate(`/tournaments/${id}/draws`)}
                    className="w-full flex items-center justify-center gap-2 bg-amber-500/20 text-amber-400 border border-amber-500/30 px-4 py-3 rounded-xl hover:bg-amber-500/30 font-semibold transition-all"
                  >
                    <GitBranch className="w-4 h-4" />
                    View Draws
                  </button>
                  <button
                    onClick={() => navigate(`/organizer/tournaments/${id}`)}
                    className="w-full flex items-center justify-center gap-2 bg-blue-500/20 text-blue-400 border border-blue-500/30 px-4 py-3 rounded-xl hover:bg-blue-500/30 font-semibold transition-all"
                  >
                    <Eye className="w-4 h-4" />
                    View Registrations
                  </button>
                  <button
                    onClick={openUmpireModal}
                    className="w-full flex items-center justify-center gap-2 bg-teal-500/20 text-teal-400 border border-teal-500/30 px-4 py-3 rounded-xl hover:bg-teal-500/30 font-semibold transition-all"
                  >
                    <Users className="w-4 h-4" />
                    Add Umpire
                  </button>
                  <button
                    onClick={() => setShowDeleteModal(true)}
                    disabled={deleting}
                    className="w-full flex items-center justify-center gap-2 bg-red-500/20 text-red-400 border border-red-500/30 px-4 py-3 rounded-xl hover:bg-red-500/30 disabled:opacity-50 font-semibold transition-all"
                  >
                    <TrashIcon className="h-4 w-4" />
                    Delete Tournament
                  </button>
                </div>
              </div>
            )}

            {/* Super Admin Actions */}
            {isSuperAdmin() && (
              <div className="bg-gradient-to-br from-purple-900/50 to-indigo-900/50 backdrop-blur-sm border border-purple-500/30 rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-4">
                  <SparklesIcon className="h-5 w-5 text-purple-400" />
                  <h3 className="font-bold text-white">Super Admin Actions</h3>
                </div>
                <div className="space-y-3">
                  <button
                    onClick={() => setShowQuickAddModal(true)}
                    className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-purple-500 to-indigo-600 text-white px-4 py-3 rounded-xl hover:shadow-lg hover:shadow-purple-500/30 font-semibold transition-all"
                  >
                    <UserPlusIcon className="h-4 w-4" />
                    Quick Add Player
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <DeleteTournamentModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        tournamentName={tournament?.name}
        isDeleting={deleting}
      />

      {/* Add Umpire Modal */}
      {showUmpireModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-white/10">
            {/* Header with halo effect */}
            <div className="relative bg-gradient-to-r from-teal-600 to-emerald-600 p-6 text-white overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-teal-400/20 to-emerald-400/20 blur-xl"></div>
              <div className="relative flex items-center gap-3">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                  <Users className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">Add Umpire</h2>
                  <p className="text-teal-100 text-sm mt-1">Enter umpire's unique code</p>
                </div>
              </div>
            </div>

            <div className="p-6">
              {/* Info box */}
              <div className="bg-slate-700/50 border border-white/10 rounded-xl p-4 mb-4">
                <p className="text-gray-300 text-sm">
                  Enter the umpire's 7-character code with # prefix (e.g., <span className="text-teal-400 font-mono">#123ABCD</span>)
                </p>
              </div>

              {/* Error message */}
              {umpireError && (
                <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-xl text-red-400 text-sm">
                  {umpireError}
                </div>
              )}

              {/* Success message */}
              {umpireSuccess && (
                <div className="mb-4 p-3 bg-green-500/20 border border-green-500/30 rounded-xl text-green-400 text-sm">
                  {umpireSuccess}
                </div>
              )}

              {/* Input field */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Umpire Code
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={umpireCode}
                    onChange={(e) => {
                      setUmpireCode(e.target.value.toUpperCase());
                      setUmpireError('');
                    }}
                    placeholder="#123ABCD"
                    maxLength={8}
                    className="w-full px-4 py-3 bg-slate-700/50 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all font-mono text-lg tracking-wider"
                  />
                </div>
              </div>

              {/* Add button */}
              <button
                onClick={handleAddUmpire}
                disabled={addingUmpire || !umpireCode.trim()}
                className="w-full px-4 py-3 bg-gradient-to-r from-teal-500 to-emerald-600 text-white rounded-xl hover:shadow-lg hover:shadow-teal-500/30 transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mb-6"
              >
                {addingUmpire ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    Adding...
                  </>
                ) : (
                  <>
                    <UserGroupIcon className="h-5 w-5" />
                    Add Umpire
                  </>
                )}
              </button>

              {/* Current umpires list */}
              <div className="border-t border-white/10 pt-4">
                <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                  <Users className="w-4 h-4 text-teal-400" />
                  Tournament Umpires ({umpires.length})
                </h3>
                
                {loadingUmpires ? (
                  <div className="flex items-center justify-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-2 border-teal-500 border-t-transparent"></div>
                  </div>
                ) : umpires.length === 0 ? (
                  <div className="text-center py-4">
                    <p className="text-gray-500 text-sm">No umpires added yet</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {umpires.map((umpire) => (
                      <div
                        key={umpire.id}
                        className="flex items-center justify-between p-3 bg-slate-700/50 border border-white/10 rounded-xl"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-teal-400 to-emerald-500 rounded-xl flex items-center justify-center text-white font-bold">
                            {umpire.name?.charAt(0)?.toUpperCase()}
                          </div>
                          <div>
                            <p className="text-white font-medium">{umpire.name}</p>
                            <p className="text-gray-400 text-xs font-mono">{umpire.umpireCode}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleRemoveUmpire(umpire.id)}
                          className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
                          title="Remove umpire"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Close button */}
              <button
                onClick={() => setShowUmpireModal(false)}
                className="w-full mt-4 px-4 py-3 border border-white/10 rounded-xl text-gray-300 hover:bg-slate-700/50 transition-colors font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Login Required Modal */}
      {showLoginModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
            <div className="bg-gradient-to-r from-purple-600 to-indigo-700 p-6 text-white">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                  <UserIcon className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">Sign In Required</h2>
                  <p className="text-purple-100 text-sm mt-1">Create an account to register</p>
                </div>
              </div>
            </div>

            <div className="p-6">
              <p className="text-gray-700 mb-6">
                To register for <span className="font-semibold">"{tournament?.name}"</span>, you need to sign in or create an account first.
              </p>

              <div className="space-y-3">
                <Link
                  to={`/register?redirect=/tournaments/${id}/register`}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl hover:shadow-lg hover:shadow-purple-500/30 transition-all font-semibold"
                >
                  Create Account
                </Link>
                <Link
                  to={`/login?redirect=/tournaments/${id}/register`}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-purple-200 text-purple-700 rounded-xl hover:bg-purple-50 transition-all font-semibold"
                >
                  Sign In
                </Link>
                <button
                  onClick={() => setShowLoginModal(false)}
                  className="w-full px-4 py-3 text-gray-400 hover:text-gray-700 transition-colors font-medium"
                >
                  Cancel
                </button>
              </div>

              <p className="text-center text-sm text-gray-400 mt-4">
                Registration is free and takes less than a minute!
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Publish Confirmation Modal */}
      {showPublishConfirmModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-6 text-white">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                  <SparklesIcon className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">Publish Tournament</h2>
                  <p className="text-green-100 text-sm mt-1">Make it live for players</p>
                </div>
              </div>
            </div>

            <div className="p-6">
              <p className="text-gray-700 mb-4">
                You are about to publish <span className="font-semibold">"{tournament?.name}"</span>.
              </p>
              
              <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6">
                <p className="text-green-800 text-sm">
                  Once published, your tournament will be visible to all players and they can start registering.
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowPublishConfirmModal(false)}
                  className="flex-1 px-4 py-3 border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handlePublish}
                  disabled={publishing}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl hover:shadow-lg hover:shadow-green-500/30 transition-all font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {publishing ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                      Publishing...
                    </>
                  ) : (
                    '🚀 Publish Now'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Publish Result Modal */}
      {publishResultModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
            <div className={`p-6 text-white ${publishResultModal.type === 'success' ? 'bg-gradient-to-r from-green-500 to-emerald-600' : 'bg-gradient-to-r from-red-500 to-rose-600'}`}>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                  {publishResultModal.type === 'success' ? (
                    <TrophyIcon className="h-6 w-6" />
                  ) : (
                    <ExclamationTriangleIcon className="h-6 w-6" />
                  )}
                </div>
                <h2 className="text-xl font-bold">{publishResultModal.title}</h2>
              </div>
            </div>

            <div className="p-6">
              <p className="text-gray-700 mb-6">{publishResultModal.message}</p>
              <button
                onClick={() => setPublishResultModal(null)}
                className={`w-full px-4 py-3 rounded-xl font-semibold transition-all ${
                  publishResultModal.type === 'success' 
                    ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:shadow-lg hover:shadow-green-500/30' 
                    : 'bg-gradient-to-r from-red-500 to-rose-600 text-white hover:shadow-lg hover:shadow-red-500/30'
                }`}
              >
                {publishResultModal.type === 'success' ? 'Awesome!' : 'Got it'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Result Modal */}
      {deleteResultModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
            <div className={`p-6 text-white ${deleteResultModal.type === 'success' ? 'bg-gradient-to-r from-emerald-500 to-teal-600' : 'bg-gradient-to-r from-red-500 to-rose-600'}`}>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                  {deleteResultModal.type === 'success' ? (
                    <SparklesIcon className="h-6 w-6" />
                  ) : (
                    <ExclamationTriangleIcon className="h-6 w-6" />
                  )}
                </div>
                <h2 className="text-xl font-bold">{deleteResultModal.title}</h2>
              </div>
            </div>

            <div className="p-6">
              <p className="text-gray-700 mb-2">{deleteResultModal.message}</p>
              {deleteResultModal.type === 'success' && (
                <p className="text-sm text-gray-400 mb-6">
                  All participants have received a notification from Matchify.pro about this cancellation.
                </p>
              )}
              <button
                onClick={() => {
                  if (deleteResultModal.redirectTo) {
                    navigate(deleteResultModal.redirectTo);
                  }
                  setDeleteResultModal(null);
                }}
                className={`w-full px-4 py-3 rounded-xl font-semibold transition-all ${
                  deleteResultModal.type === 'success' 
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white hover:shadow-lg hover:shadow-emerald-500/30' 
                    : 'bg-gradient-to-r from-red-500 to-rose-600 text-white hover:shadow-lg hover:shadow-red-500/30'
                }`}
              >
                {deleteResultModal.type === 'success' ? 'Continue' : 'Got it'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Add Player Modal (Super Admin Only) */}
      {showQuickAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-purple-500/30">
            <div className="relative bg-gradient-to-r from-purple-600 to-indigo-600 p-6 text-white overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-400/20 to-indigo-400/20 blur-xl"></div>
              <div className="relative flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                    <UserPlusIcon className="h-6 w-6" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">Quick Add Player</h2>
                    <p className="text-purple-100 text-sm mt-1">Add player without payment</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowQuickAddModal(false);
                    setQuickAddError('');
                    setQuickAddSuccess('');
                  }}
                  className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-xl flex items-center justify-center transition-colors"
                >
                  <span className="text-2xl">×</span>
                </button>
              </div>
            </div>
            <form onSubmit={handleQuickAddPlayer} className="p-6 space-y-4">
              {quickAddSuccess && (
                <div className="bg-emerald-500/20 border border-emerald-500/30 rounded-xl p-4 text-emerald-300 text-sm">
                  {quickAddSuccess}
                </div>
              )}
              {quickAddError && (
                <div className="bg-red-500/20 border border-red-500/30 rounded-xl p-4 text-red-300 text-sm">
                  {quickAddError}
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Player Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={quickAddData.name}
                  onChange={(e) => setQuickAddData({ ...quickAddData, name: e.target.value })}
                  placeholder="Enter player name"
                  className="w-full px-4 py-3 bg-slate-700/50 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Email Address <span className="text-red-400">*</span>
                </label>
                <input
                  type="email"
                  value={quickAddData.email}
                  onChange={(e) => setQuickAddData({ ...quickAddData, email: e.target.value })}
                  placeholder="player@example.com"
                  className="w-full px-4 py-3 bg-slate-700/50 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Phone Number <span className="text-red-400">*</span>
                </label>
                <input
                  type="tel"
                  value={quickAddData.phone}
                  onChange={(e) => setQuickAddData({ ...quickAddData, phone: e.target.value })}
                  placeholder="+91 9876543210"
                  className="w-full px-4 py-3 bg-slate-700/50 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Category <span className="text-red-400">*</span>
                </label>
                <select
                  value={quickAddData.categoryId}
                  onChange={(e) => setQuickAddData({ ...quickAddData, categoryId: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-700/50 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  required
                >
                  <option value="">Select a category</option>
                  {tournament?.categories?.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name} - {category.format} ({category.gender})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Gender
                </label>
                <select
                  value={quickAddData.gender}
                  onChange={(e) => setQuickAddData({ ...quickAddData, gender: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-700/50 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
                <p className="text-blue-300 text-sm">
                  <strong>Note:</strong> This player will be added without payment. A temporary account will be created if the email doesn't exist.
                </p>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowQuickAddModal(false);
                    setQuickAddError('');
                    setQuickAddSuccess('');
                  }}
                  disabled={quickAddLoading}
                  className="flex-1 px-4 py-3 border border-white/10 rounded-xl text-gray-300 hover:bg-slate-700/50 transition-colors font-medium disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={quickAddLoading}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-xl hover:shadow-lg hover:shadow-purple-500/30 transition-all font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {quickAddLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Adding...
                    </>
                  ) : (
                    <>
                      <UserPlusIcon className="h-4 w-4" />
                      Add Player
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TournamentDetailPage;
