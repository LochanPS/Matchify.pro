import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Wallet as WalletIcon, Download, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import api from '../utils/api';
import TransactionTable from '../components/wallet/TransactionTable';

const Wallet = () => {
  const navigate = useNavigate();
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchWalletData();
  }, [page]);

  const fetchWalletData = async () => {
    try {
      setLoading(true);
      
      const balanceRes = await api.get('/wallet/balance');
      setBalance(balanceRes.data.balance);

      const transactionsRes = await api.get(`/wallet/transactions?page=${page}&limit=20`);
      setTransactions(transactionsRes.data.data.transactions);
      setTotalPages(transactionsRes.data.data.pagination.totalPages);
      
    } catch (error) {
      console.error('Error fetching wallet data:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    const headers = ['Date', 'Type', 'Description', 'Amount', 'Balance After'];
    const rows = transactions.map(t => [
      new Date(t.createdAt).toLocaleString(),
      t.type,
      t.description,
      t.amount > 0 ? `+₹${t.amount}` : `₹${t.amount}`,
      `₹${t.balanceAfter}`
    ]);

    const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `matchify-transactions-${Date.now()}.csv`;
    a.click();
  };

  // Calculate stats
  const totalCredits = transactions.filter(t => t.type === 'CREDIT').reduce((sum, t) => sum + t.amount, 0);
  const totalDebits = transactions.filter(t => t.type === 'DEBIT').reduce((sum, t) => sum + t.amount, 0);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#07071a' }}>
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-t-transparent rounded-full animate-spin mx-auto" style={{ borderColor: 'rgba(0,255,136,0.3)', borderTopColor: 'transparent' }}></div>
          <p className="mt-4 font-medium" style={{ color: 'rgba(255,255,255,0.5)' }}>Loading wallet...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: '#07071a' }}>
      {/* Hero Header */}
      <div className="relative overflow-hidden" style={{ background: 'linear-gradient(135deg,#07071a 0%,#0a1a12 50%,#07071a 100%)' }}>
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/4 w-80 h-80 rounded-full blur-3xl opacity-20" style={{ background: '#00ff88' }}></div>
          <div className="absolute bottom-0 right-1/4 w-80 h-80 rounded-full blur-3xl opacity-15" style={{ background: '#00d4ff' }}></div>
        </div>

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          {/* Back Button */}
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 mb-6 transition-colors group"
            style={{ color: 'rgba(255,255,255,0.6)' }}
          >
            <ArrowLeftIcon className="h-5 w-5 group-hover:-translate-x-1 transition-transform" />
            <span>Back</span>
          </button>

          <div className="flex items-center gap-4 mb-8">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center shadow-lg" style={{ background: 'linear-gradient(135deg,#00ff88,#00d4ff)', boxShadow: '0 0 24px rgba(0,255,136,0.3)' }}>
              <WalletIcon className="w-7 h-7 sm:w-8 sm:h-8" style={{ color: '#003320' }} />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white">My Wallet</h1>
              <p style={{ color: 'rgba(255,255,255,0.5)' }}>Manage your Matchify balance</p>
            </div>
          </div>

          {/* Balance Card */}
          <div className="rounded-2xl p-6 sm:p-8 border" style={{ background: 'rgba(0,255,136,0.06)', borderColor: 'rgba(0,255,136,0.2)' }}>
            <p className="text-sm mb-2" style={{ color: 'rgba(255,255,255,0.5)' }}>Available Balance</p>
            <p className="font-black text-white" style={{ fontSize: 'clamp(2rem,8vw,3.5rem)' }}>₹{balance.toFixed(2)}</p>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          <div className="rounded-2xl p-5 flex items-center gap-4 border" style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(0,255,136,0.12)' }}>
            <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(0,255,136,0.12)' }}>
              <ArrowDownLeft className="w-6 h-6" style={{ color: '#00ff88' }} />
            </div>
            <div>
              <p className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>Total Credits</p>
              <p className="text-xl sm:text-2xl font-bold" style={{ color: '#00ff88' }}>+₹{totalCredits.toFixed(2)}</p>
            </div>
          </div>

          <div className="rounded-2xl p-5 flex items-center gap-4 border" style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,80,80,0.15)' }}>
            <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(255,80,80,0.1)' }}>
              <ArrowUpRight className="w-6 h-6" style={{ color: '#ff5050' }} />
            </div>
            <div>
              <p className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>Total Debits</p>
              <p className="text-xl sm:text-2xl font-bold" style={{ color: '#ff5050' }}>-₹{totalDebits.toFixed(2)}</p>
            </div>
          </div>
        </div>

        {/* Transaction History */}
        <div className="rounded-2xl overflow-hidden border" style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.08)' }}>
          <div className="p-4 sm:p-6 border-b flex flex-wrap items-center justify-between gap-3" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(0,212,255,0.15)' }}>
                <TrendingUp className="w-5 h-5" style={{ color: '#00d4ff' }} />
              </div>
              <h2 className="text-base sm:text-lg font-bold text-white">Transaction History</h2>
            </div>
            <button
              onClick={exportToCSV}
              className="flex items-center gap-2 px-3 py-2 rounded-xl transition-all font-medium text-sm border"
              style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.8)', borderColor: 'rgba(255,255,255,0.1)' }}
            >
              <Download className="w-4 h-4" />
              Export CSV
            </button>
          </div>

          <div className="p-6">
            <TransactionTable 
              transactions={transactions}
              page={page}
              totalPages={totalPages}
              onPageChange={setPage}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Wallet;
