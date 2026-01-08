import { Link } from 'react-router-dom';
import { formatDateIndian } from '../utils/dateFormat';

export default function TournamentHistoryCard({ tournament }) {
  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'ongoing': return 'bg-blue-100 text-blue-800';
      case 'published': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow hover:shadow-lg transition p-6">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-xl font-bold">{tournament.name}</h3>
          <p className="text-gray-600">{tournament.location}</p>
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
        <div className="bg-gray-50 rounded-lg p-3">
          <p className="text-sm text-gray-600">Categories</p>
          <p className="text-2xl font-bold">{tournament.categoriesCount}</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-3">
          <p className="text-sm text-gray-600">Participants</p>
          <p className="text-2xl font-bold">{tournament.totalParticipants}</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-3">
          <p className="text-sm text-gray-600">Matches</p>
          <p className="text-2xl font-bold">{tournament.totalMatches}</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-3">
          <p className="text-sm text-gray-600">Revenue</p>
          <p className="text-2xl font-bold">₹{tournament.totalRevenue.toLocaleString()}</p>
        </div>
      </div>

      {/* Categories */}
      <div className="mb-4">
        <p className="text-sm font-medium mb-2">Categories:</p>
        <div className="flex flex-wrap gap-2">
          {tournament.categories.map((cat) => (
            <Link
              key={cat.id}
              to={`/organizer/categories/${cat.id}`}
              className="bg-blue-50 hover:bg-blue-100 px-3 py-1 rounded-full text-sm transition"
            >
              {cat.name} ({cat.participantCount})
            </Link>
          ))}
        </div>
      </div>

      {/* Action Button */}
      <Link
        to={`/organizer/tournaments/${tournament.id}`}
        className="text-blue-600 hover:underline text-sm font-medium"
      >
        View Details →
      </Link>
    </div>
  );
}
