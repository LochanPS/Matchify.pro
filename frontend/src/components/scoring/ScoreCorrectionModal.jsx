import React, { useState } from 'react';
import { X, AlertTriangle } from 'lucide-react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const ScoreCorrectionModal = ({ matchId, currentScore, onClose, onSuccess }) => {
  const [correctionType, setCorrectionType] = useState('set_score');
  const [details, setDetails] = useState('');
  const [proposedScore, setProposedScore] = useState(JSON.stringify(currentScore, null, 2));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      // Validate JSON
      let parsedScore;
      try {
        parsedScore = JSON.parse(proposedScore);
      } catch (err) {
        setError('Invalid JSON format in proposed score');
        setSubmitting(false);
        return;
      }

      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_URL}/matches/${matchId}/corrections`,
        {
          correctionType,
          details,
          proposedScore: parsedScore,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data.success) {
        alert('✅ Correction request submitted! Admin will review it shortly.');
        if (onSuccess) onSuccess();
        onClose();
      }
    } catch (err) {
      console.error('Error submitting correction:', err);
      setError(err.response?.data?.error || 'Failed to submit correction request');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-6 h-6 text-red-600" />
            <h2 className="text-2xl font-bold text-gray-900">Request Score Correction</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Warning */}
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800">
            <strong>Important:</strong> This request will be sent to an admin for approval.
            The match will continue with the current score until approved.
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Correction Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Correction Type
            </label>
            <select
              value={correctionType}
              onChange={(e) => setCorrectionType(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              <option value="set_score">Set Score Error</option>
              <option value="match_score">Match Score Error</option>
              <option value="undo_multiple">Undo Multiple Points</option>
              <option value="other">Other</option>
            </select>
          </div>

          {/* Details */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              What happened? (Details for admin) *
            </label>
            <textarea
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={4}
              placeholder="Example: Accidentally awarded 3 points to wrong player. Should be 19-17, not 22-17."
              required
            />
            <p className="mt-1 text-xs text-gray-500">
              Be specific about what went wrong and what the correct score should be.
            </p>
          </div>

          {/* Proposed Score */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Proposed Corrected Score (JSON) *
            </label>
            <textarea
              value={proposedScore}
              onChange={(e) => setProposedScore(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg font-mono text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={12}
              required
            />
            <p className="mt-1 text-xs text-gray-500">
              Edit the JSON above to reflect the correct score. Make sure the JSON is valid.
            </p>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50 font-semibold"
            >
              {submitting ? 'Submitting...' : 'Submit for Admin Approval'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ScoreCorrectionModal;
