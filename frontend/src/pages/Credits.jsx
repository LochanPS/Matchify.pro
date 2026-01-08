import { useState, useEffect } from 'react';
import { Coins, Download, Gift, TrendingUp, TrendingDown, Info } from 'lucide-react';
import axios from 'axios';
import { formatDateIndian } from '../utils/dateFormat';

const Credits = () => {
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
      
      // Fetch summary
      const summaryRes = await axios.get('http://localhost:5000/api/credits/summary', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSummary(summaryRes.data.data);

      // Fetch transactions
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Coins className="w-8 h-8 text-emerald-600" />
            Matchify Credits
          </h1>
        </div>

        {/* Info Banner */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6 flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">About Matchify Credits</p>
            <p>Credits are promotional rewards that can only be used for platform fees (like tournament creation). 
            Entry fees for tournaments must be paid via Razorpay. Credits cannot be withdrawn or transferred.</p>
          </div>
        </div>

        {/* Balance Card */}
        <div className="bg-gradient-to-br from-emerald-600 to-emerald-800 rounded-2xl p-8 text-white shadow-xl mb-8">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-emerald-100 text-sm mb-2">Available Credits</p>
              <p className="text-5xl font-bold">₹{summary?.balance?.toFixed(2) || '0.00'}</p>
              <p className="text-emerald-200 text-sm mt-2">Use for platform fees only</p>
            </div>
            <div className="text-right">
              <div className="bg-white/20 rounded-lg px-4 py-2 mb-2">
                <p className="text-emerald-100 text-xs">Lifetime Earned</p>
                <p className="text-xl font-semibold">₹{summary?.lifetimeEarned?.toFixed(2) || '0.00'}</p>
              </div>
              <div className="bg-white/20 rounded-lg px-4 py-2">
                <p className="text-emerald-100 text-xs">Lifetime Used</p>
                <p className="text-xl font-semibold">₹{summary?.lifetimeUsed?.toFixed(2) || '0.00'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Transaction History */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Credit History</h2>
            {transactions.length > 0 && (
              <button
                onClick={exportToCSV}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
              >
                <Download className="w-4 h-4" />
                Export CSV
              </button>
            )}
          </div>

          {transactions.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Coins className="w-16 h-16 mx-auto mb-4 opacity-30" />
              <p className="text-lg">No credit transactions yet</p>
              <p className="text-sm mt-2">Credits will appear here when granted by admin</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Date</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Type</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Description</th>
                      <th className="text-right py-3 px-4 text-sm font-semibold text-gray-600">Amount</th>
                      <th className="text-right py-3 px-4 text-sm font-semibold text-gray-600">Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((transaction) => (
                      <tr key={transaction.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-4 px-4 text-sm text-gray-600">
                          {formatDateIndian(transaction.createdAt)}
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-2">
                            {getTransactionIcon(transaction.type)}
                            <span className="text-sm font-medium text-gray-700">
                              {getTransactionLabel(transaction.type)}
                            </span>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-sm text-gray-600 max-w-xs truncate">
                          {transaction.description}
                        </td>
                        <td className={`py-4 px-4 text-sm font-semibold text-right ${
                          transaction.amount > 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {transaction.amount > 0 ? '+' : ''}₹{Math.abs(transaction.amount).toFixed(2)}
                        </td>
                        <td className="py-4 px-4 text-sm text-gray-700 text-right font-medium">
                          ₹{transaction.balanceAfter.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-6">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-4 py-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    Previous
                  </button>
                  <span className="px-4 py-2 text-sm text-gray-600">
                    Page {page} of {totalPages}
                  </span>
                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="px-4 py-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* How Credits Work */}
        <div className="mt-8 bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">How Matchify Credits Work</h3>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                <Gift className="w-4 h-4 text-green-600" />
              </div>
              <div>
                <p className="font-medium text-gray-800">Earn Credits</p>
                <p className="text-sm text-gray-600">Receive promotional credits from Matchify.pro for special offers and rewards</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                <Coins className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <p className="font-medium text-gray-800">Use for Platform Fees</p>
                <p className="text-sm text-gray-600">Apply credits towards tournament creation fees and other platform charges</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                <Info className="w-4 h-4 text-orange-600" />
              </div>
              <div>
                <p className="font-medium text-gray-800">Important Note</p>
                <p className="text-sm text-gray-600">Credits cannot be used for entry fees, withdrawn, or transferred to others</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Credits;
