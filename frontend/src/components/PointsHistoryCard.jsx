import React from 'react';
import { Trophy, Calendar, Award } from 'lucide-react';

const PointsHistoryCard = ({ log }) => {
  const getReasonBadge = (reason) => {
    const badges = {
      'Winner': 'bg-green-100 text-green-800',
      'Runner-up': 'bg-blue-100 text-blue-800',
      'Semi-finalist': 'bg-yellow-100 text-yellow-800',
      'Quarter-finalist': 'bg-orange-100 text-orange-800',
      'Participation': 'bg-gray-100 text-gray-800'
    };
    return badges[reason] || 'bg-purple-100 text-purple-800';
  };

  return (
    <div className="bg-white rounded-lg shadow hover:shadow-lg transition p-6 border-l-4 border-blue-500">
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-bold text-gray-900 mb-1">
            {log.tournament_name}
          </h3>
          <p className="text-sm text-gray-600 mb-2">{log.category_name}</p>
          
          <div className="flex items-center space-x-2 text-xs text-gray-500">
            <Calendar className="w-4 h-4" />
            <span>{new Date(log.earned_at).toLocaleDateString('en-IN')}</span>
          </div>
        </div>

        <div className="text-right">
          <p className="text-3xl font-bold text-blue-600">
            +{log.points.toFixed(1)}
          </p>
          <p className="text-xs text-gray-500">Points</p>
        </div>
      </div>

      <div className="flex items-center justify-between pt-4 border-t">
        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getReasonBadge(log.reason)}`}>
          {log.reason}
        </span>

        {log.multiplier > 1 && (
          <span className="text-xs font-semibold text-purple-600">
            {log.multiplier}x Multiplier
          </span>
        )}
      </div>

      {log.description && (
        <p className="mt-3 text-sm text-gray-600 italic">
          {log.description}
        </p>
      )}
    </div>
  );
};

export default PointsHistoryCard;
