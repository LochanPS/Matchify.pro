import { useState, useEffect } from 'react';
import { walletAPI } from '../api/wallet';
import { useAuth } from '../contexts/AuthContext';
import TopupModal from '../components/wallet/TopupModal';
import TransactionHistory from '../components/wallet/TransactionHistory';
import { 
  CreditCardIcon, 
  PlusIcon, 
  ArrowUpIcon, 
  ArrowDownIcon,
  ClockIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';

const WalletPage = () => {
  const { user } = useAuth();
  const [walletData, setWalletData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showTopupModal, setShowTopupModal] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    fetchWalletData();
  }, [refreshTrigger]);

  const fetchWalletData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await walletAPI.getSummary();
      setWalletData(response.data);
    } catch (err) {
      console.error('Error fetching wallet data:', err);
      setError(err.response?.data?.error || 'Failed to load wallet data');
    } finally {
      setLoading(false);
    }
  };

  const handleTopupSuccess = () => {
    setShowTopupModal(false);
    setRefreshTrigger(prev => prev + 1);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-gray-400 mt-4 font-medium">Loading wallet...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-400 text-lg mb-4">{error}</div>
          <button
            onClick={fetchWalletData}
            className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white px-6 py-3 rounded-xl hover:shadow-lg hover:shadow-purple-500/25 transition-all font-medium"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">My Wallet</h1>
          <p className="text-gray-400 mt-2">
            Manage your tournament funds and view transaction history
          </p>
        </div>

        {/* Wallet Balance Card with Halo */}
        <div className="relative mb-8">
          <div className="absolute -inset-1 bg-gradient-to-r from-purple-500/30 via-indigo-500/30 to-purple-500/30 rounded-2xl blur-xl"></div>
          <div className="relative bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl p-8 text-white border border-white/10">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-200 text-sm font-medium">Current Balance</p>
                <p className="text-5xl font-bold mt-2 bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">
                  {formatCurrency(walletData?.currentBalance || 0)}
                </p>
                <p className="text-purple-200 text-sm mt-2">
                  Available for tournament registrations
                </p>
              </div>
              <div className="text-right">
                <CreditCardIcon className="h-16 w-16 text-purple-300/50 mb-4" />
                <button
                  onClick={() => setShowTopupModal(true)}
                  className="bg-white/20 backdrop-blur-sm text-white px-6 py-3 rounded-xl font-semibold hover:bg-white/30 transition-all flex items-center gap-2 border border-white/20"
                >
                  <PlusIcon className="h-5 w-5" />
                  Add Money
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-slate-800/50 backdrop-blur-sm border border-white/10 rounded-2xl p-6 hover:border-white/20 transition-all">
            <div className="flex items-center">
              <div className="bg-emerald-500/20 p-3 rounded-xl">
                <ArrowUpIcon className="h-6 w-6 text-emerald-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-400">Total Added</p>
                <p className="text-2xl font-bold text-white">
                  {formatCurrency(walletData?.totalTopups || 0)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-slate-800/50 backdrop-blur-sm border border-white/10 rounded-2xl p-6 hover:border-white/20 transition-all">
            <div className="flex items-center">
              <div className="bg-red-500/20 p-3 rounded-xl">
                <ArrowDownIcon className="h-6 w-6 text-red-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-400">Total Spent</p>
                <p className="text-2xl font-bold text-white">
                  {formatCurrency(walletData?.totalSpent || 0)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-slate-800/50 backdrop-blur-sm border border-white/10 rounded-2xl p-6 hover:border-white/20 transition-all">
            <div className="flex items-center">
              <div className="bg-blue-500/20 p-3 rounded-xl">
                <CheckCircleIcon className="h-6 w-6 text-blue-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-400">Total Refunds</p>
                <p className="text-2xl font-bold text-white">
                  {formatCurrency(walletData?.totalRefunds || 0)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Transactions Preview */}
        {walletData?.recentTransactions && walletData.recentTransactions.length > 0 && (
          <div className="bg-slate-800/50 backdrop-blur-sm border border-white/10 rounded-2xl mb-8 overflow-hidden">
            <div className="p-6 border-b border-white/10">
              <h2 className="text-xl font-semibold text-white">Recent Transactions</h2>
            </div>
            <div className="divide-y divide-white/5">
              {walletData.recentTransactions.slice(0, 3).map((transaction) => (
                <div key={transaction.id} className="p-6 flex items-center justify-between hover:bg-white/5 transition-colors">
                  <div className="flex items-center">
                    <div className={`p-2 rounded-xl ${
                      transaction.type === 'TOPUP' ? 'bg-emerald-500/20' :
                      transaction.type === 'REGISTRATION_FEE' ? 'bg-red-500/20' :
                      transaction.type === 'REFUND' ? 'bg-blue-500/20' :
                      'bg-slate-700/50'
                    }`}>
                      {transaction.type === 'TOPUP' ? (
                        <ArrowUpIcon className="h-5 w-5 text-emerald-400" />
                      ) : transaction.type === 'REGISTRATION_FEE' ? (
                        <ArrowDownIcon className="h-5 w-5 text-red-400" />
                      ) : transaction.type === 'REFUND' ? (
                        <CheckCircleIcon className="h-5 w-5 text-blue-400" />
                      ) : (
                        <ClockIcon className="h-5 w-5 text-gray-400" />
                      )}
                    </div>
                    <div className="ml-4">
                      <p className="font-medium text-white">{transaction.description}</p>
                      <p className="text-sm text-gray-400">
                        {new Date(transaction.createdAt).toLocaleDateString('en-IN', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-semibold ${
                      transaction.amount > 0 ? 'text-emerald-400' : 'text-red-400'
                    }`}>
                      {transaction.amount > 0 ? '+' : ''}{formatCurrency(transaction.amount)}
                    </p>
                    <p className="text-sm text-gray-500 capitalize">
                      {transaction.status.toLowerCase()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Full Transaction History */}
        <TransactionHistory onRefresh={() => setRefreshTrigger(prev => prev + 1)} />

        {/* Top-up Modal */}
        {showTopupModal && (
          <TopupModal
            isOpen={showTopupModal}
            onClose={() => setShowTopupModal(false)}
            onSuccess={handleTopupSuccess}
            currentBalance={walletData?.currentBalance || 0}
          />
        )}
      </div>
    </div>
  );
};

export default WalletPage;
