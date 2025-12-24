import { Link } from 'react-router-dom'

function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <span className="text-2xl">🎾</span>
              <span className="text-xl font-bold text-gradient">MATCHIFY</span>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                to="/login"
                className="btn-secondary"
              >
                Login
              </Link>
              <Link
                to="/register"
                className="btn-primary"
              >
                Register
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            {/* Main Heading */}
            <h1 className="text-5xl md:text-7xl font-black text-gray-900 mb-6">
              <span className="block">🎾</span>
              <span className="text-gradient">MATCHIFY</span>
            </h1>
            
            {/* Subtitle */}
            <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
              India's Premier Badminton Tournament Platform
            </p>
            
            {/* Description */}
            <p className="text-lg text-gray-500 mb-12 max-w-2xl mx-auto">
              Join thousands of badminton players across India. Register for tournaments, 
              track your progress, and compete with the best players in your city.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link
                to="/register"
                className="btn-primary btn-lg shadow-glow"
              >
                🚀 Start Playing
              </Link>
              <Link
                to="/login"
                className="btn-secondary btn-lg"
              >
                Already a Player?
              </Link>
            </div>
          </div>
        </div>

        {/* Background Decoration */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-primary-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse-slow"></div>
          <div className="absolute top-1/3 right-1/4 w-72 h-72 bg-secondary-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse-slow animation-delay-2000"></div>
          <div className="absolute bottom-1/4 left-1/3 w-72 h-72 bg-success-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse-slow animation-delay-4000"></div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Why Choose Matchify?
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Everything you need to organize and participate in badminton tournaments
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="card hover:shadow-lg transition-shadow duration-300">
              <div className="card-body text-center">
                <div className="text-4xl mb-4">🏆</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  Tournament Management
                </h3>
                <p className="text-gray-600">
                  Create and manage tournaments with automated seeding, draw generation, and live scoring.
                </p>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="card hover:shadow-lg transition-shadow duration-300">
              <div className="card-body text-center">
                <div className="text-4xl mb-4">💰</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  Secure Payments
                </h3>
                <p className="text-gray-600">
                  Integrated wallet system with Razorpay for secure tournament registrations and prize money.
                </p>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="card hover:shadow-lg transition-shadow duration-300">
              <div className="card-body text-center">
                <div className="text-4xl mb-4">📊</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  Player Rankings
                </h3>
                <p className="text-gray-600">
                  Track your progress with Matchify Points and climb the leaderboards in your category.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="py-16 bg-primary-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-3xl md:text-4xl font-bold text-white mb-2">1000+</div>
              <div className="text-primary-100">Active Players</div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-bold text-white mb-2">50+</div>
              <div className="text-primary-100">Tournaments</div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-bold text-white mb-2">25+</div>
              <div className="text-primary-100">Cities</div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-bold text-white mb-2">₹10L+</div>
              <div className="text-primary-100">Prize Money</div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <span className="text-2xl">🎾</span>
              <span className="text-xl font-bold">MATCHIFY</span>
            </div>
            <p className="text-gray-400 mb-4">
              Built with ❤️ for the Indian Badminton Community
            </p>
            <p className="text-sm text-gray-500">
              © 2024 Matchify. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default HomePage