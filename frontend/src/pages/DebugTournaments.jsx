import { useState, useEffect } from 'react';
import { tournamentAPI } from '../api/tournament';

const DebugTournaments = () => {
  const [apiResponse, setApiResponse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    testAPI();
  }, []);

  const testAPI = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔍 Testing tournament API...');
      
      const params = { page: '1', limit: '12' };
      const response = await tournamentAPI.getTournaments(params);
      
      console.log('✅ API Response:', response);
      setApiResponse(response);
      
    } catch (err) {
      console.error('❌ API Error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-white mb-6">🔍 Debug: Tournament API</h1>
          <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
            <p className="text-gray-400">Testing API connection...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-6">🔍 Debug: Tournament API</h1>
        
        <div className="space-y-6">
          {/* API Status */}
          <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
            <h2 className="text-xl font-bold text-white mb-4">API Status</h2>
            {error ? (
              <div className="bg-red-900/30 border border-red-700 rounded-lg p-4">
                <p className="text-red-400">❌ Error: {error}</p>
              </div>
            ) : (
              <div className="bg-green-900/30 border border-green-700 rounded-lg p-4">
                <p className="text-green-400">✅ API Connection Successful</p>
              </div>
            )}
          </div>

          {/* Raw Response */}
          {apiResponse && (
            <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
              <h2 className="text-xl font-bold text-white mb-4">Raw API Response</h2>
              <pre className="bg-slate-900 rounded-lg p-4 text-gray-300 text-sm overflow-auto">
                {JSON.stringify(apiResponse, null, 2)}
              </pre>
            </div>
          )}

          {/* Parsed Data */}
          {apiResponse?.data?.tournaments && (
            <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
              <h2 className="text-xl font-bold text-white mb-4">
                Tournaments Found: {apiResponse.data.tournaments.length}
              </h2>
              
              {apiResponse.data.tournaments.map((tournament) => (
                <div key={tournament.id} className="bg-slate-700 rounded-lg p-4 mb-4">
                  <h3 className="text-lg font-bold text-white mb-2">{tournament.name}</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-400">Status: <span className="text-white">{tournament.status}</span></p>
                      <p className="text-gray-400">Privacy: <span className="text-white">{tournament.privacy}</span></p>
                      <p className="text-gray-400">Location: <span className="text-white">{tournament.city}, {tournament.state}</span></p>
                    </div>
                    <div>
                      <p className="text-gray-400">Organizer: <span className="text-white">{tournament.organizer?.name}</span></p>
                      <p className="text-gray-400">Categories: <span className="text-white">{tournament.categories?.length || 0}</span></p>
                      <p className="text-gray-400">Registrations: <span className="text-white">{tournament.totalRegistrations}</span></p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination Info */}
          {apiResponse?.data?.pagination && (
            <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
              <h2 className="text-xl font-bold text-white mb-4">Pagination Info</h2>
              <div className="grid grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-gray-400">Total</p>
                  <p className="text-white font-bold">{apiResponse.data.pagination.total}</p>
                </div>
                <div>
                  <p className="text-gray-400">Page</p>
                  <p className="text-white font-bold">{apiResponse.data.pagination.page}</p>
                </div>
                <div>
                  <p className="text-gray-400">Limit</p>
                  <p className="text-white font-bold">{apiResponse.data.pagination.limit}</p>
                </div>
                <div>
                  <p className="text-gray-400">Total Pages</p>
                  <p className="text-white font-bold">{apiResponse.data.pagination.totalPages}</p>
                </div>
              </div>
            </div>
          )}

          {/* Test Button */}
          <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
            <button
              onClick={testAPI}
              className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-3 rounded-lg transition"
            >
              🔄 Test API Again
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DebugTournaments;