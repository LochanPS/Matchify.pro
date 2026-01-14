import { useState, useEffect } from 'react';
import { walletAPI } from '../../api/wallet';
import { 
  ArrowUpIcon, 
  ArrowDownIcon, 
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
  FunnelIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ArrowDownTrayIcon
} from '@heroicons/react/24/outline';

const TransactionHistory = ({ onRefresh }) => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [filterType, setFilterType] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');

  const transactionTypes = [
    { value: '', label: 'All Transactions' },
    { value: 'TOPUP', label: 'Top-ups' },
    { value: 'REGISTRATION_FEE', label: 'Registration Fees' },
    { value: 'REFUND', label: 'Refunds' },
    { value: 'ADMIN_CREDIT', label: 'Admin Credits' },
    { value: 'ADMIN_DEBIT', label: 'Admin Debits' },
  ];

  useEffect(() => {
    fetchTransactions();
  }, [currentPage, filterType]);

  useEffect(() => {
    if (onRefresh) {
      fetchTransactions();
    }
  }, [onRefresh]);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await walletAPI.getTransactions(
        currentPage, 
        20, 
        filterType || null
      );
      
      setTransactions(response.data.transactions);
      setPagination(response.data.pagination);
    } catch (err) {
      console.error('Error fetching transactions:', err);
      setError(err.response?.data?.error || 'Failed to load transactions');
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
  };

  const handleFilterChange = (newFilter) => {
    setFilterType(newFilter);
    setCurrentPage(1);
  };

  const getTransactionIcon = (type, status) => {
    if (status === 'PENDING') {
      return <ClockIcon className="h-5 w-5 text-amber-400" />;
    }
    if (status === 'FAILED') {
      return <XCircleIcon className="h-5 w-5 text-red-400" />;
    }

    switch (type) {
      case 'TOPUP':
        return <ArrowUpIcon className="h-5 w-5 text-emerald-400" />;
      case 'REGISTRATION_FEE':
        return <ArrowDownIcon className="h-5 w-5 text-red-400" />;
      case 'REFUND':
        return <CheckCircleIcon className="h-5 w-5 text-blue-400" />;
      case 'ADMIN_CREDIT':
        return <ArrowUpIcon className="h-5 w-5 text-purple-400" />;
      case 'ADMIN_DEBIT':
        return <ArrowDownIcon className="h-5 w-5 text-orange-400" />;
      default:
        return <ClockIcon className="h-5 w-5 text-gray-400" />;
    }
  };

  const getTransactionColor = (type, status) => {
    if (status === 'PENDING') return 'bg-amber-500/20';
    if (status === 'FAILED') return 'bg-red-500/20';

    switch (type) {
      case 'TOPUP':
        return 'bg-emerald-500/20';
      case 'REGISTRATION_FEE':
        return 'bg-red-500/20';
      case 'REFUND':
        return 'bg-blue-500/20';
      case 'ADMIN_CREDIT':
        return 'bg-purple-500/20';
      case 'ADMIN_DEBIT':
        return 'bg-orange-500/20';
      default:
        return 'bg-slate-700/50';
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      COMPLETED: { color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30', label: 'Completed' },
      PENDING: { color: 'bg-amber-500/20 text-amber-400 border-amber-500/30', label: 'Pending' },
      FAILED: { color: 'bg-red-500/20 text-red-400 border-red-500/30', label: 'Failed' },
      REFUNDED: { color: 'bg-blue-500/20 text-blue-400 border-blue-500/30', label: 'Refunded' },
    };

    const config = statusConfig[status] || statusConfig.PENDING;
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${config.color}`}>
        {config.label}
      </span>
    );
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const exportToCSV = async () => {
    try {
      const allTransactionsResponse = await walletAPI.getTransactions(1, 1000, filterType || null);
      const allTransactions = allTransactionsResponse.data.transactions;

      if (allTransactions.length === 0) {
        setAlertMessage('No transactions to export');
        setShowAlert(true);
        return;
      }

      const headers = ['Date', 'Type', 'Description', 'Amount', 'Balance After', 'Status', 'Reference ID'];
      const csvRows = [
        headers.join(','),
        ...allTransactions.map(transaction => [
          `"${formatDate(transaction.createdAt)}"`,
          `"${transaction.type}"`,
          `"${transaction.description}"`,
          `"${transaction.amount > 0 ? '+' : ''}${formatCurrency(transaction.amount).replace('₹', '')}"`,
          `"${formatCurrency(transaction.balanceAfter).replace('₹', '')}"`,
          `"${transaction.status}"`,
          `"${transaction.referenceId || 'N/A'}"`
        ].join(','))
      ];

      const csvContent = csvRows.join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      
      if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `matchify-transactions-${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (error) {
      console.error('Error exporting CSV:', error);
      setAlertMessage('Failed to export transactions. Please try again.');
      setShowAlert(true);
    }
  };

  if (loading && transactions.length === 0) {
    return (
      <div className="bg-slate-800/50 backdrop-blur-sm border border-white/10 rounded-2xl">
        <div className="p-6">
          <div className="animate-pulse">
            <div className="h-6 bg-slate-700 rounded w-1/4 mb-4"></div>
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center space-x-4">
                  <div className="h-10 w-10 bg-slate-700 rounded-xl"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-slate-700 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-slate-700 rounded w-1/2"></div>
                  </div>
                  <div className="h-4 bg-slate-700 rounded w-20"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-800/50 backdrop-blur-sm border border-white/10 rounded-2xl overflow-hidden relative">
      {/* Header with Filters */}
      <div className="p-6 border-b border-white/10">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-white">Transaction History</h2>
          <div className="flex items-center gap-3">
            <button
              onClick={exportToCSV}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-300 bg-slate-700/50 border border-white/10 rounded-xl hover:bg-slate-700 hover:text-white transition-all"
            >
              <ArrowDownTrayIcon className="h-4 w-4" />
              Export CSV
            </button>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-xl transition-all ${
                showFilters 
                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' 
                  : 'text-gray-300 bg-slate-700/50 border border-white/10 hover:bg-slate-700'
              }`}
            >
              <FunnelIcon className="h-4 w-4" />
              Filter
            </button>
          </div>
        </div>

        {/* Filter Options */}
        {showFilters && (
          <div className="mt-4 p-4 bg-slate-700/30 border border-white/5 rounded-xl">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
              {transactionTypes.map((type) => (
                <button
                  key={type.value}
                  onClick={() => handleFilterChange(type.value)}
                  className={`px-3 py-2 text-sm font-medium rounded-xl transition-all ${
                    filterType === type.value
                      ? 'bg-gradient-to-r from-purple-500 to-indigo-600 text-white'
                      : 'bg-slate-700/50 text-gray-300 hover:bg-slate-700 border border-white/10'
                  }`}
                >
                  {type.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Transaction List */}
      <div className="divide-y divide-white/5">
        {error ? (
          <div className="p-6 text-center">
            <div className="text-red-400 mb-4">{error}</div>
            <button
              onClick={fetchTransactions}
              className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white px-4 py-2 rounded-xl hover:shadow-lg hover:shadow-purple-500/25 transition-all"
            >
              Retry
            </button>
          </div>
        ) : transactions.length === 0 ? (
          <div className="p-12 text-center">
            <div className="text-gray-500 mb-4">
              <ClockIcon className="h-12 w-12 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-white mb-2">No transactions found</h3>
            <p className="text-gray-400">
              {filterType ? 'No transactions match your filter criteria.' : 'Your transaction history will appear here.'}
            </p>
          </div>
        ) : (
          <>
            {transactions.map((transaction) => (
              <div key={transaction.id} className="p-6 hover:bg-white/5 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className={`p-2 rounded-xl ${getTransactionColor(transaction.type, transaction.status)}`}>
                      {getTransactionIcon(transaction.type, transaction.status)}
                    </div>
                    <div className="ml-4">
                      <p className="font-medium text-white">{transaction.description}</p>
                      <div className="flex items-center gap-3 mt-1">
                        <p className="text-sm text-gray-400">
                          {formatDate(transaction.createdAt)}
                        </p>
                        {getStatusBadge(transaction.status)}
                        {transaction.referenceId && (
                          <span className="text-xs text-gray-500">
                            Ref: {transaction.referenceId.slice(-8)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-semibold text-lg ${
                      transaction.amount > 0 ? 'text-emerald-400' : 'text-red-400'
                    }`}>
                      {transaction.amount > 0 ? '+' : ''}{formatCurrency(transaction.amount)}
                    </p>
                    <p className="text-sm text-gray-500">
                      Balance: {formatCurrency(transaction.balanceAfter)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </>
        )}
      </div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="p-6 border-t border-white/10 bg-slate-800/30">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-400">
              Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
              {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
              {pagination.total} transactions
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={!pagination.hasPrev || loading}
                className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-gray-300 bg-slate-700/50 border border-white/10 rounded-xl hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                <ChevronLeftIcon className="h-4 w-4" />
                Previous
              </button>
              
              <div className="flex items-center gap-1">
                {[...Array(Math.min(5, pagination.totalPages))].map((_, i) => {
                  const pageNum = Math.max(1, pagination.page - 2) + i;
                  if (pageNum > pagination.totalPages) return null;
                  
                  return (
                    <button
                      key={pageNum}
                      onClick={() => handlePageChange(pageNum)}
                      disabled={loading}
                      className={`px-3 py-2 text-sm font-medium rounded-xl transition-all ${
                        pageNum === pagination.page
                          ? 'bg-gradient-to-r from-purple-500 to-indigo-600 text-white'
                          : 'text-gray-300 bg-slate-700/50 border border-white/10 hover:bg-slate-700'
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={!pagination.hasNext || loading}
                className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-gray-300 bg-slate-700/50 border border-white/10 rounded-xl hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                Next
                <ChevronRightIcon className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Loading Overlay */}
      {loading && transactions.length > 0 && (
        <div className="absolute inset-0 bg-slate-900/75 flex items-center justify-center">
          <div className="w-10 h-10 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}

      {/* Alert Modal */}
      {showAlert && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="relative bg-slate-800 border border-white/10 rounded-2xl p-6 max-w-sm w-full text-center">
            <div className="w-16 h-16 bg-amber-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">⚠️</span>
            </div>
            <p className="text-white mb-6">{alertMessage}</p>
            <button
              onClick={() => setShowAlert(false)}
              className="w-full bg-gradient-to-r from-purple-500 to-indigo-600 text-white py-3 rounded-xl font-medium hover:shadow-lg hover:shadow-purple-500/25 transition-all"
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TransactionHistory;
