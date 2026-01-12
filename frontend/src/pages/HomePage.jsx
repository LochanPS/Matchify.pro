import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  TrophyIcon, 
  UserGroupIcon, 
  ChartBarIcon, 
  MapPinIcon,
  CalendarIcon,
  SparklesIcon,
  ArrowRightIcon,
  PlayIcon
} from '@heroicons/react/24/outline';
import { StarIcon } from '@heroicons/react/24/solid';

function HomePage() {
  const { user } = useAuth();

  const getDashboardLink = () => {
    if (!user) return '/login';
    const userRoles = Array.isArray(user.roles) ? user.roles : [user.role];
    const primaryRole = userRoles[0];
    
    switch (primaryRole) {
      case 'PLAYER': return '/dashboard';
      case 'ORGANIZER': return '/organizer/dashboard';
      case 'UMPIRE': return '/umpire/dashboard';
      case 'ADMIN': return '/admin/dashboard';
      default: return '/dashboard';
    }
  };

  const features = [
    {
      icon: TrophyIcon,
      title: 'Tournament Management',
      description: 'Create and manage tournaments with automated draws, live scoring, and real-time updates.',
      color: 'from-amber-500 to-orange-600'
    },
    {
      icon: UserGroupIcon,
      title: 'Partner Matching',
      description: 'Find doubles partners, invite friends, and build your badminton network across India.',
      color: 'from-blue-500 to-indigo-600'
    },
    {
      icon: ChartBarIcon,
      title: 'Rankings & Points',
      description: 'Track your progress with Matchify Points and climb the leaderboards in your category.',
      color: 'from-green-500 to-emerald-600'
    },
    {
      icon: MapPinIcon,
      title: 'Discover Tournaments',
      description: 'Find tournaments near you, filter by skill level, and register with just a few clicks.',
      color: 'from-purple-500 to-violet-600'
    },
    {
      icon: CalendarIcon,
      title: 'Easy Scheduling',
      description: 'View match schedules, get reminders, and never miss your game time.',
      color: 'from-pink-500 to-rose-600'
    },
    {
      icon: SparklesIcon,
      title: 'Live Scoring',
      description: 'Real-time score updates, match statistics, and instant notifications.',
      color: 'from-cyan-500 to-teal-600'
    }
  ];

  const stats = [
    { value: '1000+', label: 'Active Players', icon: '🏸' },
    { value: '50+', label: 'Tournaments', icon: '🏆' },
    { value: '25+', label: 'Cities', icon: '🌆' },
    { value: '₹10L+', label: 'Prize Money', icon: '💰' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0">
          <div className="absolute top-0 -left-4 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
          <div className="absolute top-0 -right-4 w-96 h-96 bg-amber-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
          <div className="absolute -bottom-8 left-20 w-96 h-96 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
          <div className="absolute bottom-0 right-20 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
          <div className="text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full text-white/90 text-sm font-medium mb-8 border border-white/20">
              <SparklesIcon className="w-4 h-4 text-amber-400" />
              India's #1 Badminton Platform
            </div>

            {/* Logo & Title */}
            <div className="mb-8">
              {/* Glowing Logo Container */}
              <div className="relative inline-flex flex-col items-center">
                {/* Glow effect */}
                <div className="absolute top-0 w-40 h-40 bg-green-500/40 blur-3xl rounded-full opacity-80"></div>
                
                {/* SVG Shield Logo */}
                <div className="relative mb-6 transform hover:scale-110 transition-transform">
                  <svg viewBox="0 0 120 140" className="h-32 w-auto drop-shadow-[0_0_30px_rgba(34,197,94,0.8)]">
                    {/* Shield */}
                    <defs>
                      <linearGradient id="heroShieldFill" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#22c55e" />
                        <stop offset="50%" stopColor="#16a34a" />
                        <stop offset="100%" stopColor="#15803d" />
                      </linearGradient>
                    </defs>
                    <path d="M60 8 L110 25 L110 70 Q110 115 60 132 Q10 115 10 70 L10 25 Z" fill="url(#heroShieldFill)" stroke="#4ade80" strokeWidth="3"/>
                    {/* M Letter */}
                    <text x="60" y="85" textAnchor="middle" fill="#166534" fontSize="55" fontWeight="900" fontFamily="Arial Black, sans-serif">M</text>
                    {/* Badminton Racket */}
                    <ellipse cx="105" cy="18" rx="12" ry="16" fill="#3b82f6" stroke="#60a5fa" strokeWidth="1.5" transform="rotate(45, 105, 18)"/>
                    <line x1="105" y1="28" x2="115" y2="45" stroke="#6366f1" strokeWidth="3" strokeLinecap="round"/>
                    {/* Racket strings */}
                    <line x1="98" y1="12" x2="112" y2="24" stroke="#93c5fd" strokeWidth="0.8"/>
                    <line x1="100" y1="8" x2="110" y2="28" stroke="#93c5fd" strokeWidth="0.8"/>
                    <line x1="96" y1="18" x2="114" y2="18" stroke="#93c5fd" strokeWidth="0.8"/>
                    {/* Shuttlecock */}
                    <ellipse cx="118" cy="48" rx="4" ry="3" fill="#ec4899"/>
                    <path d="M118 45 L115 38 M118 45 L118 36 M118 45 L121 38" stroke="#f9a8d4" strokeWidth="1.5" fill="none"/>
                  </svg>
                </div>
                
                {/* Text Logo */}
                <h1 className="relative text-5xl md:text-7xl lg:text-8xl font-black tracking-tight">
                  <span className="text-transparent bg-clip-text bg-gradient-to-b from-green-300 via-green-400 to-green-600" style={{textShadow: '0 0 40px rgba(34,197,94,0.5)'}}>
                    MATCHIFY
                  </span>
                  <span className="text-transparent bg-clip-text bg-gradient-to-b from-amber-300 via-amber-400 to-amber-600" style={{textShadow: '0 0 40px rgba(245,158,11,0.5)'}}>
                    .PRO
                  </span>
                </h1>
              </div>
            </div>
            
            {/* Subtitle */}
            <p className="text-xl md:text-2xl lg:text-3xl text-white/80 mb-6 font-light max-w-3xl mx-auto">
              Where Champions Are Made
            </p>
            
            {/* Description */}
            <p className="text-lg text-white/60 mb-12 max-w-2xl mx-auto leading-relaxed">
              Join thousands of badminton players across India. Register for tournaments, 
              track your progress, and compete with the best players in your city.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              {user ? (
                <>
                  <Link
                    to={getDashboardLink()}
                    className="group inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-amber-500 to-orange-600 text-white font-semibold rounded-2xl shadow-xl shadow-amber-500/30 hover:shadow-amber-500/50 hover:scale-105 transition-all"
                  >
                    <TrophyIcon className="w-6 h-6" />
                    Go to Dashboard
                    <ArrowRightIcon className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </Link>
                  <div className="flex items-center gap-3 px-6 py-3 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20">
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold">
                      {user.name?.charAt(0).toUpperCase()}
                    </div>
                    <div className="text-left">
                      <p className="text-white/60 text-sm">Welcome back</p>
                      <p className="text-white font-medium">{user.name}</p>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <Link
                    to="/register"
                    className="group inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-amber-500 to-orange-600 text-white font-semibold rounded-2xl shadow-xl shadow-amber-500/30 hover:shadow-amber-500/50 hover:scale-105 transition-all"
                  >
                    <PlayIcon className="w-6 h-6" />
                    Get Started Free
                    <ArrowRightIcon className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </Link>
                  <Link
                    to="/login"
                    className="inline-flex items-center gap-2 px-8 py-4 bg-white/10 backdrop-blur-sm text-white font-semibold rounded-2xl border border-white/20 hover:bg-white/20 transition-all"
                  >
                    Sign In
                  </Link>
                </>
              )}
            </div>

            {/* Trust Badges */}
            <div className="mt-16 flex flex-wrap justify-center items-center gap-8 text-white/40">
              <div className="flex items-center gap-2">
                <div className="flex -space-x-2">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 border-2 border-slate-900"></div>
                  ))}
                </div>
                <span className="text-sm">1000+ players joined</span>
              </div>
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <StarIcon key={i} className="w-5 h-5 text-amber-400" />
                ))}
                <span className="text-sm ml-2">4.9/5 rating</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="inline-block px-4 py-2 bg-amber-500/20 text-amber-400 rounded-full text-sm font-semibold mb-4 border border-amber-500/30">
              ✨ Features
            </span>
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Everything You Need to
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-400"> Win</span>
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Powerful tools for players, organizers, and umpires
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <div 
                key={index}
                className="group relative bg-slate-800/50 backdrop-blur-sm border border-white/10 rounded-2xl p-8 hover:border-purple-500/50 hover:bg-slate-800/80 transition-all duration-300 hover:shadow-[0_0_30px_rgba(168,85,247,0.4)] hover:scale-[1.02]"
              >
                <div className={`inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br ${feature.color} rounded-2xl shadow-lg mb-6 group-hover:shadow-[0_0_20px_rgba(168,85,247,0.5)] transition-all duration-300`}>
                  <feature.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">
                  {feature.title}
                </h3>
                <p className="text-gray-400 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-900/50 to-indigo-900/50"></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Trusted by Players Across India
            </h2>
            <p className="text-white/60">Growing stronger every day</p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center group">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-white/10 backdrop-blur-sm rounded-2xl mb-4 group-hover:scale-110 transition-transform border border-white/10">
                  <span className="text-3xl">{stat.icon}</span>
                </div>
                <div className="text-4xl md:text-5xl font-bold text-white mb-2">{stat.value}</div>
                <div className="text-white/60 font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="bg-slate-800/50 backdrop-blur-sm border border-white/10 rounded-3xl p-12">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-amber-500 to-orange-600 rounded-3xl shadow-xl shadow-amber-500/30 mb-8">
              <span className="text-4xl">🚀</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Ready to Start Your Journey?
            </h2>
            <p className="text-xl text-gray-400 mb-10 max-w-2xl mx-auto">
              Join Matchify.pro today and become part of India's fastest-growing badminton community.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to={user ? getDashboardLink() : "/register"}
                className="inline-flex items-center justify-center gap-3 px-8 py-4 bg-gradient-to-r from-amber-500 to-orange-600 text-white font-semibold rounded-2xl shadow-xl shadow-amber-500/30 hover:shadow-amber-500/50 hover:scale-105 transition-all"
              >
                {user ? 'Go to Dashboard' : 'Create Free Account'}
                <ArrowRightIcon className="w-5 h-5" />
              </Link>
              <Link
                to="/tournaments"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white/10 backdrop-blur-sm text-white font-semibold rounded-2xl border border-white/20 hover:bg-white/20 transition-all"
              >
                Browse Tournaments
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-white/10 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center">
            <div className="flex items-center gap-3 mb-6">
              <svg viewBox="0 0 120 140" className="h-14 w-auto drop-shadow-[0_0_10px_rgba(34,197,94,0.6)]">
                <defs>
                  <linearGradient id="footerShieldFill" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#22c55e" />
                    <stop offset="50%" stopColor="#16a34a" />
                    <stop offset="100%" stopColor="#15803d" />
                  </linearGradient>
                </defs>
                <path d="M60 8 L110 25 L110 70 Q110 115 60 132 Q10 115 10 70 L10 25 Z" fill="url(#footerShieldFill)" stroke="#4ade80" strokeWidth="3"/>
                <text x="60" y="85" textAnchor="middle" fill="#166534" fontSize="55" fontWeight="900" fontFamily="Arial Black, sans-serif">M</text>
                <ellipse cx="105" cy="18" rx="12" ry="16" fill="#3b82f6" stroke="#60a5fa" strokeWidth="1.5" transform="rotate(45, 105, 18)"/>
                <line x1="105" y1="28" x2="115" y2="45" stroke="#6366f1" strokeWidth="3" strokeLinecap="round"/>
                <ellipse cx="118" cy="48" rx="4" ry="3" fill="#ec4899"/>
              </svg>
              <span className="text-2xl font-black">
                <span className="text-transparent bg-clip-text bg-gradient-to-b from-green-300 to-green-500">MATCHIFY</span>
                <span className="text-transparent bg-clip-text bg-gradient-to-b from-amber-300 to-amber-500">.PRO</span>
              </span>
            </div>
            <p className="text-gray-500 mb-6 text-center max-w-md">
              Built with ❤️ for the Indian Badminton Community
            </p>
            <div className="flex gap-6 mb-8">
              <a href="#" className="text-gray-500 hover:text-white transition-colors">About</a>
              <a href="#" className="text-gray-500 hover:text-white transition-colors">Contact</a>
              <a href="#" className="text-gray-500 hover:text-white transition-colors">Privacy</a>
              <a href="#" className="text-gray-500 hover:text-white transition-colors">Terms</a>
            </div>
            <p className="text-sm text-gray-600">
              © 2026 Matchify.pro. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default HomePage;
