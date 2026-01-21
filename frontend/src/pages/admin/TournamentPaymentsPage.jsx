import { useState, useEffect } from 'react';
import { getTournamentPayments, getTournamentPaymentStats } from '../../api/payment';
import { toast } from 'react-hot-toast';
import { Link, useNavigate } from 'react-router-dom';

const TournamentPaymentsPage = () => {
  const navigate = useNavigate();
  const [payments, setPayments] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('totalCollected');
  const [order, setOrder] = useState('desc');
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    fetchData();
  }, [sortBy, order]);

  const fetchData = async () => {
    try {
      setLoading(true);
      console.log('🔍 Fetching tournament payments with params:', { sortBy, order });
      
      const [paymentsData, statsData] = await Promise.all([
        getTournamentPayments({ sortBy, order }),
        getTournamentPaymentStats(),
      ]);
      
      console.log('✅ Tournament payments response:', paymentsData);
      console.log('✅ Stats response:', statsData);
      
      setPayments(paymentsData.data);
      setStats(statsData.data);
    } catch (error) {
      console.error('❌ Error fetching data:', error);
      console.error('❌ Error response:', error.response?.data);
      toast.error('Failed to load tournament payments');
    } finally {
      setLoading(false);
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
        <h1 className="text-3xl font-bold text-white mb-2">Tournament Payments</h1>
        <p className="text-gray-400">Revenue breakdown by tournament</p>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 shadow-lg">
            <p className="text-gray-400 text-sm">Total Collected</p>
            <p className="text-3xl font-bold text-white mt-2">
              ₹{stats.totalCollected.toLocaleString()}
            </p>
          </div>
          <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 shadow-lg">
            <p className="text-gray-400 text-sm">Platform Fees</p>
            <p className="text-3xl font-bold text-teal-400 mt-2">
              ₹{stats.totalPlatformFees.toLocaleString()}
            </p>
          </div>
          <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 shadow-lg">
            <p className="text-gray-400 text-sm">Pending First 30% Payouts</p>
            <p className="text-3xl font-bold text-yellow-400 mt-2">{stats.pending50Payouts1}</p>
          </div>
          <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 shadow-lg">
            <p className="text-gray-400 text-sm">Pending Remaining 65% Payouts</p>
            <p className="text-3xl font-bold text-orange-400 mt-2">{stats.pending50Payouts2}</p>
          </div>
        </div>
      )}

      {/* Sort Controls */}
      <div className="flex gap-4 mb-6">
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="bg-slate-800 text-white border border-slate-700 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
        >
          <option value="totalCollected">Sort by Revenue</option>
          <option value="totalRegistrations">Sort by Registrations</option>
          <option value="platformFeeAmount">Sort by Platform Fee</option>
        </select>
        <button
          onClick={() => setOrder(order === 'desc' ? 'asc' : 'desc')}
          className="bg-slate-800 text-white border border-slate-700 rounded-lg px-4 py-2 hover:bg-slate-700 transition"
        >
          {order === 'desc' ? '↓ High to Low' : '↑ Low to High'}
        </button>
      </div>

      {/* Tournament List - Compact with Expand */}
      <div className="space-y-3">
        {payments.length === 0 ? (
          <div className="bg-slate-800 rounded-xl p-12 text-center border border-slate-700">
            <p className="text-gray-400 text-lg">No tournament payments found</p>
          </div>
        ) : (
          payments.map((payment) => (
            <div
              key={payment.tournamentId}
              className="bg-slate-800 rounded-xl border border-slate-700 shadow-lg hover:shadow-teal-500/20 transition overflow-hidden"
            >
              {/* Compact Header - Always Visible */}
              <button
                onClick={() => setExpandedId(expandedId === payment.tournamentId ? null : payment.tournamentId)}
                className="w-full p-4 flex items-center justify-between hover:bg-slate-750 transition"
              >
                <div className="flex items-center gap-4 flex-1">
                  {/* Tournament Name & Status */}
                  <div className="flex-1 text-left">
                    <h3 className="text-lg font-bold text-white">{payment.tournament.name}</h3>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-gray-400 text-sm">
                        📍 {payment.tournament.city}
                      </span>
                      <span className="text-gray-400 text-sm">
                        📅 {new Date(payment.tournament.startDate).toLocaleDateString()}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        payment.tournament.status === 'completed'
                          ? 'bg-green-900/50 text-green-400'
                          : payment.tournament.status === 'ongoing'
                          ? 'bg-blue-900/50 text-blue-400'
                          : 'bg-yellow-900/50 text-yellow-400'
                      }`}>
                        {payment.tournament.status}
                      </span>
                    </div>
                  </div>

                  {/* Quick Stats */}
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="text-gray-400 text-xs">Total Collected</p>
                      <p className="text-white font-bold text-lg">₹{payment.totalCollected.toLocaleString()}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-gray-400 text-xs">Your Fee</p>
                      <p className="text-teal-400 font-bold text-lg">₹{payment.platformFeeAmount.toLocaleString()}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-gray-400 text-xs">Payouts</p>
                      <div className="flex gap-2">
                        <span className={`w-3 h-3 rounded-full ${
                          payment.payout50Status1 === 'paid' ? 'bg-green-500' : 'bg-yellow-500'
                        }`} title={`First 30%: ${payment.payout50Status1}`}></span>
                        <span className={`w-3 h-3 rounded-full ${
                          payment.payout50Status2 === 'paid' ? 'bg-green-500' : 'bg-yellow-500'
                        }`} title={`Remaining 65%: ${payment.payout50Status2}`}></span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Expand Icon */}
                <div className="ml-4">
                  <svg
                    className={`w-6 h-6 text-gray-400 transition-transform ${
                      expandedId === payment.tournamentId ? 'rotate-180' : ''
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </button>

              {/* Expanded Details */}
              {expandedId === payment.tournamentId && (
                <div className="border-t border-slate-700 p-6 bg-slate-850">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Tournament Details */}
                    <div>
                      <h4 className="text-sm font-semibold text-teal-400 mb-3">Tournament Details</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-400">Location</span>
                          <span className="text-white">{payment.tournament.city}, {payment.tournament.state}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Start Date</span>
                          <span className="text-white">{new Date(payment.tournament.startDate).toLocaleDateString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Organizer</span>
                          <span className="text-white">{payment.tournament.organizer.name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Registrations</span>
                          <span className="text-white font-medium">{payment.totalRegistrations}</span>
                        </div>
                      </div>
                    </div>

                    {/* Revenue Breakdown */}
                    <div>
                      <h4 className="text-sm font-semibold text-teal-400 mb-3">Revenue Breakdown</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-400">Total Collected</span>
                          <span className="text-white font-bold">₹{payment.totalCollected.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between p-2 bg-teal-900/30 rounded">
                          <span className="text-teal-300 font-medium">Your Fee (5%)</span>
                          <span className="text-teal-400 font-bold">₹{payment.platformFeeAmount.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Organizer Share (95%)</span>
                          <span className="text-white font-bold">₹{payment.organizerShare.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>

                    {/* Payout Status */}
                    <div>
                      <h4 className="text-sm font-semibold text-teal-400 mb-3">Payout Status</h4>
                      <div className="space-y-3">
                        {/* First 30% */}
                        <div className="p-3 bg-slate-900 rounded-lg">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-gray-400 text-sm">First 30%</span>
                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                              payment.payout50Status1 === 'paid'
                                ? 'bg-green-900/50 text-green-400'
                                : 'bg-yellow-900/50 text-yellow-400'
                            }`}>
                              {payment.payout50Status1 === 'paid' ? '✅ Paid' : '⏳ Pending'}
                            </span>
                          </div>
                          <p className="text-white font-bold">₹{payment.payout50Percent1.toLocaleString()}</p>
                          {payment.payout50PaidAt1 && (
                            <p className="text-gray-500 text-xs mt-1">
                              {new Date(payment.payout50PaidAt1).toLocaleDateString()}
                            </p>
                          )}
                        </div>

                        {/* Remaining 65% */}
                        <div className="p-3 bg-slate-900 rounded-lg">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-gray-400 text-sm">Remaining 65%</span>
                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                              payment.payout50Status2 === 'paid'
                                ? 'bg-green-900/50 text-green-400'
                                : 'bg-yellow-900/50 text-yellow-400'
                            }`}>
                              {payment.payout50Status2 === 'paid' ? '✅ Paid' : '⏳ Pending'}
                            </span>
                          </div>
                          <p className="text-white font-bold">₹{payment.payout50Percent2.toLocaleString()}</p>
                          {payment.payout50PaidAt2 && (
                            <p className="text-gray-500 text-xs mt-1">
                              {new Date(payment.payout50PaidAt2).toLocaleDateString()}
                            </p>
                          )}
                        </div>

                        {/* Action Button */}
                        {(payment.payout50Status1 === 'pending' || payment.payout50Status2 === 'pending') && (
                          <Link
                            to="/admin/organizer-payouts"
                            className="block w-full bg-teal-600 hover:bg-teal-700 text-white text-center font-medium py-2 px-4 rounded-lg transition text-sm"
                          >
                            Process Payout →
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default TournamentPaymentsPage;
