import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';

const STATUS_COLOR = {
  approved: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/30', dot: 'bg-emerald-400' },
  pending:  { bg: 'bg-amber-500/10',   text: 'text-amber-400',   border: 'border-amber-500/30',   dot: 'bg-amber-400' },
  rejected: { bg: 'bg-red-500/10',     text: 'text-red-400',     border: 'border-red-500/30',     dot: 'bg-red-400' },
  deleted:  { bg: 'bg-slate-500/10',   text: 'text-slate-400',   border: 'border-slate-500/30',   dot: 'bg-slate-500' },
};

const STATUS_TABS = ['all', 'approved', 'pending', 'rejected', 'deleted'];

export default function AdminManageAcademiesPage() {
  const navigate = useNavigate();
  const [academies, setAcademies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusTab, setStatusTab] = useState('all');
  const [deleteModal, setDeleteModal] = useState(null); // { id, name }
  const [deleteReason, setDeleteReason] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [toast, setToast] = useState('');

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const fetchAcademies = useCallback(async () => {
    try {
      setLoading(true);
      const params = statusTab !== 'all' ? `?status=${statusTab}` : '';
      const res = await api.get(`/academies/admin/all${params}`);
      setAcademies(res.data.data.academies || []);
    } catch (err) {
      showToast('Failed to load academies');
    } finally {
      setLoading(false);
    }
  }, [statusTab]);

  useEffect(() => { fetchAcademies(); }, [fetchAcademies]);

  const handleDelete = async () => {
    if (!deleteModal) return;
    try {
      setDeleting(true);
      await api.delete(`/academies/admin/${deleteModal.id}`, {
        data: { reason: deleteReason || 'Removed by administrator' }
      });
      showToast(`"${deleteModal.name}" deleted`);
      setDeleteModal(null);
      setDeleteReason('');
      fetchAcademies();
    } catch (err) {
      showToast(err.response?.data?.error || 'Delete failed');
    } finally {
      setDeleting(false);
    }
  };

  const filtered = academies.filter(a => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      a.name?.toLowerCase().includes(q) ||
      a.city?.toLowerCase().includes(q) ||
      a.state?.toLowerCase().includes(q) ||
      a.submittedByName?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6">

      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-teal-600 text-white text-sm font-semibold px-4 py-2.5 rounded-xl shadow-xl">
          {toast}
        </div>
      )}

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">All Academies</h1>
        <p className="text-sm text-slate-400 mt-1">View, search and manage every academy on the platform</p>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by name, city, state or owner..."
          className="flex-1 px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-teal-500"
        />
        <div className="flex gap-2 flex-wrap">
          {STATUS_TABS.map(tab => (
            <button
              key={tab}
              onClick={() => setStatusTab(tab)}
              className={`px-4 py-2 rounded-xl text-xs font-bold capitalize transition-all ${
                statusTab === tab
                  ? 'bg-teal-600 text-white shadow shadow-teal-500/30'
                  : 'bg-slate-800 text-slate-400 border border-slate-700 hover:border-slate-500'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Count */}
      {!loading && (
        <p className="text-xs text-slate-500 mb-4">
          {filtered.length} {filtered.length === 1 ? 'academy' : 'academies'}
          {search ? ` matching "${search}"` : ''}
        </p>
      )}

      {/* Table */}
      {loading ? (
        <div className="space-y-3">
          {[1,2,3,4,5].map(i => (
            <div key={i} className="h-16 rounded-xl bg-slate-800/50 animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center py-20 text-center">
          <span className="text-5xl mb-3">🏢</span>
          <p className="text-white font-bold mb-1">No academies found</p>
          <p className="text-slate-500 text-sm">Try a different search or status filter</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-800">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/60">
                <th className="text-left px-4 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider">Academy</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider hidden sm:table-cell">Location</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider hidden md:table-cell">Sports</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider hidden lg:table-cell">Submitted By</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider">Status</th>
                <th className="text-right px-4 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filtered.map(a => {
                const sc = STATUS_COLOR[a.status] || STATUS_COLOR.pending;
                const sports = Array.isArray(a.sports) ? a.sports : [];
                const isDeleted = a.status === 'deleted' || a.isDeleted;
                return (
                  <tr key={a.id} className={`transition-colors hover:bg-slate-800/30 ${isDeleted ? 'opacity-50' : ''}`}>
                    {/* Name + type */}
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-slate-700/60 flex items-center justify-center text-xl flex-shrink-0">
                          🏢
                        </div>
                        <div>
                          <p className="font-bold text-white leading-tight">{a.name}</p>
                          {a.type && <p className="text-xs text-slate-500 mt-0.5">{a.type}</p>}
                        </div>
                      </div>
                    </td>

                    {/* Location */}
                    <td className="px-4 py-3.5 hidden sm:table-cell">
                      <p className="text-slate-300">{a.city}</p>
                      <p className="text-xs text-slate-500">{a.state}</p>
                    </td>

                    {/* Sports */}
                    <td className="px-4 py-3.5 hidden md:table-cell">
                      <div className="flex flex-wrap gap-1">
                        {sports.slice(0,3).map(s => (
                          <span key={s} className="px-2 py-0.5 rounded-full text-xs bg-slate-700/60 text-slate-300">{s}</span>
                        ))}
                        {sports.length > 3 && (
                          <span className="px-2 py-0.5 rounded-full text-xs bg-slate-700/60 text-slate-500">+{sports.length - 3}</span>
                        )}
                      </div>
                    </td>

                    {/* Submitted by */}
                    <td className="px-4 py-3.5 hidden lg:table-cell">
                      <p className="text-slate-300 text-xs">{a.submittedByName || '—'}</p>
                      <p className="text-slate-500 text-xs">{a.submittedByPhone || a.submittedByEmail || ''}</p>
                    </td>

                    {/* Status badge */}
                    <td className="px-4 py-3.5">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${sc.bg} ${sc.text} ${sc.border}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
                        {a.status}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => navigate(`/academies/${a.id}`)}
                          className="px-3 py-1.5 rounded-lg text-xs font-bold text-teal-400 bg-teal-500/10 border border-teal-500/20 hover:bg-teal-500/20 transition-colors"
                        >
                          View
                        </button>
                        {!isDeleted && (
                          <button
                            onClick={() => { setDeleteModal({ id: a.id, name: a.name }); setDeleteReason(''); }}
                            className="px-3 py-1.5 rounded-lg text-xs font-bold text-red-400 bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 transition-colors"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl p-6 shadow-2xl">
            <div className="flex items-start gap-4 mb-5">
              <div className="w-12 h-12 rounded-xl bg-red-500/15 flex items-center justify-center flex-shrink-0">
                <span className="text-2xl">🗑️</span>
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Delete Academy</h3>
                <p className="text-sm text-slate-400 mt-1">
                  This will permanently remove <span className="font-bold text-white">"{deleteModal.name}"</span> from the platform.
                </p>
              </div>
            </div>

            <div className="mb-5">
              <label className="block text-sm font-semibold text-slate-300 mb-2">
                Reason <span className="text-slate-500 font-normal">(optional)</span>
              </label>
              <textarea
                value={deleteReason}
                onChange={e => setDeleteReason(e.target.value)}
                placeholder="e.g. Duplicate listing, Terms violation..."
                rows={3}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm placeholder-slate-500 resize-none focus:outline-none focus:border-red-500/50"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => { setDeleteModal(null); setDeleteReason(''); }}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold bg-red-600 hover:bg-red-500 text-white disabled:opacity-50 transition-colors"
              >
                {deleting ? 'Deleting…' : 'Delete Academy'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
