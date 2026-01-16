import { useState, useEffect } from 'react';
import { Search, MapPin, Phone, Mail, Globe, Star, Users, Award, Filter, X, Calendar } from 'lucide-react';
import api from '../api/axios';

const SearchAcademiesPage = () => {
  const [academies, setAcademies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedSport, setSelectedSport] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [cities] = useState(['Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Hyderabad', 'Pune', 'Kolkata']);
  const [sports] = useState(['Badminton', 'Tennis', 'Table Tennis', 'Squash']);

  useEffect(() => {
    fetchAcademies();
  }, []);

  const fetchAcademies = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      if (selectedCity) params.append('city', selectedCity);
      if (selectedSport) params.append('sport', selectedSport);
      
      const response = await api.get(`/academies?${params.toString()}`);
      if (response.data.success) {
        setAcademies(response.data.data.academies || []);
      }
    } catch (error) {
      console.error('Error fetching academies:', error);
      setAcademies([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    fetchAcademies();
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCity('');
    setSelectedSport('');
  };

  const filteredAcademies = academies.filter(academy => {
    const matchesSearch = !searchQuery || 
      academy.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      academy.city?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCity = !selectedCity || academy.city === selectedCity;
    const matchesSport = !selectedSport || academy.sports?.includes(selectedSport);
    return matchesSearch && matchesCity && matchesSport;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header Section */}
      <div className="pt-12 pb-8 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-3">
            Discover Academies
          </h1>
          <p className="text-gray-400 text-lg">
            Find and connect with badminton academies near you
          </p>
        </div>
      </div>

      {/* Search Section */}
      <div className="max-w-4xl mx-auto px-4 mb-8">
        <div className="flex items-center gap-3 bg-[#1a1f2e] rounded-xl p-2 border border-gray-700/50">
          <div className="flex-1 flex items-center gap-3 px-3">
            <Search className="w-5 h-5 text-gray-500" />
            <input
              type="text"
              placeholder="Search academies by name, city..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="w-full bg-transparent text-white placeholder-gray-500 focus:outline-none py-2"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg transition-all ${
              showFilters ? 'bg-gray-700 text-white' : 'bg-transparent text-gray-400 hover:text-white'
            }`}
          >
            <Filter className="w-4 h-4" />
            Filters
          </button>
          <button
            onClick={handleSearch}
            className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-lg transition-all"
          >
            Search
          </button>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="mt-4 p-4 bg-[#1a1f2e] rounded-xl border border-gray-700/50">
            <div className="flex flex-wrap gap-4 items-end">
              <div className="flex-1 min-w-[180px]">
                <label className="block text-sm text-gray-400 mb-2">City</label>
                <select
                  value={selectedCity}
                  onChange={(e) => setSelectedCity(e.target.value)}
                  className="w-full px-4 py-2.5 bg-[#0f1419] text-white rounded-lg border border-gray-700 focus:outline-none focus:border-emerald-500"
                >
                  <option value="">All Cities</option>
                  {cities.map(city => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </select>
              </div>
              <div className="flex-1 min-w-[180px]">
                <label className="block text-sm text-gray-400 mb-2">Sport</label>
                <select
                  value={selectedSport}
                  onChange={(e) => setSelectedSport(e.target.value)}
                  className="w-full px-4 py-2.5 bg-[#0f1419] text-white rounded-lg border border-gray-700 focus:outline-none focus:border-emerald-500"
                >
                  <option value="">All Sports</option>
                  {sports.map(sport => (
                    <option key={sport} value={sport}>{sport}</option>
                  ))}
                </select>
              </div>
              <button
                onClick={clearFilters}
                className="flex items-center gap-2 px-4 py-2.5 text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
                Clear
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Results Count */}
      <div className="max-w-6xl mx-auto px-4 mb-6">
        <p className="text-gray-400">
          Found <span className="text-emerald-400 font-semibold">{filteredAcademies.length}</span> academies
        </p>
      </div>

      {/* Academies Grid */}
      <div className="max-w-6xl mx-auto px-4 pb-16">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-[#1a1f2e] rounded-2xl overflow-hidden animate-pulse">
                <div className="h-44 bg-gray-700/50"></div>
                <div className="p-5">
                  <div className="h-5 bg-gray-700/50 rounded w-3/4 mb-3"></div>
                  <div className="h-4 bg-gray-700/50 rounded w-1/2 mb-2"></div>
                  <div className="h-4 bg-gray-700/50 rounded w-2/3"></div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredAcademies.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-20 h-20 mx-auto mb-6 bg-[#1a1f2e] rounded-full flex items-center justify-center">
              <Award className="w-10 h-10 text-gray-600" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">No Academies Yet</h3>
            <p className="text-gray-400 mb-2">Academies will appear here once they register</p>
            <p className="text-gray-500 text-sm">Check back soon!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAcademies.map((academy, index) => (
              <AcademyCard key={academy.id} academy={academy} index={index} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const AcademyCard = ({ academy, index }) => {
  // Gradient backgrounds matching the tournament cards
  const gradients = [
    'bg-gradient-to-br from-purple-600 via-purple-500 to-indigo-600',
    'bg-gradient-to-br from-teal-500 via-emerald-500 to-green-500',
    'bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500',
  ];
  const gradient = gradients[index % gradients.length];

  return (
    <div className="bg-[#1a1f2e] rounded-2xl overflow-hidden hover:ring-2 hover:ring-emerald-500/50 transition-all duration-300 group">
      {/* Card Header with Gradient */}
      <div className={`relative h-44 ${gradient} p-5`}>
        {/* Verified Badge */}
        {academy.isVerified && (
          <div className="absolute top-4 right-4">
            <span className="px-3 py-1 bg-emerald-500 text-white text-xs font-semibold rounded-full">
              Verified
            </span>
          </div>
        )}
        
        {/* Shuttlecock Icon */}
        <div className="absolute inset-0 flex items-center justify-center opacity-20">
          <svg className="w-24 h-24 text-white" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
          </svg>
        </div>

        {/* Sports Tag */}
        <div className="absolute bottom-4 left-4">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-black/30 backdrop-blur-sm text-white text-xs font-medium rounded-full">
            <span className="text-yellow-400">⚡</span>
            {academy.sports?.join(' & ') || 'Badminton'}
          </span>
        </div>
      </div>

      {/* Card Content */}
      <div className="p-5">
        {/* Academy Name */}
        <h3 className="text-lg font-bold text-white mb-3 group-hover:text-emerald-400 transition-colors">
          {academy.name}
        </h3>

        {/* Location */}
        <div className="flex items-center gap-2 text-gray-400 text-sm mb-2">
          <MapPin className="w-4 h-4 text-gray-500" />
          <span>{academy.city}, {academy.state}</span>
        </div>

        {/* Established */}
        <div className="flex items-center gap-2 text-gray-400 text-sm mb-4">
          <Calendar className="w-4 h-4 text-gray-500" />
          <span>Est. {academy.established}</span>
        </div>

        {/* Stats Row */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-700/50">
          <div className="flex items-center gap-1">
            <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
            <span className="text-white font-semibold">{academy.rating}</span>
          </div>
          <div className="flex items-center gap-1 text-gray-400 text-sm">
            <Users className="w-4 h-4" />
            <span>{academy.totalStudents} Students</span>
          </div>
          <div className="flex items-center gap-1 text-gray-400 text-sm">
            <Award className="w-4 h-4" />
            <span>{academy.coaches} Coaches</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SearchAcademiesPage;
