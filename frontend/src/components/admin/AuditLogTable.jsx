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
      <div className="bg-white rounded-lg shadow p-12 text-center text-gray-500">
        No audit logs found
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Timestamp
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Admin
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Action
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Entity
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Details
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                IP Address
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {logs.map((log) => (
              <tr key={log.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(log.createdAt).toLocaleString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <div className="font-medium text-gray-900">{log.admin.name}</div>
                  <div className="text-xs text-gray-500">{log.admin.email}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {getActionBadge(log.action)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  {log.entityType && (
                    <>
                      <div className="font-medium text-gray-900">{log.entityType}</div>
                      {log.entityId && (
                        <div className="text-xs text-gray-500 font-mono">
                          {log.entityId.substring(0, 8)}...
                        </div>
                      )}
                    </>
                  )}
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {log.details && Object.keys(log.details).length > 0 && (
                    <details className="cursor-pointer">
                      <summary className="text-blue-600 hover:text-blue-800">
                        View Details
                      </summary>
                      <pre className="text-xs bg-gray-50 p-2 rounded mt-2 max-w-md overflow-auto">
                        {JSON.stringify(log.details, null, 2)}
                      </pre>
                    </details>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
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
