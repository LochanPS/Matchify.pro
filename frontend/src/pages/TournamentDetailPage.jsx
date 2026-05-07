import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { tournamentAPI } from '../api/tournament';
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
  const [showPosterModal, setShowPosterModal] = useState(false);
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

  // Quick Add Player state (Admin only)
  const [showQuickAddModal, setShowQuickAddModal] = useState(false);
  const [quickAddData, setQuickAddData] = useState({
    name: '',
    player2Name: '',
    categoryId: ''
  });
  const [quickAddLoading, setQuickAddLoading] = useState(false);
  const [quickAddError, setQuickAddError] = useState('');
  const [quickAddSuccess, setQuickAddSuccess] = useState('');

  useEffect(() => {
    fetchTournament();
  }, [id]);

  // Keyboard navigation for poster modal
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (!showPosterModal) return;
      
      switch (event.key) {
        case 'Escape':
          setShowPosterModal(false);
          break;
        case 'ArrowLeft':
          if (tournament?.posters && selectedPoster > 0) {
            setSelectedPoster(selectedPoster - 1);
          }
          break;
        case 'ArrowRight':
          if (tournament?.posters && selectedPoster < tournament.posters.length - 1) {
            setSelectedPoster(selectedPoster + 1);
          }
          break;
      }
    };

    if (showPosterModal) {
      document.addEventListener('keydown', handleKeyDown);
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [showPosterModal, selectedPoster, tournament?.posters]);

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

    // Get selected category to check format
    const selectedCategory = tournament?.categories?.find(c => c.id === quickAddData.categoryId);
    
    // Validation - name and category required, player2Name required for doubles
    if (!quickAddData.name || !quickAddData.categoryId) {
      setQuickAddError('Name and category are required');
      return;
    }

    if (selectedCategory?.format === 'doubles' && !quickAddData.player2Name) {
      setQuickAddError('Both player names are required for doubles category');
      return;
    }

    try {
      setQuickAddLoading(true);
      const response = await api.post(`/admin/tournaments/${id}/quick-add-player`, quickAddData);
      
      if (response.data.success) {
        const displayName = selectedCategory?.format === 'doubles'
          ? `${quickAddData.name} / ${quickAddData.player2Name}`
          : quickAddData.name;
        setQuickAddSuccess(`${selectedCategory?.format === 'doubles' ? 'Team' : 'Player'} "${displayName}" added successfully!`);
        // Reset form
        setQuickAddData({
          name: '',
          player2Name: '',
          categoryId: ''
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

  const isAdmin = () => {
    if (!user) return false;
    const userRoles = Array.isArray(user.roles) ? user.roles : [user.role];
    return userRoles.includes('ADMIN');
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
      {/* Hero Header with Poster - Mobile Optimized */}
      <div className="relative bg-gradient-to-r from-slate-900 via-purple-900 to-slate-900 overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/4 w-64 h-64 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
          <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 py-5">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-white/70 hover:text-white mb-4 transition-colors"
          >
            <ArrowLeftIcon className="h-4 w-4" />
            <span className="text-sm">Back</span>
          </button>

          <div className="flex flex-col md:flex-row gap-5 items-start">
            {/* Poster - Compact for Mobile */}
            {tournament?.posters && tournament.posters.length > 0 && (
              <div className="w-full md:w-64 flex-shrink-0">
                <div 
                  className="rounded-xl overflow-hidden shadow-xl border-2 border-white/20 cursor-pointer hover:scale-105 transition-transform duration-300 group relative"
                  onClick={() => {
                    console.log('Poster clicked! Opening modal...');
                    setShowPosterModal(true);
                  }}
                >
                  <img
                    src={getImageUrl(tournament.posters?.[selectedPoster]?.imageUrl)}
                    alt={tournament.name}
                    className="w-full h-48 md:h-64 object-cover"
                  />
                  {/* Click hint overlay */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 flex items-center justify-center">
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-white/90 text-gray-800 px-2 py-1 rounded-full text-xs font-medium">
                      Tap to enlarge
                    </div>
                  </div>
                </div>
                {tournament.posters?.length > 1 && (
                  <div className="flex gap-2 mt-2 overflow-x-auto pb-2">
                    {tournament.posters.map((poster, index) => (
                      <button
                        key={poster.id}
                        onClick={() => setSelectedPoster(index)}
                        className={`flex-shrink-0 w-12 h-12 rounded-lg overflow-hidden border-2 transition-all ${
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

            {/* Tournament Info - Compact */}
            <div className="flex-1 w-full">
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${statusStyle.bg} ${statusStyle.text}`}>
                  {statusStyle.label}
                </span>
                <span className="px-2 py-1 bg-white/10 backdrop-blur-sm rounded-full text-white/80 text-xs border border-white/20">
                  {tournament.format === 'both' ? '🏸 Singles & Doubles' : 
                   tournament.format === 'singles' ? '🏸 Singles' : '👥 Doubles'}
                </span>
              </div>

              <h1 className="text-xl md:text-2xl font-black text-white mb-3 leading-tight">
                {tournament.name}
              </h1>

              <div className="grid grid-cols-1 gap-3 text-white/80">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <MapPinIcon className="h-4 w-4 text-white" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-white font-semibold text-sm truncate">{tournament.venue}</p>
                    <p className="text-xs text-white/60 truncate">{tournament.city}, {tournament.state}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <CalendarIcon className="h-4 w-4 text-white" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-white font-semibold text-sm">{formatDate(tournament.startDate)}</p>
                    <p className="text-xs text-white/60">to {formatDate(tournament.endDate)}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-5 -mt-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-4">
            {/* Description - Compact */}
            <div className="bg-slate-800/50 backdrop-blur-sm border border-white/10 rounded-xl p-4">
              <h2 className="text-base font-bold text-white mb-3">About Tournament</h2>
              <p className="text-gray-400 text-sm whitespace-pre-wrap leading-relaxed break-words max-w-full overflow-hidden">
                {tournament.description && tournament.description.length > 300 
                  ? tournament.description.substring(0, 300) + '...' 
                  : tournament.description || 'No description provided.'}
              </p>
            </div>

            {/* Key Details - Compact */}
            <div className="bg-slate-800/50 backdrop-blur-sm border border-white/10 rounded-xl p-4">
              <h2 className="text-base font-bold text-white mb-3">Tournament Details</h2>
              <div className="grid grid-cols-1 gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-purple-500/20 border border-purple-500/30 rounded-lg flex items-center justify-center flex-shrink-0">
                    <MapPinIcon className="h-5 w-5 text-purple-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-white text-sm">Venue</p>
                    <p className="text-gray-400 text-sm">{tournament.venue}</p>
                    <p className="text-xs text-gray-400 truncate">
                      {tournament.address}, {tournament.city}, {tournament.state} - {tournament.pincode}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-amber-500/20 border border-amber-500/30 rounded-lg flex items-center justify-center flex-shrink-0">
                    <CalendarIcon className="h-5 w-5 text-amber-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-white text-sm">Tournament Schedule</p>
                    <p className="text-gray-400 text-sm">Start: {formatDate(tournament.startDate)}</p>
                    <p className="text-gray-400 text-sm">End: {formatDate(tournament.endDate)}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-blue-500/20 border border-blue-500/30 rounded-lg flex items-center justify-center flex-shrink-0">
                    <ClockIcon className="h-5 w-5 text-blue-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-white text-sm">Registration Period</p>
                    <p className="text-xs text-gray-400">Opens: {formatDateTime(tournament.registrationOpenDate)}</p>
                    <p className="text-xs text-gray-400">Closes: {formatDateTime(tournament.registrationCloseDate)}</p>
                  </div>
                </div>

                {/* Shuttle Information */}
                {(tournament.shuttleType || tournament.shuttleBrand) && (
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-emerald-500/20 border border-emerald-500/30 rounded-lg flex items-center justify-center flex-shrink-0">
                      <span className="text-xl">🏸</span>
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-white text-sm">Shuttle Information</p>
                      {tournament.shuttleType && (
                        <p className="text-gray-400 text-sm">
                          Type: <span className="text-white font-medium">{tournament.shuttleType}</span>
                        </p>
                      )}
                      {tournament.shuttleBrand && (
                        <p className="text-gray-400 text-sm">
                          Brand: <span className="text-white font-medium">{tournament.shuttleBrand}</span>
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Categories - Compact */}
            <div className="bg-slate-800/50 backdrop-blur-sm border border-white/10 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-amber-400 to-orange-500 rounded-lg flex items-center justify-center">
                  <TrophyIcon className="w-4 h-4 text-white" />
                </div>
                <h2 className="text-base font-bold text-white">Categories</h2>
              </div>
              
              {tournament.categories && tournament.categories.length > 0 ? (
                <div className="space-y-3">
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
                      className="border border-white/10 rounded-xl p-4 hover:border-purple-500/50 hover:shadow-[0_0_15px_rgba(168,85,247,0.15)] transition-all bg-slate-700/50"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-white text-base mb-2 truncate">
                            {category.name}
                          </h3>
                          <div className="flex flex-wrap gap-1.5 mb-2">
                            <span className="px-2 py-0.5 bg-purple-500/20 text-purple-400 border border-purple-500/30 rounded-full text-xs font-medium">
                              {category.format}
                            </span>
                            <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-full text-xs font-medium">
                              {category.gender}
                            </span>
                            {category.ageGroup && (
                              <span className="px-2 py-0.5 bg-green-500/20 text-green-400 border border-green-500/30 rounded-full text-xs font-medium">
                                {category.ageGroup}
                              </span>
                            )}
                            {category.maxParticipants && (
                              <span className="px-2 py-0.5 bg-slate-600/50 text-gray-300 border border-white/10 rounded-full text-xs font-medium">
                                Max {category.maxParticipants}
                              </span>
                            )}
                          </div>
                          
                          {/* Tournament Format & Scoring Info - Compact */}
                          <div className="mt-2 pt-2 border-t border-white/10">
                            <div className="flex flex-wrap gap-2 text-xs">
                              {/* Tournament Format */}
                              <div className="flex items-center gap-1">
                                <span className={`px-2 py-0.5 rounded-lg text-xs font-bold ${
                                  formatInfo.color === 'amber' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                                  formatInfo.color === 'purple' ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' :
                                  'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                }`}>
                                  {formatInfo.icon} {formatInfo.label}
                                </span>
                              </div>
                              {/* Scoring Format */}
                              <div className="flex items-center gap-1 text-gray-400">
                                <span className="text-xs">🎯</span>
                                <span className="text-xs font-medium">{scoring.points} pts × {scoring.sets} {parseInt(scoring.sets) === 1 ? 'set' : 'sets'}</span>
                              </div>
                            </div>
                          </div>
                          
                          {(category.prizeWinner || category.prizeRunnerUp || category.prizeSemiFinalist) && (
                            <div className="mt-2 pt-2 border-t border-white/10">
                              <div className="flex items-center gap-1 mb-1">
                                <SparklesIcon className="w-3 h-3 text-amber-400" />
                                <span className="text-xs font-bold text-amber-400">Cash Prize</span>
                              </div>
                              <div className="flex flex-wrap gap-2 text-xs">
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
                        <div className="text-right flex-shrink-0">
                          <div className="flex items-center gap-0.5 text-xl font-bold text-white">
                            <CurrencyRupeeIcon className="h-5 w-5" />
                            {category.entryFee}
                          </div>
                          <p className="text-xs text-gray-400 mt-0.5">
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

          {/* Sidebar - Compact */}
          <div className="space-y-4">
            {/* Register Button - Show for published tournaments */}
            {tournament.status === 'published' && (
              <div className="bg-gradient-to-br from-purple-600 to-indigo-700 rounded-xl p-4 text-white shadow-xl shadow-purple-500/30">
                <h3 className="font-bold text-base mb-1">Ready to Compete?</h3>
                <p className="text-purple-100 text-xs mb-3">
                  Registration closes on {formatDate(tournament.registrationCloseDate)}
                </p>
                {user && canRegister() ? (
                  <button
                    onClick={() => navigate(`/tournaments/${id}/register`)}
                    className="w-full bg-white text-purple-700 px-5 py-3 rounded-xl hover:bg-purple-50 font-bold text-base transition-all hover:scale-105"
                  >
                    Register Now
                  </button>
                ) : (
                  <button
                    onClick={() => setShowLoginModal(true)}
                    className="w-full bg-white text-purple-700 px-5 py-3 rounded-xl hover:bg-purple-50 font-bold text-base transition-all hover:scale-105"
                  >
                    Register Now
                  </button>
                )}
              </div>
            )}

            {/* Organizer Info - Compact */}
            <div className="bg-slate-800/50 backdrop-blur-sm border border-white/10 rounded-xl p-4">
              <h3 className="font-bold text-white text-sm mb-3">Organized By</h3>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-lg flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                  {tournament.organizer.name?.charAt(0)?.toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-white text-sm truncate">{tournament.organizer.name}</p>
                  <p className="text-xs text-gray-400 truncate">{tournament.organizer.email}</p>
                  {tournament.organizer.phone && (
                    <p className="text-xs text-gray-400">{tournament.organizer.phone}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Stats - Colorful Mobile Design */}
            <div 
              className="rounded-2xl p-5 relative overflow-hidden"
              style={{
                background: 'linear-gradient(135deg, rgba(15,23,42,0.95) 0%, rgba(30,41,59,0.95) 100%)',
                border: '2px solid rgba(100,116,139,0.3)',
                backdropFilter: 'blur(20px)',
                boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
              }}
            >
              <h3 className="font-black text-white text-lg mb-4">Quick Stats</h3>
              <div className="space-y-3">
                {/* Categories - Purple */}
                <div 
                  className="flex items-center justify-between p-4 rounded-xl transition-all hover:scale-[1.02]"
                  style={{
                    background: 'linear-gradient(135deg, rgba(139,92,246,0.3) 0%, rgba(124,58,237,0.2) 100%)',
                    border: '2px solid rgba(139,92,246,0.4)',
                    boxShadow: '0 4px 15px rgba(139,92,246,0.2)'
                  }}
                >
                  <span className="text-white/90 font-bold text-base">Categories</span>
                  <span 
                    className="font-black text-2xl"
                    style={{ color: '#c4b5fd' }}
                  >
                    {tournament.categories?.length || 0}
                  </span>
                </div>

                {/* Registrations - Blue */}
                <div 
                  className="flex items-center justify-between p-4 rounded-xl transition-all hover:scale-[1.02]"
                  style={{
                    background: 'linear-gradient(135deg, rgba(59,130,246,0.3) 0%, rgba(37,99,235,0.2) 100%)',
                    border: '2px solid rgba(59,130,246,0.4)',
                    boxShadow: '0 4px 15px rgba(59,130,246,0.2)'
                  }}
                >
                  <span className="text-white/90 font-bold text-base">Registrations</span>
                  <span 
                    className="font-black text-2xl"
                    style={{ color: '#93c5fd' }}
                  >
                    {tournament._count?.registrations || 0}
                  </span>
                </div>

                {/* Zone - Green */}
                <div 
                  className="flex items-center justify-between p-4 rounded-xl transition-all hover:scale-[1.02]"
                  style={{
                    background: 'linear-gradient(135deg, rgba(16,185,129,0.3) 0%, rgba(5,150,105,0.2) 100%)',
                    border: '2px solid rgba(16,185,129,0.4)',
                    boxShadow: '0 4px 15px rgba(16,185,129,0.2)'
                  }}
                >
                  <span className="text-white/90 font-bold text-base">Zone</span>
                  <span 
                    className="font-black text-xl"
                    style={{ color: '#6ee7b7' }}
                  >
                    {tournament.zone}
                  </span>
                </div>
              </div>
              
              {/* View Draws Button - Amber/Gold */}
              {tournament.status === 'published' && (
                <button
                  onClick={() => {
                    if (tournament.categories && tournament.categories.length > 0) {
                      navigate(`/tournaments/${id}/draws/${tournament.categories[0].id}`);
                    } else {
                      navigate(`/tournaments/${id}/draws`);
                    }
                  }}
                  className="w-full mt-4 flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl font-black text-base transition-all hover:scale-[1.02] relative overflow-hidden group"
                  style={{
                    background: 'linear-gradient(135deg, rgba(245,158,11,0.3) 0%, rgba(217,119,6,0.2) 100%)',
                    border: '2px solid rgba(245,158,11,0.5)',
                    color: '#fbbf24',
                    boxShadow: '0 4px 15px rgba(245,158,11,0.3)'
                  }}
                >
                  <GitBranch className="w-5 h-5" />
                  <span>View Draws</span>
                  <div 
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{ background: 'radial-gradient(circle at center, rgba(245,158,11,0.2), transparent)' }}
                  />
                </button>
              )}
            </div>
            
            {/* Organizer Management - Colorful Mobile Design */}
            {console.log('🔍 Organizer Check:', {
              userId: user?.id,
              organizerId: tournament.organizerId,
              isMatch: user?.id === tournament.organizerId,
              userName: user?.name,
              userEmail: user?.email
            })}
            {user && user.id === tournament.organizerId && (
              <div 
                className="rounded-2xl p-5 relative overflow-hidden"
                style={{
                  background: 'linear-gradient(135deg, rgba(15,23,42,0.95) 0%, rgba(30,41,59,0.95) 100%)',
                  border: '2px solid rgba(100,116,139,0.3)',
                  backdropFilter: 'blur(20px)',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
                }}
              >
                <h3 className="font-black text-white text-lg mb-4">Manage Tournament</h3>
                <div className="space-y-3">
                  {tournament.status === 'draft' && (
                    <>
                      <button
                        onClick={() => setShowPublishConfirmModal(true)}
                        disabled={publishing || tournament.categories?.length === 0}
                        className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white px-5 py-3.5 rounded-xl hover:shadow-lg hover:shadow-green-500/30 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed font-black text-base transition-all"
                      >
                        {publishing ? 'Publishing...' : '🚀 Publish Tournament'}
                      </button>
                      {tournament.categories?.length === 0 && (
                        <p className="text-xs text-red-500 text-center">Add at least one category to publish</p>
                      )}
                    </>
                  )}
                  
                  {/* Edit Tournament - Purple */}
                  <button
                    onClick={() => navigate(`/tournaments/${id}/edit`)}
                    className="w-full flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl font-black text-base transition-all hover:scale-[1.02] relative overflow-hidden group"
                    style={{
                      background: 'linear-gradient(135deg, rgba(139,92,246,0.3) 0%, rgba(124,58,237,0.2) 100%)',
                      border: '2px solid rgba(139,92,246,0.5)',
                      color: '#c4b5fd',
                      boxShadow: '0 4px 15px rgba(139,92,246,0.3)'
                    }}
                  >
                    <Edit className="w-5 h-5" />
                    <span>Edit Tournament</span>
                    <div 
                      className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      style={{ background: 'radial-gradient(circle at center, rgba(139,92,246,0.2), transparent)' }}
                    />
                  </button>

                  {/* View Draws - Amber/Gold */}
                  <button
                    onClick={() => navigate(`/tournaments/${id}/draws`)}
                    className="w-full flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl font-black text-base transition-all hover:scale-[1.02] relative overflow-hidden group"
                    style={{
                      background: 'linear-gradient(135deg, rgba(245,158,11,0.3) 0%, rgba(217,119,6,0.2) 100%)',
                      border: '2px solid rgba(245,158,11,0.5)',
                      color: '#fbbf24',
                      boxShadow: '0 4px 15px rgba(245,158,11,0.3)'
                    }}
                  >
                    <GitBranch className="w-5 h-5" />
                    <span>View Draws</span>
                    <div 
                      className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      style={{ background: 'radial-gradient(circle at center, rgba(245,158,11,0.2), transparent)' }}
                    />
                  </button>

                  {/* View Registrations - Blue */}
                  <button
                    onClick={() => navigate(`/organizer/tournaments/${id}`)}
                    className="w-full flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl font-black text-base transition-all hover:scale-[1.02] relative overflow-hidden group"
                    style={{
                      background: 'linear-gradient(135deg, rgba(59,130,246,0.3) 0%, rgba(37,99,235,0.2) 100%)',
                      border: '2px solid rgba(59,130,246,0.5)',
                      color: '#93c5fd',
                      boxShadow: '0 4px 15px rgba(59,130,246,0.3)'
                    }}
                  >
                    <Eye className="w-5 h-5" />
                    <span>View Registrations</span>
                    <div 
                      className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      style={{ background: 'radial-gradient(circle at center, rgba(59,130,246,0.2), transparent)' }}
                    />
                  </button>

                  {/* Add Umpire - Teal/Cyan */}
                  <button
                    onClick={openUmpireModal}
                    className="w-full flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl font-black text-base transition-all hover:scale-[1.02] relative overflow-hidden group"
                    style={{
                      background: 'linear-gradient(135deg, rgba(20,184,166,0.3) 0%, rgba(13,148,136,0.2) 100%)',
                      border: '2px solid rgba(20,184,166,0.5)',
                      color: '#5eead4',
                      boxShadow: '0 4px 15px rgba(20,184,166,0.3)'
                    }}
                  >
                    <Users className="w-5 h-5" />
                    <span>Add Umpire</span>
                    <div 
                      className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      style={{ background: 'radial-gradient(circle at center, rgba(20,184,166,0.2), transparent)' }}
                    />
                  </button>

                  {/* Delete Tournament - Red */}
                  <button
                    onClick={() => setShowDeleteModal(true)}
                    disabled={deleting}
                    className="w-full flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl font-black text-base transition-all hover:scale-[1.02] disabled:opacity-50 relative overflow-hidden group"
                    style={{
                      background: 'linear-gradient(135deg, rgba(239,68,68,0.3) 0%, rgba(220,38,38,0.2) 100%)',
                      border: '2px solid rgba(239,68,68,0.5)',
                      color: '#fca5a5',
                      boxShadow: '0 4px 15px rgba(239,68,68,0.3)'
                    }}
                  >
                    <TrashIcon className="h-5 w-5" />
                    <span>Delete Tournament</span>
                    <div 
                      className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      style={{ background: 'radial-gradient(circle at center, rgba(239,68,68,0.2), transparent)' }}
                    />
                  </button>
                </div>
              </div>
            )}

            {/* Admin Actions - Compact */}
            {isAdmin() && (
              <div className="bg-gradient-to-br from-purple-900/50 to-indigo-900/50 backdrop-blur-sm border border-purple-500/30 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <SparklesIcon className="h-4 w-4 text-purple-400" />
                  <h3 className="font-bold text-white text-sm">Admin Actions</h3>
                </div>
                <div className="space-y-2">
                  <button
                    onClick={() => setShowQuickAddModal(true)}
                    className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-purple-500 to-indigo-600 text-white px-4 py-2.5 rounded-lg hover:shadow-lg hover:shadow-purple-500/30 font-bold text-sm transition-all"
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

      {/* Login Required Modal - Mobile Perfect */}
      {showLoginModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden">
            <div className="bg-gradient-to-r from-purple-600 to-indigo-700 p-5 text-white">
              <div className="flex items-center justify-center gap-2">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                  <UserIcon className="h-5 w-5" />
                </div>
                <h2 className="text-lg font-black">Sign In Required</h2>
              </div>
            </div>

            <div className="p-5">
              <p className="text-gray-700 text-sm mb-5 text-center">
                To register for <span className="font-bold">"{tournament?.name}"</span>, you need to sign in or create an account first.
              </p>

              <div className="space-y-2">
                <Link
                  to={`/register?redirect=/tournaments/${id}/register`}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl hover:shadow-lg hover:shadow-purple-500/30 transition-all font-bold text-sm"
                >
                  Create Account
                </Link>
                <Link
                  to={`/login?redirect=/tournaments/${id}/register`}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-purple-200 text-purple-700 rounded-xl hover:bg-purple-50 transition-all font-bold text-sm"
                >
                  Sign In
                </Link>
                <button
                  onClick={() => setShowLoginModal(false)}
                  className="w-full px-4 py-2.5 text-gray-400 hover:text-gray-700 transition-colors font-medium text-sm"
                >
                  Cancel
                </button>
              </div>

              <p className="text-center text-xs text-gray-400 mt-3">
                Registration is free and takes less than a minute!
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Publish Confirmation Modal - Mobile Perfect */}
      {showPublishConfirmModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden">
            <div className="bg-gradient-to-r from-emerald-500 to-green-600 p-5 text-white">
              <div className="flex items-center justify-center gap-2">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                  <SparklesIcon className="h-5 w-5" />
                </div>
                <h2 className="text-lg font-black">Publish Tournament</h2>
              </div>
            </div>

            <div className="p-5">
              <p className="text-gray-700 text-sm mb-3 text-center">
                You are about to publish <span className="font-bold">"{tournament?.name}"</span>.
              </p>
              
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 mb-5">
                <p className="text-emerald-800 text-xs text-center">
                  Once published, your tournament will be visible to all players and they can start registering.
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setShowPublishConfirmModal(false)}
                  className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors font-bold text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={handlePublish}
                  disabled={publishing}
                  className="flex-1 px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-xl hover:shadow-lg hover:shadow-emerald-500/30 transition-all font-bold text-sm disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  {publishing ? (
                    <>
                      <div className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-white border-t-transparent"></div>
                      <span>Publishing...</span>
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

      {/* Publish Result Modal - MOBILE PERFECT with Emerald Green */}
      {publishResultModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden">
            <div className={`p-5 text-white ${publishResultModal.type === 'success' ? 'bg-gradient-to-r from-emerald-500 to-green-600' : 'bg-gradient-to-r from-red-500 to-rose-600'}`}>
              <div className="flex items-center justify-center gap-2">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                  {publishResultModal.type === 'success' ? (
                    <TrophyIcon className="h-5 w-5" />
                  ) : (
                    <ExclamationTriangleIcon className="h-5 w-5" />
                  )}
                </div>
                <h2 className="text-lg font-black">{publishResultModal.title}</h2>
              </div>
            </div>

            <div className="p-5">
              <p className="text-gray-700 text-sm mb-5 text-center leading-relaxed">{publishResultModal.message}</p>
              <button
                onClick={() => setPublishResultModal(null)}
                className={`w-full px-5 py-3 rounded-xl font-bold text-base transition-all ${
                  publishResultModal.type === 'success' 
                    ? 'bg-gradient-to-r from-emerald-500 to-green-600 text-white hover:shadow-lg hover:shadow-emerald-500/30' 
                    : 'bg-gradient-to-r from-red-500 to-rose-600 text-white hover:shadow-lg hover:shadow-red-500/30'
                }`}
              >
                {publishResultModal.type === 'success' ? 'Awesome!' : 'Got it'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Result Modal - Mobile Perfect */}
      {deleteResultModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden">
            <div className={`p-5 text-white ${deleteResultModal.type === 'success' ? 'bg-gradient-to-r from-emerald-500 to-teal-600' : 'bg-gradient-to-r from-red-500 to-rose-600'}`}>
              <div className="flex items-center justify-center gap-2">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                  {deleteResultModal.type === 'success' ? (
                    <SparklesIcon className="h-5 w-5" />
                  ) : (
                    <ExclamationTriangleIcon className="h-5 w-5" />
                  )}
                </div>
                <h2 className="text-lg font-black">{deleteResultModal.title}</h2>
              </div>
            </div>

            <div className="p-5">
              <p className="text-gray-700 text-sm mb-2 text-center">{deleteResultModal.message}</p>
              {deleteResultModal.type === 'success' && (
                <p className="text-xs text-gray-400 mb-5 text-center">
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
                className={`w-full px-5 py-3 rounded-xl font-bold text-base transition-all ${
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

      {/* Quick Add Player Modal (Admin Only) */}
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
                  {tournament?.categories?.find(c => c.id === quickAddData.categoryId)?.format === 'doubles' ? 'Player 1 Name' : 'Player Name'} <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={quickAddData.name}
                  onChange={(e) => setQuickAddData({ ...quickAddData, name: e.target.value })}
                  placeholder={tournament?.categories?.find(c => c.id === quickAddData.categoryId)?.format === 'doubles' ? 'Enter player 1 name' : 'Enter player name'}
                  className="w-full px-4 py-3 bg-slate-700/50 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  required
                />
              </div>
              {tournament?.categories?.find(c => c.id === quickAddData.categoryId)?.format === 'doubles' && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Player 2 Name <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={quickAddData.player2Name}
                    onChange={(e) => setQuickAddData({ ...quickAddData, player2Name: e.target.value })}
                    placeholder="Enter player 2 name"
                    className="w-full px-4 py-3 bg-slate-700/50 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                    required
                  />
                </div>
              )}
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
                      {tournament?.categories?.find(c => c.id === quickAddData.categoryId)?.format === 'doubles' ? 'Add Team' : 'Add Player'}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Poster Modal */}
      {showPosterModal && tournament?.posters && tournament.posters.length > 0 && (
        <div 
          className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setShowPosterModal(false)}
        >
          <div className="relative max-w-4xl max-h-[90vh] w-full h-full flex items-center justify-center">
            {/* Close Button */}
            <button
              onClick={() => setShowPosterModal(false)}
              className="absolute top-4 right-4 z-10 w-10 h-10 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center text-white transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Full Size Poster */}
            <img
              src={getImageUrl(tournament.posters?.[selectedPoster]?.imageUrl)}
              alt={tournament.name}
              className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />

            {/* Navigation for Multiple Posters */}
            {tournament.posters?.length > 1 && (
              <>
                {/* Previous Button */}
                {selectedPoster > 0 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedPoster(selectedPoster - 1);
                    }}
                    className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center text-white transition-colors"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                )}

                {/* Next Button */}
                {selectedPoster < (tournament.posters?.length || 0) - 1 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedPoster(selectedPoster + 1);
                    }}
                    className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center text-white transition-colors"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                )}

                {/* Poster Counter */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
                  {selectedPoster + 1} / {tournament.posters?.length || 0}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default TournamentDetailPage;
