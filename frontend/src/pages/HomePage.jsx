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
  PlayIcon,
  CheckCircleIcon,
  BoltIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline';
import { StarIcon } from '@heroicons/react/24/solid';

function HomePage() {
  const { user } = useAuth();

  // Add custom animations to the page
  const style = document.createElement('style');
  style.textContent = `
    @keyframes fade-in-up {
      from {
        opacity: 0;
        transform: translateY(20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
    
    .animate-fade-in-up {
      animation: fade-in-up 0.6s ease-out forwards;
      opacity: 0;
    }
    
    @keyframes blob {
      0%, 100% { transform: translate(0, 0) scale(1); }
      25% { transform: translate(20px, -20px) scale(1.1); }
      50% { transform: translate(-20px, 20px) scale(0.9); }
      75% { transform: translate(20px, 20px) scale(1.05); }
    }
    
    .animate-blob {
      animation: blob 7s infinite;
    }
    
    @keyframes float {
      0%, 100% { transform: translateY(0px) rotate(0deg); }
      50% { transform: translateY(-20px) rotate(5deg); }
    }
    
    .animate-float {
      animation: float 6s ease-in-out infinite;
    }
    
    @keyframes pulse {
      0%, 100% { opacity: 0.3; }
      50% { opacity: 0.5; }
    }
    
    .animate-pulse {
      animation: pulse 4s ease-in-out infinite;
    }
    
    .animation-delay-2000 {
      animation-delay: 2s;
    }
    
    .animation-delay-4000 {
      animation-delay: 4s;
    }
  `;
  if (!document.head.querySelector('style[data-homepage-animations]')) {
    style.setAttribute('data-homepage-animations', 'true');
    document.head.appendChild(style);
  }

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
      description: 'Create tournaments with automated draws, live scoring, and real-time updates.',
      color: 'from-amber-500 to-orange-600'
    },
    {
      icon: UserGroupIcon,
      title: 'Partner Matching',
      description: 'Find doubles partners and build your badminton network across India.',
      color: 'from-blue-500 to-indigo-600'
    },
    {
      icon: ChartBarIcon,
      title: 'Rankings & Points',
      description: 'Track progress with Matchify Points and climb category leaderboards.',
      color: 'from-green-500 to-emerald-600'
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

  const howItWorks = [
    {
      step: '1',
      title: 'Create Account',
      description: 'Sign up in seconds and complete your player profile',
      icon: '👤',
      color: 'from-blue-500 to-cyan-500'
    },
    {
      step: '2',
      title: 'Find Tournament',
      description: 'Browse tournaments in your city and skill level',
      icon: '🔍',
      color: 'from-purple-500 to-pink-500'
    },
    {
      step: '3',
      title: 'Register & Pay',
      description: 'Quick registration with secure UPI payment',
      icon: '💳',
      color: 'from-green-500 to-emerald-500'
    },
    {
      step: '4',
      title: 'Play & Win',
      description: 'Compete, track scores, and climb the rankings',
      icon: '🏆',
      color: 'from-amber-500 to-orange-500'
    }
  ];

  const testimonials = [
    {
      name: 'Rahul Sharma',
      role: 'State Level Player',
      image: '👨',
      rating: 5,
      text: 'Matchify.pro made tournament registration so easy! Love the live scoring feature.',
      location: 'Bangalore'
    },
    {
      name: 'Priya Patel',
      role: 'Club Player',
      image: '👩',
      rating: 5,
      text: 'Found amazing doubles partners through this platform. The community is fantastic!',
      location: 'Mumbai'
    },
    {
      name: 'Arjun Kumar',
      role: 'Tournament Organizer',
      image: '👨',
      rating: 5,
      text: 'Managing tournaments has never been easier. Automated draws save so much time!',
      location: 'Delhi'
    }
  ];

  const benefits = [
    { icon: BoltIcon, text: 'Instant Registration', color: 'text-amber-400' },
    { icon: ShieldCheckIcon, text: 'Secure Payments', color: 'text-green-400' },
    { icon: TrophyIcon, text: 'Fair Play System', color: 'text-blue-400' },
    { icon: ChartBarIcon, text: 'Performance Tracking', color: 'text-purple-400' }
  ];

  return (
    <div className="min-h-screen bg-slate-900 relative overflow-hidden">
      {/* Professional Dark Background */}
      <div className="fixed inset-0 z-0">
        {/* Base Gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900"></div>
        
        {/* Subtle Accent Gradients */}
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-br from-green-500/10 to-transparent rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-gradient-to-tr from-amber-500/10 to-transparent rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-br from-teal-500/5 to-transparent rounded-full blur-3xl"></div>
        
        {/* Professional Grid Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(34,197,94,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(34,197,94,0.03)_1px,transparent_1px)] bg-[size:80px_80px]"></div>
      </div>

      {/* Hero Section */}
      <div className="relative z-10 overflow-hidden">

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
          <div className="text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800/80 backdrop-blur-sm rounded-full text-white/90 text-sm font-medium mb-8 border border-green-500/30 shadow-lg">
              <SparklesIcon className="w-4 h-4 text-green-400" />
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
            <p className="text-xl md:text-2xl lg:text-3xl text-white/90 mb-6 font-light max-w-3xl mx-auto">
              Where Champions Are Made
            </p>
            
            {/* Description */}
            <p className="text-lg text-white/70 mb-12 max-w-2xl mx-auto leading-relaxed">
              Join thousands of players across India. Register for tournaments, track progress, and compete with the best.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              {user ? (
                <>
                  <Link
                    to={getDashboardLink()}
                    className="group inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold rounded-xl shadow-lg shadow-green-500/30 hover:shadow-green-500/50 hover:scale-105 transition-all"
                  >
                    <TrophyIcon className="w-6 h-6" />
                    Go to Dashboard
                    <ArrowRightIcon className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </Link>
                  <div className="flex items-center gap-3 px-6 py-3 bg-slate-800/80 backdrop-blur-sm rounded-xl border border-slate-700 shadow-lg">
                    <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center text-white font-bold">
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
                    className="group inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold rounded-xl shadow-lg shadow-green-500/30 hover:shadow-green-500/50 hover:scale-105 transition-all"
                  >
                    <PlayIcon className="w-6 h-6" />
                    Get Started Free
                    <ArrowRightIcon className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </Link>
                  <Link
                    to="/login"
                    className="inline-flex items-center gap-2 px-8 py-4 bg-slate-800/80 backdrop-blur-sm text-white font-semibold rounded-xl border border-slate-700 hover:bg-slate-800 hover:border-slate-600 transition-all"
                  >
                    Sign In
                  </Link>
                </>
              )}
            </div>

            {/* Trust Badges */}
            <div className="mt-16 flex flex-wrap justify-center items-center gap-8 text-white/50">
              <div className="flex items-center gap-2">
                <div className="flex -space-x-2">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="w-8 h-8 rounded-full bg-gradient-to-br from-green-400 to-emerald-400 border-2 border-slate-900 shadow-lg"></div>
                  ))}
                </div>
                <span className="text-sm font-medium">1000+ players joined</span>
              </div>
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <StarIcon key={i} className="w-5 h-5 text-amber-400" />
                ))}
                <span className="text-sm ml-2 font-medium">4.9/5 rating</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-20 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="inline-block px-4 py-2 bg-green-500/20 text-green-400 rounded-full text-sm font-semibold mb-4 border border-green-500/30">
              ✨ Features
            </span>
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Everything You Need to
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-400"> Win</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <div 
                key={index}
                className="group relative bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-6 hover:border-green-500/50 hover:shadow-xl hover:shadow-green-500/10 transition-all duration-300 hover:scale-[1.02]"
              >
                <div className={`inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br ${feature.color} rounded-xl shadow-lg mb-4 group-hover:scale-110 transition-all duration-300`}>
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">
                  {feature.title}
                </h3>
                <p className="text-white/60 text-sm leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="py-16 relative z-10 overflow-hidden bg-gradient-to-br from-green-600 to-emerald-600">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.1)_1px,transparent_1px)] bg-[size:64px_64px]"></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-2">
              Trusted Across India
            </h2>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((stat, index) => (
              <div key={index} className="text-center group animate-fade-in-up" style={{animationDelay: `${index * 100}ms`}}>
                <div className="inline-flex items-center justify-center w-14 h-14 bg-white/20 backdrop-blur-sm rounded-xl mb-3 group-hover:scale-110 group-hover:bg-white/30 transition-all duration-300 border border-white/30">
                  <span className="text-2xl">{stat.icon}</span>
                </div>
                <div className="text-3xl md:text-4xl font-bold text-white mb-1">{stat.value}</div>
                <div className="text-white/90 text-sm font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* How It Works Section */}
      <div className="py-20 relative z-10">
        {/* Section Background */}
        <div className="absolute inset-0">
          <div className="absolute top-1/4 right-10 w-64 h-64 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
          <div className="absolute bottom-1/4 left-10 w-64 h-64 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse animation-delay-2000"></div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center mb-16">
            <span className="inline-block px-4 py-2 bg-purple-500/20 text-purple-400 rounded-full text-sm font-semibold mb-4 border border-purple-500/30">
              🎯 Simple Process
            </span>
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              How It
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400"> Works</span>
            </h2>
            <p className="text-gray-400 text-lg">Get started in 4 easy steps</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {howItWorks.map((item, index) => (
              <div key={index} className="relative group">
                {/* Connecting Line */}
                {index < howItWorks.length - 1 && (
                  <div className="hidden lg:block absolute top-20 left-full w-full h-0.5 bg-gradient-to-r from-purple-500/50 to-transparent -z-10"></div>
                )}
                
                <div className="relative bg-slate-800/50 backdrop-blur-sm border border-white/10 rounded-2xl p-6 hover:border-purple-500/50 transition-all duration-300 hover:scale-105 hover:shadow-[0_0_30px_rgba(168,85,247,0.3)]">
                  {/* Step Number */}
                  <div className={`absolute -top-4 -right-4 w-12 h-12 bg-gradient-to-br ${item.color} rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg`}>
                    {item.step}
                  </div>
                  
                  {/* Icon */}
                  <div className="text-6xl mb-4 group-hover:scale-110 transition-transform duration-300">
                    {item.icon}
                  </div>
                  
                  <h3 className="text-xl font-bold text-white mb-2">
                    {item.title}
                  </h3>
                  <p className="text-gray-400 text-sm">
                    {item.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Benefits Section */}
      <div className="py-16 relative z-10 overflow-hidden">
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-3xl p-8 md:p-12 shadow-xl">
            <div className="text-center mb-10">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                Why Choose
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-400"> Matchify.pro</span>
              </h2>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {benefits.map((benefit, index) => (
                <div key={index} className="flex items-center gap-3 bg-slate-900/50 rounded-xl p-4 border border-slate-700/50 hover:border-green-500/50 hover:shadow-lg hover:shadow-green-500/10 transition-all group">
                  <div className={`flex-shrink-0 w-10 h-10 ${benefit.color} bg-slate-800 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform`}>
                    <benefit.icon className="w-6 h-6" />
                  </div>
                  <span className="text-white font-medium">{benefit.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Testimonials Section */}
      <div className="py-20 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center mb-16">
            <span className="inline-block px-4 py-2 bg-teal-500/20 text-teal-400 rounded-full text-sm font-semibold mb-4 border border-teal-500/30">
              💬 Testimonials
            </span>
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              What Players
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-cyan-400"> Say</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="group relative">
                <div className="relative bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-6 hover:border-teal-500/50 hover:shadow-xl hover:shadow-teal-500/10 transition-all duration-300">
                  {/* Stars */}
                  <div className="flex gap-1 mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <StarIcon key={i} className="w-5 h-5 text-amber-400" />
                    ))}
                  </div>
                  
                  {/* Quote */}
                  <p className="text-white/70 mb-6 leading-relaxed">
                    "{testimonial.text}"
                  </p>
                  
                  {/* Author */}
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-teal-400 to-cyan-400 rounded-full flex items-center justify-center text-2xl shadow-lg">
                      {testimonial.image}
                    </div>
                    <div>
                      <p className="text-white font-semibold">{testimonial.name}</p>
                      <p className="text-white/50 text-sm">{testimonial.role} • {testimonial.location}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-20 relative z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative">
          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-3xl p-10 shadow-xl">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-green-600 to-emerald-600 rounded-2xl shadow-lg shadow-green-500/30 mb-6">
              <span className="text-3xl">🚀</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Ready to Start Your Journey?
            </h2>
            <p className="text-lg text-white/60 mb-8 max-w-2xl mx-auto">
              Join India's fastest-growing badminton community today.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to={user ? getDashboardLink() : "/register"}
                className="inline-flex items-center justify-center gap-3 px-8 py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold rounded-xl shadow-lg shadow-green-500/30 hover:shadow-green-500/50 hover:scale-105 transition-all"
              >
                {user ? 'Go to Dashboard' : 'Create Free Account'}
                <ArrowRightIcon className="w-5 h-5" />
              </Link>
              <Link
                to="/tournaments"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-slate-700/50 backdrop-blur-sm text-white font-semibold rounded-xl border border-slate-600 hover:bg-slate-700 hover:border-slate-500 transition-all"
              >
                Browse Tournaments
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-12 relative z-10 bg-slate-900/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center">
            <div className="flex items-center gap-3 mb-4">
              <svg viewBox="0 0 120 140" className="h-12 w-auto drop-shadow-[0_0_15px_rgba(34,197,94,0.5)]">
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
              <span className="text-xl font-black">
                <span className="text-transparent bg-clip-text bg-gradient-to-b from-green-400 to-green-500">MATCHIFY</span>
                <span className="text-transparent bg-clip-text bg-gradient-to-b from-amber-400 to-amber-500">.PRO</span>
              </span>
            </div>
            <p className="text-white/50 mb-6 text-center text-sm">
              Built with ❤️ for the Indian Badminton Community
            </p>
            
            {/* Co-Founders Section */}
            <div className="relative mb-6 max-w-xl mx-auto">
              <div className="relative bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl px-6 py-4 shadow-xl">
                <p className="text-xs text-white/50 font-medium mb-2 tracking-widest uppercase text-center">Co-Founded By</p>
                <h3 className="text-2xl md:text-3xl font-bold text-center mb-3">
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-400">
                    PS Brothers
                  </span>
                </h3>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-400"></div>
                    <span className="text-base md:text-lg font-semibold text-white">
                      PS Lochan
                    </span>
                  </div>
                  <div className="hidden sm:block w-px h-5 bg-slate-700"></div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
                    <span className="text-base md:text-lg font-semibold text-white">
                      PS Pradyumna
                    </span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex gap-6 mb-6 text-sm">
              <a href="#" className="text-white/50 hover:text-white transition-colors">About</a>
              <a href="#" className="text-white/50 hover:text-white transition-colors">Contact</a>
              <a href="#" className="text-white/50 hover:text-white transition-colors">Privacy</a>
              <a href="#" className="text-white/50 hover:text-white transition-colors">Terms</a>
            </div>
            <p className="text-xs text-white/30">
              © 2026 Matchify.pro. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default HomePage;
