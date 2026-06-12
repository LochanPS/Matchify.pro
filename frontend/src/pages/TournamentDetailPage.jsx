import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom';
import { tournamentAPI } from '../api/tournament';
import { useAuth } from '../contexts/AuthContext';
import { formatDateLongIndian, formatDateTimeIndian } from '../utils/dateFormat';
import { getImageUrl } from '../utils/imageUrl';
import { getGenderLabel } from '../utils/genderLabel';
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
  ShareIcon,
} from '@heroicons/react/24/outline';
import { Edit, Users, Eye, Layers, GitBranch, Radio } from 'lucide-react';
import { shareTournament as doShareTournament } from '../utils/tournamentShare';
import LoadingScreen from '../components/LoadingScreen';
import Spinner from '../components/Spinner';

// Delete Tournament Modal Component - Emerald Theme with Fixed Text Visibility
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
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="rounded-2xl shadow-2xl max-w-md w-full overflow-hidden"
        style={{ background: 'linear-gradient(180deg, #0f0f2e 0%, #0d1117 100%)', border: '2px solid rgba(239,68,68,0.4)' }}>
        {/* Header */}
        <div className="p-5 text-white" style={{ background: 'linear-gradient(135deg, rgba(239,68,68,0.3), rgba(220,38,38,0.2))', borderBottom: '1px solid rgba(239,68,68,0.3)' }}>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: 'rgba(239,68,68,0.25)', border: '1px solid rgba(239,68,68,0.4)' }}>
              <ExclamationTriangleIcon className="h-6 w-6 text-red-400" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white">Cancel Tournament</h2>
              <p className="text-sm mt-0.5" style={{ color: 'rgba(252,165,165,0.8)' }}>This action cannot be undone</p>
            </div>
          </div>
        </div>

        <div className="p-5">
          <p className="text-sm mb-2" style={{ color: 'rgba(255,255,255,0.7)' }}>
            You are about to cancel <span className="font-black text-white">"{tournamentName}"</span>.
          </p>
          <p className="text-xs mb-4" style={{ color: 'rgba(255,255,255,0.4)' }}>
            All registered participants will be notified about this cancellation with your reason.
          </p>

          {error && (
            <div className="mb-4 p-3 rounded-xl text-sm font-medium" style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', color: '#fca5a5' }}>
              {error}
            </div>
          )}

          <div className="mb-4">
            <label className="block text-sm font-black text-white mb-2">
              Reason for Cancellation <span className="text-red-400">*</span>
            </label>
            <textarea
              value={reason}
              onChange={(e) => { setReason(e.target.value); setError(''); }}
              placeholder="Please explain why you are cancelling this tournament..."
              rows={4}
              className="w-full px-4 py-3 rounded-xl resize-none transition-all text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-red-500"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(239,68,68,0.3)', color: 'white' }}
            />
            <p className="mt-1.5 text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>
              This message will be sent to all registered participants.
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={isDeleting}
              className="flex-1 px-4 py-3 rounded-xl font-bold text-sm disabled:opacity-50 transition-all"
              style={{ border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.7)' }}
            >
              Keep Tournament
            </button>
            <button
              onClick={handleSubmit}
              disabled={isDeleting || !reason.trim()}
              className="flex-1 px-4 py-3 rounded-xl font-bold text-sm text-white disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all hover:scale-[1.02]"
              style={{ background: 'linear-gradient(135deg, #ef4444, #dc2626)', boxShadow: '0 4px 15px rgba(239,68,68,0.3)' }}
            >
              {isDeleting ? (
                <>
                  <Spinner size="sm" />
                  <span>Cancelling...</span>
                </>
              ) : (
                <>
                  <TrashIcon className="h-4 w-4" />
                  <span>Cancel Tournament</span>
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
  const { state } = useLocation();
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
  const [showPublishPromptModal, setShowPublishPromptModal] = useState(false);
  
  // Umpire management state
  const [showUmpireModal, setShowUmpireModal] = useState(false);
  const [umpireCode, setUmpireCode] = useState('#');
  const [umpires, setUmpires] = useState([]);
  const [loadingUmpires, setLoadingUmpires] = useState(false);
  const [addingUmpire, setAddingUmpire] = useState(false);
  const [umpireError, setUmpireError] = useState('');
  const [umpireSuccess, setUmpireSuccess] = useState('');

  // Admin delete state
  const [showAdminDeleteModal, setShowAdminDeleteModal] = useState(false);
  const [adminDeleting, setAdminDeleting] = useState(false);

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

  const [shareState, setShareState] = useState('idle'); // idle | copied

  const handleShare = async () => {
    if (!tournament) return;
    await doShareTournament(tournament);
  };

  useEffect(() => {
    fetchTournament();
  }, [id]);

  // Show publish prompt if coming from tournament creation
  useEffect(() => {
    if (state?.showPublishPrompt && tournament?.status === 'draft') {
      setShowPublishPromptModal(true);
    }
  }, [state, tournament]);

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
      } else {
        setUmpires([]);
      }
    } catch (err) {
      console.error('Error fetching umpires:', err);
      setUmpires([]); // Don't leave UI stuck — show empty list on error/timeout
    } finally {
      setLoadingUmpires(false);
    }
  };

  const handleAddUmpire = async () => {
    if (!umpireCode.trim() || umpireCode.trim() === '#') {
      setUmpireError('Please enter an umpire code');
      return;
    }

    // Validate Matchify.pro ID format: #1, #2, #100 (new) or #A10000 (legacy)
    const trimmed = umpireCode.trim();
    if (!/^#\d+$/.test(trimmed) && !/^#[A-Z]\d{5}$/i.test(trimmed)) {
      setUmpireError('Invalid Matchify.pro ID. Enter like #1, #12, #100');
      return;
    }

    try {
      setAddingUmpire(true);
      setUmpireError('');
      setUmpireSuccess('');
      
      const response = await tournamentAPI.addUmpireByCode(id, umpireCode.trim());
      
      if (response.success) {
        setUmpireSuccess(`Umpire "${response.umpire.name}" added successfully!`);
        setTimeout(() => setUmpireSuccess(''), 3000);
        setUmpireCode('#');
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
    setUmpireCode('#');
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
      let response;
      let lastError;
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          if (attempt > 0) await new Promise(r => setTimeout(r, 3000));
          response = await api.put(`/tournaments/${id}`, { status: 'published' });
          break;
        } catch (err) {
          lastError = err;
          const status = err?.response?.status;
          if (status && status < 500) break; // 4xx won't change on retry
        }
      }

      if (!response) throw lastError;

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
      const backendMsg = err?.response?.data?.error || err?.response?.data?.errors?.join(', ');
      setPublishResultModal({
        type: 'error',
        title: 'Publication Failed',
        message: backendMsg || (err?.isTimeout ? 'Server took too long. Please try again.' : 'Failed to publish tournament. Please check your connection and try again.')
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

  // Admin-only: delete without requiring a reason
  const handleAdminDelete = async () => {
    try {
      setAdminDeleting(true);
      const response = await api.delete(`/tournaments/${id}`);
      if (response.data.success) {
        setShowAdminDeleteModal(false);
        setDeleteResultModal({
          type: 'success',
          title: 'Tournament Deleted',
          message: 'Tournament has been permanently deleted by admin.',
          redirectTo: '/admin/dashboard'
        });
      } else {
        setDeleteResultModal({
          type: 'error',
          title: 'Deletion Failed',
          message: response.data.error || 'Failed to delete tournament.'
        });
      }
    } catch (err) {
      console.error('Admin delete error:', err);
      setDeleteResultModal({
        type: 'error',
        title: 'Deletion Failed',
        message: err.response?.data?.error || 'Failed to delete tournament.'
      });
    } finally {
      setAdminDeleting(false);
      setShowAdminDeleteModal(false);
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
      published: { bg: 'bg-green-100', text: 'text-green-700', label: 'Open for Registration', inlineBg: 'rgba(245,158,11,0.15)', inlineColor: '#F59E0B', inlineBorder: 'rgba(245,158,11,0.3)' },
      ongoing:   { bg: 'bg-emerald-100', text: 'text-emerald-700', label: 'Ongoing',             inlineBg: 'rgba(16,185,129,0.15)', inlineColor: '#34D399', inlineBorder: 'rgba(16,185,129,0.3)' },
      completed: { bg: 'bg-gray-100',  text: 'text-gray-700',  label: 'Completed',             inlineBg: 'rgba(255,255,255,0.08)', inlineColor: 'rgba(255,255,255,0.6)', inlineBorder: 'rgba(255,255,255,0.15)' },
      draft:     { bg: 'bg-amber-100', text: 'text-amber-700', label: 'Draft',                 inlineBg: 'rgba(251,191,36,0.15)', inlineColor: '#fbbf24', inlineBorder: 'rgba(251,191,36,0.3)' },
      cancelled: { bg: 'bg-red-100',   text: 'text-red-700',   label: 'Cancelled',             inlineBg: 'rgba(239,68,68,0.15)',  inlineColor: '#f87171', inlineBorder: 'rgba(239,68,68,0.3)' },
    };
    return styles[status] || styles.draft;
  };

  if (loading) {
    return <LoadingScreen message="Loading tournament..." />;
  }

  if (error || !tournament) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#050810' }}>
        <div className="text-center rounded-2xl shadow-xl p-10 max-w-md border" style={{ background: '#0d1025', borderColor: 'rgba(255,255,255,0.1)' }}>
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: 'rgba(239,68,68,0.15)' }}>
            <ExclamationTriangleIcon className="w-8 h-8 text-red-400" />
          </div>
          <p className="text-red-400 text-lg font-semibold mb-4">{error || 'Tournament not found'}</p>
          <button
            onClick={() => navigate('/tournaments')}
            className="px-6 py-3 rounded-xl font-bold transition-all text-sm"
            style={{ background: 'linear-gradient(135deg,#F59E0B,#FCD34D)', color: '#050810', boxShadow: '0 4px 15px rgba(245,158,11,0.3)' }}
          >
            Back to Tournaments
          </button>
        </div>
      </div>
    );
  }

  const statusStyle = getStatusStyle(tournament.status);

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ background: '#050810' }}>
      {/* Background orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-80 h-80 rounded-full blur-3xl opacity-[0.06]" style={{ background: '#a855f7' }} />
        <div className="absolute bottom-1/4 right-1/4 w-72 h-72 rounded-full blur-3xl opacity-[0.05]" style={{ background: '#F59E0B' }} />
        <div className="absolute top-3/4 left-3/4 w-64 h-64 rounded-full blur-3xl opacity-[0.04]" style={{ background: '#FCD34D' }} />
      </div>

      {/* ── HERO SECTION ── Cinematic poster + info */}
      <div className="relative">

        {/* === POSTER HERO (full-width cinematic) === */}
        {tournament?.posters && tournament.posters.length > 0 ? (
          <div className="relative w-full" style={{ minHeight: '320px' }}>
            {/* Poster image — full bleed */}
            <div
              className="w-full cursor-pointer relative overflow-hidden"
              style={{ height: '340px' }}
              onClick={() => setShowPosterModal(true)}
            >
              <img
                src={getImageUrl(tournament.posters?.[selectedPoster]?.imageUrl)}
                alt={tournament.name}
                className="w-full h-full object-cover"
                style={{ objectPosition: 'center top' }}
              />
              {/* Dark gradient overlay — bottom-up so text is readable */}
              <div
                className="absolute inset-0"
                style={{
                  background: 'linear-gradient(to bottom, rgba(7,7,26,0.25) 0%, rgba(7,7,26,0.5) 50%, rgba(7,7,26,0.92) 100%)'
                }}
              />
              {/* Tap to enlarge — centered on poster */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <span
                  className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold backdrop-blur-md"
                  style={{
                    background: 'rgba(0,0,0,0.35)',
                    color: 'rgba(255,255,255,0.9)',
                    border: '1px solid rgba(255,255,255,0.25)',
                    letterSpacing: '0.02em',
                  }}
                >
                  🔍 Tap to enlarge
                </span>
              </div>
            </div>

            {/* Back button — top left over poster */}
            <button
              onClick={() => navigate('/dashboard')}
              className="absolute top-4 left-4 flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-semibold text-sm backdrop-blur-md transition-all"
              style={{ background: 'rgba(0,0,0,0.5)', color: 'rgba(255,255,255,0.85)', border: '1px solid rgba(255,255,255,0.15)' }}
            >
              <ArrowLeftIcon className="h-4 w-4" />
              Back
            </button>

            {/* Share button — top right over poster */}
            <button
              onClick={handleShare}
              className="absolute top-4 right-4 flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-semibold text-sm backdrop-blur-md transition-all"
              style={{
                background: 'rgba(0,0,0,0.5)',
                color: 'rgba(255,255,255,0.85)',
                border: '1px solid rgba(255,255,255,0.15)',
              }}
            >
              <ShareIcon className="h-4 w-4" />
              Share
            </button>

            {/* Thumbnail strip if multiple posters */}
            {tournament.posters.length > 1 && (
              <div className="absolute bottom-3 left-4 flex gap-2 overflow-x-auto">
                {tournament.posters.map((poster, index) => (
                  <button
                    key={poster.id}
                    onClick={() => setSelectedPoster(index)}
                    className="flex-shrink-0 rounded-lg overflow-hidden transition-all"
                    style={{
                      width: '40px', height: '40px',
                      border: selectedPoster === index ? '2px solid #F59E0B' : '2px solid rgba(255,255,255,0.2)',
                      opacity: selectedPoster === index ? 1 : 0.6,
                    }}
                  >
                    <img src={getImageUrl(poster.imageUrl)} alt={`P${index + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}

            {/* Info card overlaid at bottom of poster */}
            <div
              className="absolute bottom-0 left-0 right-0 px-4 pb-5"
            >
              {/* Status + format badges */}
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span
                  className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider"
                  style={{
                    background: statusStyle.bg.includes('green') || statusStyle.bg.includes('emerald')
                      ? 'linear-gradient(135deg,#F59E0B,#F59E0B)'
                      : statusStyle.bg.includes('emerald')
                      ? 'linear-gradient(135deg,#059669,#10B981)'
                      : 'linear-gradient(135deg,#b45309,#d97706)',
                    color: '#fff',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.4)'
                  }}
                >
                  {statusStyle.label}
                </span>
                <span
                  className="px-2.5 py-1 rounded-full text-xs font-semibold"
                  style={{ background: 'rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.85)', border: '1px solid rgba(255,255,255,0.2)', backdropFilter: 'blur(8px)' }}
                >
                  {tournament.format === 'both' ? '🏸 Singles & Doubles' :
                   tournament.format === 'singles' ? '🏸 Singles' : '👥 Doubles'}
                </span>
              </div>

              {/* Tournament name */}
              <h1 className="text-2xl font-black text-white leading-tight mb-2" style={{ textShadow: '0 2px 8px rgba(0,0,0,0.6)' }}>
                {tournament.name}
              </h1>

              {/* Quick info row */}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                <span className="flex items-center gap-1.5 text-sm font-medium" style={{ color: 'rgba(255,255,255,0.8)' }}>
                  <MapPinIcon className="h-4 w-4 flex-shrink-0" style={{ color: '#F59E0B' }} />
                  {tournament.city}, {tournament.state}
                </span>
                <span className="flex items-center gap-1.5 text-sm font-medium" style={{ color: 'rgba(255,255,255,0.8)' }}>
                  <CalendarIcon className="h-4 w-4 flex-shrink-0" style={{ color: '#FCD34D' }} />
                  {formatDate(tournament.startDate)}
                </span>
              </div>
            </div>
          </div>

        ) : (
          /* ── No poster: compact header ── */
          <div
            className="relative px-4 pt-5 pb-6"
            style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.02) 100%)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}
          >
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={() => navigate('/dashboard')}
                className="flex items-center gap-1.5 text-sm font-medium transition-colors"
                style={{ color: 'rgba(255,255,255,0.6)' }}
                onMouseEnter={e => e.currentTarget.style.color = '#F59E0B'}
                onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.6)'}
              >
                <ArrowLeftIcon className="h-4 w-4" />
                Back
              </button>
              <button
                onClick={handleShare}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-semibold transition-all"
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  color: 'rgba(255,255,255,0.7)',
                  border: '1px solid rgba(255,255,255,0.15)',
                }}
              >
                <ShareIcon className="h-4 w-4" />
                Share
              </button>
            </div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="px-3 py-1 rounded-full text-xs font-bold border"
                style={{ background: statusStyle.inlineBg, color: statusStyle.inlineColor, borderColor: statusStyle.inlineBorder }}>
                {statusStyle.label}
              </span>
            </div>
            <h1 className="text-2xl font-black text-white leading-tight mb-3">{tournament.name}</h1>
            <div className="flex flex-wrap gap-4">
              <span className="flex items-center gap-1.5 text-sm" style={{ color: 'rgba(255,255,255,0.7)' }}>
                <MapPinIcon className="h-4 w-4" style={{ color: '#F59E0B' }} />
                {tournament.venue}, {tournament.city}
              </span>
              <span className="flex items-center gap-1.5 text-sm" style={{ color: 'rgba(255,255,255,0.7)' }}>
                <CalendarIcon className="h-4 w-4" style={{ color: '#FCD34D' }} />
                {formatDate(tournament.startDate)}
              </span>
            </div>
          </div>
        )}

        {/* ── QUICK-STAT PILLS — prize / entry / reg deadline ── */}
        <div
          className="px-4 py-3 flex items-center gap-2 overflow-x-auto"
          style={{ background: 'rgba(7,7,26,0.95)', borderBottom: '1px solid rgba(245,158,11,0.12)' }}
        >
          {tournament.prizePool && (
            <div
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold flex-shrink-0"
              style={{ background: 'linear-gradient(135deg,rgba(245,158,11,0.2),rgba(251,146,60,0.15))', border: '1px solid rgba(245,158,11,0.4)', color: '#fbbf24' }}
            >
              🏆 ₹{Number(tournament.prizePool).toLocaleString('en-IN')} Prize
            </div>
          )}
          {tournament.categories && tournament.categories.length > 0 && (
            <div
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold flex-shrink-0"
              style={{ background: 'linear-gradient(135deg,rgba(245,158,11,0.12),rgba(245,158,11,0.08))', border: '1px solid rgba(245,158,11,0.3)', color: '#F59E0B' }}
            >
              🏸 {tournament.categories.length} {tournament.categories.length === 1 ? 'Category' : 'Categories'}
            </div>
          )}
          {tournament.registrationCloseDate && (
            <div
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold flex-shrink-0"
              style={{ background: 'linear-gradient(135deg,rgba(245,158,11,0.12),rgba(245,158,11,0.08))', border: '1px solid rgba(245,158,11,0.3)', color: '#FCD34D' }}
            >
              ⏰ Reg ends {formatDate(tournament.registrationCloseDate)}
            </div>
          )}
          {tournament.city && (
            <div
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold flex-shrink-0"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.65)' }}
            >
              📍 {tournament.city}
            </div>
          )}
        </div>
      </div>

        {/* ── PRIZE BREAKDOWN BANNER (if prizes exist) ── */}
        {(tournament.prizeWinner || tournament.prizeRunnerUp || tournament.prizeSemiFinalist) && (
          <div className="px-4 py-4" style={{ background: 'rgba(7,7,26,0.98)', borderBottom: '1px solid rgba(245,158,11,0.2)' }}>
            <div className="rounded-2xl p-4 relative overflow-hidden"
              style={{ background: 'linear-gradient(135deg,rgba(245,158,11,0.15),rgba(251,146,60,0.1))', border: '1px solid rgba(245,158,11,0.3)' }}>
              <div className="absolute top-0 right-0 w-24 h-24 rounded-full blur-2xl opacity-20"
                style={{ background: 'radial-gradient(circle,rgba(251,191,36,0.8),transparent)' }} />
              <p className="text-xs font-black uppercase tracking-widest mb-3" style={{ color: 'rgba(251,191,36,0.7)' }}>🏆 Prize Pool</p>
              <div className="flex items-center gap-3 flex-wrap">
                {tournament.prizeWinner && (
                  <div className="flex-1 min-w-0 text-center px-3 py-2 rounded-xl"
                    style={{ background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.3)' }}>
                    <p className="text-xs font-semibold mb-0.5" style={{ color: 'rgba(255,255,255,0.5)' }}>Winner</p>
                    <p className="text-lg font-black" style={{ color: '#fbbf24' }}>₹{Number(tournament.prizeWinner).toLocaleString('en-IN')}</p>
                  </div>
                )}
                {tournament.prizeRunnerUp && (
                  <div className="flex-1 min-w-0 text-center px-3 py-2 rounded-xl"
                    style={{ background: 'rgba(156,163,175,0.1)', border: '1px solid rgba(156,163,175,0.25)' }}>
                    <p className="text-xs font-semibold mb-0.5" style={{ color: 'rgba(255,255,255,0.5)' }}>Runner-up</p>
                    <p className="text-lg font-black" style={{ color: '#d1d5db' }}>₹{Number(tournament.prizeRunnerUp).toLocaleString('en-IN')}</p>
                  </div>
                )}
                {tournament.prizeSemiFinalist && (
                  <div className="flex-1 min-w-0 text-center px-3 py-2 rounded-xl"
                    style={{ background: 'rgba(180,83,9,0.1)', border: '1px solid rgba(180,83,9,0.25)' }}>
                    <p className="text-xs font-semibold mb-0.5" style={{ color: 'rgba(255,255,255,0.5)' }}>Semi-Final</p>
                    <p className="text-lg font-black" style={{ color: '#fb923c' }}>₹{Number(tournament.prizeSemiFinalist).toLocaleString('en-IN')}</p>
                  </div>
                )}
              </div>
              {tournament.prizeDescription && (
                <p className="text-xs mt-3" style={{ color: 'rgba(255,255,255,0.5)' }}>{tournament.prizeDescription}</p>
              )}
            </div>
          </div>
        )}

      <div className="max-w-7xl mx-auto px-4 py-5 -mt-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-4">
            {/* Description - Compact */}
            <div className="rounded-xl p-4 border" style={{ background: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.08)' }}>
              <h2 className="text-base font-bold text-white mb-3">About Tournament</h2>
              <p className="text-sm whitespace-pre-wrap leading-relaxed break-words max-w-full overflow-hidden" style={{ color: 'rgba(255,255,255,0.55)' }}>
                {tournament.description || 'No description provided.'}
              </p>
            </div>

            {/* Key Details - Compact */}
            <div className="rounded-xl p-4 border" style={{ background: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.08)' }}>
              <h2 className="text-base font-bold text-white mb-3">Tournament Details</h2>
              <div className="grid grid-cols-1 gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.25)' }}>
                    <MapPinIcon className="h-5 w-5" style={{ color: '#F59E0B' }} />
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-white text-sm">Venue</p>
                    <p className="text-sm" style={{ color: 'rgba(255,255,255,0.55)' }}>{tournament.venue}</p>
                    <p className="text-xs truncate" style={{ color: 'rgba(255,255,255,0.4)' }}>
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
                    <p className="text-sm" style={{ color: 'rgba(255,255,255,0.55)' }}>Start: {formatDate(tournament.startDate)}</p>
                    <p className="text-sm" style={{ color: 'rgba(255,255,255,0.55)' }}>End: {formatDate(tournament.endDate)}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.25)' }}>
                    <ClockIcon className="h-5 w-5" style={{ color: '#F59E0B' }} />
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-white text-sm">Registration Period</p>
                    <p className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>Opens: {formatDateTime(tournament.registrationOpenDate)}</p>
                    <p className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>Closes: {formatDateTime(tournament.registrationCloseDate)}</p>
                  </div>
                </div>

                {/* Shuttle Information */}
                {(tournament.shuttleType || tournament.shuttleBrand) && (
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.25)' }}>
                      <span className="text-xl">🏸</span>
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-white text-sm">Shuttle Information</p>
                      {tournament.shuttleType && (
                        <p className="text-sm" style={{ color: 'rgba(255,255,255,0.55)' }}>
                          Type: <span className="text-white font-medium">{tournament.shuttleType}</span>
                        </p>
                      )}
                      {tournament.shuttleBrand && (
                        <p className="text-sm" style={{ color: 'rgba(255,255,255,0.55)' }}>
                          Brand: <span className="text-white font-medium">{tournament.shuttleBrand}</span>
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Categories */}
            <div className="rounded-xl border" style={{ background: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.08)' }}>
              <div className="flex items-center gap-2 px-4 pt-4 pb-3">
                <div className="w-8 h-8 bg-gradient-to-br from-amber-400 to-orange-500 rounded-lg flex items-center justify-center flex-shrink-0">
                  <TrophyIcon className="w-4 h-4 text-white" />
                </div>
                <h2 className="text-base font-bold text-white">Categories</h2>
                <span className="ml-auto text-xs font-medium px-2 py-0.5 rounded-full" style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.5)' }}>
                  {tournament.categories?.length || 0}
                </span>
              </div>

              {tournament.categories && tournament.categories.length > 0 ? (
                <div
                  className="flex gap-3 overflow-x-auto"
                  style={{
                    scrollSnapType: 'x mandatory',
                    WebkitOverflowScrolling: 'touch',
                    paddingLeft: 16,
                    paddingRight: 16,
                    paddingBottom: 16,
                  }}
                >
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
                      className="flex-shrink-0 flex flex-col rounded-2xl overflow-hidden"
                      style={{
                        width: '240px',
                        scrollSnapAlign: 'start',
                        background: 'linear-gradient(145deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.03) 100%)',
                        border: '1px solid rgba(255,255,255,0.1)',
                      }}
                    >
                      {/* Card top — name + fee */}
                      <div className="px-4 pt-4 pb-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                        <h3 className="font-black text-white text-sm leading-snug mb-2">
                          {category.name}
                        </h3>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-0.5">
                            <CurrencyRupeeIcon className="h-4 w-4 text-amber-400" />
                            <span className="text-lg font-black text-amber-400">{category.entryFee}</span>
                          </div>
                          <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.5)' }}>
                            {category.registrationCount || 0} joined
                          </span>
                        </div>
                      </div>

                      {/* Card body — tags + format + scoring */}
                      <div className="px-4 py-3 flex-1 space-y-2">
                        {/* Type + gender badges */}
                        <div className="flex flex-wrap gap-1.5">
                          <span className="px-2 py-0.5 rounded-full text-xs font-semibold" style={{ background: 'rgba(245,158,11,0.15)', color: '#F59E0B' }}>
                            {category.format}
                          </span>
                          <span className="px-2 py-0.5 rounded-full text-xs font-semibold" style={{ background: 'rgba(139,92,246,0.15)', color: '#C4B5FD' }}>
                            {getGenderLabel(category.gender)}
                          </span>
                          {category.ageGroup && (
                            <span className="px-2 py-0.5 rounded-full text-xs font-semibold" style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.6)' }}>
                              {category.ageGroup}
                            </span>
                          )}
                        </div>

                        {/* Tournament format */}
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm">{formatInfo.icon}</span>
                          <span className="text-xs font-bold" style={{
                            color: formatInfo.color === 'amber' ? '#fbbf24' : formatInfo.color === 'purple' ? '#a855f7' : '#10b981'
                          }}>
                            {formatInfo.label}
                          </span>
                        </div>

                        {/* Scoring */}
                        <div className="flex items-center gap-1.5" style={{ color: 'rgba(255,255,255,0.4)' }}>
                          <span className="text-xs">🎯</span>
                          <span className="text-xs">{scoring.points} pts × {scoring.sets} {parseInt(scoring.sets) === 1 ? 'set' : 'sets'}</span>
                        </div>

                        {/* Prize */}
                        {(category.prizeWinner || category.prizeRunnerUp) && (
                          <div className="flex items-center gap-2 text-xs">
                            {category.prizeWinner && <span style={{ color: '#F59E0B' }}>🥇 ₹{category.prizeWinner}</span>}
                            {category.prizeRunnerUp && <span style={{ color: 'rgba(255,255,255,0.55)' }}>🥈 ₹{category.prizeRunnerUp}</span>}
                          </div>
                        )}

                        {/* Progress bar */}
                        {category.maxParticipants && (
                          <div>
                            <div className="flex justify-between text-xs mb-1" style={{ color: 'rgba(255,255,255,0.4)' }}>
                              <span>{category.registrationCount || 0}/{category.maxParticipants}</span>
                              <span style={{ color: (category.maxParticipants - (category.registrationCount || 0)) <= 5 ? '#ef4444' : 'rgba(255,255,255,0.4)' }}>
                                {Math.max(0, category.maxParticipants - (category.registrationCount || 0))} left
                              </span>
                            </div>
                            <div className="h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
                              <div className="h-full rounded-full"
                                style={{
                                  width: `${Math.min(100, ((category.registrationCount || 0) / category.maxParticipants) * 100)}%`,
                                  background: ((category.registrationCount || 0) / category.maxParticipants) > 0.8 ? '#ef4444' : '#F59E0B'
                                }} />
                            </div>
                          </div>
                        )}
                      </div>

                      {/* View Draw + Live Matches buttons — pinned to bottom */}
                      <div className="px-4 pb-4" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        <button
                          onClick={() => navigate(`/tournaments/${id}/draws/${category.id}`)}
                          className="w-full py-2.5 rounded-xl text-xs font-black transition-all active:scale-95 flex items-center justify-center gap-2"
                          style={{
                            background: 'linear-gradient(135deg, rgba(245,158,11,0.2), rgba(245,158,11,0.1))',
                            border: '1px solid rgba(245,158,11,0.4)',
                            color: '#F59E0B',
                          }}
                        >
                          <TrophyIcon className="w-3.5 h-3.5" />
                          View Draw
                        </button>
                        <button
                          onClick={() => navigate(`/tournaments/${id}/live?categoryId=${category.id}&categoryName=${encodeURIComponent(category.name)}`)}
                          className="w-full py-2.5 rounded-xl text-xs font-black transition-all active:scale-95 flex items-center justify-center gap-2"
                          style={{
                            background: 'linear-gradient(135deg, rgba(255,68,102,0.18), rgba(255,68,102,0.08))',
                            border: '1px solid rgba(255,68,102,0.35)',
                            color: '#ff4466',
                          }}
                        >
                          <Radio className="w-3.5 h-3.5" />
                          Live Matches
                        </button>
                      </div>
                    </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-10">
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: 'rgba(255,255,255,0.06)' }}>
                    <Layers className="w-8 h-8" style={{ color: 'rgba(255,255,255,0.3)' }} />
                  </div>
                  <p style={{ color: 'rgba(255,255,255,0.5)' }}>No categories available yet</p>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar - Compact */}
          <div className="space-y-4">
            {/* Register Button - Show for published tournaments */}
            {tournament.status === 'published' && (
              <div className="rounded-xl p-4 text-white border" style={{ background: 'linear-gradient(135deg,rgba(245,158,11,0.15),rgba(245,158,11,0.1))', borderColor: 'rgba(245,158,11,0.3)', boxShadow: '0 4px 20px rgba(245,158,11,0.1)' }}>
                <h3 className="font-bold text-base mb-1">Ready to Compete?</h3>
                <p className="text-xs mb-3" style={{ color: 'rgba(255,255,255,0.65)' }}>
                  Registration closes on {formatDate(tournament.registrationCloseDate)}
                </p>
                {user && canRegister() ? (
                  <button
                    onClick={() => navigate(`/tournaments/${id}/register`)}
                    className="w-full px-5 py-3 rounded-xl font-bold text-base transition-all hover:scale-105"
                    style={{ background: 'linear-gradient(135deg,#F59E0B,#F59E0B)', color: '#050810' }}
                  >
                    Register Now
                  </button>
                ) : (
                  <button
                    onClick={() => setShowLoginModal(true)}
                    className="w-full px-5 py-3 rounded-xl font-bold text-base transition-all hover:scale-105"
                    style={{ background: 'linear-gradient(135deg,#F59E0B,#F59E0B)', color: '#050810' }}
                  >
                    Register Now
                  </button>
                )}
              </div>
            )}

            {/* Organizer Info */}
            <div className="rounded-2xl p-4 border" style={{ background: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.08)' }}>
              <h3 className="font-bold text-white text-sm mb-3">Organized By</h3>

              {/* Avatar + name row */}
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg flex-shrink-0" style={{ background: 'linear-gradient(135deg,#a855f7,#7c3aed)' }}>
                  {tournament.organizer.name?.charAt(0)?.toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="font-black text-white text-sm leading-tight">{tournament.organizer.name}</p>
                  <p className="text-xs mt-0.5 truncate" style={{ color: 'rgba(255,255,255,0.45)' }}>{tournament.organizer.email}</p>
                </div>
              </div>

              {/* Contact buttons */}
              {(() => {
                const phone = tournament.contactPhone || tournament.organizer?.phone;
                const wa = tournament.whatsappNumber || tournament.contactPhone;
                if (!phone && !tournament.whatsappNumber) return null;
                return (
                  <div className="flex gap-2 mt-1">
                    {phone && (
                      <a
                        href={`tel:${phone}`}
                        onClick={e => e.stopPropagation()}
                        className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-black transition-all active:scale-95"
                        style={{ background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.3)', color: '#F59E0B' }}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13.5 19.79 19.79 0 0 1 1.61 4.9 2 2 0 0 1 3.6 2.69h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 10.31a16 16 0 0 0 6 6l.91-.91a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21.73 17.92z"/></svg>
                        Call
                      </a>
                    )}
                    {(tournament.whatsappNumber || tournament.contactPhone) && (
                      <a
                        href={`https://wa.me/${(tournament.whatsappNumber || tournament.contactPhone).replace(/[^0-9]/g, '')}`}
                        target="_blank"
                        rel="noreferrer"
                        onClick={e => e.stopPropagation()}
                        className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-black transition-all active:scale-95"
                        style={{ background: 'rgba(37,211,102,0.12)', border: '1px solid rgba(37,211,102,0.3)', color: '#25d366' }}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/></svg>
                        WhatsApp
                      </a>
                    )}
                  </div>
                );
              })()}
            </div>

            {/* Quick Stats */}
            <div
              className="rounded-2xl p-5 relative overflow-hidden"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
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
                    background: 'linear-gradient(135deg, rgba(139,92,246,0.25) 0%, rgba(124,58,237,0.15) 100%)',
                    border: '2px solid rgba(139,92,246,0.4)',
                    boxShadow: '0 4px 15px rgba(139,92,246,0.2)'
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

                {/* Zone - Brand Green */}
                <div
                  className="flex items-center justify-between p-4 rounded-xl transition-all hover:scale-[1.02]"
                  style={{
                    background: 'linear-gradient(135deg, rgba(245,158,11,0.2) 0%, rgba(245,158,11,0.12) 100%)',
                    border: '2px solid rgba(245,158,11,0.3)',
                    boxShadow: '0 4px 15px rgba(245,158,11,0.15)'
                  }}
                >
                  <span className="text-white/90 font-bold text-base">Zone</span>
                  <span className="font-black text-xl" style={{ color: '#F59E0B' }}>
                    {tournament.zone}
                  </span>
                </div>
              </div>
              
              {/* View Draws Button - Emerald */}
              {['published', 'completed'].includes(tournament.status) && (
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
                    background: 'linear-gradient(135deg, rgba(245,158,11,0.2) 0%, rgba(245,158,11,0.15) 100%)',
                    border: '2px solid rgba(245,158,11,0.5)',
                    color: '#F59E0B',
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

              {/* Live Matches Button */}
              {['published', 'completed'].includes(tournament.status) && (
                <button
                  onClick={() => navigate(`/tournaments/${id}/live`)}
                  className="w-full mt-3 flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl font-black text-base transition-all hover:scale-[1.02] relative overflow-hidden group"
                  style={{
                    background: 'linear-gradient(135deg, rgba(255,68,102,0.18) 0%, rgba(255,100,120,0.12) 100%)',
                    border: '2px solid rgba(255,68,102,0.45)',
                    color: '#ff4466',
                    boxShadow: '0 4px 15px rgba(255,68,102,0.25)'
                  }}
                >
                  <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#ff4466', boxShadow: '0 0 6px #ff4466', display: 'inline-block', animation: 'liveDot 1.4s ease-in-out infinite' }} />
                  <span>Live Matches</span>
                  <style>{`@keyframes liveDot{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.4;transform:scale(1.4)}}`}</style>
                  <div
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{ background: 'radial-gradient(circle at center, rgba(255,68,102,0.15), transparent)' }}
                  />
                </button>
              )}
            </div>
            
            {/* Organizer Management - Colorful Mobile Design */}
            {user && user.id === tournament.organizerId && (
              <div
                className="rounded-2xl p-5 relative overflow-hidden"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
              >
                <h3 className="font-black text-white text-lg mb-4">Manage Tournament</h3>
                <div className="space-y-3">
                  {tournament.status === 'draft' && (
                    <>
                      <button
                        onClick={() => setShowPublishConfirmModal(true)}
                        disabled={publishing || tournament.categories?.length === 0}
                        className="w-full px-5 py-3.5 rounded-xl font-black text-base transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        style={{ background: 'linear-gradient(135deg,#F59E0B,#F59E0B)', color: '#050810' }}
                      >
                        {publishing ? 'Publishing...' : '🚀 Publish Tournament'}
                      </button>
                      {tournament.categories?.length === 0 && (
                        <p className="text-xs text-red-500 text-center">Add at least one category to publish</p>
                      )}
                    </>
                  )}
                  
                  {/* Edit Tournament - Emerald */}
                  <button
                    onClick={() => navigate(`/tournaments/${id}/edit`)}
                    className="w-full flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl font-black text-base transition-all hover:scale-[1.02] relative overflow-hidden group"
                    style={{
                      background: 'linear-gradient(135deg, rgba(245,158,11,0.2) 0%, rgba(245,158,11,0.15) 100%)',
                      border: '2px solid rgba(245,158,11,0.5)',
                      color: '#F59E0B',
                      boxShadow: '0 4px 15px rgba(245,158,11,0.3)'
                    }}
                  >
                    <Edit className="w-5 h-5" />
                    <span>Edit Tournament</span>
                    <div 
                      className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      style={{ background: 'radial-gradient(circle at center, rgba(245,158,11,0.2), transparent)' }}
                    />
                  </button>

                  {/* View Draws - Emerald */}
                  <button
                    onClick={() => navigate(`/tournaments/${id}/draws`)}
                    className="w-full flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl font-black text-base transition-all hover:scale-[1.02] relative overflow-hidden group"
                    style={{
                      background: 'linear-gradient(135deg, rgba(245,158,11,0.2) 0%, rgba(245,158,11,0.15) 100%)',
                      border: '2px solid rgba(245,158,11,0.5)',
                      color: '#F59E0B',
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

                  {/* Live Matches - Red */}
                  <button
                    onClick={() => navigate(`/tournaments/${id}/live`)}
                    className="w-full flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl font-black text-base transition-all hover:scale-[1.02] relative overflow-hidden group"
                    style={{
                      background: 'linear-gradient(135deg, rgba(255,68,102,0.18) 0%, rgba(255,100,120,0.12) 100%)',
                      border: '2px solid rgba(255,68,102,0.45)',
                      color: '#ff4466',
                      boxShadow: '0 4px 15px rgba(255,68,102,0.25)'
                    }}
                  >
                    <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#ff4466', boxShadow: '0 0 6px #ff4466', display: 'inline-block', animation: 'liveDot 1.4s ease-in-out infinite' }} />
                    <span>Live Matches</span>
                    <div
                      className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      style={{ background: 'radial-gradient(circle at center, rgba(255,68,102,0.15), transparent)' }}
                    />
                  </button>

                  {/* View Registrations - Emerald */}
                  <button
                    onClick={() => navigate(`/organizer/tournaments/${id}`)}
                    className="w-full flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl font-black text-base transition-all hover:scale-[1.02] relative overflow-hidden group"
                    style={{
                      background: 'linear-gradient(135deg, rgba(245,158,11,0.2) 0%, rgba(245,158,11,0.15) 100%)',
                      border: '2px solid rgba(245,158,11,0.5)',
                      color: '#F59E0B',
                      boxShadow: '0 4px 15px rgba(245,158,11,0.3)'
                    }}
                  >
                    <Eye className="w-5 h-5" />
                    <span>View Registrations</span>
                    <div 
                      className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      style={{ background: 'radial-gradient(circle at center, rgba(245,158,11,0.2), transparent)' }}
                    />
                  </button>

                  {/* Add Umpire - Emerald */}
                  <button
                    onClick={openUmpireModal}
                    className="w-full flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl font-black text-base transition-all hover:scale-[1.02] relative overflow-hidden group"
                    style={{
                      background: 'linear-gradient(135deg, rgba(245,158,11,0.2) 0%, rgba(245,158,11,0.15) 100%)',
                      border: '2px solid rgba(245,158,11,0.5)',
                      color: '#F59E0B',
                      boxShadow: '0 4px 15px rgba(245,158,11,0.3)'
                    }}
                  >
                    <Users className="w-5 h-5" />
                    <span>Add Umpire</span>
                    <div 
                      className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      style={{ background: 'radial-gradient(circle at center, rgba(245,158,11,0.2), transparent)' }}
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
              <div className="rounded-xl p-4 border" style={{ background: 'rgba(245,158,11,0.06)', borderColor: 'rgba(245,158,11,0.2)' }}>
                <div className="flex items-center gap-2 mb-3">
                  <SparklesIcon className="h-4 w-4" style={{ color: '#F59E0B' }} />
                  <h3 className="font-bold text-white text-sm">Admin Actions</h3>
                </div>
                <div className="space-y-2">
                  <button
                    onClick={() => setShowQuickAddModal(true)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-bold text-sm transition-all"
                    style={{ background: 'linear-gradient(135deg,#F59E0B,#F59E0B)', color: '#050810' }}
                  >
                    <UserPlusIcon className="h-4 w-4" />
                    Quick Add Player
                  </button>
                  <button
                    onClick={() => setShowAdminDeleteModal(true)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-bold text-sm transition-all hover:scale-[1.02]"
                    style={{ background: 'linear-gradient(135deg,#ef4444,#dc2626)', color: 'white', boxShadow: '0 4px 12px rgba(239,68,68,0.25)' }}
                  >
                    <TrashIcon className="h-4 w-4" />
                    Delete Tournament
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

      {/* Admin Delete Tournament Modal — no reason required */}
      {showAdminDeleteModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden"
            style={{ background: 'linear-gradient(180deg,#0f0f2e 0%,#0d1117 100%)', border: '2px solid rgba(239,68,68,0.5)' }}>
            {/* Header */}
            <div className="p-5" style={{ background: 'linear-gradient(135deg,rgba(239,68,68,0.25),rgba(220,38,38,0.15))', borderBottom: '1px solid rgba(239,68,68,0.3)' }}>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: 'rgba(239,68,68,0.2)', border: '1px solid rgba(239,68,68,0.4)' }}>
                  <TrashIcon className="h-6 w-6 text-red-400" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-white">Delete Tournament</h2>
                  <p className="text-xs mt-0.5" style={{ color: 'rgba(252,165,165,0.8)' }}>Admin action · Cannot be undone</p>
                </div>
              </div>
            </div>
            {/* Body */}
            <div className="p-5">
              <p className="text-sm mb-1" style={{ color: 'rgba(255,255,255,0.7)' }}>
                Permanently delete <span className="font-black text-white">"{tournament?.name}"</span>?
              </p>
              <p className="text-xs mb-5" style={{ color: 'rgba(255,255,255,0.35)' }}>
                All draws, matches, registrations and data will be erased. Registered players will not be notified.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowAdminDeleteModal(false)}
                  disabled={adminDeleting}
                  className="flex-1 px-4 py-2.5 rounded-xl font-bold text-sm disabled:opacity-50 transition-all"
                  style={{ border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.7)' }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleAdminDelete}
                  disabled={adminDeleting}
                  className="flex-1 px-4 py-2.5 rounded-xl font-bold text-sm text-white disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all hover:scale-[1.02]"
                  style={{ background: 'linear-gradient(135deg,#ef4444,#dc2626)', boxShadow: '0 4px 15px rgba(239,68,68,0.3)' }}
                >
                  {adminDeleting ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                      </svg>
                      Deleting...
                    </span>
                  ) : (
                    <>
                      <TrashIcon className="h-4 w-4" />
                      Delete Forever
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Umpire Modal */}
      {showUmpireModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4"
          style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }}>
          <div className="w-full max-w-sm rounded-2xl overflow-hidden"
            style={{ background: '#0d0d2b', border: '1px solid rgba(255,255,255,0.1)' }}>

            {/* Header */}
            <div className="px-5 py-4 flex items-center gap-3"
              style={{ background: 'linear-gradient(135deg,rgba(245,158,11,0.12),rgba(245,158,11,0.06))', borderBottom: '1px solid rgba(245,158,11,0.15)' }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: 'rgba(245,158,11,0.2)', border: '1px solid rgba(245,158,11,0.35)' }}>
                <Users className="h-5 w-5" style={{ color: '#F59E0B' }} />
              </div>
              <div>
                <h2 className="text-base font-black text-white">Add Umpire</h2>
                <p className="text-xs" style={{ color: 'rgba(245,158,11,0.7)' }}>Enter umpire's Matchify.pro ID</p>
              </div>
            </div>

            <div className="p-5 space-y-3">
              {/* Info */}
              <div className="px-3 py-2.5 rounded-xl text-xs"
                style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.15)', color: 'rgba(245,158,11,0.8)' }}>
                Enter Matchify.pro ID: <span className="font-mono font-bold" style={{ color: '#FCD34D' }}>#1</span> or <span className="font-mono font-bold" style={{ color: '#FCD34D' }}>#100</span>
              </div>

              {/* Error */}
              {umpireError && (
                <div className="px-3 py-2.5 rounded-xl text-xs font-semibold"
                  style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', color: '#f87171' }}>
                  {umpireError}
                </div>
              )}

              {/* Success */}
              {umpireSuccess && (
                <div className="px-3 py-2.5 rounded-xl text-xs font-semibold"
                  style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)', color: '#F59E0B' }}>
                  {umpireSuccess}
                </div>
              )}

              {/* Input */}
              <div>
                <label className="block text-xs font-black mb-1.5" style={{ color: 'rgba(255,255,255,0.6)' }}>
                  Umpire Matchify.pro ID
                </label>
                <input
                  type="text"
                  value={umpireCode}
                  onChange={(e) => {
                    let val = e.target.value;
                    // Strip everything except digits and leading #
                    val = val.replace(/[^#\d]/g, '');
                    if (!val.startsWith('#')) val = '#' + val.replace(/#/g, '');
                    setUmpireCode(val);
                    setUmpireError('');
                  }}
                  placeholder="#1"
                  className="w-full px-4 py-3 rounded-xl text-white font-mono text-base tracking-widest"
                  style={{
                    background: 'rgba(0,0,0,0.3)',
                    border: '1.5px solid rgba(245,158,11,0.25)',
                    outline: 'none',
                  }}
                />
              </div>

              {/* Add button */}
              <button
                onClick={handleAddUmpire}
                disabled={addingUmpire || !umpireCode.trim() || umpireCode.trim() === '#'}
                className="w-full py-3 rounded-xl font-black text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                style={{
                  background: (!addingUmpire && umpireCode.trim() && umpireCode.trim() !== '#')
                    ? 'linear-gradient(135deg,#F59E0B,#F59E0B)'
                    : 'rgba(255,255,255,0.08)',
                  color: (!addingUmpire && umpireCode.trim() && umpireCode.trim() !== '#') ? '#050810' : 'rgba(255,255,255,0.4)',
                }}
              >
                {addingUmpire ? (
                  <>
                    <Spinner size="sm" />
                    Adding…
                  </>
                ) : (
                  <>
                    <UserGroupIcon className="h-4 w-4" />
                    Add Umpire
                  </>
                )}
              </button>

              {/* Umpires list */}
              <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', paddingTop: '12px' }}>
                <h3 className="text-xs font-black mb-3 flex items-center gap-2" style={{ color: 'rgba(255,255,255,0.6)' }}>
                  <Users className="w-3.5 h-3.5" style={{ color: '#F59E0B' }} />
                  Tournament Umpires ({umpires.length})
                </h3>

                {loadingUmpires ? (
                  <div className="flex items-center justify-center py-4">
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-t-transparent" style={{ borderColor: '#F59E0B transparent transparent transparent' }} />
                  </div>
                ) : umpires.length === 0 ? (
                  <div className="text-center py-4">
                    <p className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>No umpires added yet</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-44 overflow-y-auto">
                    {umpires.map((umpire) => (
                      <div key={umpire.id} className="flex items-center justify-between p-3 rounded-xl"
                        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm flex-shrink-0"
                            style={{ background: 'linear-gradient(135deg,#F59E0B,#F59E0B)', color: '#050810' }}>
                            {umpire.name?.charAt(0)?.toUpperCase()}
                          </div>
                          <div>
                            <p className="text-white font-bold text-sm">{umpire.name}</p>
                            <p className="text-xs font-mono" style={{ color: 'rgba(245,158,11,0.7)' }}>{umpire.umpireCode}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleRemoveUmpire(umpire.id)}
                          className="p-1.5 rounded-lg transition-colors"
                          style={{ color: '#f87171' }}
                          title="Remove umpire"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Close */}
              <button
                onClick={() => setShowUmpireModal(false)}
                className="w-full py-3 rounded-xl font-bold text-sm transition-all"
                style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.6)', border: '1px solid rgba(255,255,255,0.1)' }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Login Required Modal */}
      {showLoginModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden"
            style={{ background: 'linear-gradient(180deg, #0f0f2e 0%, #0d1117 100%)', border: '1px solid rgba(245,158,11,0.3)' }}>
            <div className="p-5 text-white" style={{ background: 'linear-gradient(135deg, rgba(245,158,11,0.2), rgba(245,158,11,0.12))', borderBottom: '1px solid rgba(245,158,11,0.15)' }}>
              <div className="flex items-center justify-center gap-2">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(245,158,11,0.2)' }}>
                  <UserIcon className="h-5 w-5" style={{ color: '#F59E0B' }} />
                </div>
                <h2 className="text-lg font-black text-white">Sign In Required</h2>
              </div>
            </div>
            <div className="p-5">
              <p className="text-sm mb-5 text-center" style={{ color: 'rgba(255,255,255,0.65)' }}>
                To register for <span className="font-bold text-white">"{tournament?.name}"</span>, sign in or create an account.
              </p>
              <div className="space-y-2.5">
                <Link
                  to={`/register?redirect=/tournaments/${id}/register`}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold text-sm transition-all hover:scale-[1.02]"
                  style={{ background: 'linear-gradient(135deg, #F59E0B, #F59E0B)', color: '#050810' }}
                >
                  Create Account
                </Link>
                <Link
                  to={`/login?redirect=/tournaments/${id}/register`}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold text-sm transition-all"
                  style={{ border: '1px solid rgba(245,158,11,0.4)', color: '#F59E0B', background: 'rgba(245,158,11,0.08)' }}
                >
                  Sign In
                </Link>
                <button
                  onClick={() => setShowLoginModal(false)}
                  className="w-full px-4 py-2.5 font-medium text-sm transition-colors"
                  style={{ color: 'rgba(255,255,255,0.4)' }}
                >
                  Cancel
                </button>
              </div>
              <p className="text-center text-xs mt-3" style={{ color: 'rgba(255,255,255,0.3)' }}>
                Registration is free and takes less than a minute!
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Publish Confirmation Modal */}
      {showPublishConfirmModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden"
            style={{ background: 'linear-gradient(180deg, #0f0f2e 0%, #0d1117 100%)', border: '1px solid rgba(245,158,11,0.3)' }}>
            <div className="p-5" style={{ background: 'linear-gradient(135deg, #F59E0B, #F59E0B)' }}>
              <div className="flex items-center justify-center gap-2">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                  <SparklesIcon className="h-5 w-5 text-white" />
                </div>
                <h2 className="text-lg font-black text-white">Publish Tournament</h2>
              </div>
            </div>
            <div className="p-5">
              <p className="text-sm mb-3 text-center" style={{ color: 'rgba(255,255,255,0.7)' }}>
                You are about to publish <span className="font-black text-white">"{tournament?.name}"</span>.
              </p>
              <div className="rounded-xl p-3 mb-5" style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)' }}>
                <p className="text-xs text-center" style={{ color: '#F59E0B' }}>
                  Once published, your tournament will be visible to all players and they can start registering.
                </p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setShowPublishConfirmModal(false)}
                  className="flex-1 px-4 py-2.5 rounded-xl font-bold text-sm transition-all"
                  style={{ border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.7)' }}>
                  Cancel
                </button>
                <button onClick={handlePublish} disabled={publishing}
                  className="flex-1 px-4 py-2.5 text-white rounded-xl font-bold text-sm disabled:opacity-50 flex items-center justify-center gap-1.5 transition-all hover:scale-[1.02]"
                  style={{ background: 'linear-gradient(135deg, #F59E0B, #F59E0B)', color: '#050810' }}>
                  {publishing ? (
                    <><Spinner size="xs" /><span style={{ color: '#050810' }}>Publishing...</span></>
                  ) : <span style={{ color: '#050810' }}>🚀 Publish Now</span>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Publish Result Modal */}
      {publishResultModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden"
            style={{ background: 'linear-gradient(180deg, #0f0f2e 0%, #0d1117 100%)', border: `1px solid ${publishResultModal.type === 'success' ? 'rgba(245,158,11,0.3)' : 'rgba(239,68,68,0.3)'}` }}>
            <div className="p-5" style={{ background: publishResultModal.type === 'success' ? 'linear-gradient(135deg, #F59E0B, #F59E0B)' : 'linear-gradient(135deg, #ef4444, #dc2626)' }}>
              <div className="flex items-center justify-center gap-2">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                  {publishResultModal.type === 'success' ? <TrophyIcon className="h-5 w-5 text-white" /> : <ExclamationTriangleIcon className="h-5 w-5 text-white" />}
                </div>
                <h2 className="text-lg font-black text-white">{publishResultModal.title}</h2>
              </div>
            </div>
            <div className="p-5">
              <p className="text-sm mb-5 text-center leading-relaxed" style={{ color: 'rgba(255,255,255,0.7)' }}>{publishResultModal.message}</p>
              <button onClick={() => setPublishResultModal(null)}
                className="w-full px-5 py-3 rounded-xl font-black text-base transition-all hover:scale-[1.02]"
                style={{
                  background: publishResultModal.type === 'success' ? 'linear-gradient(135deg, #F59E0B, #F59E0B)' : 'linear-gradient(135deg, #ef4444, #dc2626)',
                  color: publishResultModal.type === 'success' ? '#050810' : 'white',
                  boxShadow: publishResultModal.type === 'success' ? '0 4px 15px rgba(245,158,11,0.3)' : '0 4px 15px rgba(239,68,68,0.3)'
                }}>
                {publishResultModal.type === 'success' ? 'Awesome!' : 'Got it'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Result Modal */}
      {deleteResultModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden"
            style={{ background: 'linear-gradient(180deg, #0f0f2e 0%, #0d1117 100%)', border: `1px solid ${deleteResultModal.type === 'success' ? 'rgba(245,158,11,0.3)' : 'rgba(239,68,68,0.3)'}` }}>
            <div className="p-5" style={{ background: deleteResultModal.type === 'success' ? 'linear-gradient(135deg, #F59E0B, #F59E0B)' : 'linear-gradient(135deg, #ef4444, #dc2626)' }}>
              <div className="flex items-center justify-center gap-2">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                  {deleteResultModal.type === 'success' ? <SparklesIcon className="h-5 w-5 text-white" /> : <ExclamationTriangleIcon className="h-5 w-5 text-white" />}
                </div>
                <h2 className="text-lg font-black text-white">{deleteResultModal.title}</h2>
              </div>
            </div>
            <div className="p-5">
              <p className="text-sm mb-2 text-center" style={{ color: 'rgba(255,255,255,0.7)' }}>{deleteResultModal.message}</p>
              {deleteResultModal.type === 'success' && (
                <p className="text-xs mb-5 text-center" style={{ color: 'rgba(255,255,255,0.4)' }}>
                  All participants have received a notification from Matchify.pro about this cancellation.
                </p>
              )}
              <button
                onClick={() => { if (deleteResultModal.redirectTo) navigate(deleteResultModal.redirectTo); setDeleteResultModal(null); }}
                className="w-full px-5 py-3 rounded-xl font-black text-base transition-all hover:scale-[1.02]"
                style={{
                  background: deleteResultModal.type === 'success' ? 'linear-gradient(135deg, #F59E0B, #F59E0B)' : 'linear-gradient(135deg, #ef4444, #dc2626)',
                  color: deleteResultModal.type === 'success' ? '#050810' : 'white',
                  boxShadow: deleteResultModal.type === 'success' ? '0 4px 15px rgba(245,158,11,0.3)' : '0 4px 15px rgba(239,68,68,0.3)'
                }}>
                {deleteResultModal.type === 'success' ? 'Continue' : 'Got it'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Publish Prompt Modal - After Tournament Creation */}
      {showPublishPromptModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="rounded-2xl shadow-2xl max-w-md w-full overflow-hidden"
            style={{ background: 'linear-gradient(180deg, #0f0f2e 0%, #0d1117 100%)', border: '1px solid rgba(245,158,11,0.3)' }}>
            <div className="p-6" style={{ background: 'linear-gradient(135deg, #F59E0B, #F59E0B)' }}>
              <div className="flex items-center justify-center gap-3 mb-2">
                <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center">
                  <TrophyIcon className="h-7 w-7 text-white" />
                </div>
                <h2 className="text-2xl font-black text-white">Tournament Created!</h2>
              </div>
              <p className="text-sm text-center" style={{ color: 'rgba(255,255,255,0.9)' }}>
                Your tournament has been saved successfully
              </p>
            </div>
            <div className="p-6">
              <p className="text-base mb-4 text-center font-bold text-white">
                Would you like to publish your tournament now?
              </p>
              <div className="rounded-xl p-4 mb-5" style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)' }}>
                <p className="text-sm mb-2" style={{ color: '#F59E0B' }}>
                  <span className="font-bold">✓ Publish Now:</span> Make it visible to all players immediately
                </p>
                <p className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>
                  <span className="font-bold">○ Save as Draft:</span> Keep it private, publish later from dashboard
                </p>
              </div>
              <div className="space-y-3">
                <button
                  onClick={() => { setShowPublishPromptModal(false); setShowPublishConfirmModal(true); }}
                  className="w-full px-5 py-3.5 rounded-xl font-black text-base flex items-center justify-center gap-2 transition-all hover:scale-[1.02]"
                  style={{ background: 'linear-gradient(135deg, #F59E0B, #F59E0B)', color: '#050810', boxShadow: '0 4px 15px rgba(245,158,11,0.3)' }}>
                  <SparklesIcon className="h-5 w-5" />
                  Publish Now
                </button>
                <button
                  onClick={() => { setShowPublishPromptModal(false); navigate('/dashboard?role=ORGANIZER'); }}
                  className="w-full px-5 py-3.5 rounded-xl font-bold text-base transition-all"
                  style={{ border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.7)' }}>
                  Save as Draft
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quick Add Player Modal (Admin Only) */}
      {showQuickAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border" style={{ background: '#0d1025', borderColor: 'rgba(255,255,255,0.1)' }}>
            <div className="relative p-6 text-white overflow-hidden border-b" style={{ background: 'linear-gradient(135deg,rgba(245,158,11,0.12),rgba(245,158,11,0.06))', borderColor: 'rgba(245,158,11,0.15)' }}>
              <div className="relative flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                    <UserPlusIcon className="h-6 w-6" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">Quick Add Player</h2>
                    <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.65)' }}>Add player without payment</p>
                  </div>
                </div>
                <button
                  onClick={() => { setShowQuickAddModal(false); setQuickAddError(''); setQuickAddSuccess(''); }}
                  className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-xl flex items-center justify-center transition-colors"
                >
                  <span className="text-2xl">×</span>
                </button>
              </div>
            </div>
            <form onSubmit={handleQuickAddPlayer} className="p-6 space-y-4">
              {quickAddSuccess && (
                <div className="rounded-xl p-4 text-sm border" style={{ background: 'rgba(245,158,11,0.08)', borderColor: 'rgba(245,158,11,0.25)', color: '#F59E0B' }}>
                  {quickAddSuccess}
                </div>
              )}
              {quickAddError && (
                <div className="rounded-xl p-4 text-sm border" style={{ background: 'rgba(239,68,68,0.08)', borderColor: 'rgba(239,68,68,0.25)', color: '#f87171' }}>
                  {quickAddError}
                </div>
              )}
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'rgba(255,255,255,0.7)' }}>
                  {tournament?.categories?.find(c => c.id === quickAddData.categoryId)?.format === 'doubles' ? 'Player 1 Name' : 'Player Name'} <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={quickAddData.name}
                  onChange={(e) => setQuickAddData({ ...quickAddData, name: e.target.value })}
                  placeholder={tournament?.categories?.find(c => c.id === quickAddData.categoryId)?.format === 'doubles' ? 'Enter player 1 name' : 'Enter player name'}
                  className="w-full px-4 py-3 rounded-xl text-white transition-all"
                  style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)' }}
                  required
                />
              </div>
              {tournament?.categories?.find(c => c.id === quickAddData.categoryId)?.format === 'doubles' && (
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'rgba(255,255,255,0.7)' }}>
                    Player 2 Name <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={quickAddData.player2Name}
                    onChange={(e) => setQuickAddData({ ...quickAddData, player2Name: e.target.value })}
                    placeholder="Enter player 2 name"
                    className="w-full px-4 py-3 rounded-xl text-white transition-all"
                    style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)' }}
                    required
                  />
                </div>
              )}
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'rgba(255,255,255,0.7)' }}>
                  Category <span className="text-red-400">*</span>
                </label>
                <select
                  value={quickAddData.categoryId}
                  onChange={(e) => setQuickAddData({ ...quickAddData, categoryId: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl text-white transition-all"
                  style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)' }}
                  required
                >
                  <option value="" style={{ background: '#0d1025' }}>Select a category</option>
                  {tournament?.categories?.map((category) => (
                    <option key={category.id} value={category.id} style={{ background: '#0d1025' }}>
                      {category.name} - {category.format} ({getGenderLabel(category.gender)})
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setShowQuickAddModal(false); setQuickAddError(''); setQuickAddSuccess(''); }}
                  disabled={quickAddLoading}
                  className="flex-1 px-4 py-3 rounded-xl font-medium disabled:opacity-50 border transition-colors"
                  style={{ borderColor: 'rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.7)' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={quickAddLoading}
                  className="flex-1 px-4 py-3 rounded-xl font-semibold disabled:opacity-50 flex items-center justify-center gap-2 text-white transition-all"
                  style={{ background: 'linear-gradient(135deg,#a855f7,#7c3aed)' }}
                >
                  {quickAddLoading ? (
                    <>
                      <Spinner size="sm" />
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

