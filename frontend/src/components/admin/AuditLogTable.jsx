const AuditLogTable = ({ logs }) => {
  const getActionBadge = (action) => {
    const styles = {
      USER_SUSPEND: 'bg-red-100 text-red-800',
      USER_UNSUSPEND: 'bg-green-100 text-green-800',
      TOURNAMENT_CANCEL: 'bg-orange-100 text-orange-800',
      AUDIT_LOG_EXPORTED: 'bg-blue-100 text-blue-800',
      INVITE_CREATED: 'bg-purple-100 text-purple-800',
      INVITE_REVOKED: 'bg-gray-100 text-gray-800'
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[action] || 'bg-gray-100 text-gray-800'}`}>
        {action.replace(/_/g, ' ')}
      </span>
    );
  };

  if (logs.length === 0) {
    return (
      <div className="bg-slate-800 rounded-lg shadow-lg border border-slate-700 p-12 text-center text-gray-400">
        No audit logs found
      </div>
    );
  }

  return (
    <div className="bg-slate-800 rounded-lg shadow-lg border border-slate-700 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-700">
          <thead className="bg-slate-900">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                Timestamp
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                Admin
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                Action
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                Entity
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                Details
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                IP Address
              </th>
            </tr>
          </thead>
          <tbody className="bg-slate-800 divide-y divide-slate-700">
            {logs.map((log) => (
              <tr key={log.id} className="hover:bg-slate-700/50">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                  {new Date(log.createdAt).toLocaleString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <div className="font-medium text-white">{log.admin.name}</div>
                  <div className="text-xs text-gray-400">{log.admin.email}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {getActionBadge(log.action)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  {log.entityType && (
                    <>
                      <div className="font-medium text-white">{log.entityType}</div>
                      {log.entityId && (
                        <div className="text-xs text-gray-400 font-mono">
                          {log.entityId.substring(0, 8)}...
                        </div>
                      )}
                    </>
                  )}
                </td>
                <td className="px-6 py-4 text-sm text-gray-400">
                  {log.details && Object.keys(log.details).length > 0 && (
                    <details className="cursor-pointer">
                      <summary className="text-teal-400 hover:text-teal-300">
                        View Details
                      </summary>
                      <pre className="text-xs bg-slate-900 p-2 rounded mt-2 max-w-md overflow-auto text-gray-300">
                        {JSON.stringify(log.details, null, 2)}
                      </pre>
                    </details>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400 font-mono">
                  {log.ipAddress || 'N/A'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AuditLogTable;
