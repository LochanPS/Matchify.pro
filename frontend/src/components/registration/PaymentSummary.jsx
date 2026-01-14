import { QrCodeIcon } from '@heroicons/react/24/outline';

// Helper to get proper image URL
const getImageUrl = (url) => {
  if (!url) return null;
  if (url.startsWith('/uploads')) {
    const baseUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';
    return `${baseUrl}${url}`;
  }
  return url;
};

export default function PaymentSummary({ 
  selectedCategories, 
  categories,
  tournament
}) {
  // Calculate total amount
  const totalAmount = selectedCategories.reduce((sum, catId) => {
    const category = categories.find(c => c.id === catId);
    return sum + (category?.entryFee || 0);
  }, 0);

  const selectedCategoryDetails = selectedCategories.map(catId => 
    categories.find(c => c.id === catId)
  ).filter(Boolean);

  const qrImageUrl = getImageUrl(tournament?.paymentQRUrl);

  if (selectedCategories.length === 0) {
    return null;
  }

  return (
    <div className="bg-slate-800/50 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
      <h3 className="text-lg font-semibold text-white mb-4">
        Payment Summary
      </h3>

      {/* Selected Categories */}
      <div className="space-y-2 mb-4">
        {selectedCategoryDetails.map((category) => (
          <div key={category.id} className="flex justify-between text-sm">
            <span className="text-gray-400">{category.name}</span>
            <span className="font-medium text-white">₹{category.entryFee}</span>
          </div>
        ))}
      </div>

      <div className="border-t border-white/10 pt-4 mb-4">
        <div className="flex justify-between text-lg font-bold">
          <span className="text-white">Total Amount</span>
          <span className="text-purple-400">₹{totalAmount}</span>
        </div>
      </div>

      {/* Payment QR Code */}
      {qrImageUrl && (
        <div className="bg-slate-700/50 border border-white/10 rounded-xl p-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-3">
            <QrCodeIcon className="h-5 w-5 text-purple-400" />
            <h4 className="text-sm font-medium text-gray-300">
              Scan & Pay to Organizer
            </h4>
          </div>
          
          <div className="p-2 bg-slate-600/50 border border-white/10 rounded-xl inline-block">
            <img
              src={qrImageUrl}
              alt="Payment QR Code"
              className="w-48 h-48 mx-auto object-contain rounded-lg"
            />
          </div>
          
          {tournament.accountHolderName && (
            <p className="mt-3 text-sm font-medium text-white">
              {tournament.accountHolderName}
            </p>
          )}
          
          {tournament.upiId && (
            <p className="text-sm text-gray-400">
              UPI: {tournament.upiId}
            </p>
          )}
          
          <div className="mt-3 p-2 bg-amber-500/10 border border-amber-500/30 rounded-xl">
            <p className="text-xs text-amber-300">
              💡 Pay <strong className="text-amber-200">₹{totalAmount}</strong> using any UPI app
            </p>
          </div>
        </div>
      )}

      {/* No QR Code Message */}
      {!qrImageUrl && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
          <p className="text-sm text-amber-300">
            ⚠️ Payment QR not available. Please contact the organizer for payment details.
          </p>
          {tournament?.organizer && (
            <p className="text-sm text-amber-400/80 mt-2">
              Organizer: {tournament.organizer.name} ({tournament.organizer.email})
            </p>
          )}
        </div>
      )}

      {/* Payment Instructions */}
      <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/30 rounded-xl">
        <h4 className="text-sm font-medium text-blue-300 mb-2">How to Pay:</h4>
        <ol className="text-xs text-blue-400/80 space-y-1 list-decimal list-inside">
          <li>Scan the QR code with any UPI app</li>
          <li>Pay ₹{totalAmount} to the organizer</li>
          <li>Take a screenshot of the payment</li>
          <li>Click "Complete Registration" below</li>
          <li>Organizer will verify your payment</li>
        </ol>
      </div>
    </div>
  );
}
