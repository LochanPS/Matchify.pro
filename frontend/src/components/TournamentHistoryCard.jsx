import { Link } from 'react-router-dom';
import { formatDateIndian } from '../utils/dateFormat';

export default function TournamentHistoryCard({ tournament }) {
  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-green-500/20 text-green-400 border border-green-500/30';
      case 'cancelled': return 'bg-red-500/20 text-red-400 border border-red-500/30';
      case 'ongoing': return 'bg-blue-500/20 text-blue-400 border border-blue-500/30';
      case 'published': return 'bg-purple-500/20 text-purple-400 border border-purple-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border border-gray-500/30';
    }
  };

  return (
    <div className="bg-slate-800/50 backdrop-blur-sm border border-white/10 rounded-2xl hover:shadow-[0_0_30px_rgba(168,85,247,0.2)] hover:border-purple-500/30 transition-all p-6">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-xl font-bold text-white">{tournament.name}</h3>
          <p className="text-gray-400">{tournament.location}</p>
          <p className="text-sm text-gray-500">
            {formatDateIndian(tournament.startDate)} - {formatDateIndian(tournament.endDate)}
          </p>
        </div>
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(tournament.status)}`}>
          {tournament.status}
        </span>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <div className="bg-slate-700/50 border border-white/10 rounded-xl p-3">
          <p className="text-sm text-gray-400">Categories</p>
          <p className="text-2xl font-bold text-white">{tournament.categoriesCount}</p>
        </div>
        <div className="bg-slate-700/50 border border-white/10 rounded-xl p-3">
          <p className="text-sm text-gray-400">Participants</p>
          <p className="text-2xl font-bold text-white">{tournament.totalParticipants}</p>
        </div>
        <div className="bg-slate-700/50 border border-white/10 rounded-xl p-3">
          <p className="text-sm text-gray-400">Matches</p>
          <p className="text-2xl font-bold text-white">{tournament.totalMatches}</p>
        </div>
        <div className="bg-slate-700/50 border border-white/10 rounded-xl p-3">
          <p className="text-sm text-gray-400">Revenue</p>
          <p className="text-2xl font-bold text-emerald-400">₹{tournament.totalRevenue.toLocaleString()}</p>
        </div>
      </div>

      {/* Categories */}
      <div className="mb-4">
        <p className="text-sm font-medium text-gray-300 mb-2">Categories:</p>
        <div className="flex flex-wrap gap-2">
          {tournament.categories.map((cat) => (
            <Link
              key={cat.id}
              to={`/organizer/categories/${cat.id}`}
              className="bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 border border-blue-500/30 px-3 py-1 rounded-full text-sm transition"
            >
              {cat.name} ({cat.participantCount})
            </Link>
          ))}
        </div>
      </div>

      {/* Action Button */}
      <Link
        to={`/organizer/tournaments/${tournament.id}`}
        className="text-purple-400 hover:text-purple-300 text-sm font-medium transition-colors"
      >
        View Details →
      </Link>
    </div>
  );
}
