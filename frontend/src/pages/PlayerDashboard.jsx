import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/api';
import VerifiedBadge from '../components/VerifiedBadge';
import {
  TrophyIcon,
  ChartBarIcon,
  CalendarIcon,
  MapPinIcon,
  PhoneIcon,
  UserIcon,
  ArrowRightIcon,
  SparklesIcon,
  FireIcon,
  BoltIcon,
  StarIcon,
  InformationCircleIcon,
  XMarkIcon,
  EnvelopeIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline';

const PlayerDashboard = () => {
  const { user } = useAuth();
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [playerCode, setPlayerCode] = useState(null);
  const [umpireCode, setUmpireCode] = useState(null);
  const [showLevelInfo, setShowLevelInfo] = useState(false);
  const [userProfile, setUserProfile] = useState(null);

  useEffect(() => {
    fetchPlayerData();
    fetchUserProfileAndCodes(); // Consolidated to avoid duplicate /auth/me calls
  }, []);

  // Consolidated function to fetch user profile and codes in a single API call
  const fetchUserProfileAndCodes = async () => {
    try {
      const response = await api.get('/auth/me');
      if (response.data.user) {
        setUserProfile(response.data.user);
        setPlayerCode(response.data.user.playerCode);
        setUmpireCode(response.data.user.umpireCode);
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };

  const fetchPlayerData = async () => {
    try {
      const regResponse = await api.get('/registrations/my');
      setRegistrations(regResponse.data.registrations || []);
    } catch (error) {
      console.error('Error fetching player data:', error);
    } finally {
      setLoading(false);
    }
  };

  const userRoles = Array.isArray(user?.roles) ? user.roles : [user?.role];
  const winRate = (user?.matchesWon || 0) + (user?.matchesLost || 0) > 0
    ? Math.round((user?.matchesWon / ((user?.matchesWon || 0) + (user?.matchesLost || 0))) * 100)
    : 0;

  // Calculate experience level based on tournaments played
  const getExperienceLevel = (tournaments) => {
    if (tournaments === 0) return 'New Player';
    if (tournaments >= 1 && tournaments <= 3) return 'Beginner';
    if (tournaments >= 4 && tournaments <= 8) return 'Intermediate';
    if (tournaments >= 9 && tournaments <= 15) return 'Advanced';
    if (tournaments >= 16 && tournaments <= 25) return 'Expert';
    return 'Master';
  };

  const getStarCount = (tournaments) => {
    if (tournaments === 0) return 0;
    if (tournaments >= 1 && tournaments <= 3) return 1;
    if (tournaments >= 4 && tournaments <= 8) return 2;
    if (tournaments >= 9 && tournaments <= 15) return 3;
    if (tournaments >= 16 && tournaments <= 25) return 4;
    return 5;
  };

  const experienceLevel = getExperienceLevel(user?.tournamentsPlayed || 0);
  const starCount = getStarCount(user?.tournamentsPlayed || 0);

  // Calculate additional stats
  const memberSince = userProfile?.createdAt 
    ? new Date(userProfile.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : 'N/A';

  const daysActive = userProfile?.createdAt
    ? Math.floor((new Date() - new Date(userProfile.createdAt)) / (1000 * 60 * 60 * 24))
    : 0;

  const averageTournamentsPerMonth = userProfile?.createdAt && (user?.tournamentsPlayed || 0) > 0
    ? Math.round(((user?.tournamentsPlayed || 0) / (daysActive / 30)) * 10) / 10
    : 0;

  const stats = [
    { label: 'Total Points', value: user?.totalPoints || 0, icon: SparklesIcon, bg: 'linear-gradient(135deg,#f59e0b,#d97706)', glow: 'rgba(245,158,11,0.15)', val: '#fbbf24' },
    { label: 'Tournaments', value: user?.tournamentsPlayed || 0, icon: TrophyIcon, bg: 'linear-gradient(135deg,#a855f7,#7c3aed)', glow: 'rgba(168,85,247,0.15)', val: '#a855f7' },
    { label: 'Matches Won', value: user?.matchesWon || 0, icon: FireIcon, bg: 'linear-gradient(135deg,#00ff88,#00ff88)', glow: 'rgba(0,255,136,0.15)', val: '#00ff88' },
    { label: 'Win Rate', value: `${winRate}%`, icon: BoltIcon, bg: 'linear-gradient(135deg,#00bcd4,#00d4ff)', glow: 'rgba(0,212,255,0.15)', val: '#00d4ff' },
  ];

  return (
    <div className="min-h-screen" style={{ background: '#07071a' }}>
      {/* Background orbs */}
      <div className="fixed top-0 bottom-0 pointer-events-none overflow-hidden" style={{ left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: "480px" }}>
        <div className="absolute top-1/4 left-1/4 w-80 h-80 rounded-full blur-3xl opacity-[0.06]" style={{ background: '#00ff88' }} />
        <div className="absolute bottom-1/4 right-1/4 w-72 h-72 rounded-full blur-3xl opacity-[0.05]" style={{ background: '#a855f7' }} />
      </div>

      {/* Hero Header */}
      <div className="relative border-b" style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.06)' }}>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            {/* Profile Info */}
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6 w-full sm:w-auto">
              <div className="relative flex-shrink-0">
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl flex items-center justify-center text-4xl font-bold text-white shadow-2xl" style={{ background: 'linear-gradient(135deg,#00ff88,#00ff88)', color: '#003320', boxShadow: '0 8px 25px rgba(0,255,136,0.25)' }}>
                  {user?.profilePhoto ? (
                    <img src={user.profilePhoto} alt={user.name} className="w-full h-full object-cover rounded-2xl" />
                  ) : (
                    user?.name?.charAt(0)?.toUpperCase() || 'P'
                  )}
                </div>
                <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: '#00ff88' }}>
                  <span className="text-sm">🏸</span>
                </div>
              </div>
              <div className="text-center sm:text-left">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 sm:gap-3 mb-2">
                  <h1 className="text-2xl sm:text-3xl font-bold text-white">{user?.name}</h1>
                  {userProfile?.isVerifiedPlayer && (
                    <VerifiedBadge type="player" size="lg" />
                  )}
                  <div className="flex gap-2">
                    {userRoles.map((role, index) => (
                      <span key={index} className="px-3 py-1 bg-white/10 backdrop-blur-sm text-white/90 text-xs font-medium rounded-full border border-white/20">
                        {role}
                      </span>
                    ))}
                  </div>
                </div>
                <p className="text-white/60 text-sm break-all">{user?.email}</p>
                <div className="flex flex-wrap items-center gap-2 sm:gap-4 mt-3 text-white/50 text-sm justify-center sm:justify-start">
                  {user?.city && (
                    <span className="flex items-center gap-1">
                      <MapPinIcon className="w-4 h-4" />
                      {user.city}, {user.state}
                    </span>
                  )}
                  {user?.phone && (
                    <span className="flex items-center gap-1">
                      <PhoneIcon className="w-4 h-4" />
                      +91 {user.phone}
                    </span>
                  )}
                </div>
                {/* Player Code & Umpire Code - Show for all users */}
                <div className="mt-3 flex flex-wrap gap-2">
                  {playerCode && (
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/20 border border-blue-500/30 rounded-xl">
                      <span className="text-blue-400/80 text-sm">Player Code:</span>
                      <span className="text-blue-400 font-mono font-bold text-lg tracking-wider">{playerCode}</span>
                      <button
                        onClick={() => navigator.clipboard.writeText(playerCode)}
                        className="p-1.5 hover:bg-blue-500/20 rounded-lg transition-colors ml-1"
                        title="Copy player code"
                      >
                        <svg className="w-4 h-4 text-blue-400/60 hover:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      </button>
                    </div>
                  )}
                  {umpireCode && (
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500/20 border border-amber-500/30 rounded-xl">
                      <span className="text-amber-400/80 text-sm">Umpire Code:</span>
                      <span className="text-amber-400 font-mono font-bold text-lg tracking-wider">{umpireCode}</span>
                      <button
                        onClick={() => navigator.clipboard.writeText(umpireCode)}
                        className="p-1.5 hover:bg-amber-500/20 rounded-lg transition-colors ml-1"
                        title="Copy umpire code"
                      >
                        <svg className="w-4 h-4 text-amber-400/60 hover:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Edit Profile Button */}
            <Link
              to="/profile"
              className="px-6 py-3 bg-white/10 backdrop-blur-sm text-white rounded-xl border border-white/20 hover:bg-white/20 transition-all flex items-center gap-2"
            >
              <UserIcon className="w-5 h-5" />
              Edit Profile
            </Link>
          </div>
        </div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-8">
          {stats.map((stat, index) => (
            <div
              key={index}
              className="rounded-2xl p-4 sm:p-5 border transition-all"
              style={{ background: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.08)' }}
            >
              <div className="inline-flex items-center justify-center w-10 h-10 sm:w-11 sm:h-11 rounded-xl mb-3" style={{ background: stat.glow }}>
                <stat.icon className="w-5 h-5 sm:w-6 sm:h-6" style={{ color: stat.val }} />
              </div>
              <p className="text-2xl sm:text-3xl font-bold text-white">{stat.value}</p>
              <p className="text-xs sm:text-sm mt-1" style={{ color: 'rgba(255,255,255,0.55)' }}>{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Player Profile Details - 3 Column Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Profile Information */}
          <div className="rounded-2xl p-5 border" style={{ background: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.08)' }}>
            <div className="flex items-center gap-3 mb-5">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(168,85,247,0.15)' }}>
                <UserIcon className="w-5 h-5" style={{ color: '#a855f7' }} />
              </div>
              <h3 className="text-base font-bold text-white">Profile Information</h3>
            </div>

            <div className="space-y-3">
              <div>
                <p className="text-xs mb-0.5" style={{ color: 'rgba(255,255,255,0.45)' }}>Full Name</p>
                <p className="text-white font-medium text-sm">{userProfile?.name || user?.name || 'N/A'}</p>
              </div>
              {(userProfile?.email || user?.email) && (
                <div>
                  <p className="text-xs mb-0.5" style={{ color: 'rgba(255,255,255,0.45)' }}>Email Address</p>
                  <p className="text-white font-medium text-sm break-all">{userProfile?.email || user?.email}</p>
                </div>
              )}
              {(userProfile?.phone || user?.phone) && (
                <div>
                  <p className="text-xs mb-0.5" style={{ color: 'rgba(255,255,255,0.45)' }}>Phone Number</p>
                  <p className="text-white font-medium text-sm">{userProfile?.phone || user?.phone}</p>
                </div>
              )}
              {((userProfile?.city || user?.city) || (userProfile?.state || user?.state)) && (
                <div>
                  <p className="text-xs mb-0.5" style={{ color: 'rgba(255,255,255,0.45)' }}>Location</p>
                  <p className="text-white font-medium text-sm">
                    {[userProfile?.city || user?.city, userProfile?.state || user?.state, userProfile?.country || user?.country].filter(Boolean).join(', ')}
                  </p>
                </div>
              )}
              {(userProfile?.gender || user?.gender) && (
                <div>
                  <p className="text-xs mb-0.5" style={{ color: 'rgba(255,255,255,0.45)' }}>Gender</p>
                  <p className="text-white font-medium text-sm capitalize">{userProfile?.gender || user?.gender}</p>
                </div>
              )}
              <div>
                <p className="text-xs mb-0.5" style={{ color: 'rgba(255,255,255,0.45)' }}>Member Since</p>
                <p className="text-white font-medium text-sm">{memberSince}</p>
              </div>
              <div>
                <p className="text-xs mb-0.5" style={{ color: 'rgba(255,255,255,0.45)' }}>Days Active</p>
                <p className="text-white font-medium text-sm">{daysActive} days</p>
              </div>
            </div>
          </div>

          {/* Performance Stats */}
          <div className="rounded-2xl p-5 border" style={{ background: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.08)' }}>
            <div className="flex items-center gap-3 mb-5">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(0,255,136,0.12)' }}>
                <ChartBarIcon className="w-5 h-5" style={{ color: '#00ff88' }} />
              </div>
              <h3 className="text-base font-bold text-white">Performance Stats</h3>
            </div>

            <div className="space-y-5">
              {/* Win Rate */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <p className="text-sm" style={{ color: 'rgba(255,255,255,0.55)' }}>Win Rate</p>
                  <p className="font-bold text-base" style={{ color: '#00ff88' }}>{winRate}%</p>
                </div>
                <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
                  <div className="h-full rounded-full transition-all duration-500" style={{ width: `${winRate}%`, background: 'linear-gradient(90deg,#00ff88,#00ff88)' }} />
                </div>
                <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.4)' }}>
                  {user?.matchesWon || 0} wins of {(user?.matchesWon || 0) + (user?.matchesLost || 0)} matches
                </p>
              </div>

              {/* Average Tournaments Per Month */}
              <div>
                <p className="text-sm mb-2" style={{ color: 'rgba(255,255,255,0.55)' }}>Avg Tournaments/Month</p>
                <div className="flex items-end gap-2">
                  <p className="text-3xl font-bold" style={{ color: '#fbbf24' }}>{averageTournamentsPerMonth}</p>
                  <p className="text-sm mb-1" style={{ color: 'rgba(255,255,255,0.4)' }}>tournaments</p>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <FireIcon className="w-4 h-4" style={{ color: '#fbbf24' }} />
                  <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
                    {averageTournamentsPerMonth > 2 ? 'Highly active' : averageTournamentsPerMonth > 1 ? 'Active' : 'Getting started'}
                  </p>
                </div>
              </div>

              {/* Experience Level */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <p className="text-sm" style={{ color: 'rgba(255,255,255,0.55)' }}>Experience Level</p>
                  <button onClick={() => setShowLevelInfo(true)} className="p-1 rounded-lg" title="View level details"
                    style={{ color: '#00d4ff' }}>
                    <InformationCircleIcon className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-xl font-bold mb-2" style={{ color: '#fbbf24' }}>{experienceLevel}</p>
                <div className="flex gap-1">
                  {[...Array(5)].map((_, i) => (
                    <StarIcon key={i} className="h-5 w-5"
                      style={{ color: i < starCount ? '#fbbf24' : 'rgba(255,255,255,0.15)', fill: i < starCount ? '#fbbf24' : 'none' }} />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Activity & Achievements */}
          <div className="rounded-2xl p-5 border" style={{ background: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.08)' }}>
            <div className="flex items-center gap-3 mb-5">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(0,212,255,0.12)' }}>
                <TrophyIcon className="w-5 h-5" style={{ color: '#00d4ff' }} />
              </div>
              <h3 className="text-base font-bold text-white">Activity & Status</h3>
            </div>

            <div className="space-y-3">
              {/* Current Status */}
              <div className="rounded-xl p-4" style={{ background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="flex items-center justify-between mb-1.5">
                  <p className="text-sm" style={{ color: 'rgba(255,255,255,0.55)' }}>Current Status</p>
                  <div className={`w-2.5 h-2.5 rounded-full ${registrations.length > 0 ? 'animate-pulse' : ''}`}
                    style={{ background: registrations.length > 0 ? '#00ff88' : (user?.tournamentsPlayed || 0) > 0 ? '#fbbf24' : 'rgba(255,255,255,0.3)' }} />
                </div>
                <p className="text-white font-bold">{registrations.length > 0 ? 'Active' : (user?.tournamentsPlayed || 0) > 0 ? 'Inactive' : 'New'}</p>
                <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>
                  {registrations.length > 0 ? `${registrations.length} active registrations` : (user?.tournamentsPlayed || 0) > 0 ? 'No active registrations' : 'Join your first tournament'}
                </p>
              </div>

              {/* Total Points */}
              <div className="rounded-xl p-4" style={{ background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <p className="text-sm mb-1" style={{ color: 'rgba(255,255,255,0.55)' }}>Matchify Points</p>
                <p className="text-3xl font-bold" style={{ color: '#fbbf24' }}>{user?.totalPoints || 0}</p>
                <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>Rank #{user?.rank || '---'}</p>
              </div>

              {/* Verification Status */}
              <div className="rounded-xl p-4" style={{ background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <p className="text-sm mb-2" style={{ color: 'rgba(255,255,255,0.55)' }}>Verification Status</p>
                {userProfile?.isVerifiedPlayer ? (
                  <div className="flex items-center gap-2">
                    <ShieldCheckIcon className="w-5 h-5" style={{ color: '#00d4ff' }} />
                    <div>
                      <p className="font-bold" style={{ color: '#00d4ff' }}>Verified Player</p>
                      <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>Trusted member</p>
                    </div>
                  </div>
                ) : (
                  <div>
                    <p className="font-bold mb-2" style={{ color: '#fbbf24' }}>Not Verified</p>
                    {(user?.tournamentsRegistered || 0) < 12 ? (
                      <div>
                        <p className="text-xs mb-2" style={{ color: 'rgba(255,255,255,0.4)' }}>
                          Register for {12 - (user?.tournamentsRegistered || 0)} more tournament{12 - (user?.tournamentsRegistered || 0) === 1 ? '' : 's'} to get verified
                        </p>
                        <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
                          <div className="h-full rounded-full transition-all duration-500"
                            style={{ width: `${((user?.tournamentsRegistered || 0) / 12) * 100}%`, background: 'linear-gradient(90deg,#00bcd4,#00d4ff)' }} />
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>Verification pending</p>
                    )}
                  </div>
                )}
              </div>

              {/* Achievements */}
              <div>
                <p className="text-sm mb-2" style={{ color: 'rgba(255,255,255,0.55)' }}>Achievements</p>
                <div className="space-y-2">
                  {(user?.tournamentsPlayed || 0) >= 1 && <div className="flex items-center gap-2 text-sm"><span>🎯</span><span className="text-white">First Tournament</span></div>}
                  {(user?.tournamentsPlayed || 0) >= 3 && <div className="flex items-center gap-2 text-sm"><span>⭐</span><span className="text-white">3 Tournaments</span></div>}
                  {(user?.tournamentsPlayed || 0) >= 10 && <div className="flex items-center gap-2 text-sm"><span>🏆</span><span className="text-white">10 Tournaments</span></div>}
                  {(user?.matchesWon || 0) >= 10 && <div className="flex items-center gap-2 text-sm"><span>🔥</span><span className="text-white">10 Wins</span></div>}
                  {(user?.tournamentsPlayed || 0) >= 12 && <div className="flex items-center gap-2 text-sm"><span>✅</span><span className="text-white">Verified Player</span></div>}
                  {(user?.tournamentsPlayed || 0) >= 25 && <div className="flex items-center gap-2 text-sm"><span>💎</span><span className="text-white">25 Tournaments</span></div>}
                  {(user?.tournamentsPlayed || 0) >= 50 && <div className="flex items-center gap-2 text-sm"><span>👑</span><span className="text-white">Master Player</span></div>}
                  {(user?.tournamentsPlayed || 0) === 0 && <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>Play tournaments to earn achievements</p>}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Match History */}
          <div className="lg:col-span-2 rounded-2xl overflow-hidden border" style={{ background: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.08)' }}>
            <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(0,212,255,0.12)' }}>
                  <CalendarIcon className="w-5 h-5" style={{ color: '#00d4ff' }} />
                </div>
                <h3 className="text-base font-bold text-white">Recent Activity</h3>
              </div>
              <Link to="/registrations" className="text-sm font-medium flex items-center gap-1" style={{ color: '#fbbf24' }}>
                View All <ArrowRightIcon className="w-4 h-4" />
              </Link>
            </div>

            <div className="p-5">
              {loading ? (
                <div className="flex justify-center py-10">
                  <div className="w-10 h-10 border-4 border-t-transparent rounded-full animate-spin"
                    style={{ borderColor: 'rgba(0,255,136,0.3)', borderTopColor: '#00ff88' }} />
                </div>
              ) : registrations.length === 0 ? (
                <div className="text-center py-10">
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: 'rgba(255,255,255,0.06)' }}>
                    <span className="text-3xl">🏸</span>
                  </div>
                  <h4 className="text-base font-semibold text-white mb-2">No activity yet</h4>
                  <p className="text-sm mb-5" style={{ color: 'rgba(255,255,255,0.55)' }}>Start your journey by joining a tournament!</p>
                  <Link to="/tournaments" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-sm"
                    style={{ background: 'linear-gradient(135deg,#f59e0b,#d97706)', color: '#fff' }}>
                    <TrophyIcon className="w-4 h-4" />
                    Find Tournaments
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {registrations.slice(0, 5).map((reg) => (
                    <div key={reg.id} className="flex items-center justify-between p-3.5 rounded-xl border transition-all"
                      style={{ background: 'rgba(0,0,0,0.2)', borderColor: 'rgba(255,255,255,0.06)' }}
                      onMouseEnter={(e) => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'}
                      onMouseLeave={(e) => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'}
                    >
                      <div className="flex items-center gap-3">
                        <Link to={`/tournaments/${reg.tournament?.id}`}
                          className="w-10 h-10 rounded-xl flex items-center justify-center"
                          style={{ background: 'rgba(168,85,247,0.15)' }}>
                          <span className="text-lg">🏆</span>
                        </Link>
                        <div>
                          <Link to={`/tournaments/${reg.tournament?.id}`} className="font-semibold text-white text-sm"
                            onMouseEnter={(e) => e.currentTarget.style.color = '#fbbf24'}
                            onMouseLeave={(e) => e.currentTarget.style.color = '#ffffff'}>
                            {reg.tournament?.name || 'Tournament'}
                          </Link>
                          <p className="text-xs" style={{ color: 'rgba(255,255,255,0.45)' }}>
                            {reg.category?.name || 'Category'} • {new Date(reg.createdAt).toLocaleDateString('en-IN')}
                          </p>
                        </div>
                      </div>
                      <span className="px-3 py-1 rounded-lg text-xs font-semibold" style={
                        reg.status === 'confirmed' ? { background: 'rgba(0,255,136,0.12)', color: '#00ff88', border: '1px solid rgba(0,255,136,0.25)' }
                        : reg.status === 'pending' ? { background: 'rgba(251,191,36,0.12)', color: '#fbbf24', border: '1px solid rgba(251,191,36,0.25)' }
                        : reg.status === 'rejected' ? { background: 'rgba(239,68,68,0.12)', color: '#f87171', border: '1px solid rgba(239,68,68,0.25)' }
                        : { background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.1)' }
                      }>
                        {reg.status?.charAt(0).toUpperCase() + reg.status?.slice(1)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions & Leaderboard Preview */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="rounded-2xl p-5 border" style={{ background: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.08)' }}>
              <h3 className="text-base font-bold text-white mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <Link to="/tournaments" className="flex items-center gap-3 p-3.5 rounded-xl border transition-all"
                  style={{ background: 'rgba(0,0,0,0.2)', borderColor: 'rgba(255,255,255,0.06)' }}
                  onMouseEnter={(e) => e.currentTarget.style.borderColor = 'rgba(168,85,247,0.35)'}
                  onMouseLeave={(e) => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'}
                >
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(0,212,255,0.12)' }}>
                    <TrophyIcon className="w-5 h-5" style={{ color: '#00d4ff' }} />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-white text-sm">Browse Tournaments</p>
                    <p className="text-xs" style={{ color: 'rgba(255,255,255,0.45)' }}>Find your next competition</p>
                  </div>
                  <ArrowRightIcon className="w-4 h-4" style={{ color: 'rgba(255,255,255,0.35)' }} />
                </Link>

                <Link to="/leaderboard" className="flex items-center gap-3 p-3.5 rounded-xl border transition-all"
                  style={{ background: 'rgba(0,0,0,0.2)', borderColor: 'rgba(255,255,255,0.06)' }}
                  onMouseEnter={(e) => e.currentTarget.style.borderColor = 'rgba(251,191,36,0.35)'}
                  onMouseLeave={(e) => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'}
                >
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(251,191,36,0.12)' }}>
                    <ChartBarIcon className="w-5 h-5" style={{ color: '#fbbf24' }} />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-white text-sm">Leaderboard</p>
                    <p className="text-xs" style={{ color: 'rgba(255,255,255,0.45)' }}>Check your ranking</p>
                  </div>
                  <ArrowRightIcon className="w-4 h-4" style={{ color: 'rgba(255,255,255,0.35)' }} />
                </Link>
              </div>
            </div>

            {/* Rank Card */}
            <div className="rounded-2xl p-5 border relative overflow-hidden" style={{ background: 'linear-gradient(135deg,rgba(168,85,247,0.15),rgba(124,58,237,0.12))', borderColor: 'rgba(168,85,247,0.3)' }}>
              <div className="absolute top-0 right-0 w-32 h-32 rounded-full blur-2xl opacity-20" style={{ background: '#a855f7' }} />
              <div className="relative">
                <div className="flex items-center gap-2 mb-3">
                  <StarIcon className="w-5 h-5" style={{ color: '#fbbf24' }} />
                  <span className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.7)' }}>Your Rank</span>
                </div>
                <p className="text-4xl font-bold text-white mb-1">#{user?.rank || '---'}</p>
                <p className="text-sm" style={{ color: 'rgba(255,255,255,0.55)' }}>{user?.totalPoints || 0} Matchify Points</p>
                <Link to="/my-points" className="inline-flex items-center gap-1.5 mt-4 text-sm font-medium" style={{ color: '#a855f7' }}>
                  View Points History <ArrowRightIcon className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Experience Level Info Modal */}
      {showLevelInfo && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto" style={{ background: '#0d1025', border: '1px solid rgba(255,255,255,0.1)' }}>
            {/* Header */}
            <div className="sticky top-0 px-5 py-4 flex items-center justify-between" style={{ background: '#0d1025', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(251,191,36,0.15)' }}>
                  <StarIcon className="w-5 h-5" style={{ color: '#fbbf24' }} />
                </div>
                <h3 className="text-base font-bold text-white">Player Experience Levels</h3>
              </div>
              <button onClick={() => setShowLevelInfo(false)} className="p-2 rounded-lg" style={{ color: 'rgba(255,255,255,0.5)' }}>
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-5 space-y-3">
              <p className="text-sm mb-4" style={{ color: 'rgba(255,255,255,0.65)' }}>
                Experience level is determined by total tournaments played. Each level has a star rating.
              </p>

              {[
                { name: 'New Player', range: '0 tournaments', color: 'rgba(255,255,255,0.55)', filled: 0, border: 'rgba(255,255,255,0.08)', desc: 'Just getting started! Join your first tournament to earn your first star.' },
                { name: 'Beginner', range: '1-3 tournaments', color: '#fbbf24', filled: 1, border: 'rgba(251,191,36,0.25)', desc: 'Building foundational skills and learning competitive play.' },
                { name: 'Intermediate', range: '4-8 tournaments', color: '#00d4ff', filled: 2, border: 'rgba(0,212,255,0.25)', desc: 'Gaining confidence and developing consistent performance.' },
                { name: 'Advanced', range: '9-15 tournaments', color: '#a855f7', filled: 3, border: 'rgba(168,85,247,0.25)', desc: 'Experienced player with solid tournament track record.' },
                { name: 'Expert', range: '16-25 tournaments', color: '#00ff88', filled: 4, border: 'rgba(0,255,136,0.25)', desc: 'Highly experienced player with competitive excellence.' },
                { name: 'Master', range: '26+ tournaments', color: '#fbbf24', filled: 5, border: 'rgba(251,191,36,0.3)', desc: 'Elite player with extensive tournament experience.' },
              ].map((level) => (
                <div key={level.name} className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${level.border}` }}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div>
                      <h4 className="font-bold" style={{ color: level.color }}>{level.name}</h4>
                      <p className="text-xs" style={{ color: 'rgba(255,255,255,0.45)' }}>{level.range}</p>
                    </div>
                    <div className="flex gap-1">
                      {[...Array(5)].map((_, i) => (
                        <StarIcon key={i} className="w-4 h-4"
                          style={{ color: i < level.filled ? '#fbbf24' : 'rgba(255,255,255,0.15)', fill: i < level.filled ? '#fbbf24' : 'none' }} />
                      ))}
                    </div>
                  </div>
                  <p className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>{level.desc}</p>
                </div>
              ))}

              {/* Progress */}
              {(user?.tournamentsPlayed || 0) > 0 && (
                <div className="rounded-xl p-4" style={{ background: 'rgba(0,212,255,0.08)', border: '1px solid rgba(0,212,255,0.2)' }}>
                  <div className="flex items-center gap-2 mb-2">
                    <TrophyIcon className="w-4 h-4" style={{ color: '#00d4ff' }} />
                    <h4 className="font-bold text-white text-sm">Your Progress</h4>
                  </div>
                  <p className="text-sm" style={{ color: 'rgba(255,255,255,0.7)' }}>
                    You've played <span className="font-bold" style={{ color: '#00d4ff' }}>{user?.tournamentsPlayed || 0}</span> {(user?.tournamentsPlayed || 0) === 1 ? 'tournament' : 'tournaments'}.
                    {(user?.tournamentsPlayed || 0) < 4 && ` Play ${4 - (user?.tournamentsPlayed || 0)} more to reach Intermediate!`}
                    {(user?.tournamentsPlayed || 0) >= 4 && (user?.tournamentsPlayed || 0) < 9 && ` Play ${9 - (user?.tournamentsPlayed || 0)} more to reach Advanced!`}
                    {(user?.tournamentsPlayed || 0) >= 9 && (user?.tournamentsPlayed || 0) < 16 && ` Play ${16 - (user?.tournamentsPlayed || 0)} more to reach Expert!`}
                    {(user?.tournamentsPlayed || 0) >= 16 && (user?.tournamentsPlayed || 0) < 26 && ` Play ${26 - (user?.tournamentsPlayed || 0)} more to reach Master!`}
                    {(user?.tournamentsPlayed || 0) >= 26 && ' You are a Master Player! 🏆'}
                  </p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 px-5 py-4" style={{ background: '#0d1025', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
              <button onClick={() => setShowLevelInfo(false)}
                className="w-full py-3 rounded-xl font-semibold text-sm"
                style={{ background: 'linear-gradient(135deg,#00ff88,#00ff88)', color: '#003320' }}>
                Got it!
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlayerDashboard;
