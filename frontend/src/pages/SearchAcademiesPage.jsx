import { useState } from 'react';
import { Mail, Building2, Clock, Star, Sparkles, MapPin, Users } from 'lucide-react';

const SearchAcademiesPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-teal-900/50 to-slate-900 relative overflow-hidden">
      {/* Enhanced Matchify Background Pattern */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-teal-400/25 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-cyan-400/25 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-teal-300/15 rounded-full blur-3xl"></div>
        
        {/* Grid Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(20,184,166,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(20,184,166,0.06)_1px,transparent_1px)] bg-[size:50px_50px]"></div>
      </div>

      {/* Content */}
      <div className="relative z-10">
        {/* Header Section */}
        <div className="pt-16 pb-12 px-4">
          <div className="max-w-6xl mx-auto text-center">
            {/* Brand Badge */}
            <div className="inline-flex items-center gap-2 mb-6 px-6 py-3 bg-gradient-to-r from-teal-500/10 to-cyan-500/10 border border-teal-500/30 rounded-full backdrop-blur-sm">
              <Sparkles className="w-5 h-5 text-teal-400 animate-pulse" />
              <span className="text-teal-400 font-bold text-xl tracking-wide">MATCHIFY</span>
              <span className="text-white font-bold text-xl">.PRO</span>
            </div>
            
            {/* Main Title */}
            <h1 className="text-5xl md:text-7xl font-black mb-4 drop-shadow-2xl">
              <span className="bg-gradient-to-r from-teal-400 via-cyan-400 to-teal-400 bg-clip-text text-transparent animate-gradient">
                Academies
              </span>
            </h1>
            
            <p className="text-gray-200 text-xl md:text-2xl font-light max-w-2xl mx-auto drop-shadow-lg">
              Discover elite badminton academies and elevate your game
            </p>
          </div>
        </div>

        {/* Coming Soon Section */}
        <div className="max-w-5xl mx-auto px-4 pb-20">
          <div className="relative group">
            {/* Glow Effect */}
            <div className="absolute -inset-1 bg-gradient-to-r from-teal-500 to-cyan-500 rounded-3xl blur-xl opacity-20 group-hover:opacity-30 transition duration-500"></div>
            
            {/* Main Card */}
            <div className="relative bg-slate-800/90 backdrop-blur-xl border border-teal-400/40 rounded-3xl p-12 md:p-16 shadow-2xl text-center">
              {/* Icon with Animation */}
              <div className="relative w-28 h-28 mx-auto mb-10">
                <div className="absolute inset-0 bg-gradient-to-br from-teal-500 to-cyan-500 rounded-3xl blur-2xl opacity-50 animate-pulse"></div>
                <div className="relative w-28 h-28 bg-gradient-to-br from-teal-500/30 to-cyan-500/30 rounded-3xl flex items-center justify-center border border-teal-500/50 backdrop-blur-sm">
                  <Building2 className="w-14 h-14 text-teal-400" />
                </div>
              </div>

              {/* Coming Soon Badge */}
              <div className="inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/40 rounded-full mb-8 backdrop-blur-sm">
                <Clock className="w-5 h-5 text-yellow-400 animate-spin" style={{ animationDuration: '3s' }} />
                <span className="text-yellow-400 font-semibold text-lg">Coming Soon</span>
              </div>

              {/* Main Message */}
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 leading-tight">
                Academy Directory Feature
              </h2>
              <p className="text-gray-300 text-lg md:text-xl leading-relaxed mb-12 max-w-3xl mx-auto">
                We're crafting a comprehensive directory of premier badminton academies. 
                This feature will connect players with top-tier training facilities and expert coaches.
              </p>

              {/* Academy Owner Section */}
              <div className="relative mb-12">
                <div className="absolute -inset-1 bg-gradient-to-r from-teal-600 to-cyan-600 rounded-2xl blur opacity-25"></div>
                <div className="relative bg-gradient-to-br from-teal-900/60 to-cyan-900/60 rounded-2xl p-10 border border-teal-400/40 backdrop-blur-sm">
                  <div className="flex items-center justify-center gap-3 mb-6">
                    <div className="w-12 h-12 bg-gradient-to-br from-teal-500 to-cyan-500 rounded-xl flex items-center justify-center">
                      <Star className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-2xl md:text-3xl font-bold text-white">Academy Owners</h3>
                  </div>
                  
                  <p className="text-gray-300 text-lg mb-8 leading-relaxed">
                    Own a badminton academy? Join MATCHIFY.PRO and showcase your facility 
                    to thousands of passionate players!
                  </p>
                  
                  {/* Contact Information */}
                  <div className="bg-slate-800/70 rounded-xl p-8 border border-teal-400/50 backdrop-blur-sm">
                    <div className="flex items-center justify-center gap-3 mb-6">
                      <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-cyan-500 rounded-lg flex items-center justify-center">
                        <Mail className="w-5 h-5 text-white" />
                      </div>
                      <span className="text-teal-400 font-semibold text-xl">Get in Touch</span>
                    </div>
                    
                    <p className="text-gray-300 mb-6 text-lg">
                      Send us your academy details and we'll get back to you soon:
                    </p>
                    
                    <a 
                      href="mailto:matchify.pro@gmail.com?subject=Academy Listing Request&body=Hi MATCHIFY.PRO Team,%0D%0A%0D%0AI would like to list my badminton academy on your platform.%0D%0A%0D%0AAcademy Name: %0D%0ALocation: %0D%0AContact Person: %0D%0APhone: %0D%0AEmail: %0D%0A%0D%0APlease let me know the next steps.%0D%0A%0D%0AThank you!"
                      className="group inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white font-semibold rounded-xl transition-all duration-300 shadow-lg shadow-teal-500/50 hover:shadow-teal-500/70 hover:scale-105 transform"
                    >
                      <Mail className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                      matchify.pro@gmail.com
                    </a>
                  </div>
                </div>
              </div>

              {/* Features Preview */}
              <div className="grid md:grid-cols-3 gap-6 mb-12">
                <div className="group relative">
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-teal-500 to-teal-600 rounded-2xl blur opacity-0 group-hover:opacity-30 transition duration-300"></div>
                  <div className="relative bg-slate-700/70 backdrop-blur-sm rounded-2xl p-8 border border-teal-400/30 hover:border-teal-400/50 transition-all duration-300 h-full">
                    <div className="w-16 h-16 bg-gradient-to-br from-teal-500/20 to-teal-600/20 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                      <Building2 className="w-8 h-8 text-teal-400" />
                    </div>
                    <h4 className="text-white font-bold text-xl mb-3 text-center">Academy Profiles</h4>
                    <p className="text-gray-400 text-center leading-relaxed">Detailed profiles with facilities, coaches, and contact information</p>
                  </div>
                </div>
                
                <div className="group relative">
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500 to-cyan-600 rounded-2xl blur opacity-0 group-hover:opacity-30 transition duration-300"></div>
                  <div className="relative bg-slate-700/70 backdrop-blur-sm rounded-2xl p-8 border border-cyan-400/30 hover:border-cyan-400/50 transition-all duration-300 h-full">
                    <div className="w-16 h-16 bg-gradient-to-br from-cyan-500/20 to-cyan-600/20 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                      <Star className="w-8 h-8 text-cyan-400" />
                    </div>
                    <h4 className="text-white font-bold text-xl mb-3 text-center">Reviews & Ratings</h4>
                    <p className="text-gray-400 text-center leading-relaxed">Player reviews and ratings to help you choose the right academy</p>
                  </div>
                </div>
                
                <div className="group relative">
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-teal-500 to-cyan-500 rounded-2xl blur opacity-0 group-hover:opacity-30 transition duration-300"></div>
                  <div className="relative bg-slate-700/70 backdrop-blur-sm rounded-2xl p-8 border border-teal-400/30 hover:border-teal-400/50 transition-all duration-300 h-full">
                    <div className="w-16 h-16 bg-gradient-to-br from-teal-500/20 to-cyan-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                      <Mail className="w-8 h-8 text-teal-400" />
                    </div>
                    <h4 className="text-white font-bold text-xl mb-3 text-center">Direct Contact</h4>
                    <p className="text-gray-400 text-center leading-relaxed">Easy communication with academy owners and coaches</p>
                  </div>
                </div>
              </div>

              {/* Timeline */}
              <div className="relative">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-teal-500 to-cyan-500 rounded-2xl blur opacity-15"></div>
                <div className="relative bg-gradient-to-br from-slate-700/70 to-teal-800/30 rounded-2xl p-10 border border-teal-400/40 backdrop-blur-sm">
                  <div className="flex items-center justify-center gap-3 mb-8">
                    <Sparkles className="w-6 h-6 text-teal-400" />
                    <h4 className="text-white font-bold text-2xl">What to Expect</h4>
                  </div>
                  
                  <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
                    <div className="flex items-start gap-4 group">
                      <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-cyan-500 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                        <Building2 className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h5 className="text-white font-semibold mb-1">Academy Registration</h5>
                        <p className="text-gray-400 text-sm">Simple onboarding for academy owners</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-4 group">
                      <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-cyan-500 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                        <MapPin className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h5 className="text-white font-semibold mb-1">Smart Search</h5>
                        <p className="text-gray-400 text-sm">Find academies by location and filters</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-4 group">
                      <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-cyan-500 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                        <Users className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h5 className="text-white font-semibold mb-1">Rich Profiles</h5>
                        <p className="text-gray-400 text-sm">Photos, facilities, and coach details</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-4 group">
                      <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-cyan-500 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                        <Star className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h5 className="text-white font-semibold mb-1">Reviews System</h5>
                        <p className="text-gray-400 text-sm">Authentic player feedback and ratings</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SearchAcademiesPage;
