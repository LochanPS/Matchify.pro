import { useState } from 'react';
import { X, Wallet } from 'lucide-react';
import api from '../../utils/api';

const TopUpModal = ({ onClose, onSuccess }) => {
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertType, setAlertType] = useState('error');

  const quickAmounts = [25, 50, 100, 500, 1000];

  const showAlertModal = (message, type = 'error') => {
    setAlertMessage(message);
    setAlertType(type);
    setShowAlert(true);
  };

  const loadRazorpay = () => {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleTopUp = async () => {
    const topUpAmount = parseFloat(amount);
    
    if (!topUpAmount || topUpAmount < 25) {
      showAlertModal('Minimum top-up amount is ₹25');
      return;
    }

    if (topUpAmount > 50000) {
      showAlertModal('Maximum top-up amount is ₹50,000');
      return;
    }

    try {
      setLoading(true);

      // Load Razorpay script
      const res = await loadRazorpay();
      if (!res) {
        showAlertModal('Failed to load payment gateway');
        return;
      }

      const token = localStorage.getItem('token');

      // Create Razorpay order
      const orderRes = await api.post('/wallet/topup', { amount: topUpAmount });

      const { orderId, razorpayKey } = orderRes.data.data;

      // Initialize Razorpay
      const options = {
        key: razorpayKey,
        amount: topUpAmount * 100, // Convert to paise
        currency: 'INR',
        name: 'Matchify.pro',
        description: 'Wallet Top-up',
        order_id: orderId,
        handler: async function (response) {
          try {
            // Verify payment
            await api.post('/wallet/topup/verify', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature
            });

            showAlertModal('Top-up successful! ✅', 'success');
            setTimeout(() => {
              onSuccess();
            }, 1500);
          } catch (error) {
            console.error('Payment verification failed:', error);
            showAlertModal('Payment verification failed. Please contact support.');
          }
        },
        prefill: {
          name: localStorage.getItem('userName') || '',
          email: localStorage.getItem('userEmail') || '',
        },
        theme: {
          color: '#7c3aed'
        },
        modal: {
          ondismiss: function() {
            setLoading(false);
          }
        }
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();

      razorpay.on('payment.failed', function (response) {
        showAlertModal('Payment failed: ' + response.error.description);
        setLoading(false);
      });

    } catch (error) {
      console.error('Top-up error:', error);
      showAlertModal('Failed to initiate payment');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      {/* Halo Effect */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-96 h-96 bg-gradient-to-r from-purple-500/30 via-indigo-500/30 to-purple-500/30 rounded-full blur-3xl"></div>
      </div>
      
      <div className="relative bg-slate-800 border border-white/10 rounded-2xl max-w-md w-full overflow-hidden">
        {/* Header with gradient */}
        <div className="relative bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-5">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0wIDBoNDB2NDBIMHoiLz48cGF0aCBkPSJNMjAgMjBtLTEgMGExIDEgMCAxIDAgMiAwYTEgMSAwIDEgMCAtMiAwIiBmaWxsPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMSkiLz48L2c+PC9zdmc+')] opacity-30"></div>
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                <Wallet className="text-white" size={20} />
              </div>
              <h2 className="text-xl font-bold text-white">Top Up Wallet</h2>
            </div>
            <button 
              onClick={onClose}
              disabled={loading}
              className="text-white/70 hover:text-white hover:bg-white/10 rounded-lg p-1.5 transition-colors disabled:opacity-50"
            >
              <X size={22} />
            </button>
          </div>
        </div>

        <div className="p-6">
          {/* Amount Input */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Enter Amount
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg">
                ₹
              </span>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0"
                disabled={loading}
                className="w-full pl-8 pr-4 py-3 bg-slate-700/50 border border-white/10 rounded-xl text-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:opacity-50 transition-all"
              />
            </div>
            <p className="text-sm text-gray-400 mt-2">
              Min: ₹25 | Max: ₹50,000
            </p>
          </div>

          {/* Quick Amounts */}
          <div className="mb-6">
            <p className="text-sm font-medium text-gray-300 mb-3">Quick Select</p>
            <div className="grid grid-cols-5 gap-2">
              {quickAmounts.map(amt => (
                <button
                  key={amt}
                  onClick={() => setAmount(amt.toString())}
                  disabled={loading}
                  className={`px-3 py-2 border rounded-xl transition-all text-sm font-medium disabled:opacity-50 ${
                    amount === amt.toString()
                      ? 'bg-purple-500/20 border-purple-500/50 text-purple-300'
                      : 'bg-slate-700/30 border-white/10 text-gray-300 hover:bg-slate-700/50 hover:border-purple-500/30'
                  }`}
                >
                  ₹{amt}
                </button>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-6 py-3 bg-slate-700/50 border border-white/10 text-gray-300 rounded-xl font-semibold hover:bg-slate-700 hover:text-white transition-all disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleTopUp}
              disabled={loading}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-purple-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Processing...' : 'Proceed to Pay'}
            </button>
          </div>
        </div>
      </div>

      {/* Alert Modal */}
      {showAlert && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
          <div className={`relative bg-slate-800 border rounded-2xl p-6 max-w-sm w-full text-center ${
            alertType === 'success' ? 'border-emerald-500/30' : 'border-red-500/30'
          }`}>
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
              alertType === 'success' ? 'bg-emerald-500/20' : 'bg-red-500/20'
            }`}>
              <span className="text-3xl">{alertType === 'success' ? '✅' : '⚠️'}</span>
            </div>
            <p className="text-white mb-6">{alertMessage}</p>
            <button
              onClick={() => setShowAlert(false)}
              className={`w-full py-3 rounded-xl font-medium transition-all ${
                alertType === 'success'
                  ? 'bg-gradient-to-r from-emerald-500 to-green-600 text-white hover:shadow-lg hover:shadow-emerald-500/25'
                  : 'bg-gradient-to-r from-red-500 to-red-600 text-white hover:shadow-lg hover:shadow-red-500/25'
              }`}
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TopUpModal;
