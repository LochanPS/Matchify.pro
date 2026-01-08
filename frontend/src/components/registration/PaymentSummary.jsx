import { QrCodeIcon } from '@heroicons/react/24/outline';

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

  if (selectedCategories.length === 0) {
    return null;
  }

  return (
    <div className="bg-white border-2 border-gray-200 rounded-lg p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Payment Summary
      </h3>

      {/* Selected Categories */}
      <div className="space-y-2 mb-4">
        {selectedCategoryDetails.map((category) => (
          <div key={category.id} className="flex justify-between text-sm">
            <span className="text-gray-600">{category.name}</span>
            <span className="font-medium text-gray-900">₹{category.entryFee}</span>
          </div>
        ))}
      </div>

      <div className="border-t border-gray-200 pt-4 mb-4">
        <div className="flex justify-between text-lg font-bold">
          <span className="text-gray-900">Total Amount</span>
          <span className="text-green-600">₹{totalAmount}</span>
        </div>
      </div>

      {/* Payment QR Code */}
      {tournament?.paymentQRUrl && (
        <div className="bg-gray-50 rounded-lg p-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-3">
            <QrCodeIcon className="h-5 w-5 text-blue-600" />
            <h4 className="text-sm font-medium text-gray-700">
              Scan & Pay to Organizer
            </h4>
          </div>
          
          <img
            src={tournament.paymentQRUrl}
            alt="Payment QR Code"
            className="w-48 h-48 mx-auto object-contain border rounded-lg bg-white p-2"
          />
          
          {tournament.accountHolderName && (
            <p className="mt-3 text-sm font-medium text-gray-900">
              {tournament.accountHolderName}
            </p>
          )}
          
          {tournament.upiId && (
            <p className="text-sm text-gray-600">
              UPI: {tournament.upiId}
            </p>
          )}
          
          <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-xs text-yellow-800">
              💡 Pay <strong>₹{totalAmount}</strong> using any UPI app
            </p>
          </div>
        </div>
      )}

      {/* No QR Code Message */}
      {!tournament?.paymentQRUrl && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-sm text-yellow-800">
            ⚠️ Payment QR not available. Please contact the organizer for payment details.
          </p>
          {tournament?.organizer && (
            <p className="text-sm text-yellow-700 mt-2">
              Organizer: {tournament.organizer.name} ({tournament.organizer.email})
            </p>
          )}
        </div>
      )}

      {/* Payment Instructions */}
      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <h4 className="text-sm font-medium text-blue-900 mb-2">How to Pay:</h4>
        <ol className="text-xs text-blue-800 space-y-1 list-decimal list-inside">
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
