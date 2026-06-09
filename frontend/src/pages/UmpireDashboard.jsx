import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/api';
import VerifiedBadge from '../components/VerifiedBadge';
import LoadingScreen from '../components/LoadingScreen';
import {
  ClipboardDocumentListIcon,
  CheckCircleIcon,
  ClockIcon,
  CalendarDaysIcon,
  ArrowRightIcon,
  PlayIcon,
  TrophyIcon,
  StarIcon,
  FireIcon,
  ChartBarIcon,
  UserCircleIcon,
  PhoneIcon,
  EnvelopeIcon,
  MapPinIcon,
  CakeIcon,
  ShieldCheckIcon,
  InformationCircleIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

export default function UmpireDashboard() {
  const { user } = useAuth();
  const [matches, setMatches] = useState([]);
  const [umpireCode, setUmpireCode] = useState(null);
  const [playerCode, setPlayerCode] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [showLevelInfo, setShowLevelInfo] = useState(false);
  const [copiedCode, setCopiedCode] = useState(null); // 'umpire' | 'player' | null
  const [stats, setStats] = useState({
    totalMatches: 0,
    completedMatches: 0,
    upcomingMatches: 0,
    todayMatches: 0,
    historicalMatches: 0,
    isVerifiedUmpire: false
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUmpireData();
    fetchUmpireCode();
  }, []);

  const fetchUmpireCode = async () => {
    try {
      const response = await api.get('/auth/me');
      if (response.data.user) {
        setUmpireCode(response.data.user.umpireCode);
        setPlayerCode(response.data.user.playerCode);
      }
      // Store full user profile
      setUserProfile(response.data.user);
      // Also get historical match count
      if (response.data.user?.matchesUmpired !== undefined) {
        setStats(prev => ({
          ...prev,
          historicalMatches: response.data.user.matchesUmpired,
          isVerifiedUmpire: response.data.user.isVerifiedUmpire || false
        }));
      }
    } catch (error) {
      console.error('Error fetching codes:', error);
    }
  };

  const fetchUmpireData = async () => {
    try {
      const response = await api.get('/matches/umpire-matches');
      const umpireMatches = response.data.matches;
      
      setMatches(umpireMatches);
      
      const totalMatches = umpireMatches.length;
      const completedMatches = umpireMatches.filter(m => m.status === 'COMPLETED').length;
      const upcomingMatches = umpireMatches.filter(m => m.status === 'SCHEDULED').length;
      
      const today = new Date().toDateString();
      const todayMatches = umpireMatches.filter(m => 
        new Date(m.scheduledTime).toDateString() === today
      ).length;
      
      // Use prev => to preserve historicalMatches and isVerifiedUmpire
      setStats(prev => ({ 
        ...prev,
        totalMatches, 
        completedMatches, 
        upcomingMatches, 
        todayMatches 
      }));
      setLoading(false);
    } catch (error) {
      console.error('Error fetching umpire data:', error);
      setLoading(false);
    }
  };

  const statCards = [
    { label: 'Assigned Matches', value: stats.totalMatches, icon: ClipboardDocumentListIcon, color: 'from-cyan-500 to-sky-600', bgColor: '', textColor: 'text-cyan-400', description: 'Currently assigned to you' },
    { label: 'Completed', value: stats.completedMatches, icon: CheckCircleIcon, color: 'from-emerald-500 to-green-600', bgColor: '', textColor: 'text-emerald-400', description: 'Successfully umpired' },
    { label: 'Upcoming', value: stats.upcomingMatches, icon: ClockIcon, color: 'from-amber-500 to-yellow-600', bgColor: '', textColor: 'text-amber-400', description: 'Scheduled matches' },
    { label: 'Today', value: stats.todayMatches, icon: CalendarDaysIcon, color: 'from-violet-500 to-purple-600', bgColor: '', textColor: 'text-violet-400', description: 'Matches today' },
  ];

  // Calculate additional stats
  const completionRate = stats.historicalMatches > 0 
    ? Math.round((stats.completedMatches / stats.historicalMatches) * 100) 
    : 0;
  
  const memberSince = userProfile?.createdAt 
    ? new Date(userProfile.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : 'N/A';

  const daysActive = userProfile?.createdAt
    ? Math.floor((new Date() - new Date(userProfile.createdAt)) / (1000 * 60 * 60 * 24))
    : 0;

  const averageMatchesPerMonth = userProfile?.createdAt && stats.historicalMatches > 0
    ? Math.round((stats.historicalMatches / (daysActive / 30)) * 10) / 10
    : 0;

  const copyCode = (code, type) => {
    navigator.clipboard.writeText(code).catch(() => {});
    setCopiedCode(type);
    setTimeout(() => setCopiedCode(null), 1800);
  };

  if (loading) {
    return <LoadingScreen message="Loading dashboard..." />;
  }

  const todayMatches = matches.filter(m => new Date(m.scheduledTime).toDateString() === new Date().toDateString());

  return (
    <div className="min-h-screen" style={{ background: '#050810' }}>
      {/* Background orbs */}
      <div className="fixed top-0 bottom-0 pointer-events-none overflow-hidden" style={{ left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: "480px" }}>
        <div className="absolute top-1/4 left-1/4 w-80 h-80 rounded-full blur-3xl opacity-[0.07]" style={{ background: '#a855f7' }} />
        <div className="absolute bottom-1/4 right-1/4 w-72 h-72 rounded-full blur-3xl opacity-[0.05]" style={{ background: '#F59E0B' }} />
      </div>
      {/* Hero Header */}
      <div className="relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #050810 0%, #0d0a1f 50%, #050810 100%)' }}>
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/4 w-96 h-96 rounded-full blur-3xl opacity-[0.12]" style={{ background: '#a855f7' }} />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 rounded-full blur-3xl opacity-[0.08]" style={{ background: '#FCD34D' }} />
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-6">
              <div className="relative">
                <div className="w-24 h-24 bg-gradient-to-br from-amber-400 via-orange-500 to-red-600 rounded-2xl flex items-center justify-center text-4xl font-bold text-white shadow-2xl shadow-orange-500/30">
                  {user?.profilePhoto ? (
                    <img src={user.profilePhoto} alt={user.name} className="w-full h-full object-cover rounded-2xl" />
                  ) : (
                    user?.name?.charAt(0)?.toUpperCase() || 'U'
                  )}
                </div>
                <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center">
                  <span className="text-white text-sm">⚖️</span>
                </div>
              </div>
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-3xl font-bold text-white">Umpire Dashboard</h1>
                  {stats.isVerifiedUmpire && (
                    <VerifiedBadge type="umpire" size="lg" />
                  )}
                </div>
                <p className="text-white/60">Welcome back, {user?.name}!</p>
                <p className="text-white/40 text-sm mt-1">{user?.email}</p>
                {/* Quick-reference codes in header */}
                <div className="mt-3 flex flex-wrap gap-2">
                  {umpireCode && (
                    <button
                      onClick={() => copyCode(umpireCode, 'umpire-header')}
                      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all active:scale-95"
                      style={{ background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.35)' }}
                      title="Copy umpire code"
                    >
                      <span className="text-amber-400/70 text-xs">⚖️ Umpire:</span>
                      <span className="text-amber-300 font-mono font-bold text-sm tracking-widest">{umpireCode}</span>
                      <span className="text-xs" style={{ color: copiedCode === 'umpire-header' ? '#4ade80' : 'rgba(245,158,11,0.5)' }}>
                        {copiedCode === 'umpire-header' ? '✓' : '⎘'}
                      </span>
                    </button>
                  )}
                  {playerCode && (
                    <button
                      onClick={() => copyCode(playerCode, 'player-header')}
                      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all active:scale-95"
                      style={{ background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.25)' }}
                      title="Copy player code"
                    >
                      <span className="text-emerald-400/70 text-xs">🎾 Player:</span>
                      <span className="text-emerald-300 font-mono font-bold text-sm tracking-widest">{playerCode}</span>
                      <span className="text-xs" style={{ color: copiedCode === 'player-header' ? '#4ade80' : 'rgba(52,211,153,0.4)' }}>
                        {copiedCode === 'player-header' ? '✓' : '⎘'}
                      </span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 -mt-8">

        {/* ── UMPIRE ID CARD — the most important thing on this page ── */}
        {umpireCode && (
          <div
            className="mb-6 rounded-2xl overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, rgba(245,158,11,0.12) 0%, rgba(253,211,77,0.06) 50%, rgba(245,158,11,0.10) 100%)',
              border: '1.5px solid rgba(245,158,11,0.35)',
              boxShadow: '0 8px 32px rgba(245,158,11,0.12)',
            }}
          >
            {/* Top label strip */}
            <div className="px-5 pt-4 pb-0 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-base">⚖️</span>
                <span className="text-xs font-black tracking-widest uppercase" style={{ color: 'rgba(245,158,11,0.7)' }}>
                  Your Umpire Code
                </span>
              </div>
              {stats.isVerifiedUmpire && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold" style={{ background: 'rgba(34,197,94,0.15)', color: '#4ade80', border: '1px solid rgba(34,197,94,0.3)' }}>
                  ✓ Verified
                </span>
              )}
            </div>

            {/* Big code display */}
            <div className="px-5 py-3 flex items-center gap-4">
              <span
                className="font-black tracking-[0.18em] select-all"
                style={{
                  fontSize: 'clamp(28px, 8vw, 44px)',
                  color: '#F59E0B',
                  textShadow: '0 0 30px rgba(245,158,11,0.5)',
                  letterSpacing: '0.18em',
                  fontFamily: 'monospace',
                }}
              >
                {umpireCode}
              </span>
            </div>

            {/* Explanation + copy button */}
            <div className="px-5 pb-4 flex items-end justify-between gap-3">
              <p className="text-xs leading-relaxed flex-1" style={{ color: 'rgba(255,255,255,0.5)' }}>
                Share this code with tournament organizers. They enter it to add you as an umpire to their tournament. Keep it handy on match day.
              </p>
              <button
                onClick={() => copyCode(umpireCode, 'umpire-main')}
                className="flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl font-black text-sm transition-all active:scale-95"
                style={{
                  background: copiedCode === 'umpire-main'
                    ? 'linear-gradient(135deg,#22c55e,#16a34a)'
                    : 'linear-gradient(135deg,#F59E0B,#FCD34D)',
                  color: '#07071a',
                  boxShadow: copiedCode === 'umpire-main'
                    ? '0 4px 15px rgba(34,197,94,0.4)'
                    : '0 4px 15px rgba(245,158,11,0.4)',
                  minWidth: 110,
                  justifyContent: 'center',
                }}
              >
                {copiedCode === 'umpire-main' ? (
                  <><span>✓</span> Copied!</>
                ) : (
                  <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg> Copy Code</>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Historical Stats Banner */}
        {stats.historicalMatches > 0 && (
          <div className="mb-8 bg-gradient-to-r from-purple-900/50 via-indigo-900/50 to-purple-900/50 backdrop-blur-sm border border-purple-500/30 rounded-2xl p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <span className="text-3xl">🏆</span>
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white mb-1">
                    {stats.historicalMatches} {stats.historicalMatches === 1 ? 'Match' : 'Matches'} Umpired
                  </h3>
                  <p className="text-purple-300/80">Total career matches as umpire</p>
                </div>
              </div>
              {stats.isVerifiedUmpire && (
                <div className="flex items-center gap-2 px-6 py-3 border rounded-xl">
                  <svg className="w-6 h-6 text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-emerald-300 font-semibold">Verified Umpire</span>
                </div>
              )}
              {!stats.isVerifiedUmpire && stats.historicalMatches >= 5 && (
                <div className="text-right">
                  <div className="text-purple-300 text-sm mb-1">Progress to Verification</div>
                  <div className="flex items-center gap-2">
                    <div className="w-48 h-2 bg-purple-900/50 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 transition-all duration-500"
                        style={{ width: `${(stats.historicalMatches / 10) * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-purple-300 font-semibold text-sm">{stats.historicalMatches}/10</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {statCards.map((stat, index) => (
            <div key={index} className="rounded-2xl p-5 border hover:scale-105 transition-all duration-300" style={{ background: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.08)' }}>
              <div className={`inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br ${stat.color} rounded-xl shadow-lg mb-4`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
              <p className={`text-3xl font-bold ${stat.textColor} mb-1`}>{stat.value}</p>
              <p className="text-white font-medium text-sm mb-1">{stat.label}</p>
              <p className="text-gray-500 text-xs">{stat.description}</p>
            </div>
          ))}
        </div>

        {/* Umpire Profile Details */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Profile Information */}
          <div className="rounded-2xl p-6 border" style={{ background: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.08)' }}>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center">
                <UserCircleIcon className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-lg font-bold text-white">Profile Information</h3>
            </div>
            
            <div className="space-y-4">
              <div>
                <p className="text-gray-400 text-xs mb-1">Full Name</p>
                <p className="text-white font-medium">{userProfile?.name || 'N/A'}</p>
              </div>
              
              {userProfile?.email && (
                <div>
                  <p className="text-gray-400 text-xs mb-1">Email Address</p>
                  <p className="text-white font-medium text-sm break-all">{userProfile.email}</p>
                </div>
              )}
              
              {userProfile?.phone && (
                <div>
                  <p className="text-gray-400 text-xs mb-1">Phone Number</p>
                  <p className="text-white font-medium">{userProfile.phone}</p>
                </div>
              )}
              
              {(userProfile?.city || userProfile?.state || userProfile?.country) && (
                <div>
                  <p className="text-gray-400 text-xs mb-1">Location</p>
                  <p className="text-white font-medium">
                    {[userProfile.city, userProfile.state, userProfile.country].filter(Boolean).join(', ')}
                  </p>
                </div>
              )}
              
              {userProfile?.gender && (
                <div>
                  <p className="text-gray-400 text-xs mb-1">Gender</p>
                  <p className="text-white font-medium capitalize">{userProfile.gender}</p>
                </div>
              )}
              
              {userProfile?.dateOfBirth && (
                <div>
                  <p className="text-gray-400 text-xs mb-1">Date of Birth</p>
                  <p className="text-white font-medium">
                    {new Date(userProfile.dateOfBirth).toLocaleDateString('en-US', { 
                      month: 'long', 
                      day: 'numeric', 
                      year: 'numeric' 
                    })}
                  </p>
                </div>
              )}
              
              <div>
                <p className="text-gray-400 text-xs mb-1">Member Since</p>
                <p className="text-white font-medium">{memberSince}</p>
              </div>
              
              <div>
                <p className="text-gray-400 text-xs mb-1">Days Active</p>
                <p className="text-white font-medium">{daysActive} days</p>
              </div>
            </div>
          </div>

          {/* Performance Stats */}
          <div className="rounded-2xl p-6 border" style={{ background: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.08)' }}>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
                <ChartBarIcon className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-lg font-bold text-white">Performance Stats</h3>
            </div>
            
            <div className="space-y-6">
              {/* Completion Rate */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <p className="text-gray-400 text-sm">Completion Rate</p>
                  <p className="text-green-400 font-bold text-lg">{completionRate}%</p>
                </div>
                <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
                  <div 
                    className="h-full bg-gradient-to-r from-green-500 to-emerald-600 transition-all duration-500"
                    style={{ width: `${completionRate}%` }}
                  ></div>
                </div>
                <p className="text-gray-500 text-xs mt-1">
                  {stats.completedMatches} of {stats.historicalMatches} matches
                </p>
              </div>

              {/* Average Matches Per Month */}
              <div>
                <p className="text-gray-400 text-sm mb-2">Avg Matches/Month</p>
                <div className="flex items-end gap-2">
                  <p className="text-4xl font-bold text-orange-400">{averageMatchesPerMonth}</p>
                  <p className="text-gray-500 text-sm mb-1">matches</p>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <FireIcon className="w-4 h-4 text-orange-400" />
                  <p className="text-gray-500 text-xs">
                    {averageMatchesPerMonth > 5 ? 'Highly active' : 
                     averageMatchesPerMonth > 2 ? 'Active' : 'Getting started'}
                  </p>
                </div>
              </div>

              {/* Experience Level */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <p className="text-gray-400 text-sm">Experience Level</p>
                  <button
                    onClick={() => setShowLevelInfo(true)}
                    className="p-1 hover:bg-slate-700 rounded-lg transition-colors"
                    title="View level details"
                  >
                    <InformationCircleIcon className="w-4 h-4 text-emerald-400" />
                  </button>
                </div>
                <p className="text-2xl font-bold text-amber-400 mb-2">
                  {stats.historicalMatches === 0 ? 'New Umpire' :
                   stats.historicalMatches >= 1 && stats.historicalMatches < 5 ? 'Beginner' : 
                   stats.historicalMatches >= 5 && stats.historicalMatches < 10 ? 'Intermediate' : 
                   stats.historicalMatches >= 10 && stats.historicalMatches < 25 ? 'Advanced' : 
                   stats.historicalMatches >= 25 && stats.historicalMatches < 50 ? 'Expert' : 'Master'}
                </p>
                <div className="flex gap-1">
                  {[...Array(5)].map((_, i) => {
                    // Calculate stars based on experience level
                    let filledStars = 0;
                    if (stats.historicalMatches >= 1 && stats.historicalMatches < 5) filledStars = 1;      // Beginner: 1 star
                    else if (stats.historicalMatches >= 5 && stats.historicalMatches < 10) filledStars = 2; // Intermediate: 2 stars
                    else if (stats.historicalMatches >= 10 && stats.historicalMatches < 25) filledStars = 3; // Advanced: 3 stars
                    else if (stats.historicalMatches >= 25 && stats.historicalMatches < 50) filledStars = 4; // Expert: 4 stars
                    else if (stats.historicalMatches >= 50) filledStars = 5; // Master: 5 stars
                    
                    return (
                      <StarIcon 
                        key={i} 
                        className={`w-5 h-5 ${
                          i < filledStars
                            ? 'text-amber-400 fill-amber-400' 
                            : 'text-gray-600'
                        }`} 
                      />
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Activity & Achievements */}
          <div className="rounded-2xl p-6 border" style={{ background: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.08)' }}>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                <TrophyIcon className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-lg font-bold text-white">Activity & Status</h3>
            </div>
            
            <div className="space-y-4">
              {/* Current Status */}
              <div className="rounded-xl p-4 border" style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.06)' }}>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-gray-400 text-sm">Current Status</p>
                  <div className={`w-3 h-3 rounded-full ${
                    stats.totalMatches > 0 ? 'bg-green-500 animate-pulse' : 
                    stats.historicalMatches > 0 ? 'bg-yellow-500' : 'bg-gray-500'
                  }`}></div>
                </div>
                <p className="text-white font-bold text-lg">
                  {stats.totalMatches > 0 ? 'Active' : 
                   stats.historicalMatches > 0 ? 'Inactive' : 'New'}
                </p>
                <p className="text-gray-500 text-xs mt-1">
                  {stats.totalMatches > 0 ? `${stats.totalMatches} matches assigned` : 
                   stats.historicalMatches > 0 ? 'No active assignments' : 'Awaiting first assignment'}
                </p>
              </div>

              {/* Verification Status */}
              <div className="rounded-xl p-4 border" style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.06)' }}>
                <p className="text-gray-400 text-sm mb-2">Verification Status</p>
                {stats.isVerifiedUmpire ? (
                  <div className="flex items-center gap-2">
                    <ShieldCheckIcon className="w-6 h-6 text-emerald-400" />
                    <div>
                      <p className="text-emerald-400 font-bold">Verified</p>
                      <p className="text-gray-500 text-xs">Trusted umpire</p>
                    </div>
                  </div>
                ) : (
                  <div>
                    <p className="text-yellow-400 font-bold mb-2">Not Verified</p>
                    {stats.historicalMatches < 10 ? (
                      <div>
                        <p className="text-gray-500 text-xs mb-2">
                          Complete {10 - stats.historicalMatches} more {10 - stats.historicalMatches === 1 ? 'match' : 'matches'} to get verified
                        </p>
                        <div className="w-full h-1.5 bg-slate-600 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-yellow-500 to-amber-600 transition-all duration-500"
                            style={{ width: `${(stats.historicalMatches / 10) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    ) : (
                      <p className="text-gray-500 text-xs">Verification pending</p>
                    )}
                  </div>
                )}
              </div>

              {/* Achievements */}
              <div>
                <p className="text-gray-400 text-sm mb-3">Achievements</p>
                <div className="space-y-2">
                  {stats.historicalMatches >= 1 && (
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-lg">🎯</span>
                      <span className="text-white">First Match</span>
                    </div>
                  )}
                  {stats.historicalMatches >= 5 && (
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-lg">⭐</span>
                      <span className="text-white">5 Matches</span>
                    </div>
                  )}
                  {stats.historicalMatches >= 10 && (
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-lg">🏆</span>
                      <span className="text-white">Verified Umpire</span>
                    </div>
                  )}
                  {stats.historicalMatches >= 25 && (
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-lg">💎</span>
                      <span className="text-white">25 Matches</span>
                    </div>
                  )}
                  {stats.historicalMatches >= 50 && (
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-lg">👑</span>
                      <span className="text-white">Master Umpire</span>
                    </div>
                  )}
                  {stats.historicalMatches === 0 && (
                    <p className="text-gray-500 text-xs">Complete matches to earn achievements</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── YOUR QUEUE ────────────────────────────────────────────────────── */}
        {(() => {
          // Matches assigned to this umpire with a queueOrder set, sorted by position
          const queueMatches = matches
            .filter(m => m.umpireId === user?.id && m.queueOrder != null)
            .sort((a, b) => (a.queueOrder || 0) - (b.queueOrder || 0));

          if (queueMatches.length === 0) return null;

          // Next = first match that isn't COMPLETED yet
          const nextMatch = queueMatches.find(m => m.status !== 'COMPLETED');
          const upcoming  = queueMatches.filter(m => m !== nextMatch && m.status !== 'COMPLETED');
          const done      = queueMatches.filter(m => m.status === 'COMPLETED');

          const conductLink = (m) =>
            m.status === 'IN_PROGRESS'
              ? `/match/${m.id}/score`
              : `/match/${m.id}/conduct?umpireId=${m.umpireId}`;

          const playerLabel = (m) => {
            const p1 = m.player1?.name || 'TBD';
            const p2 = m.player2?.name || 'TBD';
            return `${p1} vs ${p2}`;
          };

          return (
            <div className="rounded-2xl overflow-hidden mb-8"
              style={{ background: 'rgba(96,165,250,0.06)', border: '1.5px solid rgba(96,165,250,0.25)' }}>

              {/* Header */}
              <div className="p-5 flex items-center gap-3"
                style={{ borderBottom: '1px solid rgba(96,165,250,0.15)' }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ background: 'rgba(96,165,250,0.2)' }}>
                  <span className="text-lg">📋</span>
                </div>
                <div>
                  <h3 className="text-base font-black text-white">Your Queue</h3>
                  <p className="text-xs" style={{ color: 'rgba(255,255,255,0.45)' }}>
                    {queueMatches.length} match{queueMatches.length !== 1 ? 'es' : ''} assigned in order
                  </p>
                </div>
              </div>

              <div className="p-5 space-y-4">
                {/* NEXT MATCH */}
                {nextMatch ? (
                  <div className="rounded-xl p-4"
                    style={{ background: 'rgba(96,165,250,0.1)', border: '1.5px solid rgba(96,165,250,0.35)' }}>
                    <p className="text-[10px] font-black mb-2" style={{ color: '#93c5fd', letterSpacing: '0.1em' }}>
                      ▶ NEXT MATCH
                    </p>
                    <p className="text-white font-black text-base mb-0.5">{playerLabel(nextMatch)}</p>
                    <p className="text-xs mb-3" style={{ color: 'rgba(255,255,255,0.5)' }}>
                      M{nextMatch.matchNumber} · {nextMatch.tournament?.name} · {nextMatch.category?.name}
                    </p>
                    <Link to={conductLink(nextMatch)}
                      className="flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-black transition-all hover:scale-[1.02]"
                      style={{ background: 'rgba(96,165,250,0.25)', color: '#60a5fa', border: '1.5px solid rgba(96,165,250,0.5)' }}>
                      <PlayIcon className="w-4 h-4" />
                      {nextMatch.status === 'IN_PROGRESS' ? 'Continue Match' : 'Start Match'}
                    </Link>
                  </div>
                ) : (
                  <div className="rounded-xl p-4 text-center"
                    style={{ background: 'rgba(74,222,128,0.08)', border: '1px solid rgba(74,222,128,0.2)' }}>
                    <p className="text-sm font-bold" style={{ color: '#4ade80' }}>✓ All queued matches completed!</p>
                  </div>
                )}

                {/* COMING UP */}
                {upcoming.length > 0 && (
                  <div>
                    <p className="text-[10px] font-black mb-2" style={{ color: 'rgba(255,255,255,0.4)', letterSpacing: '0.1em' }}>
                      COMING UP
                    </p>
                    <div className="space-y-2">
                      {upcoming.map((m, i) => (
                        <div key={m.id}
                          className="flex items-center gap-3 rounded-xl px-3 py-2.5"
                          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                          <span className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-black flex-shrink-0"
                            style={{ background: 'rgba(96,165,250,0.2)', color: '#93c5fd' }}>
                            {(nextMatch ? 1 : 0) + i + 1}
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-white truncate">{playerLabel(m)}</p>
                            <p className="text-[10px] truncate" style={{ color: 'rgba(255,255,255,0.4)' }}>
                              M{m.matchNumber} · {m.category?.name}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* COMPLETED in queue */}
                {done.length > 0 && (
                  <p className="text-xs text-center" style={{ color: 'rgba(255,255,255,0.3)' }}>
                    {done.length} match{done.length !== 1 ? 'es' : ''} completed
                  </p>
                )}
              </div>
            </div>
          );
        })()}

        {/* Today's Matches */}
        <div className="rounded-2xl overflow-hidden mb-8 border" style={{ background: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.08)' }}>
          <div className="p-6 border-b border-white/10 flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-rose-600 rounded-xl flex items-center justify-center">
              <CalendarDaysIcon className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-lg font-bold text-white">Today's Matches</h3>
            {todayMatches.length > 0 && (
              <span style={{ background: 'rgba(245,158,11,0.15)', color: '#FCD34D', border: '1px solid rgba(245,158,11,0.3)', fontSize: 11, fontWeight: 700, padding: '2px 10px', borderRadius: 20 }}>{todayMatches.length}</span>
            )}
          </div>

          <div className="p-6">
            {todayMatches.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: 'rgba(255,255,255,0.05)' }}>
                  <span className="text-4xl">📅</span>
                </div>
                <h4 className="text-lg font-semibold text-white mb-2">No matches today</h4>
                <p className="text-gray-500">Check back later for scheduled matches</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {todayMatches.map((match) => (
                  <div key={match.id} className="rounded-xl p-5 border hover:border-purple-500/40 transition-all" style={{ background: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.08)' }}>
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="font-semibold text-white">{match.tournament?.name}</h3>
                      <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                        match.status === 'COMPLETED' ? 'bg-green-500/20 text-green-400' :
                        match.status === 'IN_PROGRESS' ? 'bg-amber-500/20 text-amber-400' :
                        'bg-emerald-500/20 text-emerald-400'
                      }`}>
                        {match.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-400 mb-1">{match.category?.name}</p>
                    <p className="text-sm text-gray-500 mb-4 flex items-center gap-1">
                      <ClockIcon className="w-4 h-4" />
                      {new Date(match.scheduledTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                    
                    {match.status !== 'COMPLETED' && (
                      <Link
                        to={match.status === 'IN_PROGRESS'
                          ? `/match/${match.id}/score`
                          : `/match/${match.id}/conduct?umpireId=${match.umpireId || user?.id}`}
                        className="w-full flex items-center justify-center gap-2 text-white py-2.5 px-4 rounded-xl text-sm font-medium hover:shadow-lg hover:scale-105 transition-all" style={{ background: 'linear-gradient(135deg, #F59E0B, #D97706)', color: '#0C0900', boxShadow: '0 4px 12px rgba(245,158,11,0.3)' }}
                      >
                        <PlayIcon className="w-4 h-4" />
                        {match.status === 'IN_PROGRESS' ? 'Continue Scoring' : 'Start Scoring'}
                      </Link>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* All Matches */}
        <div className="rounded-2xl overflow-hidden border" style={{ background: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.08)' }}>
          <div className="p-6 border-b border-white/10 flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
              <ClipboardDocumentListIcon className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-lg font-bold text-white">All Assigned Matches</h3>
          </div>

          <div className="p-6">
            {matches.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: 'rgba(255,255,255,0.05)' }}>
                  <span className="text-4xl">📋</span>
                </div>
                <h4 className="text-lg font-semibold text-white mb-2">No matches assigned</h4>
                <p className="text-gray-500">You'll see your assigned matches here</p>
              </div>
            ) : (
              <div className="space-y-3">
                {matches.map((match) => (
                  <div key={match.id} className="flex items-center justify-between p-4 rounded-xl border hover:border-purple-500/40 transition-all" style={{ background: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.08)' }}>
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-xl flex items-center justify-center">
                        <span className="text-xl">🏸</span>
                      </div>
                      <div>
                        <p className="font-semibold text-white">{match.tournament?.name}</p>
                        <p className="text-sm text-gray-400">
                          {match.category?.name} • {match.category?.format}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(match.scheduledTime).toLocaleString('en-IN')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                        match.status === 'COMPLETED' ? 'bg-green-500/20 text-green-400' :
                        match.status === 'IN_PROGRESS' ? 'bg-amber-500/20 text-amber-400' :
                        'bg-emerald-500/20 text-emerald-400'
                      }`}>
                        {match.status}
                      </span>
                      {match.status !== 'COMPLETED' ? (
                        <Link
                          to={match.status === 'IN_PROGRESS'
                            ? `/match/${match.id}/score`
                            : `/match/${match.id}/conduct?umpireId=${match.umpireId || user?.id}`}
                          className="flex items-center gap-1 px-4 py-2 text-white rounded-xl text-sm font-medium hover:shadow-lg transition-all" style={{ background: 'linear-gradient(135deg, #F59E0B, #D97706)', color: '#0C0900', boxShadow: '0 4px 12px rgba(245,158,11,0.25)' }}
                        >
                          {match.status === 'IN_PROGRESS' ? 'Resume' : 'Score'}
                          <ArrowRightIcon className="w-4 h-4" />
                        </Link>
                      ) : (
                        <span className="text-gray-500 text-sm px-4 py-2">Completed</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Experience Level Info Modal */}
      {showLevelInfo && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border" style={{ background: '#0d1025', borderColor: 'rgba(255,255,255,0.08)' }}>
            {/* Header */}
            <div className="sticky top-0 border-b p-6 flex items-center justify-between" style={{ background: '#0d1025', borderColor: 'rgba(255,255,255,0.08)' }}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center">
                  <StarIcon className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-xl font-bold text-white">Experience Level System</h3>
              </div>
              <button
                onClick={() => setShowLevelInfo(false)}
                className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
              >
                <XMarkIcon className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              <p className="text-gray-300 mb-6">
                Your experience level is determined by the total number of matches you've umpired. 
                Each level comes with a star rating to show your expertise.
              </p>

              {/* Level Cards */}
              <div className="space-y-3">
                {/* New Umpire */}
                <div className="rounded-xl p-4 border" style={{ background: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.08)' }}>
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h4 className="text-lg font-bold text-gray-300">New Umpire</h4>
                      <p className="text-sm text-gray-400">0 matches</p>
                    </div>
                    <div className="flex gap-1">
                      {[...Array(5)].map((_, i) => (
                        <StarIcon key={i} className="w-5 h-5 text-gray-600" />
                      ))}
                    </div>
                  </div>
                  <p className="text-sm text-gray-400">
                    Just getting started! Complete your first match to earn your first star.
                  </p>
                </div>

                {/* Beginner */}
                <div className="bg-slate-700/50 border border-amber-500/30 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h4 className="text-lg font-bold text-amber-400">Beginner</h4>
                      <p className="text-sm text-gray-400">1-4 matches</p>
                    </div>
                    <div className="flex gap-1">
                      <StarIcon className="w-5 h-5 text-amber-400 fill-amber-400" />
                      {[...Array(4)].map((_, i) => (
                        <StarIcon key={i} className="w-5 h-5 text-gray-600" />
                      ))}
                    </div>
                  </div>
                  <p className="text-sm text-gray-400">
                    Building foundational umpiring skills and learning match procedures.
                  </p>
                </div>

                {/* Intermediate */}
                <div className="bg-slate-700/50 border border-emerald-500/25 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h4 className="text-lg font-bold text-emerald-400">Intermediate</h4>
                      <p className="text-sm text-gray-400">5-9 matches</p>
                    </div>
                    <div className="flex gap-1">
                      <StarIcon className="w-5 h-5 text-amber-400 fill-amber-400" />
                      <StarIcon className="w-5 h-5 text-amber-400 fill-amber-400" />
                      {[...Array(3)].map((_, i) => (
                        <StarIcon key={i} className="w-5 h-5 text-gray-600" />
                      ))}
                    </div>
                  </div>
                  <p className="text-sm text-gray-400">
                    Gaining confidence and developing consistent umpiring standards.
                  </p>
                </div>

                {/* Advanced */}
                <div className="bg-slate-700/50 border border-purple-500/30 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h4 className="text-lg font-bold text-purple-400">Advanced</h4>
                      <p className="text-sm text-gray-400">10-24 matches</p>
                    </div>
                    <div className="flex gap-1">
                      <StarIcon className="w-5 h-5 text-amber-400 fill-amber-400" />
                      <StarIcon className="w-5 h-5 text-amber-400 fill-amber-400" />
                      <StarIcon className="w-5 h-5 text-amber-400 fill-amber-400" />
                      {[...Array(2)].map((_, i) => (
                        <StarIcon key={i} className="w-5 h-5 text-gray-600" />
                      ))}
                    </div>
                  </div>
                  <p className="text-sm text-gray-400">
                    Verified umpire with solid experience and reliable match management.
                  </p>
                </div>

                {/* Expert */}
                <div className="bg-slate-700/50 border border-green-500/30 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h4 className="text-lg font-bold text-green-400">Expert</h4>
                      <p className="text-sm text-gray-400">25-49 matches</p>
                    </div>
                    <div className="flex gap-1">
                      <StarIcon className="w-5 h-5 text-amber-400 fill-amber-400" />
                      <StarIcon className="w-5 h-5 text-amber-400 fill-amber-400" />
                      <StarIcon className="w-5 h-5 text-amber-400 fill-amber-400" />
                      <StarIcon className="w-5 h-5 text-amber-400 fill-amber-400" />
                      <StarIcon className="w-5 h-5 text-gray-600" />
                    </div>
                  </div>
                  <p className="text-sm text-gray-400">
                    Highly experienced umpire trusted for important matches.
                  </p>
                </div>

                {/* Master */}
                <div className="bg-gradient-to-r from-yellow-900/30 to-orange-900/30 border border-yellow-500/30 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h4 className="text-lg font-bold text-yellow-400">Master</h4>
                      <p className="text-sm text-gray-400">50+ matches</p>
                    </div>
                    <div className="flex gap-1">
                      {[...Array(5)].map((_, i) => (
                        <StarIcon key={i} className="w-5 h-5 text-amber-400 fill-amber-400" />
                      ))}
                    </div>
                  </div>
                  <p className="text-sm text-gray-400">
                    Elite umpire with extensive experience and exceptional match control.
                  </p>
                </div>
              </div>

              {/* Current Progress */}
              {stats.historicalMatches > 0 && (
                <div className="mt-6 bg-amber-500/10 border border-amber-500/20 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <TrophyIcon className="w-5 h-5 text-emerald-400" />
                    <h4 className="font-bold text-white">Your Progress</h4>
                  </div>
                  <p className="text-gray-300">
                    You've umpired <span className="font-bold text-emerald-400">{stats.historicalMatches}</span> {stats.historicalMatches === 1 ? 'match' : 'matches'}.
                    {stats.historicalMatches < 5 && ` Complete ${5 - stats.historicalMatches} more to reach Intermediate level!`}
                    {stats.historicalMatches >= 5 && stats.historicalMatches < 10 && ` Complete ${10 - stats.historicalMatches} more to reach Advanced level!`}
                    {stats.historicalMatches >= 10 && stats.historicalMatches < 25 && ` Complete ${25 - stats.historicalMatches} more to reach Expert level!`}
                    {stats.historicalMatches >= 25 && stats.historicalMatches < 50 && ` Complete ${50 - stats.historicalMatches} more to reach Master level!`}
                    {stats.historicalMatches >= 50 && ' You are a Master Umpire! 🏆'}
                  </p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 border-t p-4" style={{ background: '#0d1025', borderColor: 'rgba(255,255,255,0.08)' }}>
              <button
                onClick={() => setShowLevelInfo(false)}
                className="w-full text-white py-3 px-4 rounded-xl font-medium hover:shadow-lg transition-all" style={{ background: 'linear-gradient(135deg, #F59E0B, #D97706)', color: '#0C0900' }}
              >
                Got it!
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


