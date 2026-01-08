import { CheckCircleIcon, PencilIcon } from '@heroicons/react/24/outline';
import { formatDateIndian } from '../../../utils/dateFormat';

const ReviewStep = ({ formData, goToStep, onPrev, onSubmit, isSubmitting }) => {
  const formatDate = (dateString) => {
    if (!dateString) return 'Not set';
    return formatDateIndian(dateString);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Review & Submit</h2>
        <p className="text-gray-600 mt-1">Review all tournament details before publishing</p>
      </div>

      {/* Basic Information */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <CheckCircleIcon className="h-5 w-5 text-green-600" />
            Basic Information
          </h3>
          <button
            onClick={() => goToStep(1)}
            className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1"
          >
            <PencilIcon className="h-4 w-4" />
            Edit
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium text-gray-700">Tournament Name:</span>
            <p className="text-gray-900 mt-1">{formData.name}</p>
          </div>
          <div>
            <span className="font-medium text-gray-700">Format:</span>
            <p className="text-gray-900 mt-1 capitalize">{formData.format}</p>
          </div>
          <div className="md:col-span-2">
            <span className="font-medium text-gray-700">Description:</span>
            <p className="text-gray-900 mt-1">{formData.description}</p>
          </div>
          <div>
            <span className="font-medium text-gray-700">Venue:</span>
            <p className="text-gray-900 mt-1">{formData.venue}</p>
          </div>
          <div>
            <span className="font-medium text-gray-700">City:</span>
            <p className="text-gray-900 mt-1">{formData.city}, {formData.state}</p>
          </div>
          <div>
            <span className="font-medium text-gray-700">Zone:</span>
            <p className="text-gray-900 mt-1">{formData.zone}</p>
          </div>
          <div>
            <span className="font-medium text-gray-700">Privacy:</span>
            <p className="text-gray-900 mt-1 capitalize">{formData.privacy}</p>
          </div>
        </div>
      </div>

      {/* Dates */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <CheckCircleIcon className="h-5 w-5 text-green-600" />
            Important Dates
          </h3>
          <button
            onClick={() => goToStep(2)}
            className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1"
          >
            <PencilIcon className="h-4 w-4" />
            Edit
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium text-gray-700">Registration Opens:</span>
            <p className="text-gray-900 mt-1">{formatDate(formData.registrationOpenDate)}</p>
          </div>
          <div>
            <span className="font-medium text-gray-700">Registration Closes:</span>
            <p className="text-gray-900 mt-1">{formatDate(formData.registrationCloseDate)}</p>
          </div>
          <div>
            <span className="font-medium text-gray-700">Tournament Starts:</span>
            <p className="text-gray-900 mt-1">{formatDate(formData.startDate)}</p>
          </div>
          <div>
            <span className="font-medium text-gray-700">Tournament Ends:</span>
            <p className="text-gray-900 mt-1">{formatDate(formData.endDate)}</p>
          </div>
        </div>
      </div>

      {/* Posters */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <CheckCircleIcon className="h-5 w-5 text-green-600" />
            Tournament Posters
          </h3>
          <button
            onClick={() => goToStep(3)}
            className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1"
          >
            <PencilIcon className="h-4 w-4" />
            Edit
          </button>
        </div>
        
        {formData.posters.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {formData.posters.map((poster, index) => (
              <div key={index} className="relative">
                <img
                  src={poster.preview}
                  alt={`Poster ${index + 1}`}
                  className="w-full h-32 object-cover rounded-lg border border-gray-200"
                />
                {poster.isPrimary && (
                  <span className="absolute top-2 left-2 bg-blue-600 text-white text-xs px-2 py-1 rounded">
                    Primary
                  </span>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-sm">No posters uploaded</p>
        )}
      </div>

      {/* Categories */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <CheckCircleIcon className="h-5 w-5 text-green-600" />
            Categories ({formData.categories.length})
          </h3>
          <button
            onClick={() => goToStep(4)}
            className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1"
          >
            <PencilIcon className="h-4 w-4" />
            Edit
          </button>
        </div>
        
        <div className="space-y-3">
          {formData.categories.map((category, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 mb-2">{category.name}</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm text-gray-600">
                <div>
                  <span className="font-medium">Format:</span> {category.format}
                </div>
                <div>
                  <span className="font-medium">Gender:</span> {category.gender}
                </div>
                {category.ageGroup && (
                  <div>
                    <span className="font-medium">Age:</span> {category.ageGroup}
                  </div>
                )}
                <div>
                  <span className="font-medium">Fee:</span> ₹{category.entryFee}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Payment QR */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <CheckCircleIcon className="h-5 w-5 text-green-600" />
            Payment QR Code
          </h3>
          <button
            onClick={() => goToStep(5)}
            className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1"
          >
            <PencilIcon className="h-4 w-4" />
            Edit
          </button>
        </div>
        
        {formData.paymentQR ? (
          <div className="flex items-start gap-6">
            <img
              src={formData.paymentQR.preview}
              alt="Payment QR"
              className="w-32 h-32 object-contain border rounded-lg bg-white p-1"
            />
            <div className="text-sm space-y-2">
              {formData.upiId && (
                <div>
                  <span className="font-medium text-gray-700">UPI ID:</span>
                  <p className="text-gray-900">{formData.upiId}</p>
                </div>
              )}
              {formData.accountHolderName && (
                <div>
                  <span className="font-medium text-gray-700">Account Holder:</span>
                  <p className="text-gray-900">{formData.accountHolderName}</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <p className="text-gray-500 text-sm">
            {formData.upiId || formData.accountHolderName ? (
              <span>
                {formData.upiId && <span>UPI ID: {formData.upiId}</span>}
                {formData.upiId && formData.accountHolderName && <span> • </span>}
                {formData.accountHolderName && <span>Account: {formData.accountHolderName}</span>}
              </span>
            ) : (
              'No payment QR uploaded (players will pay via other methods)'
            )}
          </p>
        )}
      </div>

      {/* Important Notice */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h4 className="font-medium text-yellow-900 mb-2">⚠️ Before You Submit:</h4>
        <ul className="text-sm text-yellow-800 space-y-1">
          <li>• Double-check all dates and times</li>
          <li>• Ensure venue details are accurate</li>
          <li>• Verify category entry fees</li>
          <li>• Tournament will be created as "draft" - you can publish it later</li>
          <li>• You can edit tournament details after creation</li>
        </ul>
      </div>

      {/* Navigation */}
      <div className="flex justify-between pt-6 border-t">
        <button
          onClick={onPrev}
          disabled={isSubmitting}
          className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          ← Back
        </button>
        <button
          onClick={onSubmit}
          disabled={isSubmitting}
          className="px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {isSubmitting ? (
            <>
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Creating Tournament...
            </>
          ) : (
            <>
              <CheckCircleIcon className="h-5 w-5" />
              Create Tournament
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default ReviewStep;
