import { useState, useEffect } from 'react';
import axios from 'axios';

const LiveMatchFilters = ({ filters, onFilterChange }) => {
  const [tournaments, setTournaments] = useState([]);
  const [courts, setCourts] = useState([]);

  useEffect(() => {
    fetchTournaments();
  }, []);

  const fetchTournaments = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/tournaments`, {
        params: { status: 'ongoing' }
      });
      setTournaments(response.data.tournaments || []);
    } catch (error) {
      console.error('Error fetching tournaments:', error);
    }
  };

  // Generate court numbers (1-20 for now)
  useEffect(() => {
    setCourts(Array.from({ length: 20 }, (_, i) => i + 1));
  }, []);

  return (
    <div className="bg-white rounded-lg shadow-md p-4 space-y-4">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Filters</h3>

      {/* Tournament Filter */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Tournament
        </label>
        <select
          value={filters.tournamentId || ''}
          onChange={(e) => onFilterChange({ ...filters, tournamentId: e.target.value })}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">All Tournaments</option>
          {tournaments.map((tournament) => (
            <option key={tournament.id} value={tournament.id}>
              {tournament.name}
            </option>
          ))}
        </select>
      </div>

      {/* Court Filter */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Court
        </label>
        <select
          value={filters.court || ''}
          onChange={(e) => onFilterChange({ ...filters, court: e.target.value })}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">All Courts</option>
          {courts.map((court) => (
            <option key={court} value={court}>
              Court {court}
            </option>
          ))}
        </select>
      </div>

      {/* Format Filter */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Format
        </label>
        <select
          value={filters.format || ''}
          onChange={(e) => onFilterChange({ ...filters, format: e.target.value })}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">All Formats</option>
          <option value="SINGLES">Singles</option>
          <option value="DOUBLES">Doubles</option>
          <option value="MIXED_DOUBLES">Mixed Doubles</option>
        </select>
      </div>

      {/* Reset Button */}
      <button
        onClick={() => onFilterChange({})}
        className="w-full bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300 transition-colors text-sm font-medium"
      >
        Reset Filters
      </button>
    </div>
  );
};

export default LiveMatchFilters;
