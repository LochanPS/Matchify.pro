import { CheckCircleIcon, PencilIcon } from '@heroicons/react/24/outline';
import { formatDateIndian } from '../../../utils/dateFormat';
import { getGenderLabel } from '../../../utils/genderLabel';

const ReviewStep = ({ formData, goToStep, onPrev, onSubmit, isSubmitting }) => {
  const formatDate = (dateString) => {
    if (!dateString) return 'Not set';
    return formatDateIndian(dateString);
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 
          className="text-lg font-black mb-2"
          style={{
            background: 'linear-gradient(135deg, #D97706, #F59E0B)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}
        >
          Review & Submit
        </h2>
        <p className="text-gray-400 text-xs">Review all details before publishing</p>
      </div>

      {/* Basic Information */}
      <div className="rounded-xl p-3" style={{ background: 'rgba(0,0,0,0.3)', border: '1.5px solid rgba(255,255,255,0.1)' }}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
            <CheckCircleIcon className="h-4 w-4 text-green-500" />
            Basic Information
          </h3>
          <button
            onClick={() => goToStep(1)}
            className="text-purple-400 hover:text-purple-300 text-xs font-bold flex items-center gap-1"
          >
            <PencilIcon className="h-3 w-3" />
            Edit
          </button>
        </div>
        
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div>
            <span className="font-bold text-gray-400">Name:</span>
            <p className="text-white mt-0.5">{formData.name}</p>
          </div>
          <div>
            <span className="font-bold text-gray-400">Format:</span>
            <p className="text-white mt-0.5 capitalize">{formData.format}</p>
          </div>
          <div className="col-span-2">
            <span className="font-bold text-gray-400">Description:</span>
            <p className="text-white mt-0.5 text-xs">{formData.description}</p>
          </div>
          <div>
            <span className="font-bold text-gray-400">Venue:</span>
            <p className="text-white mt-0.5">{formData.venue}</p>
          </div>
          <div>
            <span className="font-bold text-gray-400">City:</span>
            <p className="text-white mt-0.5">{formData.city}, {formData.state}</p>
          </div>
          <div>
            <span className="font-bold text-gray-400">Zone:</span>
            <p className="text-white mt-0.5">{formData.zone}</p>
          </div>
          <div>
            <span className="font-bold text-gray-400">Privacy:</span>
            <p className="text-white mt-0.5 capitalize">{formData.privacy}</p>
          </div>
        </div>
      </div>

      {/* Dates */}
      <div className="rounded-xl p-3" style={{ background: 'rgba(0,0,0,0.3)', border: '1.5px solid rgba(255,255,255,0.1)' }}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
            <CheckCircleIcon className="h-4 w-4 text-green-500" />
            Important Dates
          </h3>
          <button
            onClick={() => goToStep(2)}
            className="text-purple-400 hover:text-purple-300 text-xs font-bold flex items-center gap-1"
          >
            <PencilIcon className="h-3 w-3" />
            Edit
          </button>
        </div>
        
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div>
            <span className="font-bold text-gray-400">Reg Opens:</span>
            <p className="text-white mt-0.5">{formatDate(formData.registrationOpenDate)}</p>
          </div>
          <div>
            <span className="font-bold text-gray-400">Reg Closes:</span>
            <p className="text-white mt-0.5">{formatDate(formData.registrationCloseDate)}</p>
          </div>
          <div>
            <span className="font-bold text-gray-400">Starts:</span>
            <p className="text-white mt-0.5">{formatDate(formData.startDate)}</p>
          </div>
          <div>
            <span className="font-bold text-gray-400">Ends:</span>
            <p className="text-white mt-0.5">{formatDate(formData.endDate)}</p>
          </div>
        </div>
      </div>

      {/* Posters */}
      <div className="rounded-xl p-3" style={{ background: 'rgba(0,0,0,0.3)', border: '1.5px solid rgba(255,255,255,0.1)' }}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
            <CheckCircleIcon className="h-4 w-4 text-green-500" />
            Posters
          </h3>
          <button
            onClick={() => goToStep(3)}
            className="text-purple-400 hover:text-purple-300 text-xs font-bold flex items-center gap-1"
          >
            <PencilIcon className="h-3 w-3" />
            Edit
          </button>
        </div>
        
        {formData.posters.length > 0 ? (
          <div className="grid grid-cols-3 gap-2">
            {formData.posters.map((poster, index) => (
              <div key={index} className="relative">
                <img
                  src={poster.preview}
                  alt={`Poster ${index + 1}`}
                  className="w-full h-20 object-cover rounded-lg"
                  style={{ border: '1.5px solid rgba(255,255,255,0.1)' }}
                />
                {poster.isPrimary && (
                  <span className="absolute top-1 left-1 text-white text-xs px-1.5 py-0.5 rounded font-bold" style={{ background: 'linear-gradient(135deg, #a855f7, #8b5cf6)', fontSize: '9px' }}>
                    Primary
                  </span>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-xs">No posters uploaded</p>
        )}
      </div>

      {/* Categories */}
      <div className="rounded-xl p-3" style={{ background: 'rgba(0,0,0,0.3)', border: '1.5px solid rgba(255,255,255,0.1)' }}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
            <CheckCircleIcon className="h-4 w-4 text-green-500" />
            Categories ({formData.categories.length})
          </h3>
          <button
            onClick={() => goToStep(4)}
            className="text-purple-400 hover:text-purple-300 text-xs font-bold flex items-center gap-1"
          >
            <PencilIcon className="h-3 w-3" />
            Edit
          </button>
        </div>
        
        <div className="space-y-2">
          {formData.categories.map((category, index) => (
            <div key={index} className="rounded-lg p-2" style={{ background: 'rgba(0,0,0,0.3)', border: '1.5px solid rgba(255,255,255,0.1)' }}>
              <h4 className="font-bold text-white mb-1.5 text-xs">{category.name}</h4>
              <div className="grid grid-cols-2 gap-1.5 text-xs text-gray-400">
                <div>
                  <span className="font-bold text-gray-300">Format:</span> {category.format}
                </div>
                <div>
                  <span className="font-bold text-gray-300">Gender:</span> {getGenderLabel(category.gender)}
                </div>
                {category.ageGroup && (
                  <div>
                    <span className="font-bold text-gray-300">Age:</span> {category.ageGroup}
                  </div>
                )}
                <div>
                  <span className="font-bold text-gray-300">Fee:</span> ₹{category.entryFee}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Payment QR */}
      <div className="rounded-xl p-3" style={{ background: 'rgba(0,0,0,0.3)', border: '1.5px solid rgba(255,255,255,0.1)' }}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
            <CheckCircleIcon className="h-4 w-4 text-green-500" />
            Payment QR
          </h3>
          <button
            onClick={() => goToStep(5)}
            className="text-purple-400 hover:text-purple-300 text-xs font-bold flex items-center gap-1"
          >
            <PencilIcon className="h-3 w-3" />
            Edit
          </button>
        </div>
        
        {formData.paymentQR ? (
          <div className="flex items-start gap-3">
            <img
              src={formData.paymentQR.preview}
              alt="Payment QR"
              className="w-20 h-20 object-contain rounded-lg bg-white p-1"
              style={{ border: '1.5px solid rgba(255,255,255,0.1)' }}
            />
            <div className="text-xs space-y-1">
              {formData.upiId && (
                <div>
                  <span className="font-bold text-gray-400">UPI ID:</span>
                  <p className="text-white">{formData.upiId}</p>
                </div>
              )}
              {formData.accountHolderName && (
                <div>
                  <span className="font-bold text-gray-400">Account:</span>
                  <p className="text-white">{formData.accountHolderName}</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <p className="text-gray-500 text-xs">
            {formData.upiId || formData.accountHolderName ? (
              <span className="text-gray-400">
                {formData.upiId && <span>UPI: {formData.upiId}</span>}
                {formData.upiId && formData.accountHolderName && <span> • </span>}
                {formData.accountHolderName && <span>Account: {formData.accountHolderName}</span>}
              </span>
            ) : (
              'No payment QR uploaded'
            )}
          </p>
        )}
      </div>

      {/* Important Notice */}
      <div className="rounded-xl p-3" style={{ background: 'rgba(245,158,11,0.1)', border: '1.5px solid rgba(245,158,11,0.3)' }}>
        <h4 className="font-bold text-amber-400 mb-1.5 text-xs">⚠️ Before You Submit:</h4>
        <ul className="text-xs text-amber-300/80 space-y-0.5">
          <li>• Double-check all dates and times</li>
          <li>• Ensure venue details are accurate</li>
          <li>• Verify category entry fees</li>
          <li>• Tournament created as "draft" - publish later</li>
          <li>• You can edit details after creation</li>
        </ul>
      </div>

      {/* Navigation */}
      <div className="flex justify-between pt-4 border-t border-white/10">
        <button
          onClick={onPrev}
          disabled={isSubmitting}
          className="px-5 py-2.5 rounded-xl font-bold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ background: 'rgba(100,116,139,0.5)', color: '#d1d5db' }}
        >
          ← Back
        </button>
        <button
          onClick={onSubmit}
          disabled={isSubmitting}
          className="px-6 py-2.5 rounded-xl font-bold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          style={{ 
            background: 'linear-gradient(135deg, #D97706, #F59E0B)',
            color: '#ffffff',
            boxShadow: '0 6px 20px rgba(245,158,11,0.4)'
          }}
        >
          {isSubmitting ? (
            <>
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Creating...
            </>
          ) : (
            <>
              <CheckCircleIcon className="h-4 w-4" />
              Create Tournament
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default ReviewStep;

