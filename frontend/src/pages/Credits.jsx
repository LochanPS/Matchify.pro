import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Coins, Download, Gift, TrendingUp, TrendingDown, Info, Sparkles, ArrowRight } from 'lucide-react';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import axios from 'axios';
import { formatDateIndian } from '../utils/dateFormat';

const Credits = () => {
  const navigate = useNavigate();
  const [summary, setSummary] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchCreditsData();
  }, [page]);

  const fetchCreditsData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const summaryRes = await axios.get('http://localhost:5000/api/credits/summary', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSummary(summaryRes.data.data);

      const transactionsRes = await axios.get(
        `http://localhost:5000/api/credits/transactions?page=${page}&limit=20`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setTransactions(transactionsRes.data.data.transactions);
      setTotalPages(transactionsRes.data.data.pagination.totalPages);
      
    } catch (error) {
      console.error('Error fetching credits data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTransactionIcon = (type) => {
    switch (type) {
      case 'ADMIN_GRANT':
      case 'PROMOTIONAL':
        return <Gift className="w-5 h-5 text-green-500" />;
      case 'PLATFORM_FEE_DEDUCTION':
        return <TrendingDown className="w-5 h-5 text-red-500" />;
      case 'ADJUSTMENT':
        return <TrendingUp className="w-5 h-5 text-blue-500" />;
      default:
        return <Coins className="w-5 h-5 text-gray-500" />;
    }
  };

  const getTransactionLabel = (type) => {
    switch (type) {
      case 'ADMIN_GRANT': return 'Admin Credit';
      case 'PROMOTIONAL': return 'Promotional';
      case 'PLATFORM_FEE_DEDUCTION': return 'Platform Fee';
      case 'ADJUSTMENT': return 'Adjustment';
      case 'EXPIRED': return 'Expired';
      default: return type;
    }
  };

  const exportToCSV = () => {
    const headers = ['Date', 'Type', 'Description', 'Amount', 'Balance After'];
    const rows = transactions.map(t => [
      formatDateIndian(t.createdAt),
      getTransactionLabel(t.type),
      t.description,
      t.amount > 0 ? `+₹${t.amount}` : `₹${t.amount}`,
      `₹${t.balanceAfter}`
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `matchify-credits-${Date.now()}.csv`;
    a.click();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-gray-500 mt-4 font-medium">Loading credits...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Hero Header */}
      <div className="relative bg-gradient-to-r from-slate-900 via-amber-900 to-slate-900 overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-amber-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-orange-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Back Button */}
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-white/70 hover:text-white mb-6 transition-colors group"
          >
            <ArrowLeftIcon className="h-5 w-5 group-hover:-translate-x-1 transition-transform" />
            <span>Back</span>
          </button>

          <div className="flex items-center gap-5">
            <div className="w-16 h-16 bg-gradient-to-br from-amber-400 via-yellow-500 to-orange-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-amber-500/30">
              <Coins className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Matchify Credits</h1>
              <p className="text-white/60">Promotional rewards for platform fees</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 -mt-6">
        {/* Balance Card */}
        <div className="bg-gradient-to-br from-amber-500 via-orange-500 to-red-500 rounded-2xl p-8 text-white shadow-2xl shadow-orange-500/30 mb-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2"></div>
          
          <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-5 h-5 text-amber-200" />
                <p className="text-amber-100 text-sm font-medium">Available Credits</p>
              </div>
              <p className="text-5xl font-bold">₹{summary?.balance?.toFixed(2) || '0.00'}</p>
              <p className="text-amber-200 text-sm mt-2">Use for platform fees only</p>
            </div>
            <div className="flex gap-4">
              <div className="bg-white/20 backdrop-blur-sm rounded-xl px-5 py-4">
                <p className="text-amber-100 text-xs font-medium mb-1">Lifetime Earned</p>
                <p className="text-2xl font-bold">₹{summary?.lifetimeEarned?.toFixed(2) || '0.00'}</p>
              </div>
              <div className="bg-white/20 backdrop-blur-sm rounded-xl px-5 py-4">
                <p className="text-amber-100 text-xs font-medium mb-1">Lifetime Used</p>
                <p className="text-2xl font-bold">₹{summary?.lifetimeUsed?.toFixed(2) || '0.00'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Info Banner */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-5 mb-8 flex items-start gap-4">
          <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <Info className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <p className="font-semibold text-blue-900 mb-1">About Matchify Credits</p>
            <p className="text-sm text-blue-700">
              Credits are promotional rewards that can only be used for platform fees (like tournament creation). 
              Entry fees for tournaments must be paid via organizer's QR code. Credits cannot be withdrawn or transferred.
            </p>
          </div>
        </div>

        {/* Transaction History */}
        <div className="bg-slate-800/50 backdrop-blur-sm border border-white/10 rounded-2xl shadow-xl shadow-gray-200/50 border border-white/10 overflow-hidden">
          <div className="p-6 border-b border-white/10 flex items-center justify-between">
            <h2 className="text-xl font-bold text-white">Credit History</h2>
            {transactions.length > 0 && (
              <button
                onClick={exportToCSV}
                className="flex items-center gap-2 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 rounded-xl transition-all text-sm font-medium text-gray-700"
              >
                <Download className="w-4 h-4" />
                Export CSV
              </button>
            )}
          </div>

          {transactions.length === 0 ? (
            <div className="p-16 text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Coins className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">No credit transactions yet</h3>
              <p className="text-gray-500">Credits will appear here when granted by admin</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="text-left py-4 px-6 text-sm font-semibold text-gray-400">Date</th>
                      <th className="text-left py-4 px-6 text-sm font-semibold text-gray-400">Type</th>
                      <th className="text-left py-4 px-6 text-sm font-semibold text-gray-400">Description</th>
                      <th className="text-right py-4 px-6 text-sm font-semibold text-gray-400">Amount</th>
                      <th className="text-right py-4 px-6 text-sm font-semibold text-gray-400">Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((transaction) => (
                      <tr key={transaction.id} className="border-t border-white/10 hover:bg-gray-50 transition-colors">
                        <td className="py-4 px-6 text-sm text-gray-400">
                          {formatDateIndian(transaction.createdAt)}
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 bg-gray-100 rounded-lg flex items-center justify-center">
                              {getTransactionIcon(transaction.type)}
                            </div>
                            <span className="text-sm font-medium text-gray-700">
                              {getTransactionLabel(transaction.type)}
                            </span>
                          </div>
                        </td>
                        <td className="py-4 px-6 text-sm text-gray-400 max-w-xs truncate">
                          {transaction.description}
                        </td>
                        <td className={`py-4 px-6 text-sm font-bold text-right ${
                          transaction.amount > 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {transaction.amount > 0 ? '+' : ''}₹{Math.abs(transaction.amount).toFixed(2)}
                        </td>
                        <td className="py-4 px-6 text-sm text-gray-700 text-right font-semibold">
                          ₹{transaction.balanceAfter.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-3 p-6 border-t border-white/10">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-5 py-2.5 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-gray-700 transition-all"
                  >
                    Previous
                  </button>
                  <span className="px-4 py-2 text-sm text-gray-400 font-medium">
                    Page {page} of {totalPages}
                  </span>
                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="px-5 py-2.5 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-gray-700 transition-all"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* How Credits Work */}
        <div className="mt-8 bg-slate-800/50 backdrop-blur-sm border border-white/10 rounded-2xl shadow-xl shadow-gray-200/50 border border-white/10 p-8">
          <h3 className="text-xl font-bold text-white mb-6">How Matchify Credits Work</h3>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="flex items-start gap-4 p-5 bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl">
              <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-emerald-500 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-green-500/20">
                <Gift className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="font-semibold text-white mb-1">Earn Credits</p>
                <p className="text-sm text-gray-400">Receive promotional credits from Matchify.pro for special offers and rewards</p>
              </div>
            </div>
            <div className="flex items-start gap-4 p-5 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-blue-500/20">
                <Coins className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="font-semibold text-white mb-1">Use for Platform Fees</p>
                <p className="text-sm text-gray-400">Apply credits towards tournament creation fees and other platform charges</p>
              </div>
            </div>
            <div className="flex items-start gap-4 p-5 bg-gradient-to-br from-orange-50 to-amber-50 rounded-2xl">
              <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-amber-500 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-orange-500/20">
                <Info className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="font-semibold text-white mb-1">Important Note</p>
                <p className="text-sm text-gray-400">Credits cannot be used for entry fees, withdrawn, or transferred to others</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Credits;
