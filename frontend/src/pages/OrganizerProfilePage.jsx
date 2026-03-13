import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/api';
import VerifiedBadge from '../components/VerifiedBadge';
import {
  UserCircleIcon,
  TrophyIcon,
  UserGroupIcon,
  CurrencyRupeeIcon,
  StarIcon,
  MapPinIcon,
  PhoneIcon,
  EnvelopeIcon,
  CalendarIcon,
  BanknotesIcon,
  CheckCircleIcon,
  ClockIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline';

export default function OrganizerProfilePage() {
  const { id } = useParams();
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrganizerProfile();
  }, [id]);

  const fetchOrganizerProfile = async () => {
    try {
      const organizerId = id || user?.id;
      const response = await api.get(`/organizer/profile/${organizerId}`);
      setProfile(response.data.profile);
    } catch (error) {
      console.error('Error fetching organizer profile:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-gray-400 mt-4 font-medium">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 bg-slate-700/50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-4xl">❌</span>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Profile Not Found</h2>
          <p className="text-gray-400 mb-6">The organizer profile you're looking for doesn't exist.</p>
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-medium hover:shadow-lg transition-all"
          >
            <ArrowLeftIcon className="w-5 h-5" />
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const isOwnProfile = !id || id === user?.id;
  const memberSince = new Date(profile.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Hero Header */}
      <div className="relative bg-gradient-to-r from-slate-900 via-purple-900 to-slate-900 overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 text-white/60 hover:text-white mb-6 transition-colors"
          >
            <ArrowLeftIcon className="w-5 h-5" />
            Back to Dashboard
          </Link>

          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="relative">
              <div className="w-32 h-32 bg-gradient-to-br from-blue-400 via-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center text-5xl font-bold text-white shadow-2xl shadow-indigo-500/30">
                {profile.profilePhoto ? (
                  <img src={profile.profilePhoto} alt={profile.name} className="w-full h-full object-cover rounded-2xl" />
                ) : (
                  profile.name?.charAt(0)?.toUpperCase() || 'O'
                )}
              </div>
              {profile.isVerifiedOrganizer && (
                <div className="absolute -bottom-2 -right-2">
                  <VerifiedBadge type="organizer" size="xl" />
                </div>
              )}
            </div>

            <div className="flex-1 text-center md:text-left">
              <div className="flex items-center gap-3 justify-center md:justify-start mb-2">
                <h1 className="text-4xl font-bold text-white">{profile.name}</h1>
                {profile.isVerifiedOrganizer && (
                  <VerifiedBadge type="organizer" size="lg" showText />
                )}
              </div>
              
              {profile.organizerProfile?.organization && (
                <p className="text-xl text-white/80 mb-3">{profile.organizerProfile.organization}</p>
              )}

              <div className="flex flex-wrap items-center gap-4 text-white/60 text-sm justify-center md:justify-start">
                {profile.email && (
                  <span className="flex items-center gap-1">
                    <EnvelopeIcon className="w-4 h-4" />
                    {profile.email}
                  </span>
                )}
                {profile.phone && (
                  <span className="flex items-center gap-1">
                    <PhoneIcon className="w-4 h-4" />
                    +91 {profile.phone}
                  </span>
                )}
                {(profile.city || profile.state) && (
                  <span className="flex items-center gap-1">
                    <MapPinIcon className="w-4 h-4" />
                    {[profile.city, profile.state].filter(Boolean).join(', ')}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <CalendarIcon className="w-4 h-4" />
                  Member since {memberSince}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 -mt-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-slate-800/50 backdrop-blur-sm border border-white/10 rounded-2xl p-6 hover:border-purple-500/50 transition-all">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg mb-4">
              <TrophyIcon className="w-6 h-6 text-white" />
            </div>
            <p className="text-3xl font-bold text-white">{profile.stats.tournamentsOrganized}</p>
            <p className="text-gray-400 text-sm mt-1">Tournaments Organized</p>
          </div>

          <div className="bg-slate-800/50 backdrop-blur-sm border border-white/10 rounded-2xl p-6 hover:border-purple-500/50 transition-all">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-purple-500 to-violet-600 rounded-xl shadow-lg mb-4">
              <UserGroupIcon className="w-6 h-6 text-white" />
            </div>
            <p className="text-3xl font-bold text-white">{profile.stats.totalParticipants}</p>
            <p className="text-gray-400 text-sm mt-1">Total Participants</p>
          </div>

          <div className="bg-slate-800/50 backdrop-blur-sm border border-white/10 rounded-2xl p-6 hover:border-purple-500/50 transition-all">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl shadow-lg mb-4">
              <CurrencyRupeeIcon className="w-6 h-6 text-white" />
            </div>
            <p className="text-3xl font-bold text-white">₹{profile.stats.totalRevenue}</p>
            <p className="text-gray-400 text-sm mt-1">Total Revenue</p>
          </div>

          <div className="bg-slate-800/50 backdrop-blur-sm border border-white/10 rounded-2xl p-6 hover:border-purple-500/50 transition-all">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl shadow-lg mb-4">
              <StarIcon className="w-6 h-6 text-white" />
            </div>
            <p className="text-3xl font-bold text-white">{profile.organizerProfile?.rating || 'N/A'}</p>
            <p className="text-gray-400 text-sm mt-1">Rating</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Profile Information */}
          <div className="bg-slate-800/50 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center">
                <UserCircleIcon className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-lg font-bold text-white">Profile Information</h3>
            </div>
            
            <div className="space-y-4">
              <div>
                <p className="text-gray-400 text-xs mb-1">Full Name</p>
                <p className="text-white font-medium">{profile.name}</p>
              </div>

              {profile.organizerProfile?.organization && (
                <div>
                  <p className="text-gray-400 text-xs mb-1">Organization</p>
                  <p className="text-white font-medium">{profile.organizerProfile.organization}</p>
                </div>
              )}
              
              {profile.email && (
                <div>
                  <p className="text-gray-400 text-xs mb-1">Email Address</p>
                  <p className="text-white font-medium text-sm break-all">{profile.email}</p>
                </div>
              )}
              
              {profile.phone && (
                <div>
                  <p className="text-gray-400 text-xs mb-1">Phone Number</p>
                  <p className="text-white font-medium">{profile.phone}</p>
                </div>
              )}
              
              {(profile.city || profile.state || profile.country) && (
                <div>
                  <p className="text-gray-400 text-xs mb-1">Location</p>
                  <p className="text-white font-medium">
                    {[profile.city, profile.state, profile.country].filter(Boolean).join(', ')}
                  </p>
                </div>
              )}
              
              <div>
                <p className="text-gray-400 text-xs mb-1">Member Since</p>
                <p className="text-white font-medium">{memberSince}</p>
              </div>

              <div>
                <p className="text-gray-400 text-xs mb-1">Verification Status</p>
                {profile.isVerifiedOrganizer ? (
                  <div className="flex items-center gap-2">
                    <CheckCircleIcon className="w-5 h-5 text-green-400" />
                    <span className="text-green-400 font-medium">Verified Organizer</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <ClockIcon className="w-5 h-5 text-yellow-400" />
                    <span className="text-yellow-400 font-medium">Not Verified</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Financial Information */}
          <div className="bg-slate-800/50 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
                <BanknotesIcon className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-lg font-bold text-white">Financial Overview</h3>
            </div>
            
            <div className="space-y-6">
              <div className="bg-slate-700/50 rounded-xl p-4">
                <p className="text-gray-400 text-sm mb-2">Total Revenue</p>
                <p className="text-3xl font-bold text-emerald-400">₹{profile.stats.totalRevenue}</p>
                <p className="text-gray-500 text-xs mt-1">From all tournaments</p>
              </div>

              <div className="bg-slate-700/50 rounded-xl p-4">
                <p className="text-gray-400 text-sm mb-2">Paid Out</p>
                <p className="text-2xl font-bold text-green-400">₹{profile.stats.paidOut}</p>
                <p className="text-gray-500 text-xs mt-1">Successfully transferred</p>
              </div>

              <div className="bg-slate-700/50 rounded-xl p-4">
                <p className="text-gray-400 text-sm mb-2">Pending Payout</p>
                <p className="text-2xl font-bold text-amber-400">₹{profile.stats.pendingPayout}</p>
                <p className="text-gray-500 text-xs mt-1">Awaiting transfer</p>
              </div>

              {isOwnProfile && profile.organizerProfile?.savedUpiId && (
                <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
                  <p className="text-blue-400 text-sm font-medium mb-2">Saved Payment Details</p>
                  <div className="space-y-2">
                    <div>
                      <p className="text-gray-400 text-xs">UPI ID</p>
                      <p className="text-white text-sm font-mono">{profile.organizerProfile.savedUpiId}</p>
                    </div>
                    {profile.organizerProfile.savedAccountHolder && (
                      <div>
                        <p className="text-gray-400 text-xs">Account Holder</p>
                        <p className="text-white text-sm">{profile.organizerProfile.savedAccountHolder}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        {isOwnProfile && (
          <div className="mt-8 bg-slate-800/50 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
            <h3 className="text-lg font-bold text-white mb-4">Quick Actions</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Link
                to="/tournaments/create"
                className="flex items-center gap-4 p-4 bg-slate-700/30 rounded-xl border border-white/5 hover:border-blue-500/50 transition-all group"
              >
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <TrophyIcon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="font-semibold text-white">Create Tournament</p>
                  <p className="text-sm text-gray-400">Start organizing</p>
                </div>
              </Link>

              <Link
                to="/organizer/history"
                className="flex items-center gap-4 p-4 bg-slate-700/30 rounded-xl border border-white/5 hover:border-green-500/50 transition-all group"
              >
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <CalendarIcon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="font-semibold text-white">View History</p>
                  <p className="text-sm text-gray-400">Past tournaments</p>
                </div>
              </Link>

              <Link
                to="/profile"
                className="flex items-center gap-4 p-4 bg-slate-700/30 rounded-xl border border-white/5 hover:border-purple-500/50 transition-all group"
              >
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-violet-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <UserCircleIcon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="font-semibold text-white">Edit Profile</p>
                  <p className="text-sm text-gray-400">Update details</p>
                </div>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
