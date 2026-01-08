import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { tournamentAPI } from '../api/tournament';
import { registrationAPI } from '../api/registration';
import CategorySelector from '../components/registration/CategorySelector';
import PaymentSummary from '../components/registration/PaymentSummary';
import { ArrowLeftIcon, UserGroupIcon } from '@heroicons/react/24/outline';
import { Loader } from 'lucide-react';

export default function TournamentRegistrationPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [tournament, setTournament] = useState(null);
  const [categories, setCategories] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [partnerEmails, setPartnerEmails] = useState({}); // Changed to object: { categoryId: email }
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchTournamentData();
  }, [id]);

  const fetchTournamentData = async () => {
    try {
      setLoading(true);
      const [tournamentData, categoriesData] = await Promise.all([
        tournamentAPI.getTournament(id),
        tournamentAPI.getCategories(id),
      ]);
      
      setTournament(tournamentData.data);
      setCategories(categoriesData.categories || []);
    } catch (err) {
      console.error('Error fetching tournament:', err);
      setError('Failed to load tournament details');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    try {
      setError('');
      setSubmitting(true);

      // Validation
      if (selectedCategories.length === 0) {
        setError('Please select at least one category');
        return;
      }

      // Check if doubles categories have partner emails
      const doublesCategories = selectedCategories.filter(catId => {
        const cat = categories.find(c => c.id === catId);
        return cat?.format === 'doubles';
      });

      // Validate each doubles category has a partner email
      for (const catId of doublesCategories) {
        const email = partnerEmails[catId];
        if (!email) {
          const cat = categories.find(c => c.id === catId);
          setError(`Partner email is required for ${cat?.name}`);
          return;
        }
        
        // Validate email format
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
          const cat = categories.find(c => c.id === catId);
          setError(`Please enter a valid partner email for ${cat?.name}`);
          return;
        }
      }

      // Create registration data with partner emails per category
      const registrationData = {
        tournamentId: id,
        categoryIds: selectedCategories,
        partnerEmails: partnerEmails, // Send object with categoryId: email mapping
      };

      const response = await registrationAPI.createRegistration(registrationData);

      // Registration created - payment is via QR code
      alert('Registration submitted! ✅\n\nPlease pay via the QR code shown. The organizer will verify your payment.');
      navigate('/registrations');
    } catch (err) {
      console.error('Registration error:', err);
      setError(err.response?.data?.error || 'Registration failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader className="animate-spin h-8 w-8 text-primary-600" />
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Tournament Not Found</h2>
          <button
            onClick={() => navigate('/tournaments')}
            className="text-primary-600 hover:text-primary-700"
          >
            Back to Tournaments
          </button>
        </div>
      </div>
    );
  }

  const selectedDoublesCategories = selectedCategories.filter(catId => {
    const cat = categories.find(c => c.id === catId);
    return cat?.format === 'doubles';
  });

  const handlePartnerEmailChange = (categoryId, email) => {
    setPartnerEmails(prev => ({
      ...prev,
      [categoryId]: email
    }));
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate(`/tournaments/${id}`)}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeftIcon className="h-5 w-5" />
            Back to Tournament
          </button>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Register for Tournament
          </h1>
          <p className="text-lg text-gray-600">{tournament.name}</p>
          <div className="mt-2 flex items-center gap-4 text-sm text-gray-500">
            <span>📍 {tournament.city}, {tournament.state}</span>
            <span>📅 {new Date(tournament.startDate).toLocaleDateString()}</span>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Category Selection */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <CategorySelector
                categories={categories}
                selectedCategories={selectedCategories}
                onSelectionChange={setSelectedCategories}
              />
            </div>

            {/* Partner Email Inputs - One per doubles category */}
            {selectedDoublesCategories.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center gap-2 mb-4">
                  <UserGroupIcon className="h-6 w-6 text-primary-600" />
                  <h3 className="text-lg font-semibold text-gray-900">
                    Partner Details
                  </h3>
                </div>
                <div className="space-y-4">
                  {selectedDoublesCategories.map(catId => {
                    const category = categories.find(c => c.id === catId);
                    return (
                      <div key={catId}>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Partner Email for <span className="text-primary-600">{category?.name}</span>
                          <span className="text-red-500"> *</span>
                        </label>
                        <input
                          type="email"
                          value={partnerEmails[catId] || ''}
                          onChange={(e) => handlePartnerEmailChange(catId, e.target.value)}
                          placeholder="partner@example.com"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                          required
                        />
                        <p className="mt-1 text-xs text-gray-500">
                          Your partner will receive a confirmation email to accept the partnership for this category.
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Payment Summary */}
          <div className="lg:col-span-1">
            <div className="sticky top-6 space-y-6">
              <PaymentSummary
                selectedCategories={selectedCategories}
                categories={categories}
                tournament={tournament}
              />

              {/* Register Button */}
              <button
                onClick={handleRegister}
                disabled={submitting || selectedCategories.length === 0}
                className="w-full btn-primary btn-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader className="animate-spin h-5 w-5" />
                    Processing...
                  </span>
                ) : (
                  'Complete Registration'
                )}
              </button>

              {/* Info Box */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="text-sm font-medium text-blue-900 mb-2">
                  Registration Policy
                </h4>
                <ul className="text-xs text-blue-800 space-y-1">
                  <li>• Pay directly to organizer via QR code</li>
                  <li>• Organizer will verify your payment</li>
                  <li>• Contact organizer for refund requests</li>
                  <li>• Partner must confirm for doubles categories</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
