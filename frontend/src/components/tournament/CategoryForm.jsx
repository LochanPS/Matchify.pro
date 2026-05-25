import { useState, useEffect } from 'react';

const CategoryForm = ({ initialData, onSave, onCancel }) => {
  // Check if this category has registrations (fee is locked)
  const isFeeLocked = initialData && initialData.registrationCount > 0;
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
        tournamentFormat: 'KNOCKOUT',
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
      tournamentFormat: initialData.tournamentFormat || 'KNOCKOUT',
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

  useEffect(() => {
    setFormData(getInitialFormData());
  }, [initialData]);

  const [errors, setErrors] = useState({});

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
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
    if (!validate()) return;
    const scoringFormatString = `${formData.numberOfGames} games to ${formData.pointsPerGame} pts`;
    const cleanData = {
      ...formData,
      name: formData.name.trim(),
      entryFee: Number(formData.entryFee),
      maxParticipants: formData.maxParticipants ? Number(formData.maxParticipants) : null,
      ageGroup: formData.ageGroup.trim() || null,
      tournamentFormat: formData.tournamentFormat,
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
    <form onSubmit={handleSubmit} className="space-y-6 bg-slate-800/50 border border-white/10 rounded-xl p-6">
      <div>
        <h3 className="text-lg font-semibold text-white mb-4">
          {initialData ? 'Edit Category' : 'Add New Category'}
        </h3>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">Category Name *</label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => handleChange('name', e.target.value)}
          placeholder="e.g., Men's Singles Open, Women's Doubles U-19"
          className={`w-full px-4 py-3 bg-slate-700/50 border rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-purple-500 transition-all ${errors.name ? 'border-red-500' : 'border-white/10'}`}
        />
        {errors.name && <p className="text-red-400 text-sm mt-1">{errors.name}</p>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Format *</label>
          <select
            value={formData.format}
            onChange={(e) => handleChange('format', e.target.value)}
            className="w-full px-4 py-3 bg-slate-700/50 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-purple-500 transition-all"
          >
            <option value="singles">Singles</option>
            <option value="doubles">Doubles</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Gender *</label>
          <select
            value={formData.gender}
            onChange={(e) => handleChange('gender', e.target.value)}
            className="w-full px-4 py-3 bg-slate-700/50 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-purple-500 transition-all"
          >
            <option value="OPEN">Neutral</option>
            <option value="MALE">Men's</option>
            <option value="FEMALE">Women's</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Age Group</label>
          <input
            type="text"
            value={formData.ageGroup}
            onChange={(e) => handleChange('ageGroup', e.target.value)}
            placeholder="e.g., U-15, U-19, Open, 35+"
            className="w-full px-4 py-3 bg-slate-700/50 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-purple-500 transition-all"
          />
          <p className="text-xs text-gray-500 mt-1">Optional - Leave empty for open age</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Entry Fee (₹) *
            {isFeeLocked && (
              <span className="ml-2 inline-flex items-center gap-1 px-2 py-1 bg-amber-500/20 text-amber-400 text-xs rounded-full">
                <div className="w-2 h-2 bg-amber-400 rounded-full"></div>
                Locked
              </span>
            )}
          </label>
          <input
            type="number"
            value={formData.entryFee}
            onChange={(e) => handleChange('entryFee', e.target.value)}
            min="0"
            step="1"
            disabled={isFeeLocked}
            className={`w-full px-4 py-3 bg-slate-700/50 border rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-purple-500 transition-all ${
              isFeeLocked 
                ? 'opacity-60 cursor-not-allowed bg-slate-800/50' 
                : errors.entryFee 
                  ? 'border-red-500' 
                  : 'border-white/10'
            }`}
          />
          {errors.entryFee && <p className="text-red-400 text-sm mt-1">{errors.entryFee}</p>}
          {isFeeLocked && (
            <p className="text-amber-400 text-sm mt-1">
              Entry fee cannot be changed because {initialData.registrationCount} player(s) have already registered for this category.
            </p>
          )}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">Max Participants (Draw Size)</label>
        <select
          value={formData.maxParticipants || ''}
          onChange={(e) => handleChange('maxParticipants', e.target.value)}
          className={`w-full px-4 py-3 bg-slate-700/50 border rounded-xl text-white focus:ring-2 focus:ring-purple-500 transition-all ${errors.maxParticipants ? 'border-red-500' : 'border-white/10'}`}
        >
          <option value="">Unlimited</option>
          <option value="2">2 Participants</option>
          <option value="4">4 Participants</option>
          <option value="8">8 Participants</option>
          <option value="16">16 Participants</option>
          <option value="32">32 Participants</option>
          <option value="64">64 Participants</option>
          <option value="128">128 Participants</option>
          <option value="256">256 Participants</option>
          <option value="512">512 Participants</option>
          <option value="1024">1024 Participants</option>
          <option value="2048">2048 Participants</option>
        </select>
        {errors.maxParticipants && <p className="text-red-400 text-sm mt-1">{errors.maxParticipants}</p>}
        <p className="text-xs text-gray-500 mt-1">Select draw size for bracket tournaments</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-emerald-400 mb-3">Tournament Format *</label>
        <div className="grid grid-cols-1 gap-3">
          <button
            type="button"
            onClick={() => handleChange('tournamentFormat', 'KNOCKOUT')}
            className={`p-4 border-2 rounded-xl text-left transition-all ${formData.tournamentFormat === 'KNOCKOUT' ? 'border-amber-500 bg-gradient-to-br from-amber-500/20 to-orange-500/10' : 'border-slate-600 hover:border-slate-500 bg-slate-700/30'}`}
          >
            <div className="flex items-center gap-3 mb-1.5">
              <span className="text-2xl">🏆</span>
              <span className="font-bold text-white">Knockout</span>
            </div>
            <p className="text-sm text-gray-400">Single elimination bracket. Lose once and you're out.</p>
          </button>
          <button
            type="button"
            onClick={() => handleChange('tournamentFormat', 'ROUND_ROBIN')}
            className={`p-4 border-2 rounded-xl text-left transition-all ${formData.tournamentFormat === 'ROUND_ROBIN' ? 'border-cyan-500 bg-gradient-to-br from-cyan-500/20 to-blue-500/10' : 'border-slate-600 hover:border-slate-500 bg-slate-700/30'}`}
          >
            <div className="flex items-center gap-3 mb-1.5">
              <span className="text-2xl">🔄</span>
              <span className="font-bold text-white">Round Robin</span>
            </div>
            <p className="text-sm text-gray-400">Everyone plays everyone. Winner by most wins.</p>
          </button>
          <button
            type="button"
            onClick={() => handleChange('tournamentFormat', 'ROUND_ROBIN_KNOCKOUT')}
            className={`p-4 border-2 rounded-xl text-left transition-all ${formData.tournamentFormat === 'ROUND_ROBIN_KNOCKOUT' ? 'border-purple-500 bg-gradient-to-br from-purple-500/20 to-indigo-500/10' : 'border-slate-600 hover:border-slate-500 bg-slate-700/30'}`}
          >
            <div className="flex items-center gap-3 mb-1.5">
              <span className="text-2xl">⚡</span>
              <span className="font-bold text-white">Round Robin + Knockout</span>
            </div>
            <p className="text-sm text-gray-400">Group stage first, then knockout finals.</p>
          </button>
        </div>
      </div>

      <div className="border-t border-white/10 pt-6">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xl">💰</span>
          <h4 className="text-md font-bold text-amber-400">Cash Prize (Optional)</h4>
        </div>
        <p className="text-sm text-gray-400 mb-4">Add prize money to attract more participants</p>
        <div className="grid grid-cols-1 gap-3">
          <div>
            <label className="block text-sm font-medium text-amber-400 mb-2">🥇 Winner Prize (₹)</label>
            <input type="number" value={formData.prizeWinner} onChange={(e) => handleChange('prizeWinner', e.target.value)} min="0" step="1" placeholder="e.g., 5000" className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-amber-500 transition-all" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'rgba(255,255,255,0.6)' }}>🥈 Runner-up Prize (₹)</label>
            <input type="number" value={formData.prizeRunnerUp} onChange={(e) => handleChange('prizeRunnerUp', e.target.value)} min="0" step="1" placeholder="e.g., 3000" className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-amber-500 transition-all" />
          </div>
          <div>
            <label className="block text-sm font-medium text-orange-400 mb-2">🥉 Semi-finalist Prize (₹)</label>
            <input type="number" value={formData.prizeSemiFinalist} onChange={(e) => handleChange('prizeSemiFinalist', e.target.value)} min="0" step="1" placeholder="e.g., 1000" className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-orange-500 transition-all" />
          </div>
        </div>
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-300 mb-2">Additional Prize Info</label>
          <input type="text" value={formData.prizeDescription} onChange={(e) => handleChange('prizeDescription', e.target.value)} placeholder="e.g., Trophies, medals, certificates..." className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-emerald-500 transition-all" />
          <p className="text-xs text-gray-500 mt-1">Mention any non-cash prizes like trophies, medals, etc.</p>
        </div>
      </div>

      <div className="border-t border-white/10 pt-6">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-xl">🏸</span>
          <h4 className="text-md font-bold text-emerald-400">Scoring Settings</h4>
        </div>
        <div className="grid grid-cols-1 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Number of Games/Sets *</label>
            <input type="number" value={formData.numberOfGames} onChange={(e) => handleChange('numberOfGames', e.target.value)} min="1" max="7" className={`w-full px-4 py-3 bg-slate-700/50 border rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-emerald-500 transition-all ${errors.numberOfGames ? 'border-red-500' : 'border-slate-600'}`} />
            {errors.numberOfGames && <p className="text-red-400 text-sm mt-1">{errors.numberOfGames}</p>}
            <p className="text-xs text-gray-500 mt-1">Best of X games (e.g., 3 for best of 3)</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Points Per Game *</label>
            <input type="number" value={formData.pointsPerGame} onChange={(e) => handleChange('pointsPerGame', e.target.value)} min="1" max="50" className={`w-full px-4 py-3 bg-slate-700/50 border rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-emerald-500 transition-all ${errors.pointsPerGame ? 'border-red-500' : 'border-slate-600'}`} />
            {errors.pointsPerGame && <p className="text-red-400 text-sm mt-1">{errors.pointsPerGame}</p>}
            <p className="text-xs text-gray-500 mt-1">Points to win each game (e.g., 21)</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Win By Points</label>
            <input type="number" value={formData.winByPoints} onChange={(e) => handleChange('winByPoints', e.target.value)} min="0" max="5" className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-emerald-500 transition-all" />
            <p className="text-xs text-gray-500 mt-1">Minimum lead to win (e.g., 2)</p>
          </div>
        </div>
        <div className="mt-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-3">
          <p className="text-sm text-emerald-300">
            <span className="font-medium">Scoring Format Preview:</span> Best of {formData.numberOfGames} games, each game to {formData.pointsPerGame} points{formData.winByPoints > 0 && ` (win by ${formData.winByPoints})`}
          </p>
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
        <button type="button" onClick={onCancel} className="px-6 py-2 border border-white/10 text-gray-300 rounded-xl hover:bg-slate-700/50 transition-colors font-medium">Cancel</button>
        <button type="submit" className="px-6 py-2 rounded-xl text-white font-medium transition-all" style={{ background: 'linear-gradient(135deg, #D97706, #F59E0B)', boxShadow: '0 6px 20px rgba(245,158,11,0.4)' }}>{initialData ? 'Update Category' : 'Add Category'}</button>
      </div>
    </form>
  );
};

export default CategoryForm;

