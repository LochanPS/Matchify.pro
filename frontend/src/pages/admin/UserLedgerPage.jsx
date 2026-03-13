import { useState, useEffect } from 'react';
import { 
  MagnifyingGlassIcon,
  ArrowDownTrayIcon,
  EyeIcon,
  CurrencyDollarIcon,
  UserIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';
import { TrendingUp, TrendingDown, Users, DollarSign } from 'lucide-react';
import adminService from '../../services/adminService';

const UserLedgerPage = () => {
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('currentBalance');
  const [order, setOrder] = useState('desc');
  const [selectedUser, setSelectedUser] = useState(null);
  const [userTransactions, setUserTransactions] = useState([]);
  const [showUserModal, setShowUserModal] = useState(false);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({});

  useEffect(() => {
    fetchData();
  }, [page, search, sortBy, order]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [usersResponse, statsResponse] = await Promise.all([
        adminService.getUsersLedger({ page, search, sortBy, order }),
        adminService.getLedgerStats()
      ]);

      if (usersResponse.success) {
        setUsers(usersResponse.data.summaries || []);
        setPagination(usersResponse.data.pagination || {});
      } else {
        console.log('👥 No users with payment history found');
        setUsers([]);
        setPagination({});
      }

      if (statsResponse.success) {
        setStats(statsResponse.data);
      } else {
        console.log('📊 No payment statistics available');
        setStats({
          overview: {
            totalUsers: 0,
            totalCredits: 0,
            totalDebits: 0,
            totalTransactions: 0,
            netBalance: 0
          }
        });
      }
    } catch (error) {
      console.error('❌ Error fetching ledger data:', error);
      console.log('📊 Using empty state data');
      setUsers([]);
      setPagination({});
      setStats({
        overview: {
          totalUsers: 0,
          totalCredits: 0,
          totalDebits: 0,
          totalTransactions: 0,
          netBalance: 0
        }
      });
    } finally {
      setLoading(false);
    }
  };

  const handleViewUser = async (user) => {
    try {
      setSelectedUser(user);
      setShowUserModal(true);
      
      // Fetch user's transaction history
      const response = await adminService.getUserTransactions(user.userId, {
        page: 1,
        limit: 50
      });
      
      if (response.success) {
        setUserTransactions(response.data.ledgerEntries);
      }
    } catch (error) {
      console.error('Error fetching user transactions:', error);
    }
  };

  const handleExportUser = async (userId) => {
    try {
      await adminService.exportUserLedger(userId);
    } catch (error) {
      console.error('Error exporting user ledger:', error);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getBalanceColor = (balance) => {
    if (balance > 0) return 'text-green-400';
    if (balance < 0) return 'text-red-400';
    return 'text-gray-400';
  };

  const getBalanceIcon = (balance) => {
    if (balance > 0) return <TrendingUp className="w-4 h-4" />;
    if (balance < 0) return <TrendingDown className="w-4 h-4" />;
    return <DollarSign className="w-4 h-4" />;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-gray-400 mt-4 font-medium">Loading user ledgers...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">User Payment Ledger</h1>
          <p className="text-gray-400">Complete payment history for all MATCHIFY.PRO users</p>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-slate-800/50 backdrop-blur-sm border border-blue-500/30 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                  <Users className="w-6 h-6 text-blue-400" />
                </div>
              </div>
              <h3 className="text-2xl font-bold text-white mb-1">{stats.overview.totalUsers}</h3>
              <p className="text-gray-400 text-sm">Total Users</p>
            </div>

            <div className="bg-slate-800/50 backdrop-blur-sm border border-green-500/30 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-green-400" />
                </div>
              </div>
              <h3 className="text-2xl font-bold text-white mb-1">{formatCurrency(stats.overview.totalCredits)}</h3>
              <p className="text-gray-400 text-sm">Total Received</p>
            </div>

            <div className="bg-slate-800/50 backdrop-blur-sm border border-red-500/30 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-red-500/20 rounded-xl flex items-center justify-center">
                  <TrendingDown className="w-6 h-6 text-red-400" />
                </div>
              </div>
              <h3 className="text-2xl font-bold text-white mb-1">{formatCurrency(stats.overview.totalDebits)}</h3>
              <p className="text-gray-400 text-sm">Total Paid Out</p>
            </div>

            <div className="bg-slate-800/50 backdrop-blur-sm border border-purple-500/30 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-purple-400" />
                </div>
              </div>
              <h3 className="text-2xl font-bold text-white mb-1">{formatCurrency(stats.overview.netBalance)}</h3>
              <p className="text-gray-400 text-sm">Net Balance</p>
            </div>
          </div>
        )}

        {/* Search and Filters */}
        <div className="bg-slate-800/50 backdrop-blur-sm border border-white/10 rounded-2xl p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search users by name, email, or phone..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-slate-700/50 border border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-purple-500/50"
              />
            </div>
            
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-3 bg-slate-700/50 border border-white/10 rounded-xl text-white focus:outline-none focus:border-purple-500/50"
            >
              <option value="currentBalance">Sort by Balance</option>
              <option value="totalCredits">Sort by Total Paid</option>
              <option value="totalTransactions">Sort by Transactions</option>
              <option value="lastTransactionDate">Sort by Last Activity</option>
            </select>

            <select
              value={order}
              onChange={(e) => setOrder(e.target.value)}
              className="px-4 py-3 bg-slate-700/50 border border-white/10 rounded-xl text-white focus:outline-none focus:border-purple-500/50"
            >
              <option value="desc">Highest First</option>
              <option value="asc">Lowest First</option>
            </select>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-slate-800/50 backdrop-blur-sm border border-white/10 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-700/50">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">User</th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-gray-300">Total Paid</th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-gray-300">Total Received</th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-gray-300">Balance</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-gray-300">Transactions</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-gray-300">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {users && users.length > 0 ? (
                  users.map((user) => (
                    <tr key={user.userId} className="hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                            <UserIcon className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <p className="font-semibold text-white">{user.user.name}</p>
                            <p className="text-sm text-gray-400">{user.user.email}</p>
                            {user.user.phone && (
                              <p className="text-xs text-gray-500">{user.user.phone}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="text-green-400 font-semibold">
                          {formatCurrency(user.totalCredits)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="text-red-400 font-semibold">
                          {formatCurrency(user.totalDebits)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className={`flex items-center justify-end gap-2 font-semibold ${getBalanceColor(user.currentBalance)}`}>
                          {getBalanceIcon(user.currentBalance)}
                          {formatCurrency(Math.abs(user.currentBalance))}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="text-white font-medium">{user.totalTransactions}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleViewUser(user)}
                            className="p-2 bg-blue-500/20 border border-blue-500/30 rounded-lg text-blue-300 hover:bg-blue-500/30 transition-all"
                            title="View Transactions"
                          >
                            <EyeIcon className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleExportUser(user.userId)}
                            className="p-2 bg-green-500/20 border border-green-500/30 rounded-lg text-green-300 hover:bg-green-500/30 transition-all"
                            title="Export Ledger"
                          >
                            <ArrowDownTrayIcon className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="px-6 py-16 text-center">
                      <div className="flex flex-col items-center">
                        <div className="w-16 h-16 bg-gray-500/20 rounded-full flex items-center justify-center mb-4">
                          <Users className="w-8 h-8 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-white mb-2">No Payment History Found</h3>
                        <p className="text-gray-400 max-w-md">
                          {search ? 
                            `No users found matching "${search}". Try adjusting your search terms.` :
                            'No users have made tournament payments yet. Payment history will appear here once users start registering for badminton tournaments.'
                          }
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="px-6 py-4 border-t border-white/10 flex items-center justify-between">
              <p className="text-sm text-gray-400">
                Showing {((page - 1) * pagination.limit) + 1} to {Math.min(page * pagination.limit, pagination.total)} of {pagination.total} users
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1}
                  className="px-3 py-1 bg-slate-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-600 transition-colors"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage(page + 1)}
                  disabled={page === pagination.pages}
                  className="px-3 py-1 bg-slate-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-600 transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>

        {/* User Transaction Modal */}
        {showUserModal && selectedUser && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-slate-800 border border-white/10 rounded-2xl max-w-4xl w-full max-h-[80vh] overflow-hidden">
              <div className="p-6 border-b border-white/10">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-white">{selectedUser.user.name}</h2>
                    <p className="text-gray-400">{selectedUser.user.email}</p>
                  </div>
                  <button
                    onClick={() => setShowUserModal(false)}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                  >
                    <span className="text-gray-400 text-xl">×</span>
                  </button>
                </div>
                
                {/* User Summary */}
                <div className="grid grid-cols-3 gap-4 mt-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-400">{formatCurrency(selectedUser.totalCredits)}</p>
                    <p className="text-sm text-gray-400">Total Paid</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-red-400">{formatCurrency(selectedUser.totalDebits)}</p>
                    <p className="text-sm text-gray-400">Total Received</p>
                  </div>
                  <div className="text-center">
                    <p className={`text-2xl font-bold ${getBalanceColor(selectedUser.currentBalance)}`}>
                      {formatCurrency(Math.abs(selectedUser.currentBalance))}
                    </p>
                    <p className="text-sm text-gray-400">Net Balance</p>
                  </div>
                </div>
              </div>

              {/* Transactions List */}
              <div className="p-6 max-h-96 overflow-y-auto">
                <h3 className="text-lg font-semibold text-white mb-4">Transaction History</h3>
                <div className="space-y-3">
                  {userTransactions.map((transaction) => (
                    <div key={transaction.id} className="p-4 bg-slate-700/30 rounded-xl border border-white/5">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            transaction.type === 'CREDIT' ? 'bg-green-500/20' : 'bg-red-500/20'
                          }`}>
                            {transaction.type === 'CREDIT' ? 
                              <TrendingUp className="w-4 h-4 text-green-400" /> :
                              <TrendingDown className="w-4 h-4 text-red-400" />
                            }
                          </div>
                          <div>
                            <p className="font-medium text-white">{transaction.category.replace('_', ' ')}</p>
                            <p className="text-sm text-gray-400">{transaction.description}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`font-semibold ${transaction.type === 'CREDIT' ? 'text-green-400' : 'text-red-400'}`}>
                            {transaction.type === 'CREDIT' ? '+' : '-'}{formatCurrency(transaction.amount)}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(transaction.transactionDate).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      {transaction.tournament && (
                        <p className="text-xs text-gray-500">Tournament: {transaction.tournament.name}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserLedgerPage;