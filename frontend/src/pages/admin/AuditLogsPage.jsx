import { useState, useEffect } from 'react';
import { AlertTriangle, CheckCircle, X } from 'lucide-react';
import adminService from '../../services/adminService';
import AuditLogTable from '../../components/admin/AuditLogTable';

const AuditLogsPage = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    action: '',
    entityType: '',
    startDate: '',
    endDate: ''
  });
  const [pagination, setPagination] = useState({ page: 1, limit: 50, total: 0, totalPages: 1 });
  const [exporting, setExporting] = useState(false);
  const [alertModal, setAlertModal] = useState(null);

  useEffect(() => {
    fetchLogs();
  }, [pagination.page]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const data = await adminService.getAuditLogs({
        page: pagination.page,
        limit: pagination.limit,
        action: filters.action || undefined,
        entityType: filters.entityType || undefined,
        startDate: filters.startDate || undefined,
        endDate: filters.endDate || undefined
      });
      setLogs(data.logs);
      setPagination(data.pagination);
    } catch (err) {
      console.error('Failed to fetch audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFilter = () => {
    setPagination({ ...pagination, page: 1 });
    fetchLogs();
  };

  const handleReset = () => {
    setFilters({
      action: '',
      entityType: '',
      startDate: '',
      endDate: ''
    });
    setPagination({ ...pagination, page: 1 });
    setTimeout(fetchLogs, 100);
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      await adminService.exportAuditLogs({
        action: filters.action || undefined,
        entityType: filters.entityType || undefined,
        startDate: filters.startDate || undefined,
        endDate: filters.endDate || undefined
      });
      setAlertModal({ type: 'success', message: 'Audit logs exported successfully!' });
    } catch (err) {
      setAlertModal({ type: 'error', message: 'Failed to export audit logs' });
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Audit Logs</h1>
          <p className="text-gray-600 mt-2">Immutable record of all admin actions</p>
        </div>
        <button
          onClick={handleExport}
          disabled={exporting}
          className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 transition flex items-center space-x-2"
        >
          <span>{exporting ? 'Exporting...' : '📥 Export to CSV'}</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <h3 className="text-lg font-semibold mb-4">Filters</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Action Type
            </label>
            <select
              value={filters.action}
              onChange={(e) => setFilters({ ...filters, action: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Actions</option>
              <option value="USER_SUSPEND">User Suspended</option>
              <option value="USER_UNSUSPEND">User Unsuspended</option>
              <option value="TOURNAMENT_CANCEL">Tournament Cancelled</option>
              <option value="AUDIT_LOG_EXPORTED">Audit Log Exported</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Entity Type
            </label>
            <select
              value={filters.entityType}
              onChange={(e) => setFilters({ ...filters, entityType: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Entities</option>
              <option value="USER">User</option>
              <option value="TOURNAMENT">Tournament</option>
              <option value="AUDIT_LOG">Audit Log</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Start Date
            </label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              End Date
            </label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="mt-4 flex space-x-3">
          <button
            onClick={handleFilter}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Apply Filters
          </button>
          <button
            onClick={handleReset}
            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
          >
            Reset Filters
          </button>
        </div>
      </div>

      {/* Logs Table */}
      {loading ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading audit logs...</p>
        </div>
      ) : (
        <>
          <AuditLogTable logs={logs} />

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="mt-6 bg-white rounded-lg shadow px-6 py-4 flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
                {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                {pagination.total} logs
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
                  disabled={pagination.page === 1}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <span className="px-4 py-2 text-sm text-gray-700">
                  Page {pagination.page} of {pagination.totalPages}
                </span>
                <button
                  onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
                  disabled={pagination.page >= pagination.totalPages}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Alert Modal */}
      {alertModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="relative w-full max-w-sm">
            <div className={`absolute -inset-2 bg-gradient-to-r ${alertModal.type === 'success' ? 'from-emerald-500 to-teal-500' : 'from-red-500 to-rose-500'} rounded-3xl blur-xl opacity-50`}></div>
            <div className="relative bg-slate-800 rounded-2xl border border-white/10 overflow-hidden">
              <div className="p-6 text-center">
                <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${alertModal.type === 'success' ? 'bg-emerald-500/20' : 'bg-red-500/20'}`}>
                  {alertModal.type === 'success' ? (
                    <CheckCircle className="w-8 h-8 text-emerald-400" />
                  ) : (
                    <AlertTriangle className="w-8 h-8 text-red-400" />
                  )}
                </div>
                <h3 className={`text-lg font-semibold ${alertModal.type === 'success' ? 'text-emerald-400' : 'text-red-400'}`}>
                  {alertModal.type === 'success' ? 'Success!' : 'Error'}
                </h3>
                <p className="text-gray-300 mt-2">{alertModal.message}</p>
              </div>
              <div className="p-4 bg-slate-900/50 border-t border-white/10">
                <button
                  onClick={() => setAlertModal(null)}
                  className={`w-full px-4 py-3 rounded-xl font-medium transition-colors ${
                    alertModal.type === 'success'
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white'
                      : 'bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 text-white'
                  }`}
                >
                  OK
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuditLogsPage;
