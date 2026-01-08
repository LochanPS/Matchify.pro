import { useState } from 'react';
import { X } from 'lucide-react';
import axios from 'axios';

const TopUpModal = ({ onClose, onSuccess }) => {
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);

  const quickAmounts = [25, 50, 100, 500, 1000];

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
      alert('Minimum top-up amount is ₹25');
      return;
    }

    if (topUpAmount > 50000) {
      alert('Maximum top-up amount is ₹50,000');
      return;
    }

    try {
      setLoading(true);

      // Load Razorpay script
      const res = await loadRazorpay();
      if (!res) {
        alert('Failed to load payment gateway');
        return;
      }

      const token = localStorage.getItem('token');

      // Create Razorpay order
      const orderRes = await axios.post(
        'http://localhost:5000/api/wallet/topup',
        { amount: topUpAmount },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const { orderId, razorpayKey } = orderRes.data.data;

      // Initialize Razorpay
      const options = {
        key: razorpayKey,
        amount: topUpAmount * 100, // Convert to paise
        currency: 'INR',
        name: 'Matchify',
        description: 'Wallet Top-up',
        order_id: orderId,
        handler: async function (response) {
          try {
            // Verify payment
            await axios.post(
              'http://localhost:5000/api/wallet/topup/verify',
              {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature
              },
              { headers: { Authorization: `Bearer ${token}` } }
            );

            alert('Top-up successful! ✅');
            onSuccess();
          } catch (error) {
            console.error('Payment verification failed:', error);
            alert('Payment verification failed. Please contact support.');
          }
        },
        prefill: {
          name: localStorage.getItem('userName') || '',
          email: localStorage.getItem('userEmail') || '',
        },
        theme: {
          color: '#2563eb'
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
        alert('Payment failed: ' + response.error.description);
        setLoading(false);
      });

    } catch (error) {
      console.error('Top-up error:', error);
      alert('Failed to initiate payment');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Top Up Wallet</h2>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            disabled={loading}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Amount Input */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Enter Amount
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-lg">
              ₹
            </span>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0"
              disabled={loading}
              className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg text-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
            />
          </div>
          <p className="text-sm text-gray-500 mt-2">
            Min: ₹25 | Max: ₹50,000
          </p>
        </div>

        {/* Quick Amounts */}
        <div className="mb-6">
          <p className="text-sm font-medium text-gray-700 mb-3">Quick Select</p>
          <div className="grid grid-cols-5 gap-2">
            {quickAmounts.map(amt => (
              <button
                key={amt}
                onClick={() => setAmount(amt.toString())}
                disabled={loading}
                className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-blue-50 hover:border-blue-500 transition text-sm font-medium disabled:opacity-50"
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
            className="flex-1 px-6 py-3 border border-gray-300 rounded-lg font-semibold hover:bg-gray-50 transition disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleTopUp}
            disabled={loading}
            className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Processing...' : 'Proceed to Pay'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TopUpModal;