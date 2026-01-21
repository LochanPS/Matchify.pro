import { useState } from 'react';
import { Mail, Building2, Clock, Star } from 'lucide-react';

const SearchAcademiesPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header Section */}
      <div className="pt-12 pb-8 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-3">
            Academies
          </h1>
          <p className="text-gray-400 text-lg">
            Find and connect with badminton academies near you
          </p>
        </div>
      </div>

      {/* Coming Soon Section */}
      <div className="max-w-4xl mx-auto px-4 pb-16">
        <div className="bg-slate-800/50 backdrop-blur-sm border border-white/10 rounded-2xl p-12 text-center">
          {/* Icon */}
          <div className="w-24 h-24 mx-auto mb-8 bg-purple-500/20 rounded-full flex items-center justify-center">
            <Building2 className="w-12 h-12 text-purple-400" />
          </div>

          {/* Coming Soon Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-500/20 border border-yellow-500/30 rounded-full mb-6">
            <Clock className="w-4 h-4 text-yellow-400" />
            <span className="text-yellow-400 font-medium">Coming Soon</span>
          </div>

          {/* Main Message */}
          <h2 className="text-3xl font-bold text-white mb-4">
            Academy Directory Feature
          </h2>
          <p className="text-gray-300 text-lg mb-8 max-w-2xl mx-auto">
            We're working on building a comprehensive directory of badminton academies. 
            This feature will help players discover and connect with the best academies in their area.
          </p>

          {/* Academy Owner Section */}
          <div className="bg-slate-700/30 rounded-xl p-8 mb-8">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Star className="w-6 h-6 text-emerald-400" />
              <h3 className="text-xl font-semibold text-white">Academy Owners</h3>
            </div>
            <p className="text-gray-300 mb-6">
              Want to list your badminton academy on MATCHIFY.PRO? 
              We'd love to feature your academy in our directory!
            </p>
            
            {/* Contact Information */}
            <div className="bg-slate-800/50 rounded-lg p-6 border border-emerald-500/20">
              <div className="flex items-center justify-center gap-3 mb-4">
                <Mail className="w-5 h-5 text-emerald-400" />
                <span className="text-emerald-400 font-medium">Get in Touch</span>
              </div>
              <p className="text-gray-300 mb-4">
                Send us your academy details and we'll get back to you soon:
              </p>
              <a 
                href="mailto:matchify.pro@gmail.com?subject=Academy Listing Request&body=Hi MATCHIFY.PRO Team,%0D%0A%0D%0AI would like to list my badminton academy on your platform.%0D%0A%0D%0AAcademy Name: %0D%0ALocation: %0D%0AContact Person: %0D%0APhone: %0D%0AEmail: %0D%0A%0D%0APlease let me know the next steps.%0D%0A%0D%0AThank you!"
                className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-lg transition-all"
              >
                <Mail className="w-4 h-4" />
                matchify.pro@gmail.com
              </a>
            </div>
          </div>

          {/* Features Preview */}
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <div className="bg-slate-700/20 rounded-xl p-6">
              <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Building2 className="w-6 h-6 text-blue-400" />
              </div>
              <h4 className="text-white font-semibold mb-2">Academy Profiles</h4>
              <p className="text-gray-400 text-sm">Detailed profiles with facilities, coaches, and contact information</p>
            </div>
            
            <div className="bg-slate-700/20 rounded-xl p-6">
              <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Star className="w-6 h-6 text-green-400" />
              </div>
              <h4 className="text-white font-semibold mb-2">Reviews & Ratings</h4>
              <p className="text-gray-400 text-sm">Player reviews and ratings to help you choose the right academy</p>
            </div>
            
            <div className="bg-slate-700/20 rounded-xl p-6">
              <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Mail className="w-6 h-6 text-purple-400" />
              </div>
              <h4 className="text-white font-semibold mb-2">Direct Contact</h4>
              <p className="text-gray-400 text-sm">Easy communication with academy owners and coaches</p>
            </div>
          </div>

          {/* Timeline */}
          <div className="bg-slate-700/20 rounded-xl p-6">
            <h4 className="text-white font-semibold mb-4">What to Expect</h4>
            <div className="text-left max-w-md mx-auto space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
                <span className="text-gray-300 text-sm">Academy registration system</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
                <span className="text-gray-300 text-sm">Search and filter functionality</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
                <span className="text-gray-300 text-sm">Academy profiles with photos and details</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
                <span className="text-gray-300 text-sm">Player reviews and ratings system</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SearchAcademiesPage;
