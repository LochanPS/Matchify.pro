import { useState, useEffect } from 'react';
import { Wallet as WalletIcon, Download } from 'lucide-react';
import axios from 'axios';
import TransactionTable from '../components/wallet/TransactionTable';

const Wallet = () => {
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
      const token = localStorage.getItem('token');
      
      // Fetch balance
      const balanceRes = await axios.get('http://localhost:5000/api/wallet/balance', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setBalance(balanceRes.data.balance);

      // Fetch transactions
      const transactionsRes = await axios.get(
        `http://localhost:5000/api/wallet/transactions?page=${page}&limit=20`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setTransactions(transactionsRes.data.data.transactions);
      setTotalPages(transactionsRes.data.data.pagination.totalPages);
      
    } catch (error) {
      console.error('Error fetching wallet data:', error);
      alert('Failed to load wallet data');
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

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `matchify-transactions-${Date.now()}.csv`;
    a.click();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <WalletIcon className="w-8 h-8" />
            My Wallet
          </h1>
        </div>

        {/* Balance Card */}
        <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl p-8 text-white shadow-xl mb-8">
          <div>
            <p className="text-blue-100 text-sm mb-2">Available Balance</p>
            <p className="text-5xl font-bold">₹{balance.toFixed(2)}</p>
          </div>
        </div>

        {/* Transaction History */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Transaction History</h2>
            <button
              onClick={exportToCSV}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </button>
          </div>

          <TransactionTable 
            transactions={transactions}
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        </div>
      </div>
    </div>
  );
};

export default Wallet;