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
      color: 'bg-yellow-100 text-yellow-600',
    },
    {
      icon: Target,
      label: 'Matches Won',
      value: user?.matchesWon || 0,
      color: 'bg-green-100 text-green-600',
    },
    {
      icon: Award,
      label: 'Matches Lost',
      value: user?.matchesLost || 0,
      color: 'bg-red-100 text-red-600',
    },
    {
      icon: TrendingUp,
      label: 'Total Points',
      value: user?.totalPoints || 0,
      color: 'bg-blue-100 text-blue-600',
    },
    {
      icon: RupeeIcon,
      label: 'Wallet Balance',
      value: `₹${user?.walletBalance || 0}`,
      color: 'bg-purple-100 text-purple-600',
    },
    {
      icon: Calendar,
      label: 'Member Since',
      value: formatDate(user?.createdAt),
      color: 'bg-indigo-100 text-indigo-600',
    },
  ];

  // Calculate win rate
  const totalMatches = (user?.matchesWon || 0) + (user?.matchesLost || 0);
  const winRate = totalMatches > 0 ? Math.round((user?.matchesWon / totalMatches) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Win Rate Highlight */}
      {totalMatches > 0 && (
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg p-6 text-center">
          <h3 className="text-lg font-semibold mb-2">Win Rate</h3>
          <div className="text-4xl font-bold">{winRate}%</div>
          <p className="text-blue-100">Based on {totalMatches} matches played</p>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {statCards.map((stat, idx) => (
          <div key={idx} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
            <div className={`inline-flex p-3 rounded-lg ${stat.color} mb-3`}>
              <stat.icon size={24} />
            </div>
            <p className="text-2xl font-bold text-gray-800">{stat.value}</p>
            <p className="text-sm text-gray-600">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Additional Info for New Users */}
      {totalMatches === 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
          <Trophy className="mx-auto text-blue-500 mb-3" size={48} />
          <h3 className="text-lg font-semibold text-blue-900 mb-2">Ready to Start Playing?</h3>
          <p className="text-blue-700">
            Join your first tournament to start building your badminton profile and earn points!
          </p>
        </div>
      )}
    </div>
  );
}