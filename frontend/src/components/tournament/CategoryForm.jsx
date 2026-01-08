import { useState, useEffect } from 'react';

const CategoryForm = ({ initialData, onSave, onCancel }) => {
  // Parse scoring format from string like "3 games to 21 pts" or "21x3"
  const parseScoringFormat = (scoringFormat) => {
    if (!scoringFormat) return { numberOfGames: 3, pointsPerGame: 21 };
    
    // Try parsing "3 games to 21 pts" format
    const match1 = scoringFormat.match(/(\d+)\s*games?\s*to\s*(\d+)/i);
    if (match1) {
      return { numberOfGames: parseInt(match1[1]), pointsPerGame: parseInt(match1[2]) };
    }
    
    // Try parsing "21x3" format
    const match2 = scoringFormat.match(/(\d+)x(\d+)/);
    if (match2) {
      return { numberOfGames: parseInt(match2[2]), pointsPerGame: parseInt(match2[1]) };
    }
    
    return { numberOfGames: 3, pointsPerGame: 21 };
  };

  // Convert database gender to form gender
  const convertGenderToForm = (gender) => {
    if (!gender) return 'OPEN';
    const g = gender.toLowerCase();
    if (g === 'men' || g === 'male') return 'MALE';
    if (g === 'women' || g === 'female') return 'FEMALE';
    return 'OPEN';
  };

  // Initialize form data
  const getInitialFormData = () => {
    if (!initialData) {
      return {
        name: '',
        format: 'singles',
        gender: 'OPEN',
        ageGroup: '',
        entryFee: 0,
        maxParticipants: '',
        scoringFormat: 'custom',
        pointsPerGame: 21,
        numberOfGames: 3,
        winByPoints: 2,
        prizeWinner: '',
        prizeRunnerUp: '',
        prizeSemiFinalist: '',
        prizeDescription: '',
      };
    }

    const scoring = parseScoringFormat(initialData.scoringFormat);
    
    return {
      name: initialData.name || '',
      format: initialData.format || 'singles',
      gender: convertGenderToForm(initialData.gender),
      ageGroup: initialData.ageGroup || '',
      entryFee: initialData.entryFee || 0,
      maxParticipants: initialData.maxParticipants || '',
      scoringFormat: initialData.scoringFormat || 'custom',
      pointsPerGame: scoring.pointsPerGame,
      numberOfGames: scoring.numberOfGames,
      winByPoints: 2,
      prizeWinner: initialData.prizeWinner || '',
      prizeRunnerUp: initialData.prizeRunnerUp || '',
      prizeSemiFinalist: initialData.prizeSemiFinalist || '',
      prizeDescription: initialData.prizeDescription || '',
    };
  };

  const [formData, setFormData] = useState(getInitialFormData);

  // Reset form when initialData changes
  useEffect(() => {
    setFormData(getInitialFormData());
  }, [initialData]);

  const [errors, setErrors] = useState({});

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.name || formData.name.trim().length < 3) {
      newErrors.name = 'Category name must be at least 3 characters';
    }

    if (formData.entryFee < 0) {
      newErrors.entryFee = 'Entry fee cannot be negative';
    }

    if (formData.maxParticipants && formData.maxParticipants < 2) {
      newErrors.maxParticipants = 'Must allow at least 2 participants';
    }

    if (formData.pointsPerGame < 1 || formData.pointsPerGame > 50) {
      newErrors.pointsPerGame = 'Points must be between 1 and 50';
    }

    if (formData.numberOfGames < 1 || formData.numberOfGames > 7) {
      newErrors.numberOfGames = 'Number of games must be between 1 and 7';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validate()) {
      return;
    }

    // Build scoring format string
    const scoringFormatString = `${formData.numberOfGames} games to ${formData.pointsPerGame} pts`;

    // Clean up data
    const cleanData = {
      ...formData,
      name: formData.name.trim(),
      entryFee: Number(formData.entryFee),
      maxParticipants: formData.maxParticipants ? Number(formData.maxParticipants) : null,
      ageGroup: formData.ageGroup.trim() || null,
      scoringFormat: scoringFormatString,
      pointsPerGame: Number(formData.pointsPerGame),
      numberOfGames: Number(formData.numberOfGames),
      winByPoints: Number(formData.winByPoints),
      prizeWinner: formData.prizeWinner ? Number(formData.prizeWinner) : null,
      prizeRunnerUp: formData.prizeRunnerUp ? Number(formData.prizeRunnerUp) : null,
      prizeSemiFinalist: formData.prizeSemiFinalist ? Number(formData.prizeSemiFinalist) : null,
      prizeDescription: formData.prizeDescription?.trim() || null,
    };

    onSave(cleanData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-white border border-gray-200 rounded-lg p-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          {initialData ? 'Edit Category' : 'Add New Category'}
        </h3>
      </div>

      {/* Category Name */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Category Name *
        </label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => handleChange('name', e.target.value)}
          placeholder="e.g., Men's Singles Open, Women's Doubles U-19"
          className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
            errors.name ? 'border-red-500' : 'border-gray-300'
          }`}
        />
        {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
      </div>

      {/* Format and Gender */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Format *
          </label>
          <select
            value={formData.format}
            onChange={(e) => handleChange('format', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="singles">Singles</option>
            <option value="doubles">Doubles</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Gender *
          </label>
          <select
            value={formData.gender}
            onChange={(e) => handleChange('gender', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="OPEN">Open (All)</option>
            <option value="MALE">Male</option>
            <option value="FEMALE">Female</option>
          </select>
        </div>
      </div>

      {/* Age Group and Entry Fee */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Age Group
          </label>
          <input
            type="text"
            value={formData.ageGroup}
            onChange={(e) => handleChange('ageGroup', e.target.value)}
            placeholder="e.g., U-15, U-19, Open, 35+"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <p className="text-xs text-gray-500 mt-1">Optional - Leave empty for open age</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Entry Fee (₹) *
          </label>
          <input
            type="number"
            value={formData.entryFee}
            onChange={(e) => handleChange('entryFee', e.target.value)}
            min="0"
            step="1"
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              errors.entryFee ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.entryFee && <p className="text-red-500 text-sm mt-1">{errors.entryFee}</p>}
        </div>
      </div>

      {/* Max Participants */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Max Participants
        </label>
        <input
          type="number"
          value={formData.maxParticipants}
          onChange={(e) => handleChange('maxParticipants', e.target.value)}
          min="2"
          step="1"
          placeholder="Leave empty for unlimited"
          className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
            errors.maxParticipants ? 'border-red-500' : 'border-gray-300'
          }`}
        />
        {errors.maxParticipants && <p className="text-red-500 text-sm mt-1">{errors.maxParticipants}</p>}
        <p className="text-xs text-gray-500 mt-1">Optional - Limit registrations</p>
      </div>

      {/* Cash Prize Section */}
      <div className="border-t pt-6">
        <h4 className="text-md font-semibold text-gray-900 mb-2">💰 Cash Prize (Optional)</h4>
        <p className="text-sm text-gray-500 mb-4">Add prize money to attract more participants</p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              🥇 Winner Prize (₹)
            </label>
            <input
              type="number"
              value={formData.prizeWinner}
              onChange={(e) => handleChange('prizeWinner', e.target.value)}
              min="0"
              step="100"
              placeholder="e.g., 5000"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              🥈 Runner-up Prize (₹)
            </label>
            <input
              type="number"
              value={formData.prizeRunnerUp}
              onChange={(e) => handleChange('prizeRunnerUp', e.target.value)}
              min="0"
              step="100"
              placeholder="e.g., 3000"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              🥉 Semi-finalist Prize (₹)
            </label>
            <input
              type="number"
              value={formData.prizeSemiFinalist}
              onChange={(e) => handleChange('prizeSemiFinalist', e.target.value)}
              min="0"
              step="100"
              placeholder="e.g., 1000"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Additional Prize Info
          </label>
          <input
            type="text"
            value={formData.prizeDescription}
            onChange={(e) => handleChange('prizeDescription', e.target.value)}
            placeholder="e.g., Trophies, medals, certificates, sponsored gifts..."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <p className="text-xs text-gray-500 mt-1">Mention any non-cash prizes like trophies, medals, etc.</p>
        </div>

        {/* Prize Preview */}
        {(formData.prizeWinner || formData.prizeRunnerUp || formData.prizeSemiFinalist || formData.prizeDescription) && (
          <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-sm font-medium text-green-800 mb-2">Prize Preview:</p>
            <div className="flex flex-wrap gap-3 text-sm text-green-700">
              {formData.prizeWinner && <span>🥇 Winner: ₹{formData.prizeWinner}</span>}
              {formData.prizeRunnerUp && <span>🥈 Runner-up: ₹{formData.prizeRunnerUp}</span>}
              {formData.prizeSemiFinalist && <span>🥉 Semi-finalist: ₹{formData.prizeSemiFinalist}</span>}
            </div>
            {formData.prizeDescription && (
              <p className="text-sm text-green-600 mt-2">+ {formData.prizeDescription}</p>
            )}
          </div>
        )}
      </div>

      {/* Scoring Settings */}
      <div className="border-t pt-6">
        <h4 className="text-md font-semibold text-gray-900 mb-4">🏸 Scoring Settings</h4>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Number of Games/Sets *
            </label>
            <input
              type="number"
              value={formData.numberOfGames}
              onChange={(e) => handleChange('numberOfGames', e.target.value)}
              min="1"
              max="7"
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.numberOfGames ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.numberOfGames && <p className="text-red-500 text-sm mt-1">{errors.numberOfGames}</p>}
            <p className="text-xs text-gray-500 mt-1">Best of X games (e.g., 3 for best of 3)</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Points Per Game *
            </label>
            <input
              type="number"
              value={formData.pointsPerGame}
              onChange={(e) => handleChange('pointsPerGame', e.target.value)}
              min="1"
              max="50"
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.pointsPerGame ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.pointsPerGame && <p className="text-red-500 text-sm mt-1">{errors.pointsPerGame}</p>}
            <p className="text-xs text-gray-500 mt-1">Points to win each game (e.g., 21)</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Win By Points
            </label>
            <input
              type="number"
              value={formData.winByPoints}
              onChange={(e) => handleChange('winByPoints', e.target.value)}
              min="0"
              max="5"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-1">Minimum lead to win (e.g., 2)</p>
          </div>
        </div>

        {/* Scoring Preview */}
        <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            <span className="font-medium">Scoring Format Preview:</span>{' '}
            Best of {formData.numberOfGames} games, each game to {formData.pointsPerGame} points
            {formData.winByPoints > 0 && ` (win by ${formData.winByPoints})`}
          </p>
        </div>

        {/* Quick Presets */}
        <div className="mt-4">
          <p className="text-sm font-medium text-gray-700 mb-2">Quick Presets:</p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                handleChange('numberOfGames', 3);
                handleChange('pointsPerGame', 21);
                handleChange('winByPoints', 2);
              }}
              className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
            >
              Standard (3×21)
            </button>
            <button
              type="button"
              onClick={() => {
                handleChange('numberOfGames', 1);
                handleChange('pointsPerGame', 21);
                handleChange('winByPoints', 2);
              }}
              className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
            >
              Single Game (1×21)
            </button>
            <button
              type="button"
              onClick={() => {
                handleChange('numberOfGames', 1);
                handleChange('pointsPerGame', 15);
                handleChange('winByPoints', 0);
              }}
              className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
            >
              Quick Match (1×15)
            </button>
            <button
              type="button"
              onClick={() => {
                handleChange('numberOfGames', 5);
                handleChange('pointsPerGame', 11);
                handleChange('winByPoints', 2);
              }}
              className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
            >
              Table Tennis Style (5×11)
            </button>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end gap-3 pt-4 border-t">
        <button
          type="button"
          onClick={onCancel}
          className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          {initialData ? 'Update Category' : 'Add Category'}
        </button>
      </div>
    </form>
  );
};

export default CategoryForm;