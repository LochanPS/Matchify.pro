import { useState, useEffect } from 'react';
import { 
  CheckCircleIcon, 
  XCircleIcon,
  ClockIcon,
  EyeIcon,
  UserIcon,
  CurrencyDollarIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  MagnifyingGlassIcon,
  FunnelIcon
} from '@heroicons/react/24/outline';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const PaymentVerificationPage = () => {
  const [verifications, setVerifications] = useState([]);
  const [filteredVerifications, setFilteredVerifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [expandedCard, setExpandedCard] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [confirmModal, setConfirmModal] = useState({ show: false, type: null, verification: null });
  const [rejectModal, setRejectModal] = useState({ show: false, verification: null, reason: '' });
  const [bulkActionModal, setBulkActionModal] = useState({ show: false, action: null, count: 0 });
  const [bulkProcessing, setBulkProcessing] = useState(false);
  const [toast, setToast] = useState({ show: false, type: '', message: '' });

  const showToast = (type, message) => {
    setToast({ show: true, type, message });
    setTimeout(() => setToast({ show: false, type: '', message: '' }), 4000);
  };

  useEffect(() => {
    fetchVerifications();
  }, []);

  useEffect(() => {
    filterAndSortVerifications();
  }, [verifications, searchTerm, sortBy]);

  const getAuthHeader = () => {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const fetchVerifications = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/admin/payment-verifications`, {
        headers: getAuthHeader(),
        params: { 
          status: 'pending' // Only show pending payments, no limit to get all
        }
      });

      if (response.data.success) {
        setVerifications(response.data.data || []);
      }
    } catch (error) {
      console.error('Error fetching verifications:', error);
      setVerifications([]);
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortVerifications = () => {
    let filtered = [...verifications];

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(v => 
        v.registration?.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.registration?.user?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.registration?.tournament?.name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.submittedAt) - new Date(a.submittedAt);
        case 'oldest':
          return new Date(a.submittedAt) - new Date(b.submittedAt);
        case 'amount-high':
          return (b.amount || 0) - (a.amount || 0);
        case 'amount-low':
          return (a.amount || 0) - (b.amount || 0);
        case 'name':
          return (a.registration?.user?.name || '').localeCompare(b.registration?.user?.name || '');
        default:
          return 0;
      }
    });

    setFilteredVerifications(filtered);
  };

  const toggleExpanded = (verificationId) => {
    setExpandedCard(expandedCard === verificationId ? null : verificationId);
  };

  const handleApprove = async (verification) => {
    setConfirmModal({ show: true, type: 'approve', verification });
  };

  const handleReject = (verification) => {
    setRejectModal({ show: true, verification, reason: '' });
  };

  const confirmApprove = async () => {
    try {
      setProcessing(confirmModal.verification.id);
      setConfirmModal({ show: false, type: null, verification: null });
      
      const response = await axios.post(
        `${API_URL}/admin/payment-verifications/${confirmModal.verification.id}/approve`,
        {},
        { headers: getAuthHeader() }
      );

      if (response.data.success) {
        showToast('success', '✅ Payment APPROVED! Player has been registered to the tournament.');
        fetchVerifications(); // Refresh the list
      }
    } catch (error) {
      console.error('Error approving payment:', error);
      showToast('error', '❌ Failed to approve payment. Please try again.');
    } finally {
      setProcessing(null);
    }
  };

  const handleRejectSubmit = async () => {
    if (!rejectModal.reason.trim()) {
      showToast('error', 'Please provide a reason for rejection.');
      return;
    }

    try {
      setProcessing(rejectModal.verification.id);
      const response = await axios.post(
        `${API_URL}/admin/payment-verifications/${rejectModal.verification.id}/reject`,
        { 
          reason: rejectModal.reason,
          rejectionType: 'CUSTOM'
        },
        { headers: getAuthHeader() }
      );

      if (response.data.success) {
        showToast('success', '❌ Payment REJECTED! Player has been notified.');
        setRejectModal({ show: false, verification: null, reason: '' });
        fetchVerifications(); // Refresh the list
      }
    } catch (error) {
      console.error('Error rejecting payment:', error);
      showToast('error', '❌ Failed to reject payment. Please try again.');
    } finally {
      setProcessing(null);
    }
  };

  const handleBulkApprove = () => {
    setBulkActionModal({ 
      show: true, 
      action: 'approve', 
      count: filteredVerifications.length 
    });
  };

  const handleBulkReject = () => {
    setBulkActionModal({ 
      show: true, 
      action: 'reject', 
      count: filteredVerifications.length 
    });
  };

  const confirmBulkAction = async () => {
    try {
      setBulkProcessing(true);
      setBulkActionModal({ show: false, action: null, count: 0 });

      const action = bulkActionModal.action;
      const verificationIds = filteredVerifications.map(v => v.id);
      
      console.log(`Starting bulk ${action} for ${verificationIds.length} payments`);
      
      if (action === 'approve') {
        // Bulk approve all payments
        const response = await axios.post(
          `${API_URL}/admin/payment-verifications/bulk/approve`,
          { verificationIds },
          { headers: getAuthHeader() }
        );

        console.log('Bulk approve response:', response.data);

        if (response.data.success) {
          const { results } = response.data;
          showToast('success', `✅ Successfully approved ${results.successful} payments! All players have been registered.`);
          if (results.failed > 0) {
            console.warn('Some approvals failed:', results.errors);
            showToast('warning', `⚠️ ${results.failed} payments failed to approve. Check console for details.`);
          }
        } else {
          throw new Error(response.data.message || 'Bulk approve failed');
        }
      } else if (action === 'reject') {
        // Bulk reject all payments
        const response = await axios.post(
          `${API_URL}/admin/payment-verifications/bulk/reject`,
          { 
            verificationIds,
            reason: 'Bulk rejection by admin',
            rejectionType: 'CUSTOM'
          },
          { headers: getAuthHeader() }
        );

        console.log('Bulk reject response:', response.data);

        if (response.data.success) {
          const { results } = response.data;
          showToast('success', `❌ Successfully rejected ${results.successful} payments! All players have been notified.`);
          if (results.failed > 0) {
            console.warn('Some rejections failed:', results.errors);
            showToast('warning', `⚠️ ${results.failed} payments failed to reject. Check console for details.`);
          }
        } else {
          throw new Error(response.data.message || 'Bulk reject failed');
        }
      }

      fetchVerifications(); // Refresh the list
    } catch (error) {
      console.error('Error in bulk action:', error);
      
      // More specific error messages
      let errorMessage = `❌ Failed to ${bulkActionModal.action} all payments.`;
      
      if (error.response) {
        // Server responded with error status
        errorMessage += ` Server error: ${error.response.data?.message || error.response.statusText}`;
      } else if (error.request) {
        // Request was made but no response received
        errorMessage += ' No response from server. Please check your connection.';
      } else {
        // Something else happened
        errorMessage += ` ${error.message}`;
      }
      
      showToast('error', errorMessage);
    } finally {
      setBulkProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading payments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Enhanced Header with Search and Filters */}
      <div className="bg-slate-900/95 backdrop-blur-lg border-b border-white/10 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold text-white mb-2">💰 Payment Verification</h1>
            <p className="text-gray-400 text-lg">Review and approve player payments - Simple & Fast</p>
            {filteredVerifications.length > 0 && (
              <div className="mt-4 inline-flex items-center gap-2 bg-amber-500/20 text-amber-400 px-4 py-2 rounded-full">
                <ClockIcon className="w-5 h-5" />
                <span className="font-medium">{filteredVerifications.length} payments waiting for your approval</span>
              </div>
            )}
          </div>

          {/* Search and Filter Controls */}
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-center max-w-4xl mx-auto">
            {/* Search */}
            <div className="relative flex-1 w-full sm:w-auto">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, email, or tournament..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-slate-800/50 text-white rounded-xl border border-white/10 focus:border-purple-500/50 focus:outline-none"
              />
            </div>

            {/* Sort Filter */}
            <div className="relative">
              <FunnelIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="pl-10 pr-8 py-3 bg-slate-800/50 text-white rounded-xl border border-white/10 focus:border-purple-500/50 focus:outline-none appearance-none cursor-pointer"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="amount-high">Amount: High to Low</option>
                <option value="amount-low">Amount: Low to High</option>
                <option value="name">Name: A to Z</option>
              </select>
            </div>
          </div>

          {/* Bulk Action Buttons */}
          {filteredVerifications.length > 0 && (
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-center mt-6">
              <button
                onClick={handleBulkApprove}
                disabled={bulkProcessing}
                className="px-8 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl hover:shadow-lg hover:shadow-green-500/30 transition-all font-bold disabled:opacity-50 flex items-center gap-3"
              >
                {bulkProcessing ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <CheckCircleIcon className="w-5 h-5" />
                )}
                ✅ APPROVE EVERYONE ({filteredVerifications.length})
              </button>

              <button
                onClick={handleBulkReject}
                disabled={bulkProcessing}
                className="px-8 py-3 bg-gradient-to-r from-red-500 to-rose-600 text-white rounded-xl hover:shadow-lg hover:shadow-red-500/30 transition-all font-bold disabled:opacity-50 flex items-center gap-3"
              >
                {bulkProcessing ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <XCircleIcon className="w-5 h-5" />
                )}
                ❌ REJECT EVERYONE ({filteredVerifications.length})
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {filteredVerifications.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircleIcon className="h-10 w-10 text-green-400" />
            </div>
            <h3 className="text-2xl font-semibold text-white mb-2">
              {searchTerm ? 'No matching payments found' : 'All Caught Up! 🎉'}
            </h3>
            <p className="text-gray-400 text-lg">
              {searchTerm ? 'Try adjusting your search terms.' : 'No pending payments to review at the moment.'}
            </p>
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="mt-4 px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                Clear Search
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredVerifications.map((verification, index) => (
              <div key={verification.id} className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-white/10 overflow-hidden transition-all duration-200 hover:border-white/20">
                
                {/* Compact Header - Always Visible */}
                <div 
                  className="p-4 cursor-pointer hover:bg-slate-700/30 transition-colors"
                  onClick={() => toggleExpanded(verification.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      {/* User Avatar */}
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                        <span className="text-blue-400 font-bold text-lg">
                          {verification.registration?.user?.name?.charAt(0)?.toUpperCase() || 'U'}
                        </span>
                      </div>
                      
                      {/* Basic Info */}
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          <h3 className="text-lg font-bold text-white">{verification.registration?.user?.name || 'Unknown Player'}</h3>
                          <span className="text-2xl font-bold text-emerald-400">₹{verification.amount?.toLocaleString()}</span>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-400">
                          <span>📧 {verification.registration?.user?.email || 'No email'}</span>
                          <span>🏆 {verification.registration?.tournament?.name || 'Tournament'}</span>
                          <span>📅 {new Date(verification.submittedAt).toLocaleDateString('en-IN')}</span>
                        </div>
                      </div>
                    </div>

                    {/* Quick Actions & Expand Button */}
                    <div className="flex items-center gap-3">
                      {/* Quick Approve */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleApprove(verification);
                        }}
                        disabled={processing === verification.id}
                        className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:shadow-lg hover:shadow-green-500/30 transition-all font-medium disabled:opacity-50 flex items-center gap-2"
                      >
                        {processing === verification.id ? (
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <>
                            <CheckCircleIcon className="w-4 h-4" />
                            Approve
                          </>
                        )}
                      </button>

                      {/* Quick Reject */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleReject(verification);
                        }}
                        disabled={processing === verification.id}
                        className="px-4 py-2 bg-gradient-to-r from-red-500 to-rose-600 text-white rounded-lg hover:shadow-lg hover:shadow-red-500/30 transition-all font-medium disabled:opacity-50 flex items-center gap-2"
                      >
                        <XCircleIcon className="w-4 h-4" />
                        Reject
                      </button>

                      {/* Expand Button */}
                      <div className="flex items-center gap-2 text-gray-400">
                        <span className="text-sm">Details</span>
                        {expandedCard === verification.id ? (
                          <ChevronUpIcon className="w-5 h-5" />
                        ) : (
                          <ChevronDownIcon className="w-5 h-5" />
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Expanded Details */}
                {expandedCard === verification.id && (
                  <div className="border-t border-white/10 p-6 bg-slate-800/30">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      
                      {/* Detailed Player & Tournament Info */}
                      <div className="space-y-4">
                        <h4 className="text-lg font-semibold text-white mb-3">Player & Tournament Details</h4>
                        
                        <div className="bg-slate-700/50 rounded-xl p-4 space-y-3">
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <p className="text-gray-400">Player Name</p>
                              <p className="text-white font-medium">{verification.registration?.user?.name || 'N/A'}</p>
                            </div>
                            <div>
                              <p className="text-gray-400">Email</p>
                              <p className="text-white font-medium">{verification.registration?.user?.email || 'N/A'}</p>
                            </div>
                            <div>
                              <p className="text-gray-400">Phone</p>
                              <p className="text-white font-medium">{verification.registration?.user?.phone || 'N/A'}</p>
                            </div>
                            <div>
                              <p className="text-gray-400">City</p>
                              <p className="text-white font-medium">{verification.registration?.user?.city || 'N/A'}</p>
                            </div>
                          </div>
                        </div>

                        <div className="bg-slate-700/50 rounded-xl p-4 space-y-3">
                          <div className="grid grid-cols-1 gap-3 text-sm">
                            <div>
                              <p className="text-gray-400">Tournament</p>
                              <p className="text-white font-medium">{verification.registration?.tournament?.name || 'N/A'}</p>
                            </div>
                            <div>
                              <p className="text-gray-400">Category</p>
                              <p className="text-white font-medium">{verification.registration?.category?.name || 'N/A'}</p>
                            </div>
                            <div>
                              <p className="text-gray-400">Location</p>
                              <p className="text-white font-medium">
                                {verification.registration?.tournament?.city}, {verification.registration?.tournament?.state}
                              </p>
                            </div>
                            <div>
                              <p className="text-gray-400">Submitted</p>
                              <p className="text-white font-medium">
                                {new Date(verification.submittedAt).toLocaleString('en-IN')}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Payment Screenshot */}
                      <div className="space-y-4">
                        <h4 className="text-lg font-semibold text-white mb-3">Payment Screenshot</h4>
                        
                        <div className="bg-gradient-to-br from-emerald-500/10 to-green-500/10 border border-emerald-500/30 rounded-xl p-4">
                          <div className="flex items-center gap-2 mb-3">
                            <CurrencyDollarIcon className="w-5 h-5 text-emerald-400" />
                            <span className="text-emerald-400 font-medium">Payment Amount</span>
                          </div>
                          <p className="text-3xl font-bold text-white mb-4">₹{verification.amount?.toLocaleString()}</p>
                          
                          {verification.paymentScreenshot && (
                            <div>
                              <button
                                onClick={() => setSelectedImage(verification.paymentScreenshot)}
                                className="group relative block w-full"
                              >
                                <img
                                  src={verification.paymentScreenshot}
                                  alt="Payment Screenshot"
                                  className="w-full h-48 object-cover rounded-lg border-2 border-white/10 group-hover:border-blue-500/50 transition-all"
                                />
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 rounded-lg flex items-center justify-center transition-all">
                                  <div className="bg-blue-600 rounded-full p-3 opacity-0 group-hover:opacity-100 transition-all">
                                    <EyeIcon className="w-6 h-6 text-white" />
                                  </div>
                                </div>
                              </button>
                              <p className="text-center text-xs text-gray-400 mt-2">Click to view full screenshot</p>
                            </div>
                          )}
                        </div>

                        {/* Action Explanation */}
                        <div className="bg-slate-700/50 rounded-xl p-4 text-center">
                          <p className="text-gray-400 text-sm">
                            <strong className="text-green-400">Approve:</strong> Player gets registered to tournament<br/>
                            <strong className="text-red-400">Reject:</strong> Player gets notified with reason
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Image Modal */}
      {selectedImage && (
        <div 
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div className="max-w-4xl max-h-full">
            <img
              src={selectedImage}
              alt="Payment Screenshot"
              className="max-w-full max-h-full object-contain rounded-lg"
            />
            <p className="text-center text-white mt-4">Click anywhere to close</p>
          </div>
        </div>
      )}

      {/* MATCHIFY.PRO Bulk Action Confirmation Modal */}
      {bulkActionModal.show && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-2xl shadow-2xl max-w-md w-full border border-white/10">
            <div className="p-6">
              {/* MATCHIFY.PRO Header */}
              <div className="text-center mb-6">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
                  bulkActionModal.action === 'approve' 
                    ? 'bg-gradient-to-br from-green-500 to-emerald-600' 
                    : 'bg-gradient-to-br from-red-500 to-rose-600'
                }`}>
                  <span className="text-white font-bold text-xl">M</span>
                </div>
                <h3 className="text-xl font-bold text-white mb-2">MATCHIFY.PRO</h3>
                <p className="text-gray-400">
                  {bulkActionModal.action === 'approve' ? 'Bulk Payment Approval' : 'Bulk Payment Rejection'}
                </p>
              </div>

              <div className={`border rounded-xl p-4 mb-6 ${
                bulkActionModal.action === 'approve' 
                  ? 'bg-green-500/10 border-green-500/30' 
                  : 'bg-red-500/10 border-red-500/30'
              }`}>
                <h4 className={`font-semibold mb-2 ${
                  bulkActionModal.action === 'approve' ? 'text-green-400' : 'text-red-400'
                }`}>
                  {bulkActionModal.action === 'approve' ? 'Approve All Payments?' : 'Reject All Payments?'}
                </h4>
                <p className="text-white mb-2">
                  <strong>{bulkActionModal.count} payments</strong> will be {bulkActionModal.action}d
                </p>
                <p className="text-gray-300 text-sm">
                  {bulkActionModal.action === 'approve' 
                    ? 'This will register ALL players to the tournament and send them confirmations.'
                    : 'This will reject ALL payments and notify all players with the reason.'
                  }
                </p>
                {bulkActionModal.action === 'reject' && (
                  <p className="text-yellow-400 text-sm mt-2 font-medium">
                    ⚠️ This action cannot be undone easily!
                  </p>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setBulkActionModal({ show: false, action: null, count: 0 })}
                  className="flex-1 py-3 px-4 bg-slate-700 text-white rounded-xl hover:bg-slate-600 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmBulkAction}
                  disabled={bulkProcessing}
                  className={`flex-1 py-3 px-4 rounded-xl transition-all font-bold disabled:opacity-50 ${
                    bulkActionModal.action === 'approve'
                      ? 'bg-gradient-to-r from-green-500 to-emerald-600 hover:shadow-lg hover:shadow-green-500/30'
                      : 'bg-gradient-to-r from-red-500 to-rose-600 hover:shadow-lg hover:shadow-red-500/30'
                  } text-white`}
                >
                  {bulkProcessing ? 'Processing...' : 
                    bulkActionModal.action === 'approve' ? '✅ Approve All' : '❌ Reject All'
                  }
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MATCHIFY.PRO Confirmation Modal */}
      {confirmModal.show && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-2xl shadow-2xl max-w-md w-full border border-white/10">
            <div className="p-6">
              {/* MATCHIFY.PRO Header */}
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-white font-bold text-xl">M</span>
                </div>
                <h3 className="text-xl font-bold text-white mb-2">MATCHIFY.PRO</h3>
                <p className="text-gray-400">Payment Approval Confirmation</p>
              </div>

              <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 mb-6">
                <h4 className="text-green-400 font-semibold mb-2">Approve Payment?</h4>
                <p className="text-white mb-2">
                  Player: <strong>{confirmModal.verification?.registration?.user?.name}</strong>
                </p>
                <p className="text-white mb-2">
                  Amount: <strong>₹{confirmModal.verification?.amount?.toLocaleString()}</strong>
                </p>
                <p className="text-gray-300 text-sm">
                  This will register the player to the tournament and send them a confirmation.
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setConfirmModal({ show: false, type: null, verification: null })}
                  className="flex-1 py-3 px-4 bg-slate-700 text-white rounded-xl hover:bg-slate-600 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmApprove}
                  disabled={processing}
                  className="flex-1 py-3 px-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl hover:shadow-lg hover:shadow-green-500/30 transition-all font-bold disabled:opacity-50"
                >
                  {processing ? 'Approving...' : '✅ Approve'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MATCHIFY.PRO Reject Modal */}
      {rejectModal.show && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-2xl shadow-2xl max-w-md w-full border border-white/10">
            <div className="p-6">
              {/* MATCHIFY.PRO Header */}
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-rose-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-white font-bold text-xl">M</span>
                </div>
                <h3 className="text-xl font-bold text-white mb-2">MATCHIFY.PRO</h3>
                <p className="text-gray-400">Payment Rejection</p>
              </div>

              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-4">
                <h4 className="text-red-400 font-semibold mb-2">Reject Payment</h4>
                <p className="text-white mb-2">
                  Player: <strong>{rejectModal.verification?.registration?.user?.name}</strong>
                </p>
                <p className="text-white mb-2">
                  Amount: <strong>₹{rejectModal.verification?.amount?.toLocaleString()}</strong>
                </p>
              </div>

              <div className="mb-4">
                <label className="block text-white font-medium mb-2">
                  Why are you rejecting this payment?
                </label>
                <textarea
                  value={rejectModal.reason}
                  onChange={(e) => setRejectModal({ ...rejectModal, reason: e.target.value })}
                  placeholder="e.g., Payment amount is incorrect, Invalid screenshot, Wrong account, etc."
                  className="w-full p-3 bg-slate-700 text-white rounded-xl border border-white/10 resize-none focus:border-red-500/50 focus:outline-none"
                  rows={4}
                />
                <p className="text-gray-400 text-sm mt-2">
                  The player will receive this reason in their notification.
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setRejectModal({ show: false, verification: null, reason: '' })}
                  className="flex-1 py-3 px-4 bg-slate-700 text-white rounded-xl hover:bg-slate-600 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRejectSubmit}
                  disabled={!rejectModal.reason.trim() || processing}
                  className="flex-1 py-3 px-4 bg-gradient-to-r from-red-500 to-rose-600 text-white rounded-xl hover:shadow-lg hover:shadow-red-500/30 transition-all font-bold disabled:opacity-50"
                >
                  {processing ? 'Rejecting...' : '❌ Reject'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MATCHIFY.PRO Toast Notification */}
      {toast.show && (
        <div className="fixed top-4 right-4 z-50">
          <div className={`rounded-xl shadow-2xl border p-4 max-w-sm transform transition-all duration-300 ${
            toast.type === 'success' 
              ? 'bg-green-500/20 border-green-500/30 text-green-400' 
              : 'bg-red-500/20 border-red-500/30 text-red-400'
          }`}>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-white font-bold text-sm">M</span>
              </div>
              <div className="flex-1">
                <p className="font-semibold text-sm mb-1">MATCHIFY.PRO</p>
                <p className="text-white text-sm">{toast.message}</p>
              </div>
              <button
                onClick={() => setToast({ show: false, type: '', message: '' })}
                className="text-gray-400 hover:text-white transition-colors"
              >
                ×
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentVerificationPage;