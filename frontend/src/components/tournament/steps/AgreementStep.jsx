import { useState } from 'react';
import { CheckCircle, Shield, TrendingUp, Award, ChevronRight, AlertCircle } from 'lucide-react';

export default function AgreementStep({ onNext, onPrev }) {
  const [accepted, setAccepted] = useState(false);
  const [error, setError] = useState('');

  const handleProceed = () => {
    if (!accepted) {
      setError('Please accept the terms to continue.');
      return;
    }
    setError('');
    onNext();
  };

  return (
    <div className="space-y-5 pb-4">
      {/* Header */}
      <div className="rounded-2xl p-5 relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg,rgba(0,255,136,0.12),rgba(0,200,83,0.06))', border: '1.5px solid rgba(0,255,136,0.3)' }}>
        <div className="absolute top-0 right-0 w-32 h-32 rounded-full blur-2xl opacity-20"
          style={{ background: 'radial-gradient(circle,rgba(0,255,136,0.8),transparent)' }} />
        <div className="flex items-center gap-4 relative z-10">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'rgba(0,255,136,0.2)', border: '1px solid rgba(0,255,136,0.4)' }}>
            <Shield className="w-7 h-7" style={{ color: '#00ff88' }} />
          </div>
          <div>
            <h2 className="text-lg font-black text-white">Platform Agreement</h2>
            <p className="text-xs font-medium mt-0.5" style={{ color: 'rgba(0,255,136,0.8)' }}>
              How Matchify.pro handles your tournament revenue
            </p>
          </div>
        </div>
      </div>

      {/* Payout breakdown — visual highlight */}
      <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)' }}>
        <div className="px-4 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)', background: 'rgba(0,255,136,0.05)' }}>
          <p className="text-xs font-black uppercase tracking-widest" style={{ color: 'rgba(0,255,136,0.7)' }}>
            💸 Revenue Disbursement Structure
          </p>
        </div>
        <div className="p-4 space-y-3">
          {/* 30% before */}
          <div className="flex items-center gap-4 p-3.5 rounded-xl"
            style={{ background: 'rgba(0,212,255,0.08)', border: '1px solid rgba(0,212,255,0.2)' }}>
            <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: 'rgba(0,212,255,0.15)', border: '1px solid rgba(0,212,255,0.35)' }}>
              <TrendingUp className="w-6 h-6" style={{ color: '#00d4ff' }} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-2 flex-wrap">
                <span className="text-2xl font-black" style={{ color: '#00d4ff' }}>30%</span>
                <span className="text-xs font-bold" style={{ color: 'rgba(255,255,255,0.6)' }}>of total registration revenue</span>
              </div>
              <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.45)' }}>
                Released <span className="font-bold text-white">before</span> the tournament begins — for venue booking, logistics & preparation
              </p>
            </div>
          </div>

          {/* 67% after */}
          <div className="flex items-center gap-4 p-3.5 rounded-xl"
            style={{ background: 'rgba(0,255,136,0.08)', border: '1px solid rgba(0,255,136,0.2)' }}>
            <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: 'rgba(0,255,136,0.15)', border: '1px solid rgba(0,255,136,0.35)' }}>
              <Award className="w-6 h-6" style={{ color: '#00ff88' }} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-2 flex-wrap">
                <span className="text-2xl font-black" style={{ color: '#00ff88' }}>67%</span>
                <span className="text-xs font-bold" style={{ color: 'rgba(255,255,255,0.6)' }}>of total registration revenue</span>
              </div>
              <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.45)' }}>
                Released <span className="font-bold text-white">after</span> the tournament concludes — once results are verified & finalised
              </p>
            </div>
          </div>

          {/* 3% platform fee */}
          <div className="flex items-center gap-4 p-3.5 rounded-xl"
            style={{ background: 'rgba(168,85,247,0.08)', border: '1px solid rgba(168,85,247,0.2)' }}>
            <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: 'rgba(168,85,247,0.15)', border: '1px solid rgba(168,85,247,0.35)' }}>
              <Shield className="w-6 h-6" style={{ color: '#a855f7' }} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-2 flex-wrap">
                <span className="text-2xl font-black" style={{ color: '#a855f7' }}>3%</span>
                <span className="text-xs font-bold" style={{ color: 'rgba(255,255,255,0.6)' }}>platform service fee</span>
              </div>
              <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.45)' }}>
                Retained by Matchify.pro to cover payment processing, platform infrastructure & support
              </p>
            </div>
          </div>
        </div>

        {/* Visual bar */}
        <div className="px-4 pb-4">
          <div className="flex rounded-xl overflow-hidden h-6">
            <div className="flex items-center justify-center text-xs font-black"
              style={{ width: '30%', background: 'linear-gradient(90deg,#0891b2,#00d4ff)', color: '#07071a' }}>
              30%
            </div>
            <div className="flex items-center justify-center text-xs font-black"
              style={{ width: '67%', background: 'linear-gradient(90deg,#00c853,#00ff88)', color: '#07071a' }}>
              67%
            </div>
            <div className="flex items-center justify-center text-xs font-black"
              style={{ width: '3%', background: 'linear-gradient(90deg,#7c3aed,#a855f7)', color: '#fff' }}>
            </div>
          </div>
          <div className="flex text-xs mt-1.5" style={{ color: 'rgba(255,255,255,0.35)' }}>
            <span style={{ width: '30%' }}>Before</span>
            <span style={{ width: '67%' }}>After</span>
            <span style={{ width: '3%' }}>Fee</span>
          </div>
        </div>
      </div>

      {/* Why this model */}
      <div className="rounded-2xl p-4" style={{ background: 'rgba(251,191,36,0.07)', border: '1px solid rgba(251,191,36,0.2)' }}>
        <p className="text-xs font-black mb-2.5" style={{ color: '#fbbf24' }}>✦ Why this model benefits you</p>
        <div className="space-y-2">
          {[
            'You receive funds before the event — no waiting or upfront costs',
            'The bulk 67% payout comes after, ensuring accountability',
            '3% is among the lowest platform fees in Indian sports tech',
            'Payments are secure, tracked and fully transparent',
          ].map((point, i) => (
            <div key={i} className="flex items-start gap-2">
              <CheckCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" style={{ color: '#fbbf24' }} />
              <p className="text-xs" style={{ color: 'rgba(255,255,255,0.65)' }}>{point}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Acceptance checkbox */}
      <div
        className="rounded-2xl p-4 cursor-pointer transition-all"
        style={{
          background: accepted ? 'rgba(0,255,136,0.08)' : 'rgba(255,255,255,0.04)',
          border: accepted ? '1.5px solid rgba(0,255,136,0.4)' : '1.5px solid rgba(255,255,255,0.12)',
        }}
        onClick={() => { setAccepted(!accepted); setError(''); }}
      >
        <div className="flex items-start gap-3">
          <div className="w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 mt-0.5 transition-all"
            style={{ background: accepted ? '#00ff88' : 'transparent', border: `2px solid ${accepted ? '#00ff88' : 'rgba(255,255,255,0.3)'}` }}>
            {accepted && <CheckCircle className="w-3.5 h-3.5" style={{ color: '#07071a' }} />}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-black text-white">I accept the terms & conditions</p>
            <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.5)' }}>
              I understand and agree to Matchify.pro's revenue disbursement model: 30% before tournament, 67% after, and a 3% platform service fee.
            </p>
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl"
          style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)' }}>
          <AlertCircle className="w-4 h-4 flex-shrink-0" style={{ color: '#f87171' }} />
          <p className="text-xs font-semibold" style={{ color: '#f87171' }}>{error}</p>
        </div>
      )}

      {/* Navigation buttons */}
      <div className="flex gap-3 pt-1">
        <button
          onClick={onPrev}
          className="flex-shrink-0 px-5 py-3 rounded-2xl font-bold text-sm transition-all"
          style={{ background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.12)' }}
        >
          Back
        </button>
        <button
          onClick={handleProceed}
          className="flex-1 py-3 rounded-2xl font-black text-sm transition-all flex items-center justify-center gap-2 relative overflow-hidden"
          style={{
            background: accepted ? 'linear-gradient(135deg,#00c853,#00ff88)' : 'rgba(255,255,255,0.08)',
            color: accepted ? '#07071a' : 'rgba(255,255,255,0.4)',
            border: accepted ? 'none' : '1px solid rgba(255,255,255,0.1)',
            boxShadow: accepted ? '0 4px 16px rgba(0,200,83,0.4)' : 'none',
          }}
        >
          <span>Continue to Review</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
