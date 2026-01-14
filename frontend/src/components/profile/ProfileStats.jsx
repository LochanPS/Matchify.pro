import { Trophy, Calendar, Target, TrendingUp, Award } from 'lucide-react';

// Custom Rupee Icon component
const RupeeIcon = ({ size = 24 }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
  >
    <path d="M6 3h12M6 8h12M6 13l8.5 8M6 13h3c3.5 0 6-2.5 6-5H6" />
  </svg>
);

export default function ProfileStats({ stats, user }) {
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short'
    });
  };

  const statCards = [
    {
      icon: Trophy,
      label: 'Tournaments',
      value: user?.tournamentsPlayed || 0,
      color: 'bg-amber-500/20 text-amber-400',
      glow: 'group-hover:shadow-amber-500/20',
    },
    {
      icon: Target,
      label: 'Matches Won',
      value: user?.matchesWon || 0,
      color: 'bg-emerald-500/20 text-emerald-400',
      glow: 'group-hover:shadow-emerald-500/20',
    },
    {
      icon: Award,
      label: 'Matches Lost',
      value: user?.matchesLost || 0,
      color: 'bg-red-500/20 text-red-400',
      glow: 'group-hover:shadow-red-500/20',
    },
    {
      icon: TrendingUp,
      label: 'Total Points',
      value: user?.totalPoints || 0,
      color: 'bg-blue-500/20 text-blue-400',
      glow: 'group-hover:shadow-blue-500/20',
    },
    {
      icon: RupeeIcon,
      label: 'Wallet Balance',
      value: `₹${user?.walletBalance || 0}`,
      color: 'bg-purple-500/20 text-purple-400',
      glow: 'group-hover:shadow-purple-500/20',
    },
    {
      icon: Calendar,
      label: 'Member Since',
      value: formatDate(user?.createdAt),
      color: 'bg-indigo-500/20 text-indigo-400',
      glow: 'group-hover:shadow-indigo-500/20',
    },
  ];

  // Calculate win rate
  const totalMatches = (user?.matchesWon || 0) + (user?.matchesLost || 0);
  const winRate = totalMatches > 0 ? Math.round((user?.matchesWon / totalMatches) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Win Rate Highlight */}
      {totalMatches > 0 && (
        <div className="relative">
          {/* Halo Effect */}
          <div className="absolute -inset-1 bg-gradient-to-r from-purple-500/30 via-indigo-500/30 to-purple-500/30 rounded-2xl blur-xl"></div>
          <div className="relative bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-2xl p-6 text-center border border-white/10">
            <h3 className="text-lg font-semibold mb-2 text-white/90">Win Rate</h3>
            <div className="text-5xl font-bold bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">{winRate}%</div>
            <p className="text-purple-200 mt-2">Based on {totalMatches} matches played</p>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {statCards.map((stat, idx) => (
          <div 
            key={idx} 
            className={`group bg-slate-800/50 backdrop-blur-sm border border-white/10 rounded-2xl p-5 hover:border-white/20 hover:shadow-lg ${stat.glow} transition-all duration-300`}
          >
            <div className={`inline-flex p-3 rounded-xl ${stat.color} mb-3`}>
              <stat.icon size={22} />
            </div>
            <p className="text-2xl font-bold text-white">{stat.value}</p>
            <p className="text-sm text-gray-400">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Additional Info for New Users */}
      {totalMatches === 0 && (
        <div className="relative">
          {/* Halo Effect */}
          <div className="absolute -inset-1 bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-blue-500/20 rounded-2xl blur-xl"></div>
          <div className="relative bg-slate-800/50 backdrop-blur-sm border border-blue-500/30 rounded-2xl p-6 text-center">
            <div className="w-16 h-16 mx-auto bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mb-4">
              <Trophy className="text-white" size={32} />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Ready to Start Playing?</h3>
            <p className="text-gray-400">
              Join your first tournament to start building your badminton profile and earn points!
            </p>
          </div>
        </div>
      )}
    </div>
  );
}