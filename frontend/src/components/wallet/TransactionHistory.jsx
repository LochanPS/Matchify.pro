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
    setCurrentPage(1); // Reset to first page when filter changes
  };

  const getTransactionIcon = (type, status) => {
    if (status === 'PENDING') {
      return <ClockIcon className="h-5 w-5 text-yellow-600" />;
    }
    if (status === 'FAILED') {
      return <XCircleIcon className="h-5 w-5 text-red-600" />;
    }

    switch (type) {
      case 'TOPUP':
        return <ArrowUpIcon className="h-5 w-5 text-green-600" />;
      case 'REGISTRATION_FEE':
        return <ArrowDownIcon className="h-5 w-5 text-red-600" />;
      case 'REFUND':
        return <CheckCircleIcon className="h-5 w-5 text-blue-600" />;
      case 'ADMIN_CREDIT':
        return <ArrowUpIcon className="h-5 w-5 text-purple-600" />;
      case 'ADMIN_DEBIT':
        return <ArrowDownIcon className="h-5 w-5 text-orange-600" />;
      default:
        return <ClockIcon className="h-5 w-5 text-gray-600" />;
    }
  };

  const getTransactionColor = (type, status) => {
    if (status === 'PENDING') return 'bg-yellow-100';
    if (status === 'FAILED') return 'bg-red-100';

    switch (type) {
      case 'TOPUP':
        return 'bg-green-100';
      case 'REGISTRATION_FEE':
        return 'bg-red-100';
      case 'REFUND':
        return 'bg-blue-100';
      case 'ADMIN_CREDIT':
        return 'bg-purple-100';
      case 'ADMIN_DEBIT':
        return 'bg-orange-100';
      default:
        return 'bg-gray-100';
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      COMPLETED: { color: 'bg-green-100 text-green-800', label: 'Completed' },
      PENDING: { color: 'bg-yellow-100 text-yellow-800', label: 'Pending' },
      FAILED: { color: 'bg-red-100 text-red-800', label: 'Failed' },
      REFUNDED: { color: 'bg-blue-100 text-blue-800', label: 'Refunded' },
    };

    const config = statusConfig[status] || statusConfig.PENDING;
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
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
      // Get all transactions for export (not just current page)
      const allTransactionsResponse = await walletAPI.getTransactions(1, 1000, filterType || null);
      const allTransactions = allTransactionsResponse.data.transactions;

      if (allTransactions.length === 0) {
        alert('No transactions to export');
        return;
      }

      // Prepare CSV data
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

      // Create and download CSV
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
      alert('Failed to export transactions. Please try again.');
    }
  };

  if (loading && transactions.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6">
          <div className="animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center space-x-4">
                  <div className="h-10 w-10 bg-gray-200 rounded-lg"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                  <div className="h-4 bg-gray-200 rounded w-20"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border">
      {/* Header with Filters */}
      <div className="p-6 border-b">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">Transaction History</h2>
          <div className="flex items-center gap-3">
            <button
              onClick={exportToCSV}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <ArrowDownTrayIcon className="h-4 w-4" />
              Export CSV
            </button>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <FunnelIcon className="h-4 w-4" />
              Filter
            </button>
          </div>
        </div>

        {/* Filter Options */}
        {showFilters && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
              {transactionTypes.map((type) => (
                <button
                  key={type.value}
                  onClick={() => handleFilterChange(type.value)}
                  className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                    filterType === type.value
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-100 border'
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
      <div className="divide-y">
        {error ? (
          <div className="p-6 text-center">
            <div className="text-red-600 mb-4">{error}</div>
            <button
              onClick={fetchTransactions}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              Retry
            </button>
          </div>
        ) : transactions.length === 0 ? (
          <div className="p-12 text-center">
            <div className="text-gray-400 mb-4">
              <ClockIcon className="h-12 w-12 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No transactions found</h3>
            <p className="text-gray-500">
              {filterType ? 'No transactions match your filter criteria.' : 'Your transaction history will appear here.'}
            </p>
          </div>
        ) : (
          <>
            {transactions.map((transaction) => (
              <div key={transaction.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className={`p-2 rounded-lg ${getTransactionColor(transaction.type, transaction.status)}`}>
                      {getTransactionIcon(transaction.type, transaction.status)}
                    </div>
                    <div className="ml-4">
                      <p className="font-medium text-gray-900">{transaction.description}</p>
                      <div className="flex items-center gap-3 mt-1">
                        <p className="text-sm text-gray-500">
                          {formatDate(transaction.createdAt)}
                        </p>
                        {getStatusBadge(transaction.status)}
                        {transaction.referenceId && (
                          <span className="text-xs text-gray-400">
                            Ref: {transaction.referenceId.slice(-8)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-semibold text-lg ${
                      transaction.amount > 0 ? 'text-green-600' : 'text-red-600'
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
        <div className="p-6 border-t bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
              {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
              {pagination.total} transactions
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={!pagination.hasPrev || loading}
                className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
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
                      className={`px-3 py-2 text-sm font-medium rounded-lg ${
                        pageNum === pagination.page
                          ? 'bg-blue-600 text-white'
                          : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
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
                className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
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
        <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      )}
    </div>
  );
};

export default TransactionHistory;