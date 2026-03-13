import { useState, useEffect } from 'react';
import { getRevenueOverview, getRevenueTimeline, deleteAllData } from '../../api/payment';
import { toast } from 'react-hot-toast';
import { Link, useNavigate } from 'react-router-dom';

const RevenueDashboardPage = () => {
  const navigate = useNavigate();
  const [overview, setOverview] = useState({
    platformFees: { total: 0, percentage: 5, description: '' },
    totalCollected: 0,
    organizerShare: 0,
    pendingPayouts: 0,
    balanceInHand: 0,
    breakdown: {
      collected: 0,
      yourShare: 0,
      organizerShare: 0,
      alreadyPaid: 0,
      pendingPayout: 0
    },
    stats: {
      tournaments: 0,
      registrations: 0,
      averagePerTournament: 0,
      averagePerRegistration: 0
    }
  });
  const [timeline, setTimeline] = useState([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('daily');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchData();
  }, [period]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [overviewData, timelineData] = await Promise.all([
        getRevenueOverview(),
        getRevenueTimeline({ period }),
      ]);
      
      // Only update if data exists
      if (overviewData?.data) {
        setOverview(overviewData.data);
      }
      if (timelineData?.data) {
        setTimeline(timelineData.data);
      }
    } catch (error) {
      console.error('Error fetching revenue data:', error);
      toast.error('Failed to load revenue data');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAllData = async () => {
    if (!deletePassword) {
      toast.error('Please enter the password');
      return;
    }

    try {
      setDeleting(true);
      const response = await deleteAllData(deletePassword);

      toast.success('All data deleted successfully! System reset.');
      setShowDeleteModal(false);
      setDeletePassword('');
      
      // Refresh the page after 2 seconds
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (error) {
      console.error('Error deleting data:', error);
      toast.error(error.message || 'Failed to delete data');
    } finally {
      setDeleting(false);
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
        <h1 className="text-3xl font-bold text-white mb-2">Revenue Analytics</h1>
        <p className="text-gray-400">Complete financial overview and insights</p>
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Your Platform Fees */}
        <div className="bg-gradient-to-br from-teal-600 to-teal-700 rounded-xl p-6 shadow-lg shadow-teal-500/50">
          <div className="flex items-center justify-between mb-4">
            <div className="text-4xl">💰</div>
            <div className="bg-white/20 rounded-lg px-3 py-1">
              <p className="text-white text-xs font-bold">{overview.platformFees.percentage}%</p>
            </div>
          </div>
          <p className="text-teal-100 text-sm mb-2">Your Platform Fees</p>
          <p className="text-4xl font-bold text-white mb-2">
            ₹{overview.platformFees.total.toLocaleString()}
          </p>
          <p className="text-teal-100 text-xs">{overview.platformFees.description}</p>
        </div>

        {/* Total Collected */}
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 shadow-lg hover:shadow-teal-500/20 transition">
          <div className="flex items-center justify-between mb-4">
            <div className="text-4xl">💵</div>
          </div>
          <p className="text-gray-400 text-sm mb-2">Total Collected</p>
          <p className="text-4xl font-bold text-white mb-2">
            ₹{overview.totalCollected.toLocaleString()}
          </p>
          <p className="text-gray-400 text-xs">From all tournaments</p>
        </div>

        {/* Balance in Hand */}
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 shadow-lg hover:shadow-teal-500/20 transition">
          <div className="flex items-center justify-between mb-4">
            <div className="text-4xl">🏦</div>
          </div>
          <p className="text-gray-400 text-sm mb-2">Balance in Hand</p>
          <p className="text-4xl font-bold text-cyan-400 mb-2">
            ₹{overview.balanceInHand.toLocaleString()}
          </p>
          <p className="text-gray-400 text-xs">Collected - Paid out</p>
        </div>

        {/* Pending Payouts */}
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 shadow-lg hover:shadow-teal-500/20 transition">
          <div className="flex items-center justify-between mb-4">
            <div className="text-4xl">⏳</div>
          </div>
          <p className="text-gray-400 text-sm mb-2">Pending Payouts</p>
          <p className="text-4xl font-bold text-yellow-400 mb-2">
            ₹{overview.breakdown.pendingPayout.toLocaleString()}
          </p>
          <p className="text-gray-400 text-xs">To be paid to organizers</p>
        </div>
      </div>

      {/* Breakdown Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Money Flow */}
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 shadow-lg">
          <h2 className="text-xl font-bold text-white mb-6">Money Flow Breakdown</h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-4 bg-slate-900 rounded-lg">
              <span className="text-gray-400">Total Collected</span>
              <span className="text-white font-bold text-lg">
                ₹{overview.breakdown.collected.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between items-center p-4 bg-teal-900/30 rounded-lg border border-teal-700">
              <span className="text-teal-300">Your Share (5%)</span>
              <span className="text-teal-400 font-bold text-lg">
                ₹{overview.breakdown.yourShare.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between items-center p-4 bg-slate-900 rounded-lg">
              <span className="text-gray-400">Organizer Total (30% + 65%)</span>
              <span className="text-white font-bold text-lg">
                ₹{overview.breakdown.organizerShare.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between items-center p-4 bg-green-900/30 rounded-lg border border-green-700">
              <span className="text-green-300">Already Paid</span>
              <span className="text-green-400 font-bold text-lg">
                ₹{overview.breakdown.alreadyPaid.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between items-center p-4 bg-yellow-900/30 rounded-lg border border-yellow-700">
              <span className="text-yellow-300">Pending Payout</span>
              <span className="text-yellow-400 font-bold text-lg">
                ₹{overview.breakdown.pendingPayout.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 shadow-lg">
          <h2 className="text-xl font-bold text-white mb-6">Platform Statistics</h2>
          <div className="space-y-6">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-400">Total Tournaments</span>
                <span className="text-white font-bold text-2xl">{overview.stats.tournaments}</span>
              </div>
              <div className="w-full bg-slate-900 rounded-full h-2">
                <div className="bg-teal-500 h-2 rounded-full" style={{ width: '100%' }}></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-400">Total Registrations</span>
                <span className="text-white font-bold text-2xl">{overview.stats.registrations}</span>
              </div>
              <div className="w-full bg-slate-900 rounded-full h-2">
                <div className="bg-cyan-500 h-2 rounded-full" style={{ width: '100%' }}></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-400">Avg per Tournament</span>
                <span className="text-white font-bold text-2xl">
                  ₹{Math.round(overview.stats.averagePerTournament).toLocaleString()}
                </span>
              </div>
              <div className="w-full bg-slate-900 rounded-full h-2">
                <div className="bg-purple-500 h-2 rounded-full" style={{ width: '75%' }}></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-400">Avg per Registration</span>
                <span className="text-white font-bold text-2xl">
                  ₹{Math.round(overview.stats.averagePerRegistration).toLocaleString()}
                </span>
              </div>
              <div className="w-full bg-slate-900 rounded-full h-2">
                <div className="bg-pink-500 h-2 rounded-full" style={{ width: '60%' }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Revenue Timeline */}
      <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 shadow-lg mb-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-white">Revenue Timeline</h2>
          <div className="flex gap-2">
            {['daily', 'weekly', 'monthly'].map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  period === p
                    ? 'bg-teal-600 text-white'
                    : 'bg-slate-700 text-gray-400 hover:bg-slate-600'
                }`}
              >
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {timeline.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="text-left text-gray-400 font-medium py-3 px-4">Period</th>
                  <th className="text-right text-gray-400 font-medium py-3 px-4">Collected</th>
                  <th className="text-right text-gray-400 font-medium py-3 px-4">Your Fees</th>
                  <th className="text-right text-gray-400 font-medium py-3 px-4">Registrations</th>
                </tr>
              </thead>
              <tbody>
                {timeline.slice(0, 10).map((item, index) => (
                  <tr key={index} className="border-b border-slate-700/50 hover:bg-slate-700/30">
                    <td className="py-3 px-4 text-white">{item.period}</td>
                    <td className="py-3 px-4 text-right text-white font-medium">
                      ₹{item.totalCollected.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right text-teal-400 font-bold">
                      ₹{item.platformFees.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right text-gray-400">{item.registrations}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-center text-gray-400 py-8">No data available</p>
        )}
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Link
          to="/admin/tournament-payments"
          className="bg-slate-800 rounded-xl p-6 border border-slate-700 shadow-lg hover:shadow-teal-500/50 transition group"
        >
          <div className="text-4xl mb-4">🏆</div>
          <h3 className="text-xl font-bold text-white mb-2 group-hover:text-teal-400 transition">
            Tournament Payments
          </h3>
          <p className="text-gray-400 text-sm">View revenue by tournament</p>
        </Link>

        <Link
          to="/admin/organizer-payouts"
          className="bg-slate-800 rounded-xl p-6 border border-slate-700 shadow-lg hover:shadow-teal-500/50 transition group"
        >
          <div className="text-4xl mb-4">💸</div>
          <h3 className="text-xl font-bold text-white mb-2 group-hover:text-teal-400 transition">
            Organizer Payouts
          </h3>
          <p className="text-gray-400 text-sm">Manage pending payouts</p>
        </Link>

        <Link
          to="/admin/payment-verifications"
          className="bg-slate-800 rounded-xl p-6 border border-slate-700 shadow-lg hover:shadow-teal-500/50 transition group"
        >
          <div className="text-4xl mb-4">💳</div>
          <h3 className="text-xl font-bold text-white mb-2 group-hover:text-teal-400 transition">
            Payment Verification
          </h3>
          <p className="text-gray-400 text-sm">Approve payment screenshots</p>
        </Link>
      </div>

      {/* Danger Zone - Delete All Data */}
      <div className="bg-red-900/20 rounded-xl p-6 border-2 border-red-700 shadow-lg">
        <div className="flex items-start gap-4">
          <div className="text-4xl">⚠️</div>
          <div className="flex-1">
            <h3 className="text-xl font-bold text-red-400 mb-2">Danger Zone</h3>
            <p className="text-gray-300 mb-4">
              Delete all system data including tournaments, registrations, payments, and users. 
              This action is irreversible and will reset all revenue to zero.
            </p>
            <p className="text-sm text-gray-400 mb-4">
              ⚠️ Admin account (ADMIN@gmail.com) will be preserved
            </p>
            <button
              onClick={() => setShowDeleteModal(true)}
              className="bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-lg transition shadow-lg shadow-red-500/50"
            >
              🗑️ Delete All Info
            </button>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-2xl border-2 border-red-600 shadow-2xl max-w-md w-full p-8">
            <div className="text-center mb-6">
              <div className="text-6xl mb-4">⚠️</div>
              <h2 className="text-2xl font-bold text-red-400 mb-2">Delete All Data?</h2>
              <p className="text-gray-300 mb-4">
                This will permanently delete:
              </p>
              <ul className="text-left text-gray-400 text-sm space-y-2 mb-4">
                <li>✗ All tournaments and matches</li>
                <li>✗ All registrations and payments</li>
                <li>✗ All users (except admin)</li>
                <li>✗ All revenue data</li>
                <li>✗ All notifications and logs</li>
              </ul>
              <div className="bg-green-900/30 border border-green-700 rounded-lg p-3 mb-4">
                <p className="text-green-400 text-sm">
                  ✓ Admin account will be preserved
                </p>
              </div>
              <p className="text-red-400 font-bold text-lg">
                This action cannot be undone!
              </p>
            </div>

            <div className="mb-6">
              <label className="block text-gray-300 font-medium mb-2">
                Enter Admin Password to Confirm:
              </label>
              <input
                type="password"
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
                placeholder="Pradyu@123(123)"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-red-500"
                disabled={deleting}
              />
              <p className="text-xs text-gray-500 mt-2">
                Password: Pradyu@123(123)
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeletePassword('');
                }}
                className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-medium py-3 px-4 rounded-lg transition"
                disabled={deleting}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAllData}
                disabled={deleting || !deletePassword}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-4 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {deleting ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Deleting...
                  </span>
                ) : (
                  '🗑️ Delete Everything'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RevenueDashboardPage;
