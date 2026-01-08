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
      // Don't show alert, just set error state
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-lg mb-4">{error}</div>
          <button
            onClick={fetchWalletData}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Wallet</h1>
          <p className="text-gray-600 mt-2">
            Manage your tournament funds and view transaction history
          </p>
        </div>

        {/* Wallet Balance Card */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-8 text-white mb-8">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm font-medium">Current Balance</p>
              <p className="text-4xl font-bold mt-2">
                {formatCurrency(walletData?.currentBalance || 0)}
              </p>
              <p className="text-blue-100 text-sm mt-2">
                Available for tournament registrations
              </p>
            </div>
            <div className="text-right">
              <CreditCardIcon className="h-16 w-16 text-blue-200 mb-4" />
              <button
                onClick={() => setShowTopupModal(true)}
                className="bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors flex items-center gap-2"
              >
                <PlusIcon className="h-5 w-5" />
                Add Money
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg p-6 shadow-sm border">
            <div className="flex items-center">
              <div className="bg-green-100 p-3 rounded-lg">
                <ArrowUpIcon className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Added</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(walletData?.totalTopups || 0)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm border">
            <div className="flex items-center">
              <div className="bg-red-100 p-3 rounded-lg">
                <ArrowDownIcon className="h-6 w-6 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Spent</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(walletData?.totalSpent || 0)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm border">
            <div className="flex items-center">
              <div className="bg-blue-100 p-3 rounded-lg">
                <CheckCircleIcon className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Refunds</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(walletData?.totalRefunds || 0)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Transactions Preview */}
        {walletData?.recentTransactions && walletData.recentTransactions.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border mb-8">
            <div className="p-6 border-b">
              <h2 className="text-xl font-semibold text-gray-900">Recent Transactions</h2>
            </div>
            <div className="divide-y">
              {walletData.recentTransactions.slice(0, 3).map((transaction) => (
                <div key={transaction.id} className="p-6 flex items-center justify-between">
                  <div className="flex items-center">
                    <div className={`p-2 rounded-lg ${
                      transaction.type === 'TOPUP' ? 'bg-green-100' :
                      transaction.type === 'REGISTRATION_FEE' ? 'bg-red-100' :
                      transaction.type === 'REFUND' ? 'bg-blue-100' :
                      'bg-gray-100'
                    }`}>
                      {transaction.type === 'TOPUP' ? (
                        <ArrowUpIcon className={`h-5 w-5 ${
                          transaction.type === 'TOPUP' ? 'text-green-600' : 'text-gray-600'
                        }`} />
                      ) : transaction.type === 'REGISTRATION_FEE' ? (
                        <ArrowDownIcon className="h-5 w-5 text-red-600" />
                      ) : transaction.type === 'REFUND' ? (
                        <CheckCircleIcon className="h-5 w-5 text-blue-600" />
                      ) : (
                        <ClockIcon className="h-5 w-5 text-gray-600" />
                      )}
                    </div>
                    <div className="ml-4">
                      <p className="font-medium text-gray-900">{transaction.description}</p>
                      <p className="text-sm text-gray-500">
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
                      transaction.amount > 0 ? 'text-green-600' : 'text-red-600'
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