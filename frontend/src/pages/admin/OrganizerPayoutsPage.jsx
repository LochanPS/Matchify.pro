import { useState, useEffect } from 'react';
import { getPendingPayouts, markPayout50_1Paid, markPayout50_2Paid } from '../../api/payment';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const OrganizerPayoutsPage = () => {
  const navigate = useNavigate();
  const [payouts, setPayouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [processing, setProcessing] = useState(null);
  const [showNotesModal, setShowNotesModal] = useState(null);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    fetchPayouts();
  }, [filter]);

  const fetchPayouts = async () => {
    try {
      setLoading(true);
      const response = await getPendingPayouts(filter);
      setPayouts(response.data);
    } catch (error) {
      console.error('Error fetching payouts:', error);
      toast.error('Failed to load payouts');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkPaid = async (tournamentId, type) => {
    try {
      setProcessing(tournamentId + type);
      
      if (type === '50-1') {
        await markPayout50_1Paid(tournamentId, notes);
        toast.success('First 50% payout marked as paid!');
      } else {
        await markPayout50_2Paid(tournamentId, notes);
        toast.success('Second 50% payout marked as paid!');
      }
      
      setShowNotesModal(null);
      setNotes('');
      fetchPayouts();
    } catch (error) {
      console.error('Error marking payout:', error);
      toast.error('Failed to mark payout as paid');
    } finally {
      setProcessing(null);
    }
  };

  const openNotesModal = (tournamentId, type, amount) => {
    setShowNotesModal({ tournamentId, type, amount });
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

  const pending50_1 = payouts.filter(p => p.payout50Status1 === 'pending');
  const pending50_2 = payouts.filter(p => p.payout50Status2 === 'pending');

  return (
    <div className="min-h-screen bg-slate-900 p-6">
      {/* Back Button */}
      <button
        onClick={() => navigate('/admin-dashboard')}
        className="mb-6 flex items-center gap-2 text-gray-400 hover:text-teal-400 transition"
      >
        <span>←</span>
        <span>Back to Dashboard</span>
      </button>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Organizer Payouts</h1>
        <p className="text-gray-400">Manage pending payouts to tournament organizers</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 shadow-lg">
          <p className="text-gray-400 text-sm">Pending First 50% Payouts</p>
          <p className="text-4xl font-bold text-yellow-400 mt-2">{pending50_1.length}</p>
          <p className="text-gray-500 text-sm mt-2">
            Total: ₹{pending50_1.reduce((sum, p) => sum + p.payout50Percent1, 0).toLocaleString()}
          </p>
        </div>
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 shadow-lg">
          <p className="text-gray-400 text-sm">Pending Second 50% Payouts</p>
          <p className="text-4xl font-bold text-orange-400 mt-2">{pending50_2.length}</p>
          <p className="text-gray-500 text-sm mt-2">
            Total: ₹{pending50_2.reduce((sum, p) => sum + p.payout50Percent2, 0).toLocaleString()}
          </p>
        </div>
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 shadow-lg">
          <p className="text-gray-400 text-sm">Total Pending Amount</p>
          <p className="text-4xl font-bold text-teal-400 mt-2">
            ₹{(
              pending50_1.reduce((sum, p) => sum + p.payout50Percent1, 0) +
              pending50_2.reduce((sum, p) => sum + p.payout50Percent2, 0)
            ).toLocaleString()}
          </p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-4 mb-6">
        {['all', '50-1', '50-2'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-6 py-2 rounded-lg font-medium transition ${
              filter === f
                ? 'bg-teal-600 text-white shadow-lg shadow-teal-500/50'
                : 'bg-slate-800 text-gray-400 hover:bg-slate-700'
            }`}
          >
            {f === 'all' ? 'All Pending' : f === '50-1' ? 'Pending First 50%' : 'Pending Second 50%'}
          </button>
        ))}
      </div>

      {/* Payouts List */}
      <div className="space-y-6">
        {payouts.length === 0 ? (
          <div className="bg-slate-800 rounded-xl p-12 text-center border border-slate-700">
            <div className="text-6xl mb-4">✅</div>
            <p className="text-gray-400 text-lg">No pending payouts!</p>
            <p className="text-gray-500 text-sm mt-2">All payouts have been processed</p>
          </div>
        ) : (
          payouts.map((payout) => (
            <div
              key={payout.tournamentId}
              className="bg-slate-800 rounded-xl p-6 border border-slate-700 shadow-lg hover:shadow-teal-500/20 transition"
            >
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Tournament Info */}
                <div className="lg:col-span-1">
                  <h3 className="text-lg font-bold text-white mb-3">{payout.tournament.name}</h3>
                  <div className="space-y-2 text-sm">
                    <p className="text-gray-400">
                      📍 {payout.tournament.city}, {payout.tournament.state}
                    </p>
                    <p className="text-gray-400">
                      📅 {new Date(payout.tournament.startDate).toLocaleDateString()}
                    </p>
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                      payout.tournament.status === 'completed'
                        ? 'bg-green-900/50 text-green-400'
                        : 'bg-blue-900/50 text-blue-400'
                    }`}>
                      {payout.tournament.status}
                    </span>
                  </div>
                </div>

                {/* Organizer Info */}
                <div className="lg:col-span-1">
                  <h4 className="text-sm font-semibold text-gray-400 mb-3">Organizer Details</h4>
                  <div className="space-y-2 text-sm">
                    <p className="text-white font-medium">{payout.tournament.organizer.name}</p>
                    <p className="text-gray-400">{payout.tournament.organizer.email}</p>
                    <p className="text-gray-400">{payout.tournament.organizer.phone}</p>
                    {payout.organizerUpiId && (
                      <div className="mt-3 p-2 bg-slate-900 rounded">
                        <p className="text-gray-400 text-xs mb-1">UPI ID</p>
                        <p className="text-teal-400 font-mono">{payout.organizerUpiId}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Payment Details */}
                <div className="lg:col-span-1">
                  <h4 className="text-sm font-semibold text-gray-400 mb-3">Payment Breakdown</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Total Collected</span>
                      <span className="text-white font-medium">
                        ₹{payout.totalCollected.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Platform Fee (5%)</span>
                      <span className="text-teal-400 font-medium">
                        ₹{payout.platformFeeAmount.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-slate-700">
                      <span className="text-gray-400">Organizer Share</span>
                      <span className="text-white font-bold">
                        ₹{payout.organizerShare.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Payout Actions */}
                <div className="lg:col-span-1">
                  <h4 className="text-sm font-semibold text-gray-400 mb-3">Payout Actions</h4>
                  <div className="space-y-3">
                    {/* First 50% Payout */}
                    {payout.payout50Status1 === 'pending' && (
                      <div className="p-3 bg-yellow-900/20 border border-yellow-700 rounded-lg">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-yellow-300 text-sm font-medium">First 50%</span>
                          <span className="text-yellow-400 font-bold">
                            ₹{payout.payout50Percent1.toLocaleString()}
                          </span>
                        </div>
                        <button
                          onClick={() => openNotesModal(payout.tournamentId, '50-1', payout.payout50Percent1)}
                          disabled={processing === payout.tournamentId + '50-1'}
                          className="w-full bg-yellow-600 hover:bg-yellow-700 text-white font-medium py-2 px-4 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                        >
                          {processing === payout.tournamentId + '50-1' ? 'Processing...' : '✅ Mark as Paid'}
                        </button>
                      </div>
                    )}

                    {payout.payout50Status1 === 'paid' && (
                      <div className="p-3 bg-green-900/20 border border-green-700 rounded-lg">
                        <div className="flex justify-between items-center">
                          <span className="text-green-300 text-sm">First 50% Paid</span>
                          <span className="text-green-400 font-bold">
                            ₹{payout.payout50Percent1.toLocaleString()}
                          </span>
                        </div>
                        {payout.payout50PaidAt1 && (
                          <p className="text-green-600 text-xs mt-1">
                            {new Date(payout.payout50PaidAt1).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Second 50% Payout */}
                    {payout.payout50Status2 === 'pending' && (
                      <div className="p-3 bg-orange-900/20 border border-orange-700 rounded-lg">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-orange-300 text-sm font-medium">Second 50%</span>
                          <span className="text-orange-400 font-bold">
                            ₹{payout.payout50Percent2.toLocaleString()}
                          </span>
                        </div>
                        <button
                          onClick={() => openNotesModal(payout.tournamentId, '50-2', payout.payout50Percent2)}
                          disabled={processing === payout.tournamentId + '50-2'}
                          className="w-full bg-orange-600 hover:bg-orange-700 text-white font-medium py-2 px-4 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                        >
                          {processing === payout.tournamentId + '50-2' ? 'Processing...' : '✅ Mark as Paid'}
                        </button>
                      </div>
                    )}

                    {payout.payout50Status2 === 'paid' && (
                      <div className="p-3 bg-green-900/20 border border-green-700 rounded-lg">
                        <div className="flex justify-between items-center">
                          <span className="text-green-300 text-sm">Second 50% Paid</span>
                          <span className="text-green-400 font-bold">
                            ₹{payout.payout50Percent2.toLocaleString()}
                          </span>
                        </div>
                        {payout.payout50PaidAt2 && (
                          <p className="text-green-600 text-xs mt-1">
                            {new Date(payout.payout50PaidAt2).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Notes Modal */}
      {showNotesModal && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-xl p-8 max-w-md w-full border border-slate-700">
            <h3 className="text-2xl font-bold text-white mb-4">
              Confirm {showNotesModal.type === '50-1' ? 'First' : 'Second'} 50% Payout
            </h3>
            <div className="bg-slate-900 rounded-lg p-4 mb-4">
              <p className="text-gray-400 text-sm">Amount to be paid:</p>
              <p className="text-3xl font-bold text-teal-400 mt-1">
                ₹{showNotesModal.amount.toLocaleString()}
              </p>
            </div>
            <p className="text-gray-400 mb-4">
              Add notes (optional):
            </p>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-slate-900 text-white border border-slate-700 rounded-lg p-4 mb-4 focus:outline-none focus:ring-2 focus:ring-teal-500"
              rows="3"
              placeholder="e.g., Paid via UPI, Transaction ID: XXXXXX"
            />
            <div className="flex gap-4">
              <div className="flex-1 relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-teal-500 to-cyan-500 rounded-xl blur-lg opacity-50 group-hover:opacity-100 transition duration-300"></div>
                <button
                  onClick={() => handleMarkPaid(showNotesModal.tournamentId, showNotesModal.type)}
                  disabled={processing}
                  className="relative w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-3 px-6 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Confirm Payment
                </button>
              </div>
              <button
                onClick={() => {
                  setShowNotesModal(null);
                  setNotes('');
                }}
                disabled={processing}
                className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 px-6 rounded-lg transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrganizerPayoutsPage;
