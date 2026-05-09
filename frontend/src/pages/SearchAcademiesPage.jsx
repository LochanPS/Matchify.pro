import { Mail, Building2, Clock, Star, Sparkles, MapPin, Users, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const B = {
  bg: '#07071a',
  card: 'rgba(255,255,255,0.04)',
  border: 'rgba(255,255,255,0.08)',
  cardDark: '#0d1025',
  green: '#00ff88',
  cyan: '#00d4ff',
  purple: '#a855f7',
};

const SearchAcademiesPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ background: B.bg }}>
      {/* Background orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full blur-3xl" style={{ background: B.green, opacity: 0.06 }} />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full blur-3xl" style={{ background: B.cyan, opacity: 0.05 }} />
        <div className="absolute top-1/2 right-1/3 w-64 h-64 rounded-full blur-3xl" style={{ background: B.purple, opacity: 0.04 }} />
      </div>

      <div className="relative z-10 max-w-lg mx-auto px-4 py-6">
        {/* Back */}
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 mb-6">
          <ArrowLeft className="w-5 h-5" style={{ color: B.green }} />
          <span className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.7)' }}>Back</span>
        </button>

        {/* Header */}
        <div className="text-center mb-8">
          <div
            className="inline-flex items-center gap-2 mb-4 px-4 py-2 rounded-full border"
            style={{ background: 'rgba(0,255,136,0.08)', borderColor: 'rgba(0,255,136,0.2)' }}
          >
            <Sparkles className="w-4 h-4" style={{ color: B.green }} />
            <span className="font-bold text-sm" style={{ color: B.green }}>MATCHIFY.PRO</span>
          </div>

          <h1
            className="text-4xl font-black mb-3"
            style={{
              background: `linear-gradient(135deg, ${B.green}, ${B.cyan})`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            Academies
          </h1>
          <p className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.6)' }}>
            Discover elite badminton academies and elevate your game
          </p>
        </div>

        {/* Main card */}
        <div className="rounded-2xl border p-5 mb-5" style={{ background: B.card, borderColor: B.border }}>
          {/* Icon */}
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5"
            style={{ background: 'rgba(0,255,136,0.1)', border: '1px solid rgba(0,255,136,0.2)' }}
          >
            <Building2 className="w-8 h-8" style={{ color: B.green }} />
          </div>

          {/* Coming soon badge */}
          <div className="flex justify-center mb-5">
            <div
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full border"
              style={{ background: 'rgba(251,191,36,0.1)', borderColor: 'rgba(251,191,36,0.3)' }}
            >
              <Clock className="w-4 h-4 text-yellow-400 animate-spin" style={{ animationDuration: '3s' }} />
              <span className="text-yellow-400 font-semibold text-sm">Coming Soon</span>
            </div>
          </div>

          <h2 className="text-xl font-black text-white text-center mb-3">Academy Directory</h2>
          <p className="text-sm text-center mb-6" style={{ color: 'rgba(255,255,255,0.6)', lineHeight: '1.7' }}>
            We're building a comprehensive directory of premier badminton academies — connecting players with top training facilities and expert coaches.
          </p>

          {/* Divider */}
          <div className="border-t mb-5" style={{ borderColor: B.border }} />

          {/* Academy Owners */}
          <div
            className="rounded-xl p-4 mb-5 border"
            style={{ background: 'rgba(0,255,136,0.05)', borderColor: 'rgba(0,255,136,0.15)' }}
          >
            <div className="flex items-center gap-3 mb-3">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: 'rgba(0,255,136,0.15)' }}
              >
                <Star className="w-5 h-5" style={{ color: B.green }} />
              </div>
              <h3 className="text-base font-bold text-white">Academy Owners</h3>
            </div>

            <p className="text-sm mb-4" style={{ color: 'rgba(255,255,255,0.65)', lineHeight: '1.65' }}>
              Own a badminton academy? Join MATCHIFY.PRO and showcase your facility to thousands of passionate players!
            </p>

            {/* Get in Touch box */}
            <div
              className="rounded-xl p-4 border"
              style={{ background: B.cardDark, borderColor: 'rgba(0,255,136,0.2)' }}
            >
              <div className="flex items-center gap-2 mb-2">
                <Mail className="w-4 h-4 flex-shrink-0" style={{ color: B.green }} />
                <span className="font-semibold text-sm" style={{ color: B.green }}>Get in Touch</span>
              </div>

              <p className="text-xs mb-4" style={{ color: 'rgba(255,255,255,0.55)', lineHeight: '1.5' }}>
                Send your academy details and we'll reach out:
              </p>

              <a
                href="mailto:matchify.pro@gmail.com?subject=Academy Listing Request&body=Hi MATCHIFY.PRO Team,%0D%0A%0D%0AI would like to list my badminton academy on your platform.%0D%0A%0D%0AAcademy Name: %0D%0ALocation: %0D%0AContact Person: %0D%0APhone: %0D%0AEmail: %0D%0A%0D%0APlease let me know the next steps.%0D%0A%0D%0AThank you!"
                className="flex items-center gap-2 w-full px-4 py-3 rounded-xl font-bold text-sm transition-all"
                style={{ background: 'linear-gradient(135deg,#00c853,#00ff88)', color: '#003320' }}
              >
                <Mail className="w-4 h-4 flex-shrink-0" />
                <span style={{ wordBreak: 'break-all' }}>matchify.pro@gmail.com</span>
              </a>
            </div>
          </div>

          {/* Features list */}
          <div className="space-y-3 mb-5">
            {[
              { icon: <Building2 className="w-4 h-4" style={{ color: B.green }} />, title: 'Academy Profiles', desc: 'Detailed profiles with facilities, coaches, and contact info', accent: B.green },
              { icon: <Star className="w-4 h-4" style={{ color: B.cyan }} />, title: 'Reviews & Ratings', desc: 'Authentic player reviews to help you choose the right academy', accent: B.cyan },
              { icon: <MapPin className="w-4 h-4" style={{ color: B.purple }} />, title: 'Smart Search', desc: 'Find academies by location and specialty filters', accent: B.purple },
              { icon: <Mail className="w-4 h-4" style={{ color: B.green }} />, title: 'Direct Contact', desc: 'Easy communication with academy owners and coaches', accent: B.green },
            ].map(({ icon, title, desc, accent }) => (
              <div
                key={title}
                className="flex items-start gap-3 p-3 rounded-xl border"
                style={{ background: 'rgba(255,255,255,0.03)', borderColor: B.border }}
              >
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: 'rgba(255,255,255,0.06)' }}
                >
                  {icon}
                </div>
                <div className="min-w-0">
                  <h4 className="font-bold text-white text-sm mb-0.5">{title}</h4>
                  <p className="text-xs" style={{ color: 'rgba(255,255,255,0.55)', lineHeight: '1.5' }}>{desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* What to Expect */}
          <div
            className="rounded-xl p-4 border"
            style={{ background: 'rgba(168,85,247,0.05)', borderColor: 'rgba(168,85,247,0.15)' }}
          >
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-4 h-4" style={{ color: B.purple }} />
              <h4 className="font-bold text-white text-sm">What to Expect</h4>
            </div>

            <div className="space-y-3">
              {[
                { icon: <Building2 className="w-4 h-4" style={{ color: B.green }} />, title: 'Academy Registration', desc: 'Simple onboarding for academy owners' },
                { icon: <MapPin className="w-4 h-4" style={{ color: B.cyan }} />, title: 'Smart Search', desc: 'Find academies by location and filters' },
                { icon: <Users className="w-4 h-4" style={{ color: B.purple }} />, title: 'Rich Profiles', desc: 'Photos, facilities, and coach details' },
                { icon: <Star className="w-4 h-4 text-yellow-400" />, title: 'Reviews System', desc: 'Authentic player feedback and ratings' },
              ].map(({ icon, title, desc }) => (
                <div key={title} className="flex items-start gap-3">
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: 'rgba(255,255,255,0.06)' }}
                  >
                    {icon}
                  </div>
                  <div className="min-w-0">
                    <h5 className="font-semibold text-white text-xs">{title}</h5>
                    <p className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SearchAcademiesPage;
