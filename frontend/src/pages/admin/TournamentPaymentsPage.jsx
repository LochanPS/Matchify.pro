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

  useEffect(() => {
    fetchData();
  }, [sortBy, order]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [paymentsData, statsData] = await Promise.all([
        getTournamentPayments({ sortBy, order }),
        getTournamentPaymentStats(),
      ]);
      setPayments(paymentsData.data);
      setStats(statsData.data);
    } catch (error) {
      console.error('Error fetching data:', error);
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
            <p className="text-gray-400 text-sm">Pending Second 65% Payouts</p>
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

      {/* Tournament List */}
      <div className="space-y-6">
        {payments.length === 0 ? (
          <div className="bg-slate-800 rounded-xl p-12 text-center border border-slate-700">
            <p className="text-gray-400 text-lg">No tournament payments found</p>
          </div>
        ) : (
          payments.map((payment) => (
            <div
              key={payment.tournamentId}
              className="bg-slate-800 rounded-xl p-6 border border-slate-700 shadow-lg hover:shadow-teal-500/20 transition"
            >
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Tournament Info */}
                <div className="lg:col-span-1">
                  <h3 className="text-xl font-bold text-white mb-2">{payment.tournament.name}</h3>
                  <div className="space-y-2 text-sm">
                    <p className="text-gray-400">
                      📍 {payment.tournament.city}, {payment.tournament.state}
                    </p>
                    <p className="text-gray-400">
                      📅 {new Date(payment.tournament.startDate).toLocaleDateString()}
                    </p>
                    <p className="text-gray-400">
                      👤 {payment.tournament.organizer.name}
                    </p>
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
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

                {/* Revenue Breakdown */}
                <div className="lg:col-span-1">
                  <h4 className="text-sm font-semibold text-gray-400 mb-3">Revenue Breakdown</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400 text-sm">Total Collected</span>
                      <span className="text-white font-bold">
                        ₹{payment.totalCollected.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400 text-sm">Registrations</span>
                      <span className="text-white font-medium">{payment.totalRegistrations}</span>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-teal-900/30 rounded">
                      <span className="text-teal-300 text-sm font-medium">Your Fee (5%)</span>
                      <span className="text-teal-400 font-bold">
                        ₹{payment.platformFeeAmount.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400 text-sm">Organizer Total (30% + 65%)</span>
                      <span className="text-white font-bold">
                        ₹{payment.organizerShare.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Payout Status */}
                <div className="lg:col-span-1">
                  <h4 className="text-sm font-semibold text-gray-400 mb-3">Payout Status</h4>
                  <div className="space-y-3">
                    {/* First 30% Payout */}
                    <div className="p-3 bg-slate-900 rounded-lg">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-gray-400 text-sm">First 30%</span>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
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
                          Paid on {new Date(payment.payout50PaidAt1).toLocaleDateString()}
                        </p>
                      )}
                    </div>

                    {/* Second 65% Payout */}
                    <div className="p-3 bg-slate-900 rounded-lg">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-gray-400 text-sm">Second 65%</span>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
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
                          Paid on {new Date(payment.payout50PaidAt2).toLocaleDateString()}
                        </p>
                      )}
                    </div>

                    {/* Action Button */}
                    {(payment.payout50Status1 === 'pending' || payment.payout50Status2 === 'pending') && (
                      <Link
                        to="/admin/organizer-payouts"
                        className="block w-full bg-teal-600 hover:bg-teal-700 text-white text-center font-medium py-2 px-4 rounded-lg transition"
                      >
                        Process Payout →
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default TournamentPaymentsPage;
