import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ShoppingBag, Phone, Mail } from 'lucide-react';

const B = {
  border: 'rgba(255,255,255,0.08)',
  gold: '#F59E0B',
  goldLight: '#FCD34D',
};

// Shop — Coming Soon. A branded placeholder that also invites sellers to
// partner with us. No products, no cart, no payments yet (intentionally).
export default function ShopPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen relative" style={{
      background: '#050810',
      backgroundImage: 'url(/bg-galaxy.png)',
      backgroundSize: 'cover',
      backgroundPosition: 'center top',
      backgroundRepeat: 'no-repeat',
      backgroundAttachment: 'fixed',
    }}>
      {/* Dark overlay */}
      <div className="fixed inset-0 pointer-events-none" style={{ background: 'rgba(5,8,16,0.75)', zIndex: 0 }} />

      {/* ── Sticky header ── */}
      <div className="sticky top-0 z-30 px-4 pt-5 pb-4 flex items-center justify-between"
        style={{ background: 'rgba(5,8,16,0.88)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', borderBottom: `1px solid ${B.border}` }}>
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 group">
          <ArrowLeft className="w-5 h-5 transition-transform group-active:-translate-x-0.5" style={{ color: B.gold }} />
          <span className="text-sm font-bold" style={{ color: 'rgba(255,255,255,0.6)' }}>Back</span>
        </button>
        <h1 className="text-lg font-black text-white tracking-tight">Shop</h1>
        {/* Spacer to keep the title centered against the Back button */}
        <div style={{ width: 62 }} />
      </div>

      {/* ── Body ── */}
      <div className="relative z-10 px-5 pt-14 pb-32 flex flex-col items-center text-center">

        {/* Icon badge */}
        <div className="flex items-center justify-center rounded-full mb-6"
          style={{
            width: 92, height: 92,
            background: 'radial-gradient(circle at 50% 35%, rgba(245,158,11,0.22), rgba(245,158,11,0.06))',
            border: '1px solid rgba(245,158,11,0.35)',
            boxShadow: '0 8px 40px rgba(245,158,11,0.18)',
          }}>
          <ShoppingBag className="w-11 h-11" style={{ color: B.gold, filter: 'drop-shadow(0 0 10px rgba(245,158,11,0.45))' }} />
        </div>

        {/* Coming soon badge */}
        <div className="px-4 py-1.5 rounded-full text-xs font-black tracking-wide mb-4"
          style={{ background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.4)', color: B.gold }}>
          COMING SOON
        </div>

        {/* Title + subtitle */}
        <h2 className="text-2xl font-black text-white leading-tight mb-3" style={{ maxWidth: 340 }}>
          The Matchify Shop is on its way
        </h2>
        <p className="text-sm leading-relaxed mb-10" style={{ color: 'rgba(255,255,255,0.6)', maxWidth: 320 }}>
          We're building a home for the best rackets, shuttles, strings, shoes and gear — everything you need to gear up for your next match. Stay tuned.
        </p>

        {/* Seller / partner card */}
        <div className="w-full rounded-2xl px-5 py-6 text-left"
          style={{ maxWidth: 400, background: 'rgba(255,255,255,0.04)', border: `1px solid ${B.border}` }}>
          <h3 className="text-base font-black text-white mb-1.5">Want to sell sports products with us?</h3>
          <p className="text-sm leading-relaxed mb-5" style={{ color: 'rgba(255,255,255,0.55)' }}>
            If you sell rackets, shoes, apparel or any sports gear, we'd love to partner with you. Reach out and let's build something together.
          </p>

          {/* Call / WhatsApp */}
          <a href="tel:+919742628582"
            className="flex items-center gap-3 w-full rounded-xl px-4 py-3 mb-3 transition-all active:scale-[0.98]"
            style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)' }}>
            <div className="flex items-center justify-center rounded-lg flex-shrink-0"
              style={{ width: 38, height: 38, background: 'rgba(245,158,11,0.15)' }}>
              <Phone size={18} style={{ color: B.gold }} />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-bold uppercase tracking-wide" style={{ color: 'rgba(255,255,255,0.45)' }}>Call or WhatsApp</p>
              <p className="text-sm font-black text-white">9742628582</p>
            </div>
          </a>

          {/* Email */}
          <a href="mailto:Matchify.pro@gmail.com"
            className="flex items-center gap-3 w-full rounded-xl px-4 py-3 transition-all active:scale-[0.98]"
            style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${B.border}` }}>
            <div className="flex items-center justify-center rounded-lg flex-shrink-0"
              style={{ width: 38, height: 38, background: 'rgba(255,255,255,0.06)' }}>
              <Mail size={18} style={{ color: B.goldLight }} />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-bold uppercase tracking-wide" style={{ color: 'rgba(255,255,255,0.45)' }}>Email</p>
              <p className="text-sm font-black text-white break-all">Matchify.pro@gmail.com</p>
            </div>
          </a>
        </div>
      </div>
    </div>
  );
}
