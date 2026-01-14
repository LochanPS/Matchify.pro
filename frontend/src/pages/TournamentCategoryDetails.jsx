import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function TournamentCategoryDetails() {
  const { categoryId } = useParams();
  const navigate = useNavigate();
  const [category, setCategory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchCategoryDetails();
  }, [categoryId]);

  const fetchCategoryDetails = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/organizer/categories/${categoryId}/details`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data.success) {
        setCategory(response.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch category details:', err);
      setError('Failed to load category details');
    } finally {
      setLoading(false);
    }
  };

  const downloadParticipants = () => {
    if (!category) return;

    const csv = [
      ['Name', 'Email', 'Phone', 'City', 'State', 'Partner', 'Registered At'].join(','),
      ...category.participants.map(p => [
        p.player.name,
        p.player.email,
        p.player.phone || '',
        p.player.city || '',
        p.player.state || '',
        p.partner?.name || '-',
        new Date(p.registeredAt).toLocaleDateString()
      ].join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${category.category.name}_participants.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !category) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="text-center py-12">
          <p className="text-red-600 mb-4">{error || 'Category not found'}</p>
          <button
            onClick={() => navigate('/organizer/dashboard')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex justify-between items-start">
          <div>
            <button
              onClick={() => navigate(-1)}
              className="text-blue-600 hover:underline mb-2 text-sm"
            >
              ← Back
            </button>
            <h1 className="text-3xl font-bold mb-2">{category.category.name}</h1>
            <p className="text-gray-600">Tournament: {category.category.tournament.name}</p>
            <p className="text-sm text-gray-500">
              Format: {category.category.format.toUpperCase()} | Entry Fee: ₹{category.category.entryFee}
            </p>
          </div>
          <button
            onClick={downloadParticipants}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition"
          >
            📥 Download CSV
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-600 mb-2">Total Participants</p>
          <p className="text-4xl font-bold">{category.stats.totalParticipants}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-600 mb-2">Total Matches</p>
          <p className="text-4xl font-bold">{category.stats.totalMatches}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-600 mb-2">Completed</p>
          <p className="text-4xl font-bold">{category.stats.completedMatches}</p>
        </div>
      </div>

      {/* Winner */}
      {category.winner && (
        <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">🏆 Winner</h2>
          {Array.isArray(category.winner) ? (
            <div>
              <p className="text-lg font-semibold">{category.winner[0].name} & {category.winner[1].name}</p>
            </div>
          ) : (
            <p className="text-lg font-semibold">{category.winner.name}</p>
          )}
        </div>
      )}

      {/* Participants Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b">
          <h2 className="text-xl font-bold">All Participants ({category.participants.length})</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">#</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                {category.category.format !== 'SINGLES' && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Partner</th>
                )}
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">City</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Registered</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {category.participants.map((participant, index) => (
                <tr key={participant.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {index + 1}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap font-medium">
                    {participant.player.name}
                  </td>
                  {category.category.format !== 'SINGLES' && (
                    <td className="px-6 py-4 whitespace-nowrap">
                      {participant.partner?.name || <span className="text-yellow-600">Pending</span>}
                    </td>
                  )}
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {participant.player.email}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {participant.player.phone || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {participant.player.city}, {participant.player.state}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {new Date(participant.registeredAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
