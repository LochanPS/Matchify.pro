import { QrCodeIcon } from '@heroicons/react/24/outline';
import { useState, useEffect } from 'react';
import { getPublicPaymentSettings } from '../../api/payment';

const getImageUrl = (url) => {
  if (!url) return null;
  if (url.startsWith('/uploads')) {
    const baseUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'https://matchify-probackend.vercel.app';
    return `${baseUrl}${url}`;
  }
  return url;
};

export default function PaymentSummary({ selectedCategories, categories, tournament }) {
  const [adminPaymentSettings, setAdminPaymentSettings] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAdminPaymentSettings = async () => {
      try {
        const response = await getPublicPaymentSettings();
        setAdminPaymentSettings(response.data);
      } catch (error) {
        console.error('Error fetching admin payment settings:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchAdminPaymentSettings();
  }, []);

  const totalAmount = selectedCategories.reduce((sum, catId) => {
    const category = categories.find(c => c.id === catId);
    return sum + (category?.entryFee || 0);
  }, 0);

  const selectedCategoryDetails = selectedCategories
    .map(catId => categories.find(c => c.id === catId))
    .filter(Boolean);

  const qrImageUrl = adminPaymentSettings?.qrCodeUrl ? getImageUrl(adminPaymentSettings.qrCodeUrl) : null;

  if (selectedCategories.length === 0) return null;

  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
      {/* Header */}
      <div className="px-4 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)', background: 'rgba(168,85,247,0.05)' }}>
        <p className="text-xs font-black uppercase tracking-widest" style={{ color: 'rgba(168,85,247,0.8)' }}>
          Payment Summary
        </p>
      </div>

      <div className="p-4 space-y-3">
        {/* Category breakdown */}
        <div className="space-y-2">
          {selectedCategoryDetails.map(category => (
            <div key={category.id} className="flex justify-between text-sm">
              <span style={{ color: 'rgba(255,255,255,0.55)' }}>{category.name}</span>
              <span className="font-bold text-white">₹{category.entryFee}</span>
            </div>
          ))}
        </div>

        {/* Total */}
        <div className="flex justify-between items-center pt-3 mt-1"
          style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <span className="text-sm font-black text-white">Total</span>
          <span className="text-2xl font-black" style={{ color: '#a855f7' }}>₹{totalAmount}</span>
        </div>

        {/* QR Code */}
        {loading ? (
          <div className="flex items-center justify-center py-6">
            <div className="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin"
              style={{ borderColor: '#a855f7 transparent transparent transparent' }} />
          </div>
        ) : qrImageUrl ? (
          <div className="rounded-xl p-4 text-center"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <div className="flex items-center justify-center gap-1.5 mb-3">
              <QrCodeIcon className="h-4 w-4" style={{ color: '#a855f7' }} />
              <p className="text-xs font-black" style={{ color: 'rgba(255,255,255,0.6)' }}>Scan & Pay · Matchify.pro</p>
            </div>
            <div className="inline-block p-2 bg-white rounded-xl">
              <img src={qrImageUrl} alt="Payment QR" className="w-44 h-44 object-contain rounded-lg mx-auto" />
            </div>
            <div className="mt-2">
              <a
                href={qrImageUrl}
                download="matchify-payment-qr.png"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all active:scale-95"
                style={{
                  background: 'rgba(0,255,136,0.10)',
                  border: '1px solid rgba(0,255,136,0.30)',
                  color: '#00ff88',
                  textDecoration: 'none',
                }}
              >
                ⬇️ Download QR Code
              </a>
            </div>
            {adminPaymentSettings?.accountHolderName && (
              <p className="mt-2.5 text-xs font-bold text-white">{adminPaymentSettings.accountHolderName}</p>
            )}
            {adminPaymentSettings?.upiId && (
              <p className="text-xs" style={{ color: 'rgba(255,255,255,0.45)' }}>UPI: {adminPaymentSettings.upiId}</p>
            )}
            <div className="mt-3 px-3 py-2 rounded-xl text-xs font-semibold"
              style={{ background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.2)', color: '#fbbf24' }}>
              Pay <strong>₹{totalAmount}</strong> using any UPI app
            </div>
            <div className="mt-2 px-3 py-2 rounded-xl text-xs"
              style={{ background: 'rgba(0,212,255,0.06)', border: '1px solid rgba(0,212,255,0.18)', color: 'rgba(0,212,255,0.8)' }}>
              🔒 All payments go to Matchify.pro. Organizer paid after verification.
            </div>
          </div>
        ) : (
          <div className="px-3 py-3 rounded-xl text-xs font-semibold"
            style={{ background: 'rgba(251,191,36,0.07)', border: '1px solid rgba(251,191,36,0.2)', color: '#fbbf24' }}>
            ⚠️ Payment QR not available. Contact support.
          </div>
        )}

        {/* How to pay */}
        <div className="px-3 py-3 rounded-xl" style={{ background: 'rgba(0,212,255,0.05)', border: '1px solid rgba(0,212,255,0.15)' }}>
          <p className="text-xs font-black mb-2" style={{ color: 'rgba(0,212,255,0.8)' }}>How to pay:</p>
          {['Scan QR with any UPI app', `Pay ₹${totalAmount} to Matchify.pro`, 'Screenshot the payment', 'Upload below → we verify & confirm'].map((t, i) => (
            <div key={i} className="flex items-start gap-1.5 mt-1">
              <span className="text-xs font-black" style={{ color: '#00d4ff' }}>{i + 1}.</span>
              <p className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>{t}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
