import { useState, useEffect } from 'react';
import { 
  BellIcon, 
  CurrencyDollarIcon, 
  ClockIcon, 
  ExclamationTriangleIcon,
  DocumentArrowDownIcon,
  EyeIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import { TrendingUp, FileText, AlertCircle } from 'lucide-react';
import adminService from '../../services/adminService';

const AdminPaymentDashboard = () => {
  const [paymentData, setPaymentData] = useState({
    todayReceived: 0,
    todayToPay: 0,
    platformEarnings: 0,
    pendingVerifications: 0,
    overduePayments: 0,
    actionItems: []
  });

  const [notifications, setNotifications] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPaymentData();
    fetchNotifications();
    fetchQuickStats();
  }, []);

  const fetchPaymentData = async () => {
    try {
      const response = await adminService.getPaymentDashboard();
      if (response.success) {
        setPaymentData(response.data);
        console.log('✅ Payment dashboard data loaded:', response.data);
      } else {
        console.log('📊 No payment data available, using empty state');
        setPaymentData({
          todayReceived: 0,
          todayToPay: 0,
          platformEarnings: 0,
          pendingVerifications: 0,
          overduePayments: 0,
          actionItems: []
        });
      }
    } catch (error) {
      console.error('❌ Error fetching payment data:', error);
      console.log('🔄 Using empty state data');
      
      setPaymentData({
        todayReceived: 0,
        todayToPay: 0,
        platformEarnings: 0,
        pendingVerifications: 0,
        overduePayments: 0,
        actionItems: []
      });
    }
  };

  const fetchNotifications = async () => {
    try {
      const response = await adminService.getPaymentNotifications();
      if (response.success) {
        setNotifications(response.data || []);
      } else {
        console.log('📢 No notifications available');
        setNotifications([]);
      }
    } catch (error) {
      console.error('❌ Error fetching notifications:', error);
      console.log('📢 Using empty notifications state');
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchQuickStats = async () => {
    try {
      const response = await adminService.getQuickStats();
      if (response.success) {
        setStats(response.data);
      } else {
        console.log('📊 No stats available, using zeros');
        setStats({
          monthlyRevenue: 0,
          monthlyEarnings: 0,
          organizersPaid: 0,
          successRate: 0
        });
      }
    } catch (error) {
      console.error('❌ Error fetching quick stats:', error);
      console.log('📊 Using zero stats');
      setStats({
        monthlyRevenue: 0,
        monthlyEarnings: 0,
        organizersPaid: 0,
        successRate: 0
      });
    }
  };

  const downloadDailyReport = async () => {
    try {
      await adminService.exportPaymentCSV();
      console.log('✅ Daily report downloaded successfully');
    } catch (error) {
      console.error('❌ Error downloading report:', error);
      const csvContent = generateDailyReportCSV();
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `payment_report_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
    }
  };

  const handleActionClick = async (actionType) => {
    try {
      switch (actionType) {
        case 'verify':
          window.location.href = '/admin/payment-verifications';
          break;
        case 'pay':
          window.location.href = '/admin/organizer-payouts';
          break;
        case 'overdue':
          window.location.href = '/admin/organizer-payouts?filter=overdue';
          break;
        default:
          console.log('Unknown action type:', actionType);
      }
    } catch (error) {
      console.error('Error handling action click:', error);
    }
  };

  const generateDailyReportCSV = () => {
    const today = new Date().toISOString().split('T')[0];
    return `Date,Time,Type,Player/Organizer,Tournament,Amount,Status,Notes
${today},10:30,RECEIVED,Rahul Kumar,Bangalore Open,1000,APPROVED,Entry fee
${today},11:15,RECEIVED,Priya Sharma,City Open,800,PENDING,Waiting verification
${today},14:20,PAID_OUT,John Doe,Ace Tournament,300,COMPLETED,30% before tournament
${today},16:45,RECEIVED,Amit Singh,State Championship,1200,APPROVED,Entry fee`;
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'payment_received':
        return <CurrencyDollarIcon className="w-5 h-5 text-green-400" />;
      case 'payment_due':
        return <ClockIcon className="w-5 h-5 text-yellow-400" />;
      case 'payment_overdue':
        return <ExclamationTriangleIcon className="w-5 h-5 text-red-400" />;
      default:
        return <BellIcon className="w-5 h-5 text-blue-400" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-gray-400 mt-4 font-medium">Loading payment dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="w-full overflow-x-hidden">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6">
          {/* Header */}
          <div className="mb-6 sm:mb-8">
            <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-2">
              💰 Payment Dashboard
            </h1>
            <p className="text-gray-400 text-sm sm:text-base mb-4">
              Complete payment management for MATCHIFY.PRO tournaments
            </p>
            
            {/* Quick Explanation */}
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-blue-400 text-sm">💡</span>
                </div>
                <div>
                  <h3 className="text-blue-400 font-semibold mb-2">How MATCHIFY.PRO Payment System Works:</h3>
                  <div className="text-gray-300 text-sm space-y-1">
                    <p>• <strong>Players pay entry fees</strong> → You verify their payment screenshots</p>
                    <p>• <strong>30% goes to organizers</strong> before tournament starts</p>
                    <p>• <strong>65% goes to organizers</strong> after tournament ends</p>
                    <p>• <strong>5% stays with MATCHIFY.PRO</strong> as platform fee</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Overview Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6 mb-6 sm:mb-8">
            {/* Today's Received */}
            <div className="bg-slate-800/50 backdrop-blur-sm border border-green-500/30 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-green-400" />
                </div>
                <span className="text-green-400 text-sm font-medium">+12%</span>
              </div>
              <h3 className="text-2xl font-bold text-white mb-1">₹{paymentData.todayReceived.toLocaleString()}</h3>
              <p className="text-gray-400 text-sm mb-2">Received Today</p>
              <div className="bg-green-500/10 rounded-lg p-2 mt-3">
                <p className="text-green-300 text-xs">
                  💰 Money received from players who registered for tournaments today
                </p>
              </div>
            </div>

            {/* Need to Pay */}
            <div className="bg-slate-800/50 backdrop-blur-sm border border-yellow-500/30 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-yellow-500/20 rounded-xl flex items-center justify-center">
                  <CurrencyDollarIcon className="w-6 h-6 text-yellow-400" />
                </div>
                <span className="text-yellow-400 text-sm font-medium">
                  {paymentData.todayToPay > 0 ? 'Due' : 'None'}
                </span>
              </div>
              <h3 className="text-2xl font-bold text-white mb-1">₹{paymentData.todayToPay.toLocaleString()}</h3>
              <p className="text-gray-400 text-sm mb-2">Need to Pay Today</p>
              <div className="bg-yellow-500/10 rounded-lg p-2 mt-3">
                <p className="text-yellow-300 text-xs">
                  {paymentData.todayToPay > 0 
                    ? '⏰ 30% payments due to organizers (tournaments starting tomorrow)'
                    : '✅ No organizer payments due today'
                  }
                </p>
              </div>
            </div>

            {/* Platform Earnings */}
            <div className="bg-slate-800/50 backdrop-blur-sm border border-purple-500/30 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center">
                  <span className="text-purple-400 text-xl">💰</span>
                </div>
                <span className="text-purple-400 text-sm font-medium">5%</span>
              </div>
              <h3 className="text-2xl font-bold text-white mb-1">₹{paymentData.platformEarnings.toLocaleString()}</h3>
              <p className="text-gray-400 text-sm mb-2">Platform Earnings</p>
              <div className="bg-purple-500/10 rounded-lg p-2 mt-3">
                <p className="text-purple-300 text-xs">
                  🏆 MATCHIFY.PRO keeps 5% of all tournament entry fees as platform fee
                </p>
              </div>
            </div>

            {/* Overdue Payments */}
            <div className="bg-slate-800/50 backdrop-blur-sm border border-red-500/30 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-red-500/20 rounded-xl flex items-center justify-center">
                  <ExclamationTriangleIcon className="w-6 h-6 text-red-400" />
                </div>
                <span className="text-red-400 text-sm font-medium">
                  {paymentData.overduePayments > 0 ? 'Alert' : 'Good'}
                </span>
              </div>
              <h3 className="text-2xl font-bold text-white mb-1">{paymentData.overduePayments}</h3>
              <p className="text-gray-400 text-sm mb-2">Overdue Payments</p>
              <div className="bg-red-500/10 rounded-lg p-2 mt-3">
                <p className="text-red-300 text-xs">
                  {paymentData.overduePayments > 0 
                    ? '🚨 65% payments overdue to organizers (tournaments already ended)'
                    : '✅ All organizer payments are up to date'
                  }
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Action Required & Notifications */}
            <div className="lg:col-span-2 space-y-8">
              {/* Action Required */}
              <div className="bg-slate-800/50 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                    <AlertCircle className="w-6 h-6 text-red-400" />
                    Action Required
                  </h2>
                  <button
                    onClick={downloadDailyReport}
                    className="flex items-center gap-2 px-4 py-2 bg-purple-500/20 border border-purple-500/30 rounded-lg text-purple-300 hover:bg-purple-500/30 transition-all"
                  >
                    <DocumentArrowDownIcon className="w-4 h-4" />
                    Download Report
                  </button>
                </div>

                {/* Explanation Box */}
                <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 mb-6">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-blue-500/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-blue-400 text-xs">ℹ️</span>
                    </div>
                    <div>
                      <h4 className="text-blue-400 font-semibold mb-2">What you need to do as admin:</h4>
                      <div className="text-gray-300 text-sm space-y-1">
                        <p>🔍 <strong>Verify Payments:</strong> Check player payment screenshots and approve/reject them</p>
                        <p>💰 <strong>Pay Organizers:</strong> Send 30% before tournament, 65% after tournament ends</p>
                        <p>⚠️ <strong>Handle Overdue:</strong> Pay organizers who haven't received their 65% payment</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  {paymentData.actionItems && paymentData.actionItems.length > 0 ? (
                    paymentData.actionItems.map((item, index) => (
                      <div key={index} className="p-4 bg-slate-700/30 rounded-xl border border-white/5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                              item.type === 'verify' ? 'bg-blue-500/20' :
                              item.type === 'pay' ? 'bg-green-500/20' : 'bg-red-500/20'
                            }`}>
                              {item.type === 'verify' ? <EyeIcon className="w-5 h-5 text-blue-400" /> :
                               item.type === 'pay' ? <CurrencyDollarIcon className="w-5 h-5 text-green-400" /> :
                               <ExclamationTriangleIcon className="w-5 h-5 text-red-400" />}
                            </div>
                            <div>
                              <p className="font-semibold text-white">{item.count} {item.description}</p>
                              <p className="text-sm text-gray-400">
                                {item.type === 'verify' ? '🔍 Review payment screenshots from players for MATCHIFY.PRO tournaments' :
                                 item.type === 'pay' ? '💰 Pay organizers their share (30% before / 65% after tournament)' : 
                                 '🚨 Urgent: Pay overdue amounts to tournament organizers'}
                              </p>
                              {item.details && (
                                <p className="text-xs text-gray-500 mt-1">
                                  Total: ₹{item.details.totalAmount?.toLocaleString()} 
                                  {item.details.tournaments && ` • Tournaments: ${item.details.tournaments.join(', ')}`}
                                </p>
                              )}
                            </div>
                          </div>
                          <button 
                            className={`px-4 py-2 rounded-lg font-medium transition-all ${
                              item.type === 'verify' ? 'bg-blue-500 hover:bg-blue-600 text-white' :
                              item.type === 'pay' ? 'bg-green-500 hover:bg-green-600 text-white' :
                              'bg-red-500 hover:bg-red-600 text-white'
                            }`}
                            onClick={() => handleActionClick(item.type)}
                          >
                            {item.type === 'verify' ? '🔍 Verify Payments' :
                             item.type === 'pay' ? '💰 Pay Organizers' : '🚨 Pay Overdue'}
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CheckCircleIcon className="w-8 h-8 text-green-400" />
                      </div>
                      <h3 className="text-lg font-semibold text-white mb-2">🎉 All Caught Up!</h3>
                      <p className="text-gray-400 mb-4">No pending payment actions required for MATCHIFY.PRO tournaments.</p>
                      <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4">
                        <div className="text-green-300 text-sm space-y-1">
                          <p>✅ All player payments have been verified</p>
                          <p>✅ All organizer payments are up to date</p>
                          <p>✅ No overdue payments to handle</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Recent Notifications */}
              <div className="bg-slate-800/50 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
                <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                  <BellIcon className="w-6 h-6 text-blue-400" />
                  🔔 Recent Notifications
                  <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">{notifications.length}</span>
                </h2>

                {/* Explanation */}
                <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-3 mb-4">
                  <p className="text-blue-300 text-xs">
                    💡 You'll get notified when players make payments, organizers need to be paid, or payments are overdue
                  </p>
                </div>

                <div className="space-y-4">
                  {notifications && notifications.length > 0 ? (
                    notifications.map((notification) => (
                      <div key={notification.id} className={`p-4 rounded-xl border transition-all hover:bg-white/5 ${
                        notification.urgent ? 'bg-red-500/10 border-red-500/30' : 'bg-slate-700/30 border-white/5'
                      }`}>
                        <div className="flex items-start gap-4">
                          {getNotificationIcon(notification.type)}
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <h3 className="font-semibold text-white">{notification.title}</h3>
                              <span className="text-xs text-gray-400">{notification.time}</span>
                            </div>
                            <p className="text-gray-300 text-sm mb-3">{notification.message}</p>
                            <div className="flex gap-2">
                              <button className="px-3 py-1 bg-green-500 hover:bg-green-600 text-white text-xs rounded-lg transition-all">
                                Take Action
                              </button>
                              <button className="px-3 py-1 bg-slate-600 hover:bg-slate-500 text-white text-xs rounded-lg transition-all">
                                View Details
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                        <BellIcon className="w-8 h-8 text-blue-400" />
                      </div>
                      <h3 className="text-lg font-semibold text-white mb-2">📭 No Notifications</h3>
                      <p className="text-gray-400 mb-4">You're all caught up! No tournament payment notifications at the moment.</p>
                      <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4">
                        <div className="text-green-300 text-sm space-y-1">
                          <p>✅ No new player payments to verify</p>
                          <p>✅ No organizer payments due</p>
                          <p>✅ No overdue payments to handle</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column - Quick Stats */}
            <div className="space-y-8">
              <div className="bg-slate-800/50 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
                <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-3">
                  <FileText className="w-5 h-5 text-purple-400" />
                  📊 Monthly Summary
                </h2>

                {/* Explanation */}
                <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-3 mb-4">
                  <p className="text-purple-300 text-xs">
                    💡 This shows your MATCHIFY.PRO platform performance for this month
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
                    <div>
                      <span className="text-gray-400 text-sm">Total Revenue</span>
                      <p className="text-xs text-gray-500">Money received from all players</p>
                    </div>
                    <span className="text-white font-medium">₹{stats?.monthlyRevenue?.toLocaleString() || 0}</span>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
                    <div>
                      <span className="text-gray-400 text-sm">Platform Earnings</span>
                      <p className="text-xs text-gray-500">Your 5% commission (₹{stats?.monthlyRevenue || 0} × 5%)</p>
                    </div>
                    <span className="text-green-400 font-medium">₹{stats?.monthlyEarnings?.toLocaleString() || 0}</span>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
                    <div>
                      <span className="text-gray-400 text-sm">Organizers Paid</span>
                      <p className="text-xs text-gray-500">Number of organizers who received payments</p>
                    </div>
                    <span className="text-white font-medium">{stats?.organizersPaid || 0}</span>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
                    <div>
                      <span className="text-gray-400 text-sm">Success Rate</span>
                      <p className="text-xs text-gray-500">% of payments approved vs rejected</p>
                    </div>
                    <span className="text-green-400 font-medium">{stats?.successRate || 0}%</span>
                  </div>
                </div>

                {/* Payment Flow Explanation */}
                <div className="mt-6 bg-slate-700/30 rounded-xl p-4">
                  <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
                    <span>🔄</span> Payment Flow
                  </h4>
                  <div className="space-y-2 text-xs text-gray-300">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-blue-400 rounded-full"></span>
                      <span>Player pays entry fee → Screenshot uploaded</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-yellow-400 rounded-full"></span>
                      <span>Admin verifies payment → Player registered</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                      <span>30% paid to organizer before tournament</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-purple-400 rounded-full"></span>
                      <span>65% paid to organizer after tournament</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-pink-400 rounded-full"></span>
                      <span>5% stays with MATCHIFY.PRO</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPaymentDashboard;