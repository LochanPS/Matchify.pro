import { useState, useEffect } from 'react';
import { getPaymentSettings, updatePaymentSettings } from '../../api/payment';
import { toast } from 'react-hot-toast';

const QRSettingsPage = () => {
  const [settings, setSettings] = useState({
    upiId: '',
    accountHolder: '',
    qrCodeUrl: null
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    upiId: '',
    accountHolder: '',
  });
  const [qrFile, setQrFile] = useState(null);
  const [qrPreview, setQrPreview] = useState(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await getPaymentSettings();
      if (response?.data) {
        setSettings(response.data);
        setFormData({
          upiId: response.data.upiId || '',
          accountHolder: response.data.accountHolder || '',
        });
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
      // Don't show error toast - settings might not exist yet
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size must be less than 5MB');
        return;
      }
      setQrFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setQrPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.upiId || !formData.accountHolder) {
      toast.error('Please fill all required fields');
      return;
    }

    try {
      setSaving(true);
      const data = new FormData();
      data.append('upiId', formData.upiId);
      data.append('accountHolder', formData.accountHolder);
      if (qrFile) {
        data.append('qrCode', qrFile);
      }

      await updatePaymentSettings(data);
      toast.success('Payment settings updated successfully!');
      fetchSettings();
      setQrFile(null);
      setQrPreview(null);
    } catch (error) {
      console.error('Error updating settings:', error);
      toast.error('Failed to update settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500 mx-auto"></div>
          <p className="mt-4 text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Payment QR Code Settings</h1>
        <p className="text-gray-400">Upload your UPI QR code so Matchify.pro can pay you your tournament earnings</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Current Settings */}
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 shadow-lg">
          <h2 className="text-xl font-bold text-white mb-6">Current Settings</h2>

          {/* Current QR Code */}
          <div className="mb-6">
            <p className="text-gray-400 text-sm mb-3">Current QR Code</p>
            {settings?.qrCodeUrl ? (
              <div className="bg-slate-900 rounded-lg p-4 border border-slate-700">
                <img
                  src={settings.qrCodeUrl.startsWith('http') ? settings.qrCodeUrl : `http://localhost:5000${settings.qrCodeUrl}`}
                  alt="Payment QR Code"
                  className="w-full max-w-sm mx-auto"
                  onError={(e) => {
                    console.error('Failed to load QR code:', settings.qrCodeUrl);
                    e.target.style.display = 'none';
                    e.target.parentElement.innerHTML = '<p class="text-red-400 text-center">Failed to load QR code</p>';
                  }}
                />
              </div>
            ) : (
              <div className="bg-slate-900 rounded-lg p-8 border border-slate-700 text-center">
                <p className="text-gray-500">No QR code uploaded yet</p>
              </div>
            )}
          </div>

          {/* Current Details */}
          <div className="space-y-4">
            <div>
              <p className="text-gray-400 text-sm">UPI ID</p>
              <p className="text-white font-mono text-lg mt-1">{settings?.upiId}</p>
            </div>
            <div>
              <p className="text-gray-400 text-sm">Account Holder Name</p>
              <p className="text-white font-medium text-lg mt-1">{settings?.accountHolder}</p>
            </div>
            <div>
              <p className="text-gray-400 text-sm">Status</p>
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium mt-1 ${
                settings?.isActive
                  ? 'bg-green-900/50 text-green-400'
                  : 'bg-red-900/50 text-red-400'
              }`}>
                {settings?.isActive ? '✅ Active' : '❌ Inactive'}
              </span>
            </div>
          </div>
        </div>

        {/* Update Form */}
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 shadow-lg">
          <h2 className="text-xl font-bold text-white mb-6">Update Settings</h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* UPI ID */}
            <div>
              <label className="block text-gray-400 text-sm mb-2">
                Your UPI ID <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={formData.upiId}
                onChange={(e) => setFormData({ ...formData, upiId: e.target.value })}
                placeholder="yourname@upi or 9876543210@paytm"
                className="w-full bg-slate-900 text-white border border-slate-700 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-teal-500"
                required
              />
              <p className="text-gray-500 text-xs mt-1">Matchify.pro will transfer your earnings to this UPI ID</p>
            </div>

            {/* Account Holder */}
            <div>
              <label className="block text-gray-400 text-sm mb-2">
                Your Account Holder Name <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={formData.accountHolder}
                onChange={(e) => setFormData({ ...formData, accountHolder: e.target.value })}
                placeholder="Your Full Name"
                className="w-full bg-slate-900 text-white border border-slate-700 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-teal-500"
                required
              />
              <p className="text-gray-500 text-xs mt-1">Name as per your bank account</p>
            </div>

            {/* QR Code Upload */}
            <div>
              <label className="block text-gray-400 text-sm mb-2">
                Upload Your QR Code <span className="text-teal-400">(So Matchify.pro can pay you)</span>
              </label>
              <div className="border-2 border-dashed border-slate-700 rounded-lg p-6 text-center hover:border-teal-500 transition">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                  id="qr-upload"
                />
                <label htmlFor="qr-upload" className="cursor-pointer">
                  {qrPreview ? (
                    <div>
                      <img
                        src={qrPreview}
                        alt="QR Preview"
                        className="w-48 h-48 object-contain mx-auto mb-4"
                      />
                      <p className="text-teal-400">Click to change</p>
                    </div>
                  ) : (
                    <div>
                      <div className="text-6xl mb-4">📱</div>
                      <p className="text-white font-medium mb-2">Upload your UPI QR code</p>
                      <p className="text-gray-400 text-sm">PNG, JPG up to 5MB</p>
                      <p className="text-teal-400 text-xs mt-2">Matchify.pro will use this to pay you</p>
                    </div>
                  )}
                </label>
              </div>
            </div>

            {/* Submit Button */}
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-teal-500 to-cyan-500 rounded-xl blur-lg opacity-50 group-hover:opacity-100 transition duration-300"></div>
              <button
                type="submit"
                disabled={saving}
                className="relative w-full bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white font-bold py-4 px-6 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
              >
                {saving ? 'Saving...' : '💾 Save Settings'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Info Box */}
      <div className="mt-8 bg-teal-900/20 border border-teal-700 rounded-xl p-6">
        <div className="flex items-start gap-4">
          <div className="text-3xl">💰</div>
          <div>
            <h3 className="text-white font-bold mb-2">How Payments Work</h3>
            <ul className="text-gray-300 space-y-2 text-sm">
              <li>• <strong className="text-teal-400">Players pay to Matchify.pro's QR code</strong> during tournament registration</li>
              <li>• <strong className="text-teal-400">Matchify.pro collects all payments</strong> and keeps 5% platform fee</li>
              <li>• <strong className="text-teal-400">Upload your QR code here</strong> so Matchify.pro can pay you</li>
              <li>• You'll receive <strong className="text-yellow-400">30% before the tournament</strong> and <strong className="text-yellow-400">65% after completion</strong></li>
              <li>• Make sure your QR code and UPI ID are correct to receive payments smoothly</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QRSettingsPage;
