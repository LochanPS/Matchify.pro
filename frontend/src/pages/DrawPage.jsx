import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { drawAPI } from '../api/draw';
import { tournamentAPI } from '../api/tournament';
import SingleEliminationBracket from '../components/brackets/SingleEliminationBracket';
import CategoryTabs from '../components/tournament/CategoryTabs';
import { useAuth } from '../contexts/AuthContext';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { Loader } from 'lucide-react';

const DrawPage = () => {
  const { tournamentId, categoryId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [tournament, setTournament] = useState(null);
  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState(null);
  const [bracket, setBracket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [generating, setGenerating] = useState(false);

  // Fetch tournament and categories on mount
  useEffect(() => {
    fetchTournamentData();
  }, [tournamentId]);

  // Fetch bracket when category changes
  useEffect(() => {
    if (activeCategory) {
      fetchBracket();
    }
  }, [activeCategory]);

  const fetchTournamentData = async () => {
    try {
      setLoading(true);
      
      // Fetch tournament details
      const tournamentData = await tournamentAPI.getTournament(tournamentId);
      setTournament(tournamentData.data);

      // Fetch categories
      const categoriesData = await tournamentAPI.getCategories(tournamentId);
      const cats = categoriesData.categories || [];
      setCategories(cats);

      // Set active category (from URL or first category)
      const active = categoryId
        ? cats.find(c => c.id === categoryId)
        : cats[0];
      
      if (active) {
        setActiveCategory(active);
      } else if (cats.length > 0) {
        setActiveCategory(cats[0]);
      }
    } catch (err) {
      console.error('Error fetching tournament data:', err);
      setError('Failed to load tournament data');
    } finally {
      setLoading(false);
    }
  };

  const fetchBracket = async () => {
    if (!activeCategory) return;

    setLoading(true);
    setError(null);

    try {
      const data = await drawAPI.getBracket(tournamentId, activeCategory.id);
      setBracket(data.bracket);
    } catch (err) {
      console.error('Error fetching bracket:', err);
      if (err.response?.status === 404) {
        setError(null); // Draw not generated yet, not an error
        setBracket(null);
      } else {
        setError('Failed to load bracket');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateDraw = async () => {
    if (!window.confirm('Generate draw for this category? This cannot be undone.')) {
      return;
    }

    setGenerating(true);
    try {
      await drawAPI.generateDraw(tournamentId, activeCategory.id);
      alert('✅ Draw generated successfully!');
      
      // Refresh data
      await fetchTournamentData();
      await fetchBracket();
    } catch (err) {
      console.error('Error generating draw:', err);
      alert(err.response?.data?.error || 'Failed to generate draw');
    } finally {
      setGenerating(false);
    }
  };

  const handleMatchClick = (match) => {
    // Navigate to match details page (to be built later)
    console.log('Match clicked:', match);
    // navigate(`/matches/${match.id}`);
  };

  const handleCategoryChange = (category) => {
    setActiveCategory(category);
    navigate(`/tournaments/${tournamentId}/draws/${category.id}`);
  };

  if (loading && !tournament) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <Loader className="animate-spin h-12 w-12 text-primary-600" />
      </div>
    );
  }

  if (error && !bracket) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => navigate(`/tournaments/${tournamentId}`)}
            className="text-primary-600 hover:text-primary-700"
          >
            Back to Tournament
          </button>
        </div>
      </div>
    );
  }

  const isOrganizer = user?.role === 'ORGANIZER' && tournament?.organizerId === user?.id;
  const drawNotGenerated = !bracket && activeCategory;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <button
                onClick={() => navigate(`/tournaments/${tournamentId}`)}
                className="text-primary-600 hover:text-primary-700 mb-2 flex items-center gap-1 font-medium"
              >
                <ArrowLeftIcon className="h-4 w-4" />
                Back to Tournament
              </button>
              <h1 className="text-3xl font-bold text-gray-900">
                {tournament?.name} - Draw
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                View brackets and match progression
              </p>
            </div>

            {/* Generate Draw Button (Organizer only) */}
            {isOrganizer && drawNotGenerated && (
              <button
                onClick={handleGenerateDraw}
                disabled={generating}
                className="bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium transition-colors"
              >
                {generating ? (
                  <span className="flex items-center gap-2">
                    <Loader className="animate-spin h-5 w-5" />
                    Generating...
                  </span>
                ) : (
                  '⚡ Generate Draw'
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Category Tabs */}
      {categories.length > 0 && (
        <CategoryTabs
          categories={categories}
          activeCategory={activeCategory}
          onCategoryChange={handleCategoryChange}
        />
      )}

      {/* Content */}
      <div className="max-w-full mx-auto py-8">
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <Loader className="animate-spin h-12 w-12 text-primary-600" />
          </div>
        ) : drawNotGenerated ? (
          <div className="mx-8 text-center py-20">
            <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-8 inline-block max-w-md">
              <div className="text-5xl mb-4">📋</div>
              <p className="text-yellow-800 font-semibold text-lg mb-2">
                Draw Not Generated Yet
              </p>
              <p className="text-yellow-700 text-sm">
                {isOrganizer
                  ? 'Click the "Generate Draw" button above to create the bracket for this category.'
                  : 'The organizer hasn\'t generated the draw for this category yet.'}
              </p>
            </div>
          </div>
        ) : !bracket ? (
          <div className="mx-8 text-center py-20">
            <p className="text-gray-500">No bracket data available.</p>
          </div>
        ) : (
          <SingleEliminationBracket
            bracket={bracket}
            onMatchClick={handleMatchClick}
          />
        )}
      </div>
    </div>
  );
};

export default DrawPage;
